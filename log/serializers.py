from rest_framework import serializers
from log.models import Log
from portfolio.serializers import PortfolioSerializer


class LogSerializer(serializers.ModelSerializer):
    range_start = serializers.DateTimeField(format='%Y/%m/%d', required=False)
    range_end = serializers.DateTimeField(format='%Y/%m/%d', required=False)
    portfolio = PortfolioSerializer(read_only=True, required=False)
    price_deltas = serializers.ReadOnlyField(source='get_price_deltas')
    stocks_quotes = serializers.ReadOnlyField(source='get_stocks_quotes')
    logs = serializers.ReadOnlyField(source='get_logs')

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        repr['price_deltas'] = repr['price_deltas']()
        repr['stocks_quotes'] = repr['stocks_quotes']()
        return repr

    class Meta:
        model = Log
        exclude =('id',)
