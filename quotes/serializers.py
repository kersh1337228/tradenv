from rest_framework import serializers
from quotes.models import StockQuotes, StockInstance


class StockQuotesSerializer(serializers.ModelSerializer):  # Full data
    tendency = serializers.ReadOnlyField(source='get_tendency')
    quotes = serializers.ReadOnlyField(source='get_quotes')
    last_updated = serializers.ReadOnlyField()

    class Meta:
        model = StockQuotes
        fields = '__all__'


class StockQuotesSerializerLite(serializers.ModelSerializer):  # No expensive quotes field
    tendency = serializers.ReadOnlyField(source='get_tendency')
    last_timestamp = serializers.ReadOnlyField()

    def to_internal_value(self, data):
        return super().to_internal_value(data)

    class Meta:
        model = StockQuotes
        exclude = ('quotes',)


class StockInstanceSerializer(serializers.ModelSerializer):
    quotes = StockQuotesSerializerLite(read_only=True)

    class Meta:
        model = StockInstance
        fields = '__all__'
