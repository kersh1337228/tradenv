from django.urls import path
from analysis import views


urlpatterns = [
    path(
        '',
        views.GenericView.as_view(),
        name='analysis'
    ),
    path(
        'api/submit',
        views.AnalysisAPIView.as_view(),
        name='analysis_form_submit'
    ),
    path(
        'form',
        views.AnalysisAPIView.as_view(),
        name='analysis_form'
    ),
]
