from django.urls import path
from log.views import LogListAPIView, LogAPIView
from analysis.views import GenericView


urlpatterns = [
    # Regular URLs
    path(
        'list',
        GenericView.as_view(),
        name='log_list'
    ),
    path(
        'detail/<slug:slug>',
        GenericView.as_view(),
        name='log_detail'
    ),
    # API URLs
    path(
        'api/list',
        LogListAPIView.as_view(),
        name='log_list'
    ),
    path(
        'api/detail/<slug:slug>',
        LogAPIView.as_view(),
        name='log_detail'
    ),
    path(
        'api/delete/<slug:slug>',
        LogAPIView.as_view(),
        name='log_delete'
    ),
]
