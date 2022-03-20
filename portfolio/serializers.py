from rest_framework import serializers
from portfolio.models import Portfolio
from quotes.serializers import StockSerializer


class PortfolioSerializer(serializers.ModelSerializer):
    created = serializers.DateTimeField(format='%Y/%m/%d %H:%M', required=False)
    last_updated = serializers.DateTimeField(format='%Y/%m/%d %H:%M', required=False)
    stocks = StockSerializer(many=True, read_only=True, required=False)

    def create(self):
        return PortfolioSerializer(
            Portfolio.objects.create(**self.validated_data)
        ).data

    def update(self, slug):
        queryset = Portfolio.objects.filter(slug=slug)
        queryset.update(**self.validated_data)
        return PortfolioSerializer(queryset.last()).data

    class Meta:
        model = Portfolio
        fields = '__all__'
        optional_fields = ('created', 'last_updated')
