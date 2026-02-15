from django.contrib import admin

from .models import QRCode, ScanLog, FinderMessage, NFCTag


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ["animal", "token", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["token", "animal__name"]
    readonly_fields = ["created_at", "updated_at", "token"]
    raw_id_fields = ["animal"]


@admin.register(ScanLog)
class ScanLogAdmin(admin.ModelAdmin):
    list_display = [
        "qr_code",
        "ip_address",
        "city_guess",
        "country_guess",
        "created_at",
    ]
    list_filter = ["country_guess"]
    search_fields = ["qr_code__animal__name", "ip_address"]
    readonly_fields = ["created_at"]
    raw_id_fields = ["qr_code"]


@admin.register(FinderMessage)
class FinderMessageAdmin(admin.ModelAdmin):
    list_display = ["sender_name", "qr_code", "is_read", "created_at"]
    list_filter = ["is_read"]
    search_fields = [
        "sender_name",
        "sender_email",
        "qr_code__animal__name",
    ]
    readonly_fields = ["created_at"]
    raw_id_fields = ["qr_code", "scan_log"]


@admin.register(NFCTag)
class NFCTagAdmin(admin.ModelAdmin):
    list_display = ["tag_uid", "animal", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["tag_uid", "animal__name"]
    raw_id_fields = ["animal"]
