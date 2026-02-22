"""Core views: health check, robots.txt, etc."""

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.views.generic import TemplateView


class HealthCheckView(View):
    """Simple health check for load balancers and monitoring."""

    def get(self, request):
        return JsonResponse({"status": "ok"})


class RobotsTxtView(TemplateView):
    """Serve robots.txt as a template (so we can inject BASE_URL)."""

    template_name = "robots.txt"
    content_type = "text/plain"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["base_url"] = settings.BASE_URL
        return context
