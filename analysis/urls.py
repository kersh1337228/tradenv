from django.urls import path
from analysis import views


urlpatterns = [
    path(
        'api/submit',
        views.AnalysisAPIView.as_view(),
        name='analysis_form_submit'
    ),
    path(
        'api/form',
        views.AnalysisAPIView.as_view(),
        name='analysis_form'
    ),
]
