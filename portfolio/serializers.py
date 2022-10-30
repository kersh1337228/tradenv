from rest_framework import serializers
from portfolio.models import Portfolio
from quotes.serializers import StockInstanceSerializer
from asgiref.sync import sync_to_async


class PortfolioSerializer(serializers.ModelSerializer):
    created = serializers.DateTimeField(format='%Y/%m/%d %H:%M', required=False)
    last_updated = serializers.DateTimeField(format='%Y/%m/%d %H:%M', required=False)
    slug = serializers.SlugField(validators=[], required=False)
    stocks = StockInstanceSerializer(many=True, read_only=True, required=False)

    async def acreate(self):
        if await sync_to_async(self.is_valid)(raise_exception=True):
            obj = await Portfolio.objects.acreate(**self.validated_data)
            return await sync_to_async(
                lambda: PortfolioSerializer(obj).data
            )()

    async def aupdate(self, slug: str):
        if await sync_to_async(self.is_valid)(raise_exception=True):
            objs = Portfolio.objects.filter(slug=slug)
            await objs.aupdate(**self.validated_data)
            obj = await objs.afirst()
            return await sync_to_async(lambda: PortfolioSerializer(obj).data)()

    class Meta:
        model = Portfolio
        exclude = ('id',)
        optional_fields = ('created', 'last_updated', 'slug')
