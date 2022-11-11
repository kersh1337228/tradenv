from django.urls import path
from portfolio.views import PortfolioListAPIView, PortfolioAPIView


urlpatterns = [
    path(
        'api/create',
        PortfolioAPIView.as_view(),
        name='portfolio_api_create'
    ),
    path(
        'api/list',
        PortfolioListAPIView.as_view(),
        name='portfolio_api_list'
    ),
    path(
        'api/detail/<slug:slug>',
        PortfolioAPIView.as_view(),
        name='portfolio_api_detail'
    ),
    path(
        'api/update/<slug:slug>',
        PortfolioAPIView.as_view(),
        name='portfolio_api_update'
    ),
    path(
        'api/delete/<slug:slug>',
        PortfolioAPIView.as_view(),
        name='portfolio_api_delete'
    ),
    path(
        'api/detail/<slug:slug>/stocks/<str:type>',
        PortfolioAPIView.as_view(),
        name='portfolio_api_stocks_manage'
    ),
]
