import json
from django.db.models import Q
from django.shortcuts import render
from asgiref.sync import async_to_sync
from rest_framework import generics, decorators
from rest_framework.response import Response
from quotes.models import StockQuotes
from quotes.serializers import StockQuotesSerializer
from quotes.utils import paginate, parse_quotes_names
import quotes.indicators as ind


class QuotesView(generics.RetrieveAPIView):
    @async_to_sync
    async def get(self, request, *args, **kwargs):
        return render(
            template_name='index.html',
            context={
                'quote': await StockQuotes.objects.aget(
                    symbol=kwargs.get('symbol')
                )
            },
            request=request
        )


class QuotesAPIView(
    generics.RetrieveUpdateAPIView
):
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={
                    'quotes': StockQuotesSerializer(
                        StockQuotes.objects.get(
                            symbol=kwargs.get('symbol')
                        )
                    ).data
                },
                status=200
            )

    @async_to_sync  # Refresh stock quotes by symbol
    async def patch(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            quotes = await StockQuotes.objects.aget(
                symbol=kwargs.get('symbol')
            )
            await quotes.update_quotes()
            return Response(
                data={
                    'quotes': StockQuotesSerializer(
                        quotes
                    ).data
                },
                status=200
            )


class QuotesListAPIView(
    generics.ListAPIView,
    generics.UpdateAPIView
):
    def get(self, request, *args, **kwargs):  # Get list of stocks with search
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            if StockQuotes.objects.exists():
                query = request.query_params.get('query', None)  # Search query
                limit = int(request.query_params.get('limit', 50))  # How much on one page
                page = int(request.query_params.get('page', 1))  # Page number
                quotes = (
                     StockQuotes.objects.filter(
                        Q(name__istartswith=query) |
                        Q(symbol__istartswith=query)
                     )[:limit] if query else
                     StockQuotes.objects.all()[(page - 1) * limit:page * limit]
                )
                return Response(
                    data={
                        'quotes': StockQuotesSerializer(quotes, many=True).data,
                        'pagination': paginate(page, limit) if not query else None,
                        'query': query
                    },
                    status=200
                )
            else:
                return Response(
                    data={
                        'quotes': 'No stocks yet.',
                        'pagination': None,
                    },
                    status=200
                )

    @async_to_sync
    async def put(self, request, *args, **kwargs):  # Refreshing quotes data
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            if not await StockQuotes.objects.aexists():
                await parse_quotes_names()
            return self.get(request)


@decorators.api_view(('GET',))  # Getting all supported technical analysis indicators list
def get_quotes_plot_indicators_list(request, *args, **kwargs):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        return Response(
            data=ind.choices,
            status=200
        )


@decorators.api_view(('GET',))
def get_quotes_plot_indicator(request, *args, **kwargs):  # Getting indicator values for certain stock
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        match kwargs.get('type'):
            case 'sma' | 'ema' | 'vwma':  # Moving averages
                return Response(
                    StockQuotes.objects.get(
                        symbol=request.query_params.get('symbol')
                    ).get_moving_averages(
                        range_start=request.query_params.get('range_start'),
                        range_end=request.query_params.get('range_end'),
                        period_length=int(json.loads(
                            request.query_params.get('args')
                        ).get('period_length')),
                        price=json.loads(
                            request.query_params.get('args')
                        ).get('price'),
                        _type=kwargs.get('type')
                    ),
                    status=200
                )
