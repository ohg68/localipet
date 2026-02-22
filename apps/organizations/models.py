import secrets

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


def _generate_invite_token():
    return secrets.token_urlsafe(48)


class Organization(TimeStampedModel):
    """A vet clinic, pet shop, or shelter that acts as a Localipet sales channel."""

    class Type(models.TextChoices):
        VET_CLINIC = "vet_clinic", _("Veterinary Clinic")
        PET_SHOP = "pet_shop", _("Pet Shop")
        SHELTER = "shelter", _("Shelter")

    # Identity
    name = models.CharField(_("organization name"), max_length=255)
    slug = models.SlugField(_("slug"), unique=True, max_length=100)
    org_type = models.CharField(
        _("type"), max_length=20, choices=Type.choices
    )
    logo = models.ImageField(
        _("logo"), upload_to="organizations/logos/%Y/%m/", blank=True
    )
    description = models.TextField(_("description"), blank=True)

    # Contact
    phone = models.CharField(_("phone"), max_length=30, blank=True)
    email = models.EmailField(_("contact email"), blank=True)
    website = models.URLField(_("website"), blank=True)

    # Address
    address = models.TextField(_("address"), blank=True)
    city = models.CharField(_("city"), max_length=100, blank=True)
    state = models.CharField(_("state"), max_length=100, blank=True)
    zip_code = models.CharField(_("ZIP code"), max_length=20, blank=True)
    country = models.CharField(_("country"), max_length=100, default="MX")

    # Mexican fiscal data
    rfc = models.CharField(
        _("RFC"),
        max_length=13,
        blank=True,
        help_text=_("Registro Federal de Contribuyentes"),
    )
    razon_social = models.CharField(
        _("business name"),
        max_length=255,
        blank=True,
        help_text=_("Legal business name for invoicing"),
    )
    regimen_fiscal = models.CharField(
        _("tax regime"), max_length=100, blank=True
    )

    # Stripe (org-level billing)
    stripe_customer_id = models.CharField(
        max_length=255, blank=True, db_index=True
    )

    # Odoo sync
    odoo_partner_id = models.IntegerField(
        null=True, blank=True, db_index=True
    )

    # Status
    is_active = models.BooleanField(_("active"), default=True)
    is_verified = models.BooleanField(_("verified"), default=False)

    class Meta:
        verbose_name = _("organization")
        verbose_name_plural = _("organizations")
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def owner(self):
        """Return the User who is OWNER of this organization."""
        membership = (
            self.members.filter(
                role=OrganizationMember.Role.OWNER, is_active=True
            )
            .select_related("user")
            .first()
        )
        return membership.user if membership else None

    @property
    def active_subscription(self):
        return self.subscriptions.filter(
            status=OrganizationSubscription.Status.ACTIVE
        ).select_related("plan").first()

    def client_animal_ids(self):
        """Return list of animal IDs belonging to all org clients."""
        from apps.animals.models import Animal

        client_user_ids = self.clients.filter(
            is_active=True
        ).values_list("user_id", flat=True)
        return Animal.objects.filter(
            owner_id__in=client_user_ids, is_active=True
        ).values_list("id", flat=True)


class OrganizationMember(TimeStampedModel):
    """Links a User to an Organization with a role (staff side)."""

    class Role(models.TextChoices):
        OWNER = "owner", _("Owner")
        ADMIN = "admin", _("Admin")
        STAFF = "staff", _("Staff")
        VET = "vet", _("Veterinarian")

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="org_memberships",
    )
    role = models.CharField(
        _("role"), max_length=10, choices=Role.choices
    )
    is_active = models.BooleanField(_("active"), default=True)
    invited_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="org_invitations_sent",
    )

    class Meta:
        verbose_name = _("organization member")
        verbose_name_plural = _("organization members")
        unique_together = [("organization", "user")]
        indexes = [
            models.Index(
                fields=["user", "is_active"],
                name="orgmember_user_active_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.user.get_full_name() or self.user.email} "
            f"@ {self.organization.name} ({self.get_role_display()})"
        )


class OrganizationClient(TimeStampedModel):
    """Links a pet owner as a client of an Organization."""

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="clients"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="org_client_memberships",
    )
    registered_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clients_registered",
    )
    notes = models.TextField(_("internal notes"), blank=True)
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        verbose_name = _("organization client")
        verbose_name_plural = _("organization clients")
        unique_together = [("organization", "user")]
        indexes = [
            models.Index(
                fields=["organization", "is_active"],
                name="orgclient_org_active_idx",
            ),
        ]

    def __str__(self):
        name = self.user.get_full_name() or self.user.email
        return f"{name} (client of {self.organization.name})"


class OrganizationInvitation(TimeStampedModel):
    """Pending invitation to join an organization (staff or client)."""

    class InviteType(models.TextChoices):
        STAFF = "staff", _("Staff Member")
        CLIENT = "client", _("Client")

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="invitations"
    )
    email = models.EmailField(_("invited email"))
    invite_type = models.CharField(
        max_length=10, choices=InviteType.choices
    )
    role = models.CharField(
        _("role"),
        max_length=10,
        choices=OrganizationMember.Role.choices,
        blank=True,
        help_text=_("Only for staff invitations"),
    )
    token = models.CharField(
        max_length=64, unique=True, db_index=True, default=_generate_invite_token
    )
    invited_by = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = _("invitation")
        verbose_name_plural = _("invitations")

    def __str__(self):
        return f"Invite {self.email} to {self.organization.name}"

    @property
    def is_expired(self):
        return self.expires_at < timezone.now()

    @property
    def is_pending(self):
        return self.accepted_at is None and not self.is_expired


class OrganizationPlan(TimeStampedModel):
    """Subscription plan for organizations (separate from individual plans)."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    stripe_product_id = models.CharField(max_length=255, blank=True)
    stripe_price_id = models.CharField(max_length=255, blank=True)
    price_monthly = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default="MXN")

    # Limits
    max_staff = models.PositiveIntegerField(
        _("max staff members"), default=3
    )
    max_clients = models.PositiveIntegerField(
        _("max clients"), default=50
    )

    # Features
    has_bulk_operations = models.BooleanField(default=False)
    has_revenue_dashboard = models.BooleanField(default=False)
    has_csv_import = models.BooleanField(default=False)
    commission_rate = models.DecimalField(
        _("commission rate"),
        max_digits=5,
        decimal_places=4,
        default=0,
        help_text=_("0.10 = 10% commission on product sales"),
    )

    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = _("organization plan")
        verbose_name_plural = _("organization plans")
        ordering = ["display_order"]

    def __str__(self):
        return self.name


class OrganizationSubscription(TimeStampedModel):
    """Subscription at the Organization level."""

    class Status(models.TextChoices):
        ACTIVE = "active", _("Active")
        PAST_DUE = "past_due", _("Past Due")
        CANCELED = "canceled", _("Canceled")
        TRIALING = "trialing", _("Trialing")

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        OrganizationPlan, on_delete=models.PROTECT
    )
    stripe_subscription_id = models.CharField(
        max_length=255, unique=True, db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    current_period_start = models.DateTimeField(null=True)
    current_period_end = models.DateTimeField(null=True)
    cancel_at_period_end = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("organization subscription")
        verbose_name_plural = _("organization subscriptions")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.organization.name} - {self.plan.name}"


class OrganizationSale(TimeStampedModel):
    """Tracks a product sale made BY an organization ON BEHALF OF a client."""

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="sales"
    )
    order = models.OneToOneField(
        "billing.Order",
        on_delete=models.CASCADE,
        related_name="org_sale",
    )
    client = models.ForeignKey(
        OrganizationClient,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sales",
    )
    sold_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="org_sales_made",
    )
    commission_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = _("organization sale")
        verbose_name_plural = _("organization sales")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["organization", "-created_at"],
                name="orgsale_org_created_idx",
            ),
        ]

    def __str__(self):
        return f"Sale #{self.order_id} by {self.organization.name}"
