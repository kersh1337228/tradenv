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
        if request.is_ajax():
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
        if request.is_ajax():
            data = {key: request.data.get(key) for key in request.data}
            serializer = StrategySerializer(data={
                'name': data.get('name'),
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


class StrategyListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            return Response(
                data={
                    'strategies': StrategySerializer(
                        Strategy.objects.all(),
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
