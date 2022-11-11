from django.urls import path
from log.views import LogListAPIView, LogAPIView


urlpatterns = [
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
