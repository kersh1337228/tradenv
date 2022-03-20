from rest_framework import serializers
from strategy.models import Strategy


class StrategySerializer(serializers.ModelSerializer):
    def create(self):
        return StrategySerializer(
            Strategy.objects.create(
                **self.validated_data
            )
        )

    def update(self):
        queryset = Strategy.objects.filter(
            slug=self.validated_data.slug
        )
        queryset.update(**self.validated_data)
        return StrategySerializer(
            queryset.last()
        )

    class Meta:
        model = Strategy
        fields = '__all__'