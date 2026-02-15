from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class User(AbstractUser):
    """Custom user model using email as the login field."""

    email = models.EmailField(_("email address"), unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")


class Profile(TimeStampedModel):
    class Role(models.TextChoices):
        OWNER = "owner", _("Pet Owner")
        VET = "vet", _("Veterinarian")
        SHOP = "shop", _("Pet Shop")
        ADMIN = "admin", _("Administrator")

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(
        _("role"), max_length=10, choices=Role.choices, default=Role.OWNER
    )
    phone = models.CharField(_("phone number"), max_length=20, blank=True)
    address = models.TextField(_("address"), blank=True)
    city = models.CharField(_("city"), max_length=100, blank=True)
    country = models.CharField(
        _("country"), max_length=100, blank=True, default="MX"
    )
    avatar = models.ImageField(
        _("avatar"), upload_to="profiles/%Y/%m/", blank=True
    )
    language_preference = models.CharField(
        _("language preference"),
        max_length=5,
        choices=[("es", "Español"), ("en", "English")],
        default="es",
    )

    # Stripe
    stripe_customer_id = models.CharField(
        max_length=255, blank=True, db_index=True
    )

    # Notification preferences
    email_on_scan = models.BooleanField(_("email on scan"), default=True)
    email_on_message = models.BooleanField(_("email on message"), default=True)
    email_on_consent_request = models.BooleanField(
        _("email on consent request"), default=True
    )

    # Business fields for vet/shop roles
    business_name = models.CharField(
        _("business name"), max_length=255, blank=True
    )
    license_number = models.CharField(
        _("license/registration number"), max_length=100, blank=True
    )
    is_verified = models.BooleanField(_("verified professional"), default=False)

    # Odoo integration (optional)
    odoo_partner_id = models.IntegerField(
        _("Odoo partner ID"), null=True, blank=True, db_index=True
    )

    class Meta:
        verbose_name = _("profile")
        verbose_name_plural = _("profiles")

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_role_display()})"

    @property
    def is_premium(self):
        return self.user.subscriptions.filter(status="active").exists()
