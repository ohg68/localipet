from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "recipient",
        "notification_type",
        "title",
        "is_read",
        "email_sent",
        "created_at",
    ]
    list_filter = ["notification_type", "is_read", "email_sent"]
    search_fields = ["recipient__email", "title", "message"]
    raw_id_fields = ["recipient"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"
