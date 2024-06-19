from typing import override
from rest_framework import status
from rest_framework.response import Response
from src.async_api.views import (
    AsyncAPIView,
    AsyncModelAPIView
)
from src.apps.logs import models
from src.apps.logs import serializers


class LogAPIView(AsyncModelAPIView):
    model = models.Log
    serializer_class = serializers.LogSerializer


class LogListAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        return Response(
            data=await serializers.LogPartialSerializer(
                instance=models.Log.objects.all(),
                many=True
            ).data,
            status=status.HTTP_200_OK
        )

    @override
    async def post(
            self,
            request,
            *args,
            **kwargs
    ):
        query = {}

        range_start__start = request.data.get('range_start__start')
        if range_start__start:
            query |= {'range_start__gte': range_start__start}

        range_start__end = request.data.get('range_start__end')
        if range_start__end:
            query |= {'range_start__lte': range_start__end}

        range_end__start = request.data.get('range_end__start')
        if range_end__start:
            query |= {'range_end__gte': range_end__start}

        range_end__end = request.data.get('range_end__end')
        if range_end__end:
            query |= {'range_end__lte': range_end__end}

        timeframe = request.data.get('timeframe')
        if timeframe:
            query |= {'timeframe': timeframe}

        portfolio = request.data.get('portfolio')
        if portfolio:
            query |= {'portfolio__name__istartswith': portfolio}

        create_time__start = request.data.get('create_time__start')
        if create_time__start:
            query |= {'create_time__gte': create_time__start}

        create_time__end = request.data.get('create_time__end')
        if create_time__end:
            query |= {'create_time__lte': create_time__end}

        offset = request.data.get('offset', 0)
        limit = request.data.get('limit', 5)

        return Response(
            data=await serializers.LogPartialSerializer(
                instance=models.Log.objects
                .order_by()
                .filter(**query)
                .distinct()[offset:offset + limit],
                many=True
            ).data,
            status=status.HTTP_200_OK
        )
