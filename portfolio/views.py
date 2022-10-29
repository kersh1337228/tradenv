import datetime
from rest_framework import generics
from rest_framework.response import Response
from log.models import Log
from log.serializers import LogSerializer
from portfolio.models import Portfolio
from portfolio.serializers import PortfolioSerializer
from quotes.models import StockInstance, StockQuotes
from asgiref.sync import async_to_sync, sync_to_async


class PortfolioAPIView(
    generics.CreateAPIView,
    generics.RetrieveUpdateDestroyAPIView
):
    @async_to_sync
    async def get(self, request, *args, **kwargs):  # detail
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            try:
                portfolio = await Portfolio.objects.aget(
                    slug=kwargs.get('slug')
                )
                return Response(
                    data={
                        'portfolio': await sync_to_async(
                            lambda: PortfolioSerializer(portfolio).data
                        )(),
                        'logs': await sync_to_async(
                            lambda: LogSerializer(
                                Log.objects.filter(portfolio=portfolio),
                                many=True
                            ).data)()
                    },
                    status=200
                )
            except Portfolio.DoesNotExist:
                return Response(
                    data={'message': 'Page not found.'},
                    status=404
                )

    @async_to_sync
    async def post(self, request, *args, **kwargs):  # Creating portfolio model instance
        serializer = PortfolioSerializer(data={
            'name': request.data.get('name').strip().capitalize(),
            'balance': request.data.get('balance')
        })
        return Response(
            data={'portfolio': await serializer.acreate()},
            status=201
        )

    @async_to_sync
    async def patch(self, request, *args, **kwargs):  # Update portfolio name or balance
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={
                    'portfolio': await PortfolioSerializer(
                        data={
                            'name': request.data.get('name').strip().capitalize(),
                            'balance': request.data.get('balance')
                        },
                        partial=True
                    ).aupdate(kwargs.get('slug'))
                },
                status=200
            )

    @async_to_sync
    async def put(self, request, *args, **kwargs):  # Add, change amount of or delete stocks
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            portfolio = await Portfolio.objects.aget(
                slug=kwargs.get('slug'),
            )
            match kwargs.get('type'):  # Ejecting operation type
                case 'add':  # Add 1 stock to portfolio
                    symb = request.data.get('symbol', '')
                    if not await portfolio.stocks.filter(
                            quotes__symbol=symb
                    ).aexists():
                        await sync_to_async(portfolio.stocks.add)(
                            await StockInstance.objects.acreate(
                                quotes=await StockQuotes.objects.aget(
                                    symbol=symb
                                )
                            )
                        )
                        await sync_to_async(portfolio.save)()
                case 'change_amount':  # Change amount of stock selected
                    errors = {}
                    try:
                        amount = int(request.data.get('amount'))
                        if amount <= 0:
                            errors['amount'] = ['Stocks amount must be positive value.']
                    except ValueError:
                        errors['amount'] = ['Invalid value format.']
                    if errors:
                        return Response(
                            data=errors,
                            status=400,
                        )
                    else:
                        await portfolio.stocks.filter(
                            quotes=await StockQuotes.objects.aget(
                                symbol=request.data.get('symbol')
                            )
                        ).aupdate(
                            amount=request.data.get('amount')
                        )
                        portfolio.last_updated = datetime.datetime.now()
                        await sync_to_async(portfolio.save)()
                case 'remove':  # Remove stock from portfolio
                    await portfolio.stocks.filter(
                        quotes=await StockQuotes.objects.aget(
                            symbol=request.data.get('symbol')
                        ),
                    ).adelete()
            return Response(
                data={
                    'portfolio': await sync_to_async(
                        lambda: PortfolioSerializer(portfolio).data
                    )()
                },
                status=200
            )

    @async_to_sync
    async def delete(self, request, *args, **kwargs):  # Deleting portfolio model instance
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            await Portfolio.objects.filter(
                slug=kwargs.get('slug')
            ).adelete()
            return Response(
                data={},
                status=200
            )


# Shows list of all portfolios
class PortfolioListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):  # Returns all portfolios available
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={
                    'portfolios': PortfolioSerializer(
                        Portfolio.objects.order_by('-last_updated', '-created'),
                        many=True
                    ).data
                },
                status=200,
            )
