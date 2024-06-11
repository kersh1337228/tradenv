from rest_framework import generics
from rest_framework.response import Response
from .strategies import choices
from src.async_api.views import AsyncAPIView


class StrategyListAPIView(AsyncAPIView):
    # Strategy format:
    # verbose_name -> name shown on client
    # alias -> name to link view and functionality
    # args -> function arguments
    async def get(self, request, *args, **kwargs):  # Return list of strategies available
        return Response(
            data={'strategies': choices},
            status=200,
        )
