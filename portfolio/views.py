import datetime
from django.forms import model_to_dict
from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response

from log.models import Log
from log.serializers import LogSerializer
from portfolio.models import Portfolio
from portfolio.serializers import PortfolioSerializer
from quotes.models import Stock, Quotes


class PortfolioAPIView(
    generics.CreateAPIView,
    generics.RetrieveUpdateDestroyAPIView
):
    def get(self, request, *args, **kwargs):  # detail
        portfolio = Portfolio.objects.get(
            slug=kwargs.get('slug')
        )
        if request.is_ajax():
            return Response(
                data={
                    'portfolio': PortfolioSerializer(portfolio).data,
                    'logs': LogSerializer(
                        Log.objects.filter(portfolio=portfolio),
                        many=True,
                    ).data
                },
                status=200
            )
        else:
            return render(
                request=request,
                template_name='index.html',
            )

    def post(self, request, *args, **kwargs):  # create
        if request.is_ajax():
            data = {key: request.data.get(key) for key in request.data}
            serializer = PortfolioSerializer(data={
                'name': data.get('name').strip().capitalize(),
                'slug': data.get('name').strip().lower().replace(' ', '_'),
                'balance': data.get('balance')
            })
            serializer.is_valid(raise_exception=True)
            return Response(
                data={
                    'portfolio': serializer.create()
                },
                status=200
            )
        else:
            pass

    def patch(self, request, *args, **kwargs):  # update
        if request.is_ajax():
            data = {key: request.data.get(key) for key in request.data}
            data.pop('csrfmiddlewaretoken', None)
            portfolio = Portfolio.objects.get(
                slug=request.data.get('slug')
            )
            Portfolio.objects.filter(
                slug=request.data.get('slug')
            ).update(
                name=request.data.get('name').strip(),
                slug=request.data.get('name').strip().lower().replace(' ', '_'),
                balance=request.data.get('balance'),
                last_updated=datetime.datetime.now()
            )
            return Response(
                data={},
                status=200
            )
        else:
            pass

    def put(self, request, *args, **kwargs):  # manage stocks
        if request.is_ajax():
            # Add, change amount of or delete stocks
            portfolio = Portfolio.objects.get(
                slug=request.data.get('slug'),
            )
            if request.data.get('type') == 'add':
                stock = Stock.objects.create(
                    origin=Quotes.objects.get(
                        symbol=request.data.get('symbol')
                    ),
                    amount=1,
                )
                portfolio.stocks.add(stock)
                return Response(
                    data={'stock': {
                        'symbol': stock.origin.symbol,
                        'name': stock.origin.name
                    }},
                    status=200
                )
            elif request.data.get('type') == 'change_amount':
                portfolio.stocks.filter(
                    origin=Quotes.objects.get(
                        symbol=request.data.get('symbol')
                    )
                ).update(
                    amount=request.data.get('amount')
                )
                portfolio.last_updated=datetime.datetime.now()
                portfolio.save()
            elif request.data.get('type') == 'delete':
                portfolio.stocks.get(
                    origin=Quotes.objects.get(
                        symbol=request.data.get('symbol')
                    ),
                ).delete()
            return Response(
                data={},
                status=200
            )
        else:
            pass

    def delete(self, request, *args, **kwargs):  # delete
        if request.is_ajax():
            Portfolio.objects.get(
                slug=request.data.get('slug')
            ).delete()
            return Response(
                data={},
                status=200
            )
        else:
            pass


# Shows list of all portfolios
class PortfolioListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):  # list
        if request.is_ajax():
            return Response(
                data={
                    'portfolios': PortfolioSerializer(
                        Portfolio.objects.all(),
                        many=True
                    ).data
                },
                status=200,
            )
        else:
            pass
        return render(
            template_name='index.html',
            request=request,
        )
