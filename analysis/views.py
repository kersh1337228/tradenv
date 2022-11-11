import rest_framework.parsers
from django.shortcuts import render
from rest_framework import generics, decorators
from rest_framework.response import Response
from log.models import Log
from portfolio.models import Portfolio
from portfolio.serializers import PortfolioSerializer
from asgiref.sync import async_to_sync, sync_to_async
import strategy.strategies as strats
import multiprocessing
from asyncAPI.views import AsyncAPIView


class AnalysisAPIView(AsyncAPIView):
    parser_classes = (rest_framework.parsers.JSONParser,)

    async def get(self, request, *args, **kwargs):  # Step by step form signing in
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

    async def post(self, request, *args, **kwargs):  # Getting form data and analysing them
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
        with multiprocessing.Pool(min((
            len(strategies), multiprocessing.cpu_count()
        ))) as pool:
            results = (
                pool.apply_async(
                    getattr(strats, sname),
                    kwds={
                        'portfolio': portfolio,
                        'range_start': range_start,
                        'range_end': range_end
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
