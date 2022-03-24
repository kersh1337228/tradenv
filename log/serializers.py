from rest_framework import serializers
from log.models import Log
from portfolio.serializers import PortfolioSerializer
from strategy.serializers import StrategySerializer


class LogSerializer(serializers.ModelSerializer):
    time_interval_start = serializers.DateField(format='%Y/%m/%d', required=False)
    time_interval_end = serializers.DateField(format='%Y/%m/%d', required=False)
    strategy = StrategySerializer(read_only=True, required=False)
    portfolio = PortfolioSerializer(read_only=True, required=False)

    def create(self, validated_data=None):
        return LogSerializer(Log.objects.create(**self.validated_data))

    class Meta:
        model = Log
        fields = '__all__'
