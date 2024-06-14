from typing import (
    Self,
    Any,
    override
)
from rest_framework.serializers import (
    Field,
    SerializerMethodField
)


__all__ = (
    'AsyncField',
    'AsyncSerializerMethodField'
)


class AsyncField(Field):
    pass


class AsyncSerializerMethodField(SerializerMethodField):
    @override
    async def to_representation(
            self: Self,
            value: Any
    ) -> Any:
        method = getattr(self.parent, self.method_name)
        return await method(value)
