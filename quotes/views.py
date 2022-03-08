from django.db.models import Q
from django.shortcuts import render
from django.template.loader import render_to_string
from rest_framework.generics import RetrieveUpdateDestroyAPIView, CreateAPIView, ListAPIView
from rest_framework.response import Response
from quotes.models import Quote
from quotes.utils import paginate, get_all_quotes, quote_name_search


class QuotesAPIView(
    RetrieveUpdateDestroyAPIView,
    CreateAPIView
):
    def get(self, request, *args, **kwargs): # detail
        if request.is_ajax():
            quotes = Quote.objects.filter(slug=kwargs.get('slug'))
            return Response(
                data={
                    'quotes': Quote.add_quote_by_symbol(
                        request.query_params.get('symbol'),
                        request.query_params.get('name'),
                        kwargs.get('slug'),
                    ) if not quotes else quotes.last()
                }, status=201
            )
        else:
            return render(
                template_name='quotes_detail.html',
                context={
                    'quote': Quote.objects.get(
                        slug=kwargs.get('slug')
                    )
                }, request=request,
            )

    def post(self, request, *args, **kwargs):
        if request.is_ajax():
            pass
        else:
            pass

    def patch(self, request, *args, **kwargs):
        if request.is_ajax():
            pass
        else:
            pass

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
    ListAPIView
):
    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            if request.query_params.get('downloaded'):
                quotes = Quote.objects.filter(
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
                results = quote_name_search(
                     request.query_params.get('search')
                ) if request.query_params.get('search') else \
                    get_all_quotes(int(request.query_params.get('page', 1)) - 1, 50)
                quotes = [{
                    'symbol': result[0],
                    'name': result[1],
                    'price': result[2],
                    'change': result[3],
                    'change_percent': result[4],
                    'volume': result[5],
                    'slug': result[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
                } for result in results]
                quotes_html = ''
                for quote in quotes:
                    quotes_html += render_to_string(
                        template_name='quote.html',
                        context={
                            'quote': quote,
                            'downloaded_quotes': [quote.symbol for quote in Quote.objects.all()],
                        },
                        request=request,
                    )
                return Response(
                    data={
                        'quotes_html': quotes_html,
                        'pagination_html': render_to_string(
                            template_name='pagination.html',
                            context={
                                'pagination': paginate(int(request.query_params.get('page', 1)), 50)
                            },
                            request=request
                        ) if not request.query_params.get('search') else None

                    },
                    status=200
                )
        else:
            current_page = int(request.query_params.get('page', 1))
            quotes = get_all_quotes(current_page - 1, 50)
            return render(
                request=request,
                template_name='quotes_list.html',
                context={'quotes': [{
                        'symbol': quote[0],
                        'name': quote[1],
                        'price': quote[2],
                        'change': quote[3],
                        'change_percent': quote[4],
                        'volume': quote[5],
                        'slug': quote[1].lower().replace(' ', '_').replace(',', '_').replace('.', '_'),
                    } for quote in quotes],
                    'downloaded_quotes': [quote.symbol for quote in Quote.objects.all()],
                    'pagination': paginate(current_page, 50)
                }
            )
