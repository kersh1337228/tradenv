from django.urls import path
from . import views


urlpatterns = (
    path( # get | post
        route='',
        view=views.StrategyAPIView.as_view(),
        name='strategies'
    ),
)
