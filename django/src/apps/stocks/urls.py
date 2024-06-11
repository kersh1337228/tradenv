from django.urls import path
from .views import (
    StockMetaAPIView,
    StockAPIView,
    QuotesAPIView,
    IndicatorAPIView
)


urlpatterns = (
    # metadata
    path( # get | post
        route='meta/<slug:meta>',
        view=StockMetaAPIView.as_view(),
        name='stock_meta'
    ),
    # stock
    path( # post
        route='',
        view=StockAPIView.as_view(),
        name='stock_list'
    ),
    path( # get
        route='<str:symbol>',
        view=StockAPIView.as_view(),
        name='stock_detail'
    ),
    # quotes
    path( # get
        route='<str:symbol>/<slug:timeframe>',
        view=QuotesAPIView.as_view(),
        name='stock_detail'
    ),
    # indicator
    path( # get
        route='indicators',
        view=IndicatorAPIView.as_view(),
        name='quotes_indicator_list'
    ),
    path( # post
        route='<str:symbol>/<slug:timeframe>/<slug:name>',
        view=IndicatorAPIView.as_view(),
        name='quotes_indicator_detail'
    )
)
