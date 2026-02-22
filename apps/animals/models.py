from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class Species(models.TextChoices):
    DOG = "dog", _("Dog")
    CAT = "cat", _("Cat")
    BIRD = "bird", _("Bird")
    RABBIT = "rabbit", _("Rabbit")
    REPTILE = "reptile", _("Reptile")
    OTHER = "other", _("Other")


class Animal(TimeStampedModel):
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="animals",
        verbose_name=_("owner"),
    )
    name = models.CharField(_("name"), max_length=100)
    species = models.CharField(
        _("species"), max_length=20, choices=Species.choices
    )
    breed = models.CharField(_("breed"), max_length=100, blank=True)
    color = models.CharField(_("color"), max_length=100, blank=True)
    date_of_birth = models.DateField(
        _("date of birth"), null=True, blank=True
    )
    weight_kg = models.DecimalField(
        _("weight (kg)"), max_digits=5, decimal_places=2, null=True, blank=True
    )
    sex = models.CharField(
        _("sex"),
        max_length=10,
        choices=[
            ("male", _("Male")),
            ("female", _("Female")),
            ("unknown", _("Unknown")),
        ],
        default="unknown",
    )
    is_neutered = models.BooleanField(_("neutered/spayed"), default=False)
    microchip_id = models.CharField(
        _("microchip ID"), max_length=50, blank=True, db_index=True
    )
    photo = models.ImageField(
        _("main photo"), upload_to="animals/%Y/%m/", blank=True
    )
    description = models.TextField(_("description"), blank=True)
    medical_notes = models.TextField(
        _("medical notes (owner)"),
        blank=True,
        help_text=_(
            "Private notes visible only to the owner and authorized vets."
        ),
    )
    is_lost = models.BooleanField(_("marked as lost"), default=False)
    lost_since = models.DateTimeField(
        _("lost since"), null=True, blank=True
    )
    is_active = models.BooleanField(_("active"), default=True)

    class Meta:
        verbose_name = _("animal")
        verbose_name_plural = _("animals")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["owner", "is_active", "-created_at"],
                name="animal_owner_active_idx",
            ),
            models.Index(
                fields=["is_lost", "is_active"],
                name="animal_lost_active_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_species_display()})"


class AnimalPhoto(TimeStampedModel):
    """Additional photos for an animal beyond the main photo field."""

    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="photos"
    )
    image = models.ImageField(
        _("image"), upload_to="animals/gallery/%Y/%m/"
    )
    caption = models.CharField(_("caption"), max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("animal photo")
        ordering = ["-created_at"]


# ── Vaccination Calendar ─────────────────────────────


class Vaccination(TimeStampedModel):
    """Tracks vaccinations and upcoming due dates for reminders."""

    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="vaccinations"
    )
    name = models.CharField(
        _("vaccine name"), max_length=200,
        help_text=_("e.g. Rabies, DHPP, FVRCP"),
    )
    date_administered = models.DateField(_("date administered"))
    next_due_date = models.DateField(
        _("next due date"), null=True, blank=True
    )
    batch_number = models.CharField(
        _("batch/lot number"), max_length=100, blank=True
    )
    administered_by = models.CharField(
        _("administered by"), max_length=200, blank=True,
        help_text=_("Vet name or clinic"),
    )
    notes = models.TextField(_("notes"), blank=True)
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("vaccination")
        verbose_name_plural = _("vaccinations")
        ordering = ["-date_administered"]
        indexes = [
            models.Index(
                fields=["animal", "-date_administered"],
                name="vacc_animal_date_idx",
            ),
            models.Index(
                fields=["next_due_date", "reminder_sent"],
                name="vacc_due_reminder_idx",
            ),
        ]

    def __str__(self):
        return f"{self.name} — {self.animal.name} ({self.date_administered})"

    @property
    def is_overdue(self):
        from django.utils import timezone

        if self.next_due_date:
            return self.next_due_date < timezone.now().date()
        return False


# ── Weight Tracking ──────────────────────────────────


class WeightRecord(TimeStampedModel):
    """Historical weight measurements for an animal."""

    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="weight_records"
    )
    weight_kg = models.DecimalField(
        _("weight (kg)"), max_digits=6, decimal_places=2
    )
    date_recorded = models.DateField(_("date recorded"))
    notes = models.CharField(_("notes"), max_length=255, blank=True)

    class Meta:
        verbose_name = _("weight record")
        verbose_name_plural = _("weight records")
        ordering = ["-date_recorded"]
        indexes = [
            models.Index(
                fields=["animal", "-date_recorded"],
                name="weight_animal_date_idx",
            ),
        ]

    def __str__(self):
        return f"{self.animal.name}: {self.weight_kg} kg ({self.date_recorded})"


# ── Family / Shared Access ───────────────────────────


class AnimalCoOwner(TimeStampedModel):
    """Allows sharing access to an animal with family members."""

    class Permission(models.TextChoices):
        VIEW = "view", _("View Only")
        EDIT = "edit", _("View & Edit")
        MANAGE = "manage", _("Full Manage")

    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="co_owners"
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="shared_animals",
        verbose_name=_("shared with"),
    )
    permission = models.CharField(
        _("permission level"),
        max_length=10,
        choices=Permission.choices,
        default=Permission.VIEW,
    )
    invited_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="invitations_sent",
    )

    class Meta:
        verbose_name = _("co-owner")
        verbose_name_plural = _("co-owners")
        unique_together = [("animal", "user")]

    def __str__(self):
        return (
            f"{self.user.get_full_name()} — "
            f"{self.animal.name} ({self.get_permission_display()})"
        )


# ── Vet Appointments ────────────────────────────────


class Appointment(TimeStampedModel):
    """Scheduled vet appointments for an animal."""

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", _("Scheduled")
        CONFIRMED = "confirmed", _("Confirmed")
        COMPLETED = "completed", _("Completed")
        CANCELED = "canceled", _("Canceled")
        NO_SHOW = "no_show", _("No Show")

    animal = models.ForeignKey(
        Animal, on_delete=models.CASCADE, related_name="appointments"
    )
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    vet = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vet_appointments",
        verbose_name=_("veterinarian"),
    )
    title = models.CharField(_("title"), max_length=200)
    description = models.TextField(_("description"), blank=True)
    date = models.DateField(_("appointment date"))
    time = models.TimeField(_("appointment time"))
    status = models.CharField(
        _("status"),
        max_length=10,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("appointment")
        verbose_name_plural = _("appointments")
        ordering = ["date", "time"]
        indexes = [
            models.Index(
                fields=["owner", "date"],
                name="appointment_owner_date_idx",
            ),
            models.Index(
                fields=["vet", "date"],
                name="appointment_vet_date_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} — {self.animal.name} ({self.date} {self.time})"
