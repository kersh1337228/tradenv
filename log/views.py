from django.shortcuts import render, redirect
from rest_framework.generics import ListAPIView, RetrieveUpdateDestroyAPIView, get_object_or_404
from rest_framework.response import Response

from log.models import Log


# Shows list of all analysis logs
class LogListAPIView(ListAPIView):
    def get(self, request, *args, **kwargs):  # list
        if request.is_ajax():
            pass
        else:
            return render(
                template_name='log_list.html',
                context={
                    'logs': Log.objects.all()
                },
                request=request
            )


# Getting log details or deleting the one
class LogAPIView(RetrieveUpdateDestroyAPIView):
    def get(self, request, *args, **kwargs):  # detail
        if request.is_ajax():
            pass
        else:
            return render(
                template_name='log_detail.html',
                context={
                    'log': get_object_or_404(Log, slug=kwargs.get('slug'))
                },
                request=request
            )

    def delete(self, request, *args, **kwargs):  # delete
        Log.objects.get(slug=kwargs.get('slug')).delete()
        if request.is_ajax():
            return Response({}, status=200)
        else:
            return redirect(to='log_list')
