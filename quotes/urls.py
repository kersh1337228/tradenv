from django.urls import path
from quotes import views


urlpatterns = [
    path(
        'api/list',
        views.QuotesListAPIView.as_view(),
        name='quotes_api_list'
    ),
    path(
        'api/list/refresh',
        views.QuotesListAPIView.as_view(),
        name='quotes_api_list'
    ),
    path(
        'api/detail/<slug:symbol>',
        views.QuotesAPIView.as_view(),
        name='quotes_api_detail'
    ),
    path(
        'api/plot/indicators/list',
        views.get_quotes_plot_indicators_list,
        name='quotes_api_plot_indicators_list'
    ),
    path(
        'api/plot/indicators/detail/<slug:type>',
        views.get_quotes_plot_indicator,
        name='quotes_api_plot_indicator_detail'
    )
]