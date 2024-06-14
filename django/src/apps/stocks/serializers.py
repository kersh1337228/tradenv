from rest_framework import serializers
from src.apps.stocks.models import (
    Stock,
    Quotes,
    timeframe_format
)
from src.async_api.serializers import AsyncModelSerializer


class QuotesSerializer(AsyncModelSerializer):
    ohlcv = serializers.SerializerMethodField(read_only=True)
    tendency = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_ohlcv(
            quotes: Quotes
    ):
        return quotes.ohlcv.set_index(
            quotes.ohlcv.index.strftime(
                timeframe_format[quotes.timeframe]
            )
        ).reset_index(
            names='timestamp'
        ).to_dict('records')

    @staticmethod
    def get_tendency(
            quotes: Quotes
    ):
        last = quotes.ohlcv.iloc[-1]
        ohlcv = last.round(2)
        ohlcv['timestamp'] = ohlcv.name.strftime(
            timeframe_format[quotes.timeframe]
        )
        return {
            'abs': round(last['close'] - last['open'], 2),
            'rel': round(
                (last['close'] / last['open'] - 1) * 100, 2
            ) if last['open'] != 0 else 'Zero open',
            'ohlcv': ohlcv.to_dict()
        }

    class Meta:
        model = Quotes
        exclude = (
            'id',
            'stock'
        )


class StockSerializer(AsyncModelSerializer):
    quotes = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_quotes(
            stock: Stock
    ) -> list[dict]:
        return stock.quotes.values(
            'timeframe',
            'update_time'
        )

    class Meta:
        model = Stock
        fields = '__all__'
