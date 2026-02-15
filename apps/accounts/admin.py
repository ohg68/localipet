from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = _("Profile")
    fk_name = "user"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]
    list_display = [
        "email",
        "username",
        "first_name",
        "last_name",
        "is_active",
        "date_joined",
    ]
    list_filter = ["is_active", "is_staff", "profile__role"]
    search_fields = ["email", "username", "first_name", "last_name"]
    ordering = ["-date_joined"]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "phone", "city", "is_verified", "created_at"]
    list_filter = ["role", "is_verified", "country"]
    search_fields = [
        "user__email",
        "user__first_name",
        "user__last_name",
        "business_name",
    ]
    readonly_fields = ["created_at", "updated_at"]
