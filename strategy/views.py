import datetime
import re
from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response
from log.models import Log
from log.serializers import LogSerializer
from strategy.models import Strategy
from strategy.serializers import StrategySerializer


class StrategyAPIView(
    generics.RetrieveUpdateDestroyAPIView,
    generics.CreateAPIView
):
    def get(self, request, *args, **kwargs):
        strategy = Strategy.objects.get(
            slug=kwargs.get('slug')
        )
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={
                    'strategy': StrategySerializer(strategy).data,
                    'logs': LogSerializer(
                        Log.objects.filter(strategy=strategy),
                        many=True
                    ).data,
                },
                status=200,
            )
        else:
            return render(
                template_name='index.html',
                request=request
            )

    def post(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            data = {key: request.data.get(key) for key in request.data}
            serializer = StrategySerializer(data={
                'name': data.get('name').capitalize(),
                'long_limit': data.get('long_limit'),
                'short_limit': data.get('short_limit'),
                'slug': re.sub(r'[.\- ]+','_' , data.get('name').strip().lower()),
            })
            serializer.is_valid(raise_exception=True)
            return Response(
                data={
                    'strategy': serializer.create()
                },
                status=200
            )
        else:
            pass

    def patch(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            # Getting data from client
            data = {key: request.data.get(key) for key in request.data}
            serializer = StrategySerializer(data={
                'name': data.get('name').strip().capitalize(),
                'slug': re.sub(r'[.\- ]+', '_', data.get('name').strip().lower()),
                'long_limit': data.get('long_limit'),
                'short_limit': data.get('short_limit'),
                'last_updated': datetime.datetime.now(),
            } if re.sub(
                r'[.\- ]+', '_', data.get('name').strip().lower()
            ) != kwargs.get('slug') else {
                'long_limit': data.get('long_limit'),
                'short_limit': data.get('short_limit'),
                'last_updated': datetime.datetime.now(),
            }, partial=True)
            serializer.is_valid(raise_exception=True)
            return Response(
                data={
                    'strategy': serializer.update(kwargs.get('slug'))
                },
                status=200
            )
        else:
            pass

    def put(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            pass
        else:
            pass

    def delete(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            Strategy.objects.get(
                slug=kwargs.get('slug')
            ).delete()
            return Response(
                data={},
                status=200
            )
        else:
            pass


class StrategyListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={
                    'strategies': StrategySerializer(
                        Strategy.objects.order_by('last_updated'),
                        many=True
                    ).data
                },
                status=200,
            )
        else:
            return render(
                template_name='index.html',
                request=request
            )
