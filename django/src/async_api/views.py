from inspect import iscoroutine
from typing import (
    Self,
    Callable,
    Any,
    Coroutine,
    override
)
from types import FunctionType
from django.db import models
from django.utils.cache import cc_delim_re, patch_vary_headers
from django.http import HttpResponseBase
from rest_framework.generics import GenericAPIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from src.async_api.serializers import AsyncModelSerializer


__all__ = (
    'AsyncAPIView',
    'async_api_view',
    'AsyncModelAPIView'
)


class AsyncAPIView(GenericAPIView):
    @classmethod
    @override
    def as_view(
            cls: Self,
            **kwargs
    ) -> Callable[[Any], Any]:
        view = super().as_view(**kwargs)
        view.cls = cls
        view.initkwargs = kwargs
        return view

    async def get(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'GET method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    async def post(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'POST method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    async def put(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'PUT method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    async def patch(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'PATCH method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    async def delete(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'DELETE method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    async def head(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'HEAD method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    @override
    async def options(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        if self.metadata_class is None:
            return self.http_method_not_allowed(request, *args, **kwargs)

        return Response(
            data=self.metadata_class().determine_metadata(request, self),
            status=200
        )

    async def trace(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Response:
        return Response(
            data={
                'detail': 'TRACE method not implemented'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    @override
    def dispatch(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ) -> Coroutine[Any, Any, Response]:
        self.args = args
        self.kwargs = kwargs
        request = self.initialize_request(request, *args, **kwargs)
        self.request = request
        self.headers = self.default_response_headers
        try:
            self.initial(request, *args, **kwargs)
            if request.method.lower() in self.http_method_names:
                handler = getattr(
                    self, request.method.lower(),
                    self.http_method_not_allowed
                )
            else:
                handler = self.http_method_not_allowed
            response = handler(request, *args, **kwargs)
        except Exception as err:
            response = self.handle_exception(err)
        self.response = self.finalize_response(
            request, response, *args, **kwargs)
        return self.response

    @override
    async def finalize_response(
            self: Self,
            request: Request,
            response: Response,
            *args,
            **kwargs
    ) -> Response:
        if iscoroutine(response):
            response = await response
        assert isinstance(response, HttpResponseBase), (
            'Expected a `Response`, `HttpResponse` or `HttpStreamingResponse` '
            f'to be returned from the view, but received a {type(response)}'
        )
        if isinstance(response, Response):
            if not getattr(request, 'accepted_renderer', None):
                neg = self.perform_content_negotiation(request, force=True)
                request.accepted_renderer, request.accepted_media_type = neg
            response.accepted_renderer = request.accepted_renderer
            response.accepted_media_type = request.accepted_media_type
            response.renderer_context = self.get_renderer_context()
        vary_headers = self.headers.pop('Vary', None)
        if vary_headers is not None:
            patch_vary_headers(response, cc_delim_re.split(vary_headers))
        for key, value in self.headers.items():
            response[key] = value
        return response


def async_api_view(
        http_method_names: list[str] | tuple[str, ...] = None
) -> Callable[[Any], Any]:
    http_method_names = ('GET',) if http_method_names is None else http_method_names

    def decorator(
            func: Callable[
                [Request, tuple[Any, ...], dict[str, Any]],
                Coroutine[Any, Any, Response]
            ]
    ) -> Callable[[Any], Any]:
        WrappedAPIView = type(
            'WrappedAPIView',
            (AsyncAPIView,),
            {
                '__doc__': func.__doc__
            }
        )

        assert not isinstance(http_method_names, FunctionType), (
            '@async_api_view missing list of allowed HTTP methods'
        )

        assert isinstance(http_method_names, (list, tuple)), (
                '@async_api_view expected a list of strings ', 
                f'received {type(http_method_names).__name__}'
        )

        allowed_methods = set(http_method_names) | {'options'}
        WrappedAPIView.http_method_names = [method.lower() for method in allowed_methods]

        async def handler(
                self: Self,
                *args,
                **kwargs
        ) -> Response:
            return await func(*args, **kwargs)

        for method in http_method_names:
            setattr(WrappedAPIView, method.lower(), handler)

        WrappedAPIView.__name__ = func.__name__
        WrappedAPIView.__module__ = func.__module__
        WrappedAPIView.renderer_classes = getattr(
            func, 'renderer_classes',
            AsyncAPIView.renderer_classes
        )
        WrappedAPIView.parser_classes = getattr(
            func, 'parser_classes',
            AsyncAPIView.parser_classes
        )
        WrappedAPIView.authentication_classes = getattr(
            func, 'authentication_classes',
            AsyncAPIView.authentication_classes
        )
        WrappedAPIView.throttle_classes = getattr(
            func, 'throttle_classes',
            AsyncAPIView.throttle_classes
        )
        WrappedAPIView.permission_classes = getattr(
            func, 'permission_classes',
            AsyncAPIView.permission_classes
        )
        WrappedAPIView.schema = getattr(
            func, 'schema',
            AsyncAPIView.schema
        )

        return WrappedAPIView.as_view()

    return decorator


class AsyncModelAPIView(AsyncAPIView):
    model: models.Model.__class__ = None
    serializer_class: AsyncModelSerializer.__class__ = None
    edit_serializer_class: AsyncModelSerializer.__class__ = None

    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        try:
            return Response(
                data=await self.serializer_class(
                    instance=await self.model.objects.aget(
                        id=kwargs.pop('id')
                    )
                ).data,
                status=status.HTTP_200_OK
            )
        except self.model.DoesNotExist:
            return Response(
                data={
                    'detail': f'{self.model.__name__} not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )

    @override
    async def post(
            self,
            request,
            *args,
            **kwargs
    ):
        serializer = self.edit_serializer_class(
            data=request.data
        )

        data, ok = await serializer.create_or_update()
        if ok:
            return Response(
                data=await self.serializer_class(
                    instance=data
                ).data,
                status=status.HTTP_201_CREATED
            )
        return Response(
            data=data,
            status=status.HTTP_400_BAD_REQUEST
        )

    @override
    async def patch(
            self,
            request,
            *args,
            **kwargs
    ):
        try:
            model_instance = await self.model.objects.aget(
                id=kwargs.pop('id')
            )
            serializer = self.edit_serializer_class(
                instance=model_instance,
                data=request.data,
                partial=True
            )

            data, ok = await serializer.create_or_update()
            if ok:
                return Response(
                    data=await self.serializer_class(
                        instance=data
                    ).data,
                    status=status.HTTP_200_OK
                )
            return Response(
                data=data,
                status=status.HTTP_400_BAD_REQUEST
            )
        except self.model.DoesNotExist:
            return Response(
                data={
                    'detail': f'{self.model.__name__} not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )

    @override
    async def delete(
            self,
            request,
            *args,
            **kwargs
    ):
        model_instance = self.model.objects.filter(
            id=kwargs.pop('id')
        )
        if await model_instance.aexists():
            await model_instance.adelete()
            return Response(
                data={},
                status=status.HTTP_200_OK
            )
        return Response(
            data={
                'detail': f'{self.model.__name__} not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )
