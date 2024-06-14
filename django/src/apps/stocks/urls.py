from django.urls import path
from . import views


urlpatterns = (
    # metadata
    path(  # get | post
        route='/meta/<slug:meta>',
        view=views.StockMetaAPIView.as_view(),
        name='stocks_meta'
    ),
    # indicator
    path(  # get
        route='/indicators',
        view=views.IndicatorAPIView.as_view(),
        name='indicator_list'
    ),
    path(  # post
        route='/<str:symbol>/<slug:timeframe>/<slug:name>',
        view=views.IndicatorAPIView.as_view(),
        name='indicator_detail'
    ),
    # quotes
    path(  # get
        route='/<str:symbol>/<slug:timeframe>',
        view=views.QuotesAPIView.as_view(),
        name='quotes_detail'
    ),
    # stock
    path(  # post
        route='',
        view=views.StockAPIView.as_view(),
        name='stocks_list'
    ),
    path(  # get
        route='/<str:symbol>',
        view=views.StockAPIView.as_view(),
        name='stocks_detail'
    )
)
