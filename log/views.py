from rest_framework import generics
from rest_framework.response import Response
from log.models import Log
from log.serializers import LogSerializer
from asgiref.sync import async_to_sync, sync_to_async


class LogListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            return Response(
                data={
                    'logs': LogSerializer(
                        Log.objects.all(),
                        many=True
                    ).data
                },
                status=200,
            )


# Getting log details or deleting the one
class LogAPIView(
    generics.RetrieveDestroyAPIView
):
    @async_to_sync
    async def get(self, request, *args, **kwargs):  # Selecting log matching request
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            log = await Log.objects.aget(slug=kwargs.get('slug'))
            return Response(
                data={
                    'log': await sync_to_async(
                        lambda: LogSerializer(log).data
                    )()
                },
                status=200
            )

    @async_to_sync
    async def delete(self, request, *args, **kwargs):  # Deleting log matching request
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            await Log.objects.filter(slug=kwargs.get('slug')).adelete()
            return Response({}, status=200)
