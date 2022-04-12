from rest_framework import serializers
from log.models import Log
from portfolio.serializers import PortfolioSerializer
from strategy.serializers import StrategySerializer


# Serializing analysis log instance
class LogSerializer(serializers.ModelSerializer):
    # Proper date format
    range_start = serializers.DateField(format='%Y/%m/%d', required=False)
    range_end = serializers.DateField(format='%Y/%m/%d', required=False)
    # Attached models fields
    strategy = StrategySerializer(read_only=True, required=False)
    portfolio = PortfolioSerializer(read_only=True, required=False)
    # Getter-methods fields
    price_deltas = serializers.ReadOnlyField(source='get_price_deltas')
    stocks_quotes = serializers.ReadOnlyField(source='get_stocks_quotes')

    def create(self, validated_data=None):
        return LogSerializer(Log.objects.create(**self.validated_data))

    class Meta:
        model = Log
        fields = '__all__'
