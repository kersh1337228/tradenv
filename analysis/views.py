from django.shortcuts import render, redirect
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.reverse import reverse_lazy
from log.models import Log
from portfolio.models import Portfolio
from portfolio.serializers import PortfolioSerializer
from strategy.models import Strategy
from strategy.serializers import StrategySerializer


class AnalysisAPIView(
    generics.CreateAPIView,
    generics.RetrieveUpdateDestroyAPIView
):
    # Analysis page get request, returns the form fields
    # step by step, depending on the previous choices
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            match request.query_params.get('step'):
                case 'initial':  # Initial request
                    return Response(
                        data={
                            'portfolios': PortfolioSerializer(
                                Portfolio.objects.all(),
                                many=True
                            ).data,
                            'strategies': StrategySerializer(
                                Strategy.objects.all(),
                                many=True
                            ).data,
                        },
                        status=200,
                    )
                case 'portfolio':  # Choosing the portfolio
                    portfolio = Portfolio.objects.get(
                        slug=request.query_params.get('slug')
                    )
                    if not len(portfolio.stocks.all()):
                        return Response(
                            data={
                                'portfolio': ['No stocks in the portfolio'],
                            },
                            status=400,
                        )
                    return Response(
                        data={
                            'dates': portfolio.get_quotes_dates()
                        },
                        status=200,
                    )
        else:
            return render(
                template_name='index.html',
                request=request,
            )

    # Getting form data and analysing them
    def post(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            pass
        else:
            return redirect(
                'log_detail',
                slug=Log.objects.create(
                    range_start=request.data.get('time_interval_start'),
                    range_end=request.data.get('time_interval_end'),
                    strategy=Strategy.objects.get(
                        slug=request.data.get('strategy')
                    ),
                    portfolio=Portfolio.objects.get(
                        slug=request.data.get('portfolio')
                    ),
                ).slug,
            )

    def put(self, request, *args, **kwargs):
        pass

    def patch(self, request, *args, **kwargs):
        pass

    def delete(self, request, *args, **kwargs):
        pass

    '''Redirecting if form is validated successfully'''
    def get_success_url(self):
        return reverse_lazy('plot')
