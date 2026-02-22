from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    Organization,
    OrganizationClient,
    OrganizationInvitation,
    OrganizationMember,
    OrganizationPlan,
    OrganizationSale,
    OrganizationSubscription,
)


class OrganizationMemberInline(admin.TabularInline):
    model = OrganizationMember
    extra = 0
    raw_id_fields = ["user", "invited_by"]


class OrganizationClientInline(admin.TabularInline):
    model = OrganizationClient
    extra = 0
    raw_id_fields = ["user", "registered_by"]


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "org_type",
        "city",
        "rfc",
        "is_active",
        "is_verified",
        "created_at",
    ]
    list_filter = ["org_type", "is_active", "is_verified", "country"]
    search_fields = ["name", "rfc", "email", "razon_social"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [OrganizationMemberInline, OrganizationClientInline]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ["user", "organization", "role", "is_active", "created_at"]
    list_filter = ["role", "is_active"]
    search_fields = [
        "user__email",
        "user__first_name",
        "user__last_name",
        "organization__name",
    ]
    raw_id_fields = ["user", "organization", "invited_by"]


@admin.register(OrganizationClient)
class OrganizationClientAdmin(admin.ModelAdmin):
    list_display = ["user", "organization", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = [
        "user__email",
        "user__first_name",
        "organization__name",
    ]
    raw_id_fields = ["user", "organization", "registered_by"]


@admin.register(OrganizationInvitation)
class OrganizationInvitationAdmin(admin.ModelAdmin):
    list_display = [
        "email",
        "organization",
        "invite_type",
        "role",
        "accepted_at",
        "expires_at",
    ]
    list_filter = ["invite_type", "role"]
    search_fields = ["email", "organization__name"]
    raw_id_fields = ["organization", "invited_by"]
    readonly_fields = ["token"]


@admin.register(OrganizationPlan)
class OrganizationPlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "price_monthly",
        "currency",
        "max_staff",
        "max_clients",
        "commission_rate",
        "is_active",
    ]
    list_filter = ["is_active"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(OrganizationSubscription)
class OrganizationSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "organization",
        "plan",
        "status",
        "current_period_start",
        "current_period_end",
    ]
    list_filter = ["status"]
    search_fields = ["organization__name"]
    raw_id_fields = ["organization"]


@admin.register(OrganizationSale)
class OrganizationSaleAdmin(admin.ModelAdmin):
    list_display = [
        "organization",
        "order",
        "client",
        "sold_by",
        "commission_amount",
        "created_at",
    ]
    list_filter = ["organization"]
    search_fields = ["organization__name"]
    raw_id_fields = ["organization", "order", "client", "sold_by"]
