from django.contrib import admin

from .models import OdooSyncLog


@admin.register(OdooSyncLog)
class OdooSyncLogAdmin(admin.ModelAdmin):
    list_display = [
        "model_name",
        "local_id",
        "odoo_model",
        "odoo_id",
        "operation",
        "status",
        "synced_at",
        "created_at",
    ]
    list_filter = ["status", "operation", "model_name"]
    search_fields = ["local_id", "model_name", "error_message"]
    readonly_fields = [
        "created_at",
        "updated_at",
        "request_data",
    ]
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
