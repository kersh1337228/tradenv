from rest_framework import generics
from rest_framework.response import Response
from log.models import Log
from log.serializers import LogSerializer
from asgiref.sync import async_to_sync, sync_to_async
from asyncAPI.views import AsyncAPIView


class LogListAPIView(AsyncAPIView):
    async def get(self, request, *args, **kwargs):
        return Response(
            data={
                'logs': await sync_to_async(
                    lambda: LogSerializer(
                        Log.objects.all(),
                        many=True
                    ).data
                )()
            },
            status=200,
        )


# Getting log details or deleting the one
class LogAPIView(AsyncAPIView):
    async def get(self, request, *args, **kwargs):  # Selecting log matching request
        log = await Log.objects.aget(slug=kwargs.get('slug'))
        return Response(
            data={
                'log': await sync_to_async(
                    lambda: LogSerializer(log).data
                )()
            },
            status=200
        )

    async def delete(self, request, *args, **kwargs):  # Deleting log matching request
        await Log.objects.filter(slug=kwargs.get('slug')).adelete()
        return Response({}, status=200)
