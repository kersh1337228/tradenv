from django.urls import path
from strategy.views import StrategyListAPIView, StrategyAPIView


urlpatterns = [
    path(
        'list/',
        StrategyListAPIView.as_view(),
        name='strategy_list'
    ),
    path(
        'create/',
        StrategyAPIView.as_view(),
        name='strategy_create'
    ),
    path(
        'detail/<slug:slug>/',
        StrategyAPIView.as_view(),
        name='strategy_detail'
    ),
    path(
        'update/<slug:slug>/',
        StrategyAPIView.as_view(),
        name='strategy_update'
    ),
    path(
        'delete/<slug:slug>/',
        StrategyAPIView.as_view(),
        name='strategy_delete'
    ),
]
