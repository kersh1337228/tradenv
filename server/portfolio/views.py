from rest_framework import generics
from rest_framework.response import Response
from rest_framework import parsers
from log.models import Log
from log.serializers import LogSerializer
from portfolio.models import Portfolio
from portfolio.serializers import PortfolioSerializer, PortfolioSerializerLite
from quotes.models import StockInstance, StockQuotes
from asgiref.sync import async_to_sync, sync_to_async
import aiohttp
import asyncio
from asyncAPI.views import AsyncAPIView


class PortfolioAPIView(AsyncAPIView):
    parser_classes = (parsers.JSONParser,)

    async def get(self, request, *args, **kwargs):  # detail
        try:
            portfolio = await Portfolio.objects.aget(
                slug=kwargs.get('slug')
            )
            async with aiohttp.ClientSession() as session:
                async with asyncio.TaskGroup() as tg:
                    async for q in portfolio.stocks.select_related('quotes'):
                        tg.create_task(q.quotes.update_quotes(session))
            return Response(
                data={
                    'portfolio': await sync_to_async(
                        lambda: PortfolioSerializer(portfolio).data
                    )(),
                    'logs': await sync_to_async(
                    lambda: LogSerializer(
                            Log.objects.filter(portfolio=portfolio),
                            many=True
                        ).data
                    )()
                },
                status=200
            )
        except Portfolio.DoesNotExist:
            return Response(
                data={'message': 'Page not found.'},
                status=404
            )

    async def post(self, request, *args, **kwargs):  # Creating portfolio model instance
        serializer = PortfolioSerializer(data={
            'name': request.data.get('name').strip().capitalize(),
            'balance': request.data.get('balance')
        })
        return Response(
            data={'portfolio': await serializer.acreate()},
            status=201
        )

    async def patch(self, request, *args, **kwargs):  # Update portfolio settings
        return Response(
            data={
                'portfolio': await PortfolioSerializer(
                    data=request.data,
                    partial=True
                ).aupdate(kwargs.get('slug'))
            },
            status=200
        )

    async def put(self, request, *args, **kwargs):  # Add, change amount of or delete stocks
        portfolio = await Portfolio.objects.prefetch_related(
            'stocks'
        ).aget(  # Prefetching stocks m2m field
            slug=kwargs.get('slug')
        )
        match kwargs.get('type'):  # Ejecting operation type
            case 'add':  # Add 1 stock to portfolio
                symbol = request.data.get('symbol')
                if not await portfolio.stocks.filter(
                    quotes__symbol=symbol
                ).aexists():
                    await sync_to_async(portfolio.stocks.add)(
                        await StockInstance.objects.acreate(
                            quotes=await StockQuotes.objects.aget(
                                symbol=symbol
                            ),
                            priority=await portfolio.stocks.acount() + 1
                        )
                    )
                    await sync_to_async(portfolio.save)()
            case 'alter':  # Change amount of stock selected
                errors = {}
                try:
                    priority = min(
                        request.data.get('priority'),
                        await portfolio.stocks.acount()
                    )
                    amount = request.data.get('amount')
                    stock = await portfolio.stocks.aget(
                        quotes__symbol=request.data.get('symbol')
                    )
                    if (stock.priority != priority):  # Reordering priorities
                        await portfolio.stocks.filter(priority=priority).aupdate(
                            priority=stock.priority
                        )  # Just updating
                    stock.priority = priority
                    stock.amount = amount
                    await sync_to_async(stock.save)()
                except AssertionError:
                    return Response(
                        data=errors,
                        status=400,
                    )
            case 'remove':  # Remove stock from portfolio
                stock = await portfolio.stocks.aget(  # Getting stock requested
                    quotes__symbol=request.data.get('symbol')
                )
                await sync_to_async(portfolio.stocks.remove)(stock)  # Removing m2m link
                await sync_to_async(stock.delete)()  # Deleting model
        return Response(
            data={
                'portfolio': await sync_to_async(
                    lambda: PortfolioSerializer(portfolio).data
                )()
            },
            status=200
        )

    async def delete(self, request, *args, **kwargs):  # Deleting portfolio model instance
        await Portfolio.objects.filter(
            slug=kwargs.get('slug')
        ).adelete()
        return Response(
            data={},
            status=200
        )


# Shows list of all portfolios
class PortfolioListAPIView(AsyncAPIView):
    async def get(self, request, *args, **kwargs):  # Returns all portfolios available
        return Response(
            data={
                'portfolios': await sync_to_async(
                    lambda: PortfolioSerializerLite(
                        Portfolio.objects.order_by('-last_updated', '-created'),
                        many=True
                    ).data
                )()
            },
            status=200,
        )
