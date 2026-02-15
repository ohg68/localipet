from django.contrib import admin

from .models import (
    Invoice,
    Order,
    OrderItem,
    Product,
    Subscription,
    SubscriptionPlan,
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "price_monthly",
        "max_animals",
        "is_active",
    ]
    list_filter = ["is_active"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "plan",
        "status",
        "cancel_at_period_end",
        "current_period_end",
    ]
    list_filter = ["status", "cancel_at_period_end"]
    search_fields = ["user__email", "stripe_subscription_id"]
    raw_id_fields = ["user", "plan"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "product_type",
        "price",
        "stock",
        "is_active",
    ]
    list_filter = ["product_type", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    raw_id_fields = ["product"]
    readonly_fields = ["unit_price"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "status",
        "total",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = [
        "user__email",
        "stripe_checkout_session_id",
        "shipping_name",
    ]
    raw_id_fields = ["user", "animal"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [OrderItemInline]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number",
        "user",
        "total",
        "tax",
        "status",
        "created_at",
    ]
    list_filter = ["status"]
    search_fields = ["invoice_number", "user__email"]
    raw_id_fields = ["user", "order"]
    readonly_fields = ["created_at", "updated_at"]
