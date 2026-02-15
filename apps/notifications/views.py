from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.translation import gettext_lazy as _
from django.views import View
from django.views.generic import ListView

from .models import Notification


class NotificationListView(LoginRequiredMixin, ListView):
    """List user's notifications."""

    model = Notification
    template_name = "notifications/notification_list.html"
    context_object_name = "notifications"
    paginate_by = 30

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")


class MarkReadView(LoginRequiredMixin, View):
    """Mark a single notification as read."""

    def post(self, request, pk):
        notification = get_object_or_404(
            Notification, pk=pk, recipient=request.user
        )
        notification.mark_read()

        # If notification has a URL, redirect there
        if notification.url:
            return redirect(notification.url)

        return redirect("notifications:list")


class MarkAllReadView(LoginRequiredMixin, View):
    """Mark all notifications as read."""

    def post(self, request):
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)

        return redirect("notifications:list")


class UnreadCountView(LoginRequiredMixin, View):
    """Return unread count (for HTMX polling)."""

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()

        # Support both JSON and HTMX responses
        if request.headers.get("HX-Request"):
            if count > 0:
                badge = (
                    f'<span class="badge bg-danger">'
                    f"{count if count <= 99 else '99+'}"
                    f"</span>"
                )
            else:
                badge = ""
            from django.http import HttpResponse

            return HttpResponse(badge)

        return JsonResponse({"unread_count": count})
