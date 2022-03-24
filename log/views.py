from django.shortcuts import render, redirect
from rest_framework import generics
from rest_framework.response import Response
from log.models import Log
from log.serializers import LogSerializer


# Shows list of all analysis logs
class LogListAPIView(
    generics.ListAPIView
):
    def get(self, request, *args, **kwargs):  # list
        if request.is_ajax():
            return Response(
                data={
                    'logs': LogSerializer(
                        Log.objects.all(),
                        many=True
                    ).data
                },
                status=200,
            )
        else:
            return render(
                template_name='index.html',
                request=request
            )


# Getting log details or deleting the one
class LogAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    def get(self, request, *args, **kwargs):  # detail
        if request.is_ajax():
            return Response(
                data={
                    'log': LogSerializer(
                        generics.get_object_or_404(
                            Log,
                            slug=kwargs.get('slug')
                        )
                    ).data
                },
                status=200
            )
        else:
            return render(
                template_name='index.html',
                request=request
            )

    def delete(self, request, *args, **kwargs):  # delete
        if request.is_ajax():
            Log.objects.get(slug=kwargs.get('slug')).delete()
            return Response({}, status=200)
        else:
            pass
