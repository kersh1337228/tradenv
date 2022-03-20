from rest_framework import serializers
from quotes.models import Quotes, Stock


class QuotesSerializer(serializers.ModelSerializer):
    tendency = serializers.ReadOnlyField(source='get_tendency')

    class Meta:
        model = Quotes
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    origin = QuotesSerializer(read_only=True)

    class Meta:
        model = Stock
        fields = '__all__'
