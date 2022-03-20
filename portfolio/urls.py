from django.urls import path
from portfolio.views import PortfolioListAPIView, PortfolioAPIView


urlpatterns = [
    path(
        'list/',
        PortfolioListAPIView.as_view(),
        name='portfolio_list'
    ),
    path(
        'create/',
        PortfolioAPIView.as_view(),
        name='portfolio_create'
    ),
    path(
        'detail/<slug:slug>/',
        PortfolioAPIView.as_view(),
        name='portfolio_detail'
    ),
    path(
        'update/<slug:slug>/',
        PortfolioAPIView.as_view(),
        name='portfolio_update'
    ),
    path(
        'delete/<slug:slug>/',
        PortfolioAPIView.as_view(),
        name='portfolio_delete'
    ),
    path(
        'detail/<slug:slug>/stocks/<str:type>/',
        PortfolioAPIView.as_view(),
        name='portfolio_stocks_manage'
    ),
]
