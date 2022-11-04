from rest_framework import generics
from rest_framework.response import Response
from .strategies import choices


class StrategyListAPIView(
    generics.ListAPIView
):
    # Strategy format:
    # verbose_name -> name shown on client
    # alias -> name to link view and functionality
    # args -> function arguments
    def get(self, request, *args, **kwargs):  # Return list of strategies available
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={'strategies': choices},
                status=200,
            )
