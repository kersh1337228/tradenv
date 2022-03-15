from django.shortcuts import render
from rest_framework import generics
from log.models import Log
from strategy.models import Strategy


class StrategyAPIView(
    generics.RetrieveUpdateDestroyAPIView,
    generics.CreateAPIView
):
    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            pass
        else:
            return render(
                template_name='strategy_detail.html',
                context={
                    'strategy': Strategy.objects.get(
                        slug=kwargs.get('slug')
                    ),
                    'logs': Log.objects.filter(
                        strategy__slug=kwargs.get('slug')
                    )
                },
                request=request
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


class StrategyListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):
        if request.is_ajax():
            pass
        else:
            return render(
                template_name='strategy_list.html',
                context={
                    'strategies': Strategy.objects.all()
                },
                request=request
            )
