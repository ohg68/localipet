from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class SubscriptionPlan(TimeStampedModel):
    """Mirrors Stripe product/price for local reference."""

    name = models.CharField(_("plan name"), max_length=100)
    slug = models.SlugField(unique=True)
    stripe_product_id = models.CharField(max_length=255, blank=True)
    stripe_price_id = models.CharField(max_length=255, blank=True)
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default="MXN")
    # Feature flags
    max_animals = models.PositiveIntegerField(
        _("max animals"), default=2
    )
    scan_history_days = models.PositiveIntegerField(
        _("scan history retention (days)"), default=30
    )
    has_advanced_alerts = models.BooleanField(default=False)
    has_reminders = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _("subscription plan")
        ordering = ["display_order"]

    def __str__(self):
        return self.name


class Subscription(TimeStampedModel):
    """Tracks a user's active Stripe subscription."""

    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        PAST_DUE = "past_due", _("Past Due")
        CANCELED = "canceled", _("Canceled")
        TRIALING = "trialing", _("Trialing")

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    stripe_subscription_id = models.CharField(
        max_length=255, unique=True, db_index=True
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    current_period_start = models.DateTimeField(null=True)
    current_period_end = models.DateTimeField(null=True)
    cancel_at_period_end = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("subscription")
        ordering = ["-created_at"]


class Product(TimeStampedModel):
    """Physical products for sale (premium tags, medals, labels)."""

    class ProductType(models.TextChoices):
        PREMIUM_TAG = "premium_tag", _("Premium Tag")
        MEDAL = "medal", _("Medal")
        ECONOMIC_LABEL = "economic_label", _("Economic Label")
        NFC_TAG = "nfc_tag", _("NFC Tag")

    name = models.CharField(_("name"), max_length=255)
    slug = models.SlugField(unique=True)
    product_type = models.CharField(
        max_length=20, choices=ProductType.choices
    )
    description = models.TextField(_("description"))
    price = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default="MXN")
    stripe_product_id = models.CharField(max_length=255, blank=True)
    stripe_price_id = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="products/", blank=True)
    is_active = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _("product")

    def __str__(self):
        return self.name


class Order(TimeStampedModel):
    """One-time purchase order for physical products."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending Payment")
        PAID = "paid", _("Paid")
        SHIPPED = "shipped", _("Shipped")
        DELIVERED = "delivered", _("Delivered")
        CANCELED = "canceled", _("Canceled")
        REFUNDED = "refunded", _("Refunded")

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="orders",
    )
    stripe_checkout_session_id = models.CharField(
        max_length=255, blank=True, db_index=True
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255, blank=True
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="MXN")
    shipping_name = models.CharField(max_length=255)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_zip = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default="MX")
    tracking_number = models.CharField(max_length=255, blank=True)
    animal = models.ForeignKey(
        "animals.Animal",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    # Odoo sync (optional)
    odoo_order_id = models.IntegerField(null=True, blank=True, db_index=True)

    class Meta:
        verbose_name = _("order")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "status", "-created_at"],
                name="order_user_status_idx",
            ),
            models.Index(
                fields=["stripe_payment_intent_id"],
                name="order_payment_intent_idx",
            ),
        ]


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = _("order item")

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class Invoice(TimeStampedModel):
    """Native invoice generated in Django (independent of Odoo)."""

    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        ISSUED = "issued", _("Issued")
        PAID = "paid", _("Paid")
        CANCELED = "canceled", _("Canceled")

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="invoice",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    invoice_number = models.CharField(
        _("invoice number"), max_length=50, unique=True, db_index=True
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    total = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="MXN")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    pdf = models.FileField(
        _("PDF"),
        upload_to="invoices/%Y/%m/",
        blank=True,
    )
    # Odoo sync (optional)
    odoo_invoice_id = models.IntegerField(
        null=True, blank=True, db_index=True
    )

    class Meta:
        verbose_name = _("invoice")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invoice {self.invoice_number}"
