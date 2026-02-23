from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    AuditLog,
    CookieConsent,
    DataRetentionPolicy,
    LegalConsent,
    LegalDocument,
)


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ["doc_type", "version", "effective_date", "is_active", "created_at"]
    list_filter = ["doc_type", "is_active"]
    search_fields = ["version", "changelog"]
    readonly_fields = ["created_at", "updated_at", "content_hash"]


@admin.register(LegalConsent)
class LegalConsentAdmin(admin.ModelAdmin):
    list_display = [
        "user", "document", "consent_given", "withdrawn_at", "created_at"
    ]
    list_filter = ["consent_given", "document__doc_type"]
    search_fields = ["user__email", "user__first_name"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["user", "document"]


@admin.register(CookieConsent)
class CookieConsentAdmin(admin.ModelAdmin):
    list_display = [
        "get_who", "essential", "analytics", "marketing", "created_at"
    ]
    list_filter = ["analytics", "marketing"]
    readonly_fields = ["created_at", "updated_at"]

    @admin.display(description=_("User/Session"))
    def get_who(self, obj):
        return obj.user.email if obj.user else f"Session {obj.session_key[:8]}..."


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["user", "action", "ip_address", "created_at"]
    list_filter = ["action"]
    search_fields = ["user__email", "description"]
    readonly_fields = [
        "id", "user", "action", "description", "ip_address",
        "user_agent", "metadata", "created_at",
    ]
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(DataRetentionPolicy)
class DataRetentionPolicyAdmin(admin.ModelAdmin):
    list_display = ["data_type", "retention_days", "is_active", "last_cleanup"]
    list_filter = ["is_active"]
    readonly_fields = ["last_cleanup", "created_at", "updated_at"]
