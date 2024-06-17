from django.urls import path
from . import views


urlpatterns = (
    # portfolio
    path(  # get | post
        route='',
        view=views.PortfolioListAPIView.as_view(),
        name='portfolio_list'
    ),
    path(  # post
        route='/create',
        view=views.PortfolioAPIView.as_view(),
        name='portfolio_create'
    ),
    path(  # post
        route='/accounts',
        view=views.AccountAPIView.as_view(),
        name='portfolio_accounts_create'
    ),
    path(  # post
        route='/stocks',
        view=views.StockInstanceAPIView.as_view(),
        name='portfolio_stocks_create'
    ),
    path(  # get | patch | delete
        route='/<slug:id>',
        view=views.PortfolioAPIView.as_view(),
        name='portfolio_rud'
    ),
    path(  # patch | delete
        route='/accounts/<slug:id>',
        view=views.AccountAPIView.as_view(),
        name='portfolio_accounts_ud'
    ),
    path(  # patch | delete
        route='/stocks/<str:id>',
        view=views.StockInstanceAPIView.as_view(),
        name='portfolio_stocks_ud'
    ),
    path(  # get | post
        route='/<slug:id>/<slug:meta>',
        view=views.PortfolioListAPIView.as_view(),
        name='portfolio_meta'
    )
)
