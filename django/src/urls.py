from django.conf import settings
from django.urls import path, include
from django.conf.urls.static import static


urlpatterns = (
    path(
        route='stocks',
        view=include('src.apps.stocks.urls'),
        name='stocks'
    ),
    path(
        route='portfolios',
        view=include('src.apps.portfolios.urls'),
        name='portfolio'
    ),
    path(
        route='strategies',
        view=include('src.apps.strategies.urls'),
        name='strategy'
    ),
    path(
        route='logs',
        view=include('src.apps.logs.urls'),
        name='log'
    )
)


if settings.DEBUG:
    urlpatterns += (
        *static(
            settings.STATIC_URL,
            document_root=settings.STATIC_ROOT
        ),
        *static(
            settings.MEDIA_URL,
            document_root=settings.MEDIA_ROOT
        )
    )
