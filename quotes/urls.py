from django.urls import path
from quotes.views import QuotesAPIView, QuotesListAPIView


urlpatterns = [
    path(
        'list/',
        QuotesListAPIView.as_view(),
        name='quotes_list'
    ),
    path(
        'list/search/',
        QuotesListAPIView.as_view(),
        name='quotes_list_search'
    ),
    path(
        'list/filter/',
        QuotesListAPIView.as_view(),
        name='quotes_list_filter'
    ),
    path(
        'detail/<slug:slug>/',
        QuotesAPIView.as_view(),
        name='quotes_detail'
    ),
]