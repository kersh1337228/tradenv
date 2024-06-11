import traceback
from asyncio import iscoroutinefunction
from typing import (
    Self,
    Any,
    Never,
    Callable,
    Coroutine,
    override
)
from rest_framework.fields import (
    SkipField,
    empty
)
from rest_framework.relations import PKOnlyObject
from rest_framework.serializers import (
    Field,
    SerializerMethodField,
    ListSerializer,
    ModelSerializer,
    raise_errors_on_nested_writes
)
from rest_framework.exceptions import ValidationError
from rest_framework.utils import model_meta
from rest_framework.utils.serializer_helpers import (
    ReturnList,
    ReturnDict
)
from asgiref.sync import sync_to_async
from django.db import models


def validated_method(
        callback: Callable[
            ['AsyncModelSerializer'],
            Coroutine
        ]
) -> Callable[
    ['AsyncModelSerializer'],
    Coroutine[Any, Any, tuple[Any, bool]]
]:
    async def wrapped(
            self: 'AsyncModelSerializer'
    ):
        try:
            if await self.is_valid(raise_exception=True):
                return await callback(self), True
        except ValidationError as err:
            errors = {}
            for key, details in err.detail.items():
                errors[key] = list(map(str, details))
            return errors, False

    return wrapped


class AsyncField(Field):
    pass


class AsyncSerializerMethodField(SerializerMethodField):
    @override
    async def to_representation(
            self: Self,
            value: Any
    ):
        method = getattr(self.parent, self.method_name)
        return await method(value)


class AsyncListSerializer(ListSerializer):
    @override
    async def create(
            self: Self,
            validated_data: list[dict[str, Any]]
    ) -> list[models.Model] | Never:
        return [
            await self.child.create(attrs)
            for attrs in validated_data
        ]

    @override
    async def update(
            self: Self,
            instance: models.Model,
            validated_data: dict[str, Any]
    ) -> list[models.Model]:
        raise NotImplementedError(
            "Serializers with many=True do not support multiple update by "
            "default, only multiple create. For updates it is unclear how to "
            "deal with insertions and deletions. If you need to support "
            "multiple update, use a `ListSerializer` class and override "
            "`.update()` so you can specify the behavior exactly."
        )

    @override
    async def is_valid(
            self: Self,
            *,
            raise_exception: bool = False
    ) -> bool:
        return await sync_to_async(super().is_valid)(
            raise_exception=raise_exception
        )

    @override
    async def save(
            self: Self,
            **kwargs
    ):
        assert 'commit' not in kwargs, (
            "'commit' is not a valid keyword argument to the 'save()' method. "
            "If you need to access data before committing to the database then "
            "inspect 'serializer.validated_data' instead. "
            "You can also pass additional keyword arguments to 'save()' if you "
            "need to set extra attributes on the saved model instance. "
            "For example: 'serializer.save(owner=request.user)'.'"
        )

        validated_data = [
            {**attrs, **kwargs}
            for attrs in self.validated_data
        ]

        if self.instance is not None:
            self.instance = await self.update(self.instance, validated_data)
            assert self.instance is not None, (
                '`update()` did not return an object instance.'
            )
        else:
            self.instance = await self.create(validated_data)
            assert self.instance is not None, (
                '`create()` did not return an object instance.'
            )

        return self.instance

    @override
    async def to_representation(
            self: Self,
            data: Any
    ) -> list[Any]:
        iterable = data.all() if isinstance(
            data, models.manager.BaseManager
        ) else data

        return [
            await self.child.to_representation(item)
            async for item in iterable
        ]

    @property
    @override
    async def data(
            self: Self
    ) -> ReturnList:
        if hasattr(self, 'initial_data') and not hasattr(self, '_validated_data'):
            msg = (
                'When a serializer is passed a `data` keyword argument you '
                'must call `.is_valid()` before attempting to access the '
                'serialized `.data` representation.\n'
                'You should either call `.is_valid()` first, '
                'or access `.initial_data` instead.'
            )
            raise AssertionError(msg)

        if not hasattr(self, '_data'):
            if self.instance is not None and not getattr(self, '_errors', None):
                self._data = await self.to_representation(self.instance)
            elif hasattr(self, '_validated_data') and not getattr(self, '_errors', None):
                self._data = await self.to_representation(self.validated_data)
            else:
                if hasattr(self, 'initial_data'):
                    self._data = await self.to_representation(self.initial_data)
                self._data = []

        return ReturnList(self._data, serializer=self)


class AsyncModelSerializer(ModelSerializer):
    def __new__(
            cls,
            instance: models.Model | models.QuerySet = None,
            data: dict[str, Any] = empty,
            **kwargs
    ):
        setattr(
            cls.Meta,
            'list_serializer_class',
            AsyncListSerializer
        )
        return super().__new__(
            cls,
            instance,
            data,
            **kwargs
        )

    @override
    async def create(
            self: Self,
            validated_data: dict[str, Any]
    ) -> models.Model | Never:
        raise_errors_on_nested_writes('create', self, validated_data)

        ModelClass = self.Meta.model

        info = model_meta.get_field_info(ModelClass)
        many_to_many = {}
        for field_name, relation_info in info.relations.items():
            if relation_info.to_many and (field_name in validated_data):
                many_to_many[field_name] = validated_data.pop(field_name)

        try:
            instance = await ModelClass._default_manager.acreate(
                **validated_data)
        except TypeError:
            tb = traceback.format_exc()
            msg = (
                'Got a `TypeError` when calling '
                f'`{ModelClass.__name__}.{ModelClass._default_manager.name}.acreate()`. '
                'This may be because you have a writable field on the '
                'serializer class that is not a valid argument to '
                f'`{ModelClass.__name__}.{ModelClass._default_manager.name}.acreate()`. '
                'You may need to make the field '
                f'read-only, or override the {self.__class__.__name__}.acreate() '
                f'method to handle this correctly.\nOriginal exception was:\n {tb}'
            )
            raise TypeError(msg)

        if many_to_many:
            for field_name, value in many_to_many.items():
                field = getattr(instance, field_name)
                await field.aset(value)

        return instance

    @override
    async def update(
            self: Self,
            instance: models.Model,
            validated_data: dict[str, Any]
    ) -> models.Model:
        raise_errors_on_nested_writes('update', self, validated_data)
        info = model_meta.get_field_info(instance)

        m2m_fields = []
        for attr, value in validated_data.items():
            if attr in info.relations and info.relations[attr].to_many:
                m2m_fields.append((attr, value))
            else:
                setattr(instance, attr, value)

        await instance.asave()

        for attr, value in m2m_fields:
            field = getattr(instance, attr)
            await field.aset(value)

        return instance

    @override
    async def is_valid(self, *, raise_exception=False):
        return await sync_to_async(super().is_valid)(
            raise_exception=raise_exception
        )

    @override
    async def save(
            self: Self,
            **kwargs
    ):
        assert hasattr(self, '_errors'), (
            'You must call `.is_valid()` before calling `.save()`.'
        )

        assert not self.errors, (
            'You cannot call `.save()` on a serializer with invalid data.'
        )

        assert 'commit' not in kwargs, (
            "'commit' is not a valid keyword argument to the 'save()' method. "
            "If you need to access data before committing to the database then "
            "inspect 'serializer.validated_data' instead. "
            "You can also pass additional keyword arguments to 'save()' if you "
            "need to set extra attributes on the saved model instance. "
            "For example: 'serializer.save(owner=request.user)'.'"
        )

        assert not hasattr(self, '_data'), (
            "You cannot call `.save()` after accessing `serializer.data`."
            "If you need to access data before committing to the database then "
            "inspect 'serializer.validated_data' instead. "
        )

        validated_data = {**self.validated_data, **kwargs}

        if self.instance is not None:
            self.instance = await self.update(self.instance, validated_data)
            assert self.instance is not None, (
                '`update()` did not return an object instance.'
            )
        else:
            self.instance = await self.create(validated_data)
            assert self.instance is not None, (
                '`create()` did not return an object instance.'
            )

        return self.instance

    @override
    async def to_representation(self, instance):
        ret = {}
        fields = self._readable_fields
        for field in fields:
            try:
                attribute = await sync_to_async(field.get_attribute)(instance)
            except SkipField:
                continue

            check_for_none = attribute.pk if isinstance(attribute, PKOnlyObject) else attribute
            if check_for_none is None:
                ret[field.field_name] = None
            else:
                if iscoroutinefunction(field.to_representation):
                    ret[field.field_name] = await field.to_representation(attribute)
                else:
                    ret[field.field_name] = await sync_to_async(field.to_representation)(attribute)

        return ret

    @property
    @override
    async def data(
            self: Self
    ):
        if hasattr(self, 'initial_data') and not hasattr(self, '_validated_data'):
            msg = (
                'When a serializer is passed a `data` keyword argument you '
                'must call `.is_valid()` before attempting to access the '
                'serialized `.data` representation.\n'
                'You should either call `.is_valid()` first, '
                'or access `.initial_data` instead.'
            )
            raise AssertionError(msg)

        if not hasattr(self, '_data'):
            if self.instance is not None and not getattr(self, '_errors', None):
                self._data = await self.to_representation(self.instance)
            elif hasattr(self, '_validated_data') and not getattr(self, '_errors', None):
                self._data = await self.to_representation(self.validated_data)
            else:
                self._data = self.get_initial()

        return ReturnDict(self._data, serializer=self)

    @validated_method
    async def create_or_update(
            self: Self
    ) -> None | Never:
        return await self.save()
