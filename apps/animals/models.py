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
