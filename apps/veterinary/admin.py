from django.contrib import admin

from .models import Consent, VetMedicalRecord, ServiceRecord


@admin.register(Consent)
class ConsentAdmin(admin.ModelAdmin):
    list_display = [
        "requester",
        "animal",
        "owner",
        "status",
        "created_at",
        "responded_at",
    ]
    list_filter = ["status"]
    search_fields = [
        "requester__email",
        "owner__email",
        "animal__name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["requester", "animal", "owner"]


@admin.register(VetMedicalRecord)
class VetMedicalRecordAdmin(admin.ModelAdmin):
    list_display = [
        "animal",
        "professional",
        "record_type",
        "title",
        "date_performed",
    ]
    list_filter = ["record_type"]
    search_fields = ["animal__name", "title"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["animal", "professional", "consent"]


@admin.register(ServiceRecord)
class ServiceRecordAdmin(admin.ModelAdmin):
    list_display = [
        "animal",
        "professional",
        "service_name",
        "date_provided",
        "cost",
    ]
    search_fields = ["animal__name", "service_name"]
    readonly_fields = ["created_at", "updated_at"]
    raw_id_fields = ["animal", "professional", "consent"]
