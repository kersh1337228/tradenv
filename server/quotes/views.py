import asyncio
import json
import aiohttp
from django.db.models import Q
from asgiref.sync import sync_to_async
from rest_framework.response import Response
from quotes.models import StockQuotes
from quotes.serializers import StockQuotesSerializer, StockQuotesSerializerLite
from quotes.utils import paginate, parse_quotes_names
from quotes import indicators
from asyncAPI.views import AsyncAPIView
from asyncAPI import decorators


class QuotesAPIView(AsyncAPIView):
    async def get(self, request, *args, **kwargs):
        quotes = await StockQuotes.objects.aget(
            symbol=kwargs.get('symbol')
        )
        # async with aiohttp.ClientSession() as session:
        #     await quotes.update_quotes(session)
        return Response(
            data={
                'quotes': StockQuotesSerializer(quotes).data
            },
            status=200
        )


class QuotesListAPIView(AsyncAPIView):
    async def get(self, request, *args, **kwargs):  # Get list of stocks with search
        if await StockQuotes.objects.aexists():
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
            # async with aiohttp.ClientSession() as session:  # Refreshing stocks quotes
            #     async with asyncio.TaskGroup() as tg:
            #         async for q in quotes:
            #             tg.create_task(q.update_quotes(session))
            return Response(
                data={
                    'quotes': StockQuotesSerializerLite(quotes, many=True).data,
                    'pagination': await sync_to_async(paginate)(page, limit) if not query else None,
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

    async def put(self, request, *args, **kwargs):  # Refreshing quotes data
        if not await StockQuotes.objects.aexists():
            await parse_quotes_names()
        return self.get(request)


@decorators.async_api_view(('GET',))  # Getting all supported technical analysis indicators list
async def get_quotes_plot_indicators_list(request, *args, **kwargs):
    return Response(
        data=indicators.choices,
        status=200
    )


@decorators.async_api_view(('GET',))
async def get_quotes_plot_indicator(request, *args, **kwargs):  # Getting indicator values for certain stock
    return Response(
        (await StockQuotes.objects.aget(
            symbol=request.query_params.get('symbol')
        )).get_indicator(
            kwargs.get('alias'),
            request.query_params.get('range_start'),
            request.query_params.get('range_end'),
            json.loads(request.query_params.get('args'))
        ),
        status=200
    )
