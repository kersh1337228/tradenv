from django.urls import path
from .views import StrategyListAPIView


urlpatterns = (
    path(
        route='list',
        view=StrategyListAPIView.as_view(),
        name='strategy_list'
    ),
)
