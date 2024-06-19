from typing import override

from django.db.models import QuerySet
from rest_framework.exceptions import ValidationError
from src.apps.portfolios import models
from src.apps.stocks.serializers import StockSerializer
from src.async_api.serializers import (
    AsyncModelSerializer,
    validated_method
)
from src.async_api.fields import AsyncSerializerMethodField


class PortfolioEditSerializer(AsyncModelSerializer):
    @override
    @validated_method
    async def create_or_update(self):
        currency = self.validated_data.get('currency')
        if currency:
            if not await (
                    models.Stock.objects
                    .filter(currency=currency)
                    .aexists()
            ):
                raise ValidationError(detail={
                    'currency': (
                        'Invalid currency symbol',
                    ),
                })

        return await self.save()

    class Meta:
        model = models.Portfolio
        exclude = (
            'id',
            'is_snapshot',
            'create_time',
            'update_time'
        )


class PortfolioPartialSerializer(AsyncModelSerializer):
    class Meta:
        model = models.Portfolio
        fields = (
            'id',
            'name',
            'currency',
            'create_time',
            'update_time'
        )


class PortfolioSerializer(AsyncModelSerializer):
    stocks = AsyncSerializerMethodField(read_only=True)
    accounts = AsyncSerializerMethodField(read_only=True)
    logs = AsyncSerializerMethodField(read_only=True)

    @staticmethod
    async def get_stocks(
            portfolio: models.Portfolio
    ) -> list[dict]:
        return await StockInstanceSerializer(
            instance=portfolio.stocks,
            many=True
        ).data

    @staticmethod
    async def get_accounts(
            portfolio: models.Portfolio
    ) -> list[dict]:
        return await AccountSerializer(
            instance=portfolio.accounts,
            many=True
        ).data

    @staticmethod
    async def get_logs(
            portfolio: models.Portfolio
    ) -> list[dict]:
        from src.apps.logs.serializers import LogPartialSerializer
        return await LogPartialSerializer(
            instance=portfolio.logs,
            many=True
        ).data

    class Meta:
        model = models.Portfolio
        exclude = (
            'is_snapshot',
        )


class StockInstanceEditSerializer(AsyncModelSerializer):
    class Meta:
        model = models.StockInstance
        exclude = (
            'id',
        )


class StockInstanceSerializer(AsyncModelSerializer):
    stock = StockSerializer(read_only=True)

    class Meta:
        model = models.StockInstance
        exclude = (
            'portfolio',
        )


class AccountEditSerializer(AsyncModelSerializer):
    @override
    @validated_method
    async def create_or_update(self):
        currency = self.validated_data.get('currency')
        if currency:
            if not await (
                    models.Stock.objects
                    .filter(currency=currency)
                    .aexists()
            ):
                raise ValidationError(detail={
                    'currency': (
                        'Invalid currency symbol',
                    ),
                })

        return await self.save()

    class Meta:
        model = models.Account
        exclude = (
            'id',
        )


class AccountSerializer(AsyncModelSerializer):
    class Meta:
        model = models.Account
        exclude = (
            'portfolio',
        )
