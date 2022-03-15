from django.db.models import Q
from django.forms import model_to_dict
from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response
from quotes.models import Quotes
from quotes.utils import paginate, get_all_quotes, quote_name_search, parse_quotes_names


class QuotesAPIView(
    generics.RetrieveUpdateDestroyAPIView,
    generics.CreateAPIView
):
    def get(self, request, *args, **kwargs):  # detail
        if request.is_ajax():
            quotes = Quotes.objects.filter(slug=kwargs.get('slug'))
            return Response(
                data={
                    'quotes': model_to_dict(Quotes.add_quote_by_symbol(
                        request.query_params.get('symbol'),
                        request.query_params.get('name'),
                        kwargs.get('slug'),
                    )) if not quotes else model_to_dict(quotes.last())
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
        if request.is_ajax():
            pass
        else:
            pass

    def delete(self, request, *args, **kwargs):
        if request.is_ajax():
            pass
        else:
            pass


class QuotesListAPIView(
    generics.ListAPIView,
    generics.UpdateAPIView
):
    def get(self, request, *args, **kwargs):  # list
        if request.is_ajax():
            if request.query_params.get('downloaded'):
                quotes = Quotes.objects.filter(
                    Q(symbol__icontains=request.query_params.get('name')) |
                    Q(name__icontains=request.query_params.get('name'))
                )
                return Response(
                    {'results': [{
                        'symbol': quote.symbol,
                        'name': quote.name,
                        'slug': quote.slug,
                    } for quote in quotes] if quotes else []},
                    status=200
                )
            else:
                # quotes_html = ''
                # for quote in quotes:
                #     quotes_html += render_to_string(
                #         template_name='quotes.html',
                #         context={
                #             'quote': quote,
                #             'downloaded_quotes': [quote.symbol for quote in Quotes.objects.all()],
                #         },
                #         request=request,
                #     )
                return Response(
                    data={
                        'quotes': quote_name_search(request.query_params.get('search'))
                            if request.query_params.get('search') else
                            get_all_quotes(int(request.query_params.get('page', 1)) - 1, 50),
                        'pagination': paginate(int(request.query_params.get('page', 1)), 50)
                        if not request.query_params.get('search') else None,
                    },
                    status=200
                )
        else:
            return render(
                request=request,
                template_name='index.html',
            )

    async def put(self, request, *args, **kwargs):  # Refresh the quotes data
        if request.is_ajax():
            await parse_quotes_names()
            return self.get(request)
        else:
            pass
