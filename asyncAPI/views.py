from django.views.decorators.csrf import csrf_exempt
from django.utils.cache import cc_delim_re, patch_vary_headers
from django.http import HttpResponseBase
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response


class AsyncAPIView(GenericAPIView):
    @classmethod
    def as_view(cls, **kwargs):
        view = super().as_view(**kwargs)
        view.cls = cls
        view.initkwargs = kwargs
        return csrf_exempt(view)

    async def get(self, request, *args, **kwargs):
        pass

    async def post(self, request, *args, **kwargs):
        pass

    async def put(self, request, *args, **kwargs):
        pass

    async def patch(self, request, *args, **kwargs):
        pass

    async def delete(self, request, *args, **kwargs):
        pass

    async def head(self, request, *args, **kwargs):
        pass

    async def options(self, request, *args, **kwargs):
        if self.metadata_class is None:
            return self.http_method_not_allowed(request, *args, **kwargs)
        data = self.metadata_class().determine_metadata(request, self)
        return Response(data, status=200)

    async def trace(self, request, *args, **kwargs):
        pass

    def dispatch(self, request, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        request = self.initialize_request(request, *args, **kwargs)
        self.request = request
        self.headers = self.default_response_headers
        try:
            self.initial(request, *args, **kwargs)
            if request.method.lower() in self.http_method_names:
                handler = getattr(
                    self, request.method.lower(),
                    self.http_method_not_allowed
                )
            else:
                handler = self.http_method_not_allowed
            response = handler(request, *args, **kwargs)
        except Exception as exc:
            response = self.handle_exception(exc)
        self.response = self.finalize_response(request, response, *args, **kwargs)
        return self.response

    async def finalize_response(self, request, response, *args, **kwargs):
        response = await response
        assert isinstance(response, HttpResponseBase), (
            'Expected a `Response`, `HttpResponse` or `HttpStreamingResponse` '
            'to be returned from the view, but received a `%s`'
            % type(response)
        )
        if isinstance(response, Response):
            if not getattr(request, 'accepted_renderer', None):
                neg = self.perform_content_negotiation(request, force=True)
                request.accepted_renderer, request.accepted_media_type = neg
            response.accepted_renderer = request.accepted_renderer
            response.accepted_media_type = request.accepted_media_type
            response.renderer_context = self.get_renderer_context()
        vary_headers = self.headers.pop('Vary', None)
        if vary_headers is not None:
            patch_vary_headers(response, cc_delim_re.split(vary_headers))
        for key, value in self.headers.items():
            response[key] = value
        return response
