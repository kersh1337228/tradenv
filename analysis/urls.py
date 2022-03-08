from django.urls import path
from analysis.views import AnalysisAPIView


urlpatterns = [
    path(
        '',
        AnalysisAPIView.as_view(),
        name='analysis'
    ),
    path(
        'form/',
        AnalysisAPIView.as_view(),
        name='analysis_form'
    ),
]
