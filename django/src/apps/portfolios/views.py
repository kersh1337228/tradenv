from typing import override
from rest_framework.response import Response
from rest_framework import status
from src.async_api.views import AsyncAPIView, AsyncModelAPIView
from src.apps.portfolios import models
from src.apps.portfolios import serializers


class PortfolioAPIView(AsyncModelAPIView):
    model = models.Portfolio
    serializer_class = serializers.PortfolioSerializer
    edit_serializer_class = serializers.PortfolioEditSerializer


class PortfolioListAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        return Response(
            data=await serializers.PortfolioPartialSerializer(
                instance=await models.Portfolio.objects.all(),
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

        name = request.data.get('name')
        if name:
            query |= {'name__icontains': name}

        create_time__start = request.data.get('publish_time__start')
        if create_time__start:
            query |= {'publish_time__gte': create_time__start}

        create_time__end = request.data.get('create_time__end')
        if create_time__end:
            query |= {'create_time__lte': create_time__end}

        update_time__start = request.data.get('update_time__start')
        if update_time__start:
            query |= {'update_time__gte': update_time__start}

        update_time__end = request.data.get('update_time__end')
        if update_time__end:
            query |= {'update_time__lte': update_time__end}

        offset = request.data.get('offset', 0)
        limit = request.data.get('limit', 5)

        return Response(
            data=await serializers.PortfolioPartialSerializer(
                instance=models.Portfolio.objects
                .filter(**query)
                .distinct()[offset:offset + limit],
                many=True
            ).data,
            status=status.HTTP_200_OK
        )


class StockInstanceAPIView(AsyncModelAPIView):
    model = models.StockInstance
    serializer_class = serializers.StockInstanceSerializer
    edit_serializer_class = serializers.StockInstanceEditSerializer


class AccountAPIView(AsyncModelAPIView):
    model = models.Account
    serializer_class = serializers.AccountSerializer
    edit_serializer_class = serializers.AccountEditSerializer