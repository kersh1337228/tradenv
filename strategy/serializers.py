from rest_framework import serializers
from strategy.models import Strategy


class StrategySerializer(serializers.ModelSerializer):
    created = serializers.DateTimeField(format='%Y/%m/%d %H:%M', required=False)
    last_updated = serializers.DateTimeField(format='%Y/%m/%d %H:%M', required=False)

    def create(self):
        return StrategySerializer(
            Strategy.objects.create(
                **self.validated_data
            )
        ).data

    def update(self, slug):
        queryset = Strategy.objects.filter(
            slug=slug
        )
        queryset.update(**self.validated_data)
        return StrategySerializer(
            queryset.last()
        ).data

    class Meta:
        model = Strategy
        fields = '__all__'