from django.contrib import admin

from .models import Animal, AnimalPhoto


class AnimalPhotoInline(admin.TabularInline):
    model = AnimalPhoto
    extra = 0


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
    inlines = [AnimalPhotoInline]
    raw_id_fields = ["owner"]


@admin.register(AnimalPhoto)
class AnimalPhotoAdmin(admin.ModelAdmin):
    list_display = ["animal", "caption", "is_primary", "created_at"]
    list_filter = ["is_primary"]
    raw_id_fields = ["animal"]
