from django.contrib import admin

from .models import (
    Animal,
    AnimalCoOwner,
    AnimalPhoto,
    Appointment,
    Vaccination,
    WeightRecord,
)


class AnimalPhotoInline(admin.TabularInline):
    model = AnimalPhoto
    extra = 0


class VaccinationInline(admin.TabularInline):
    model = Vaccination
    extra = 0
    fields = ["name", "date_administered", "next_due_date", "administered_by"]


class WeightRecordInline(admin.TabularInline):
    model = WeightRecord
    extra = 0
    fields = ["weight_kg", "date_recorded", "notes"]


class CoOwnerInline(admin.TabularInline):
    model = AnimalCoOwner
    extra = 0
    raw_id_fields = ["user", "invited_by"]


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "species",
        "breed",
        "owner",
        "is_lost",
        "is_active",
        "created_at",
    ]
    list_filter = ["species", "is_lost", "is_active", "sex"]
    search_fields = ["name", "breed", "microchip_id", "owner__email"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [
        AnimalPhotoInline,
        VaccinationInline,
        WeightRecordInline,
        CoOwnerInline,
    ]
    raw_id_fields = ["owner"]


@admin.register(AnimalPhoto)
class AnimalPhotoAdmin(admin.ModelAdmin):
    list_display = ["animal", "caption", "is_primary", "created_at"]
    list_filter = ["is_primary"]
    raw_id_fields = ["animal"]


@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "animal",
        "date_administered",
        "next_due_date",
        "reminder_sent",
    ]
    list_filter = ["reminder_sent", "name"]
    search_fields = ["name", "animal__name"]
    raw_id_fields = ["animal"]


@admin.register(WeightRecord)
class WeightRecordAdmin(admin.ModelAdmin):
    list_display = ["animal", "weight_kg", "date_recorded"]
    raw_id_fields = ["animal"]


@admin.register(AnimalCoOwner)
class AnimalCoOwnerAdmin(admin.ModelAdmin):
    list_display = ["animal", "user", "permission", "invited_by", "created_at"]
    list_filter = ["permission"]
    raw_id_fields = ["animal", "user", "invited_by"]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "animal",
        "owner",
        "date",
        "time",
        "status",
    ]
    list_filter = ["status", "date"]
    search_fields = ["title", "animal__name", "owner__email"]
    raw_id_fields = ["animal", "owner", "vet"]
