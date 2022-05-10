from django.urls import path
from quotes import views


urlpatterns = [
    path(
        'list/',
        views.QuotesListAPIView.as_view(),
        name='quotes_list'
    ),
    path(
        'list/search/',
        views.QuotesListAPIView.as_view(),
        name='quotes_list_search'
    ),
    path(
        'list/sort/',
        views.QuotesListAPIView.as_view(),
        name='quotes_list_filter'
    ),
    path(
        'detail/<slug:slug>/',
        views.QuotesAPIView.as_view(),
        name='quotes_detail'
    ),
    path(
        'plot/indicators/list/',
        views.get_quotes_plot_indicators_list,
        name='quotes_plot_indicators_list'
    ),
    path(
        'plot/indicators/detail/<slug:type>/',
        views.get_quotes_plot_indicator,
        name='quotes_plot_indicator'
    )
]