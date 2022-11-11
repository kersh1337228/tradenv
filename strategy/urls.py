from django.urls import path
from strategy.views import StrategyListAPIView


urlpatterns = [
    path(
        'api/list',
        StrategyListAPIView.as_view(),
        name='strategy_api_list'
    ),
]
