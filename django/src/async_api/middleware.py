from functools import partial
from typing import Self
from asgiref.sync import async_to_sync
from django.contrib import auth
from django.core.handlers.asgi import ASGIRequest
from django.utils.deprecation import MiddlewareMixin
from django.db.models import Model


async def get_user(
        request: ASGIRequest
) -> Model:
    if not hasattr(request, "_cached_user"):
        request._cached_user = await auth.aget_user(request)
    return request._cached_user


async def auser(
        request: ASGIRequest
) -> Model:
    if not hasattr(request, "_acached_user"):
        request._acached_user = await auth.aget_user(request)
    return request._acached_user


class AuthenticationMiddleware(MiddlewareMixin):
    def process_request(
            self: Self,
            request: ASGIRequest
    ) -> None:
        request.user = async_to_sync(get_user)(request)
        request.auser = partial(auser, request)
