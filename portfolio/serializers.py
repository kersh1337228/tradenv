from rest_framework import serializers
from portfolio.models import Portfolio


class PortfolioSerializer(serializers.ModelSerializer):
    #stock = serializers.
    created = serializers.DateTimeField(format='%Y/%m/%d %H:%M')
    last_updated = serializers.DateTimeField(format='%Y/%m/%d %H:%M')

    def create(self, validated_data=None):
        return PortfolioSerializer(Portfolio.objects.create(**self.validated_data))

    class Meta:
        model = Portfolio
        fields = '__all__'
