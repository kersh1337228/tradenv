from django.urls import path
from log.views import LogListAPIView, LogAPIView


urlpatterns = [
    path(
        'list/',
        LogListAPIView.as_view(),
        name='log_list'
    ),
    path(
        'detail/<slug:slug>/',
        LogAPIView.as_view(),
        name='log_detail'
    ),
    path(
        'delete/<slug:slug>/',
        LogAPIView.as_view(),
        name='log_delete'
    ),
]
