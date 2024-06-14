from typing import override
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from src.async_api.views import AsyncAPIView
from src.apps.stocks import models
from src.apps.stocks import serializers
from src.utils.functions import paginate
from src.apps.stocks.indicators import indicators_data


class StockMetaAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        meta = kwargs.get('meta')
        match meta:
            case 'type':
                return Response(
                    data=next(
                        zip(
                            *models.Stock.type.field.choices
                        )
                    ),
                    status=status.HTTP_200_OK
                )
            case 'timeframe':
                return Response(
                    data=next(
                        zip(
                            *models.Quotes.timeframe.field.choices
                        )
                    ),
                    status=status.HTTP_200_OK
                )
            case 'exchange' | 'timezone' | 'country' | 'currency' | 'sector' | 'industry':
                return Response(
                    data=models.Stock.objects
                    .order_by()
                    .values_list(
                        meta,
                        flat=True
                    ).distinct(),
                    status=status.HTTP_200_OK
                )

        return Response(
            data={
                'detail': 'Metadata not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    @override
    async def post(
            self,
            request,
            *args,
            **kwargs
    ):
        meta = kwargs.get('meta')
        query = request.data.pop('query')
        match meta:
            case 'type':
                return Response(
                    data=list(
                        filter(
                            lambda tp: query in tp,
                            next(
                                zip(
                                    *models.Stock.type.field.choices
                                )
                            )
                        )
                    ),
                    status=status.HTTP_200_OK
                )
            case 'timeframe':
                return Response(
                    data=list(
                        filter(
                            lambda tf: query in tf,
                            next(
                                zip(
                                    *models.Quotes.timeframe.field.choices
                                )
                            )
                        )
                    ),
                    status=status.HTTP_200_OK
                )
            case 'exchange' | 'timezone' | 'country' | 'currency' | 'sector' | 'industry':
                return Response(
                    data=models.Stock.objects
                    .order_by()
                    .filter(**{
                        f'{meta}__icontains': query
                    }).values_list(
                        meta,
                        flat=True
                    ).distinct(),
                    status=status.HTTP_200_OK
                )

        return Response(
            data={
                'detail': 'Metadata not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )


class StockAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        try:
            return Response(
                data=await serializers.StockSerializer(
                    instance=await models.Stock.objects.aget(
                        symbol=kwargs.get('symbol')
                    ),
                ).data,
                status=status.HTTP_200_OK
            )
        except models.Stock.DoesNotExist:
            return Response(
                data={
                    'detail': f'Stock not found'
                },
                status=status.HTTP_404_NOT_FOUND
            )

    @override
    async def post(
            self,
            request,
            *args,
            **kwargs
    ):
        query = Q()

        symbol_or_name = request.data.get('symbol_or_name')
        if symbol_or_name:
            query &= (Q(symbol__istartswith=symbol_or_name) |
                      Q(name__istartswith=symbol_or_name))

        types = request.data.get('types')
        if types:
            query &= Q(type__in=types)

        exchange = request.data.get('exchange')
        if exchange:
            query &= (Q(exchange__istartswith=exchange) |
                      Q(exchange_name__istartswith=exchange))

        timezone = request.data.get('timezone')
        if timezone:
            query &= Q(timezone__istartswith=timezone)

        country = request.data.get('country')
        if country:
            query &= Q(country__istartswith=country)

        currency = request.data.get('currency')
        if currency:
            query &= Q(currency__istartswith=currency)

        sector = request.data.get('sector')
        if sector:
            query &= Q(sector__istartswith=sector)

        industry = request.data.get('industry')
        if industry:
            query &= Q(industry__istartswith=industry)

        limit = int(request.data.get('limit', 50))
        page = int(request.data.get('page', 1))

        stocks = models.Stock.objects.filter(query)

        return Response(
            data={
                'stocks': await serializers.StockSerializer(
                    instance=stocks[(page - 1) * limit:page * limit],
                    many=True
                ).data,
                'pagination': paginate(
                    count=await stocks.acount(),
                    current_page=page,
                    limit=limit
                )
            },
            status=status.HTTP_200_OK
        )


class QuotesAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        try:
            quotes = await models.Quotes.objects.aget(
                stock__symbol=kwargs.get('symbol'),
                timeframe=kwargs.get('timeframe')
            )
            await quotes.update_quotes()

            return Response(
                data=await serializers.QuotesSerializer(
                    instance=quotes,
                ).data,
                status=status.HTTP_200_OK
            )
        except models.Quotes.DoesNotExist:
            try:
                stock = await models.Stock.objects.aget(
                    symbol=kwargs.get('symbol')
                )

                return Response(
                    data=await serializers.QuotesSerializer(
                        instance=await stock.parse_quotes(
                            timeframe=kwargs.get('timeframe')
                        ),
                    ).data,
                    status=status.HTTP_200_OK
                )
            except models.Stock.DoesNotExist:
                return Response(
                    data={
                        'detail': f'Stock not found'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )


class IndicatorAPIView(AsyncAPIView):
    @override
    async def get(
            self,
            request,
            *args,
            **kwargs
    ):
        return Response(
            data=indicators_data,
            status=status.HTTP_200_OK
        )

    @override
    async def post(
            self,
            request,
            *args,
            **kwargs
    ):
        quotes = await models.Quotes.objects.aget(
            stock__symbol=kwargs.get('symbol'),
            timeframe=kwargs.get('timeframe')
        )
        await quotes.update_quotes()

        return Response(
            data=quotes.indicator(
                name=kwargs.get('name'),
                params=request.data.get('params'),
                range_start=request.data.get('range_start'),
                range_end=request.data.get('range_end')
            ),
            status=status.HTTP_200_OK
        )
