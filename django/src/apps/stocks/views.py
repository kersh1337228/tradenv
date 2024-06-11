from typing import override, Self
from django.db.models import Q
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from src.async_api.views import AsyncAPIView
from src.apps.stocks.models import Stock, Quotes
from src.apps.stocks import serializers
from src.utils.functions import paginate
from src.apps.stocks.indicators import indicators


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
                    data=Stock.type.field.choices,
                    status=status.HTTP_200_OK
                )
            case 'timeframe':
                return Response(
                    data=Quotes.timeframe.field.choices,
                    status=status.HTTP_200_OK
                )
            case 'exchange' | 'timezone' | 'country' | 'currency' | 'sector' | 'industry':
                return Response(
                    data=Stock.objects.values(meta).distinct(),
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
                            Stock.type.field.choices,
                            lambda tp: query in tp
                        )
                    ),
                    status=status.HTTP_200_OK
                )
            case 'timeframe':
                return Response(
                    data=list(
                        filter(
                            Quotes.timeframe.field.choices,
                            lambda tf: query in tf
                        )
                    ),
                    status=status.HTTP_200_OK
                )
            case 'exchange' | 'timezone' | 'country' | 'currency' | 'sector' | 'industry':
                return Response(
                    data=Stock.objects.values(meta).filter(**{
                        f'{meta}__icontains': query
                    }).distinct(),
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
        return Response(
            data=await serializers.StockSerializer(
                instance=await Stock.objects.aget(
                    symbol=kwargs.get('symbol')
                ),
            ).data,
            status=status.HTTP_200_OK
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
        if type:
            query &= Q({'type__in': types})

        exchange = request.data.get('exchange')
        if exchange:
            query &= (Q(exchange__istartswith=exchange) |
                      Q(exchange_name__istartswith=exchange))

        timezone = request.data.get('timezone')
        if timezone:
            query &= Q({'exchange_timezone': timezone})

        country = request.data.get('country')
        if country:
            query &= Q({'country': country})

        currency = request.data.get('currency')
        if currency:
            query &= Q({'currency': currency})

        sector = request.data.get('sector')
        if sector:
            query &= {'sector': sector}

        industry = request.data.get('industry')
        if industry:
            query &= {'industry': industry}

        limit = int(request.query_params.get('limit', 50))
        page = int(request.query_params.get('page', 1))

        stocks = Stock.objects.filter(query)[:limit] if query else\
            Stock.objects.all()[(page - 1) * limit:page * limit]

        return Response(
            data={
                'stocks': await serializers.StockSerializer(
                    instance=stocks,
                    many=True
                ).data,
                'pagination': paginate(page, limit) if not query else None
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
        quotes: Quotes = await Quotes.objects.aget(
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


class IndicatorAPIView(AsyncAPIView):
    @override
    async def get(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ):
        return Response(
            data=indicators,
            status=200
        )

    @override
    async def post(
            self: Self,
            request: Request,
            *args,
            **kwargs
    ):
        quotes: Quotes = await Quotes.objects.aget(
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
            status=200
        )
