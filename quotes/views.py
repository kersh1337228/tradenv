from django.db.models import Q
from django.forms import model_to_dict
from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response

from portfolio.models import Portfolio
from quotes.models import Quotes
from quotes.serializers import QuotesSerializer
from quotes.utils import paginate, get_all_quotes, quote_name_search, parse_quotes_names


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
            if request.query_params.get('downloaded'):
                return Response(
                    data=QuotesSerializer(
                        Quotes.objects.filter(
                            Q(symbol__istartswith=request.query_params.get('query')) |
                            Q(name__istartswith=request.query_params.get('query'))
                        ) if not request.query_params.get('slug') else Quotes.objects.filter((
                            Q(symbol__istartswith=request.query_params.get('query')) |
                            Q(name__istartswith=request.query_params.get('query'))) & ~(
                            Q(slug__in=[stock.origin.slug for stock in Portfolio.objects.get(
                                slug=request.query_params.get('slug')
                            ).stocks.all()])
                        )),
                        many=True
                    ).data,
                    status=200,
                )
            else:
                limit = int(request.query_params.get('limit', 50))
                page = int(request.query_params.get('page', 1))
                return Response(
                    data={
                        'quotes': quote_name_search(request.query_params.get('query'))
                            if request.query_params.get('query') else
                            QuotesSerializer(
                                Quotes.objects.all()[(page - 1) * limit:(page - 1) * limit + limit],
                                many=True
                            ).data,
                        'pagination': paginate(page, limit)
                        if not request.query_params.get('query') else None,
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
            parse_quotes_names()
            return self.get(request)
        else:
            pass
