import rest_framework.parsers
from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response
from log.models import Log
from portfolio.models import Portfolio
from portfolio.serializers import PortfolioSerializer
from asgiref.sync import async_to_sync, sync_to_async
import strategy.utils as strats
import multiprocessing
import asyncio
# import django
# django.setup()


class GenericView(generics.ListAPIView):
    def get(self, request, *args, **kwargs):
        return render(  # Just returning template for further React rendering
            request=request,
            template_name='index.html',
        )


class AnalysisAPIView(
    generics.CreateAPIView,
    generics.RetrieveAPIView
):
    @async_to_sync
    async def get(self, request, *args, **kwargs):  # Step by step form signing in
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            response = {'data': {}, 'status': 0}
            match request.query_params.get('step'):
                case 'initial':  # Initial request
                    response = {
                        'data': {
                            'portfolios': await sync_to_async(
                                lambda: PortfolioSerializer(
                                    Portfolio.objects.all(),
                                    many=True
                                ).data
                            )()
                        },
                        'status': 200
                    }
                case 'portfolio':  # Choosing the portfolio
                    portfolio = await Portfolio.objects.aget(slug=request.query_params.get('slug'))
                    if not await portfolio.stocks.aexists():
                        response['data']['portfolio'] = ['No stocks in the portfolio']
                        response['status'] = 500
                    if not portfolio.balance:
                        if 'portfolio' not in response['data'].keys():
                            response['data']['portfolio'] = ['Zero portfolio balance']
                        else:
                            response['data']['portfolio'].append(['Zero portfolio balance'])
                        response['status'] = 500
                    if not response['status']:
                        response = {
                            'data': {
                                'dates': (
                                    await portfolio.get_quotes_dates()
                                ).strftime('%Y-%m-%d').tolist()
                            },
                            'status': 200
                        }
            return Response(**response)

    parser_classes = (rest_framework.parsers.JSONParser,)

    @async_to_sync
    async def post(self, request, *args, **kwargs):  # Getting form data and analysing them
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            range_start, range_end, long_limit, short_limit, strategies, portfolio = (
                request.data.get('range_start'),
                request.data.get('range_end'),
                request.data.get('long_limit'),
                request.data.get('short_limit'),
                request.data.get('strategies'),
                await Portfolio.objects.aget(
                    slug=request.data.get('portfolio')
                )
            )
            balance, portfolio_quotes = (
                portfolio.balance,
                await portfolio.get_all_quotes(_fill=True)
            )
            with multiprocessing.Pool(min((
                len(strategies), multiprocessing.cpu_count()
            ))) as pool:
                results = (
                    pool.apply_async(
                        getattr(strats, sname),
                        kwds={
                            'portfolio_quotes': portfolio_quotes,
                            'balance': balance,
                            'range_start': range_start,
                            'range_end': range_end,
                            'long_limit': long_limit if long_limit else 10 ** 6,
                            'short_limit': short_limit if short_limit else 10 ** 6,
                        } | request.data.get(sname)
                    ) for sname in strategies
                )
                logs = [res.get().to_json() for res in results]
            log = await Log.objects.acreate(
                range_start=range_start,
                range_end=range_end,
                portfolio=portfolio,
                strategies={sname: request.data.get(sname) for sname in strategies},
                logs=dict(zip(strategies, logs))
            )
            return Response(
                data={'slug': log.slug},
                status=201
            )
