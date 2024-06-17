from django.urls import path
from .views import LogListAPIView, LogAPIView


urlpatterns = (
    path( # get | post
        route='',
        view=LogListAPIView.as_view(),
        name='log_list'
    ),
    path( # get | delete
        route='/<slug:id>',
        view=LogAPIView.as_view(),
        name='log_rd'
    )
)
