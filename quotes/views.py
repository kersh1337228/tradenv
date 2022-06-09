import json

from django.db.models import Q
from django.shortcuts import render
from rest_framework import generics, decorators
from rest_framework.response import Response
from quotes.models import Quotes
from quotes.serializers import QuotesSerializer
from quotes.utils import paginate, parse_quotes_names


class QuotesAPIView(
    generics.RetrieveUpdateDestroyAPIView,
    generics.CreateAPIView
):
    def get(self, request, *args, **kwargs):  # detail
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            quotes = Quotes.objects.filter(slug=kwargs.get('slug'))
            return Response(
                data={
                    'quotes': QuotesSerializer(Quotes.add_quote_by_symbol(
                        request.query_params.get('symbol'),
                        request.query_params.get('name'),
                        kwargs.get('slug'),
                    )).data if not quotes.exists() else QuotesSerializer(quotes.last()).data
                }, status=201
            )
        else:
            return render(
                template_name='index.html',
                context={
                    'quote': Quotes.objects.get(
                        slug=kwargs.get('slug')
                    )
                }, request=request,
            )

    def put(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            pass
        else:
            pass

    def delete(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            pass
        else:
            pass


class QuotesListAPIView(
    generics.ListAPIView,
    generics.UpdateAPIView
):
    def get(self, request, *args, **kwargs):  # list
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            if Quotes.objects.exists():
                query = request.query_params.get('query', None)
                limit = int(request.query_params.get('limit', 50))
                page = int(request.query_params.get('page', 1))
                quotes = Quotes.objects.filter(
                    Q(name__istartswith=query) | Q(symbol__istartswith=query)
                ) if query else Quotes.objects.all()[(page - 1) * limit:page * limit]
                return Response(
                    data={
                        'quotes': QuotesSerializer(quotes, many=True).data,
                        'pagination': paginate(page, limit) if not query else None,
                    },
                    status=200
                )
            else:
                return Response(
                    data={
                        'quotes': 'No quotes',
                        'pagination': None,
                    },
                    status=200
                )
        else:
            return render(
                request=request,
                template_name='index.html',
            )

    def put(self, request, *args, **kwargs):  # Refresh the quotes data
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            if not Quotes.objects.exists():
                parse_quotes_names()
            return self.get(request)
        else:
            pass


# Getting all supported technical analysis indicators list
@decorators.api_view(('GET',))
def get_quotes_plot_indicators_list(request, *args, **kwargs):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        return Response(data=Quotes.get_indicators_list(), status=200)


# Getting indicator values list for certain stock
@decorators.api_view(('GET',))
def get_quotes_plot_indicator(request, *args, **kwargs):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        match kwargs.get('type'):
            case 'SMA' | 'EMA' | 'VMA':
                return Response(Quotes.objects.get(
                    slug=request.query_params.get('slug')
                ).get_moving_averages(
                    request.query_params.get('range_start'),
                    request.query_params.get('range_end'),
                    int(json.loads(request.query_params.get('args')).get('period_length')),
                    json.loads(request.query_params.get('args')).get('price'),
                    kwargs.get('type'),
                ), status=200)
    else:
        pass
