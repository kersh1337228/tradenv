from django.urls import path
from . import views


urlpatterns = (
    path(  # get | post
        route='',
        view=views.PortfolioListAPIView.as_view(),
        name='portfolio_list'
    ),
    path( # post
        route='create',
        view=views.PortfolioAPIView.as_view(),
        name='portfolio_create'
    ),
    path( # get | patch | delete
        route='<slug:id>',
        view=views.PortfolioAPIView.as_view(),
        name='portfolio_rud'
    ),
    path(  # post
        route='<slug:id>/accounts',
        view=views.AccountAPIView.as_view(),
        name='portfolio_accounts_create'
    ),
    path(  # patch | delete
        route='<slug:id>/accounts/<slug:account_id>',
        view=views.AccountAPIView.as_view(),
        name='portfolio_accounts_ud'
    ),
    path( # post
        route='<slug:id>/stocks',
        view=views.StockInstanceAPIView.as_view(),
        name='portfolio_stocks_create'
    ),
    path( # patch | delete
        route='<slug:id>/stocks/<slug:stock_id>',
        view=views.StockInstanceAPIView.as_view(),
        name='portfolio_stocks_ud'
    ),
)
