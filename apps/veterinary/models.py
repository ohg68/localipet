from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class Consent(TimeStampedModel):
    """Access-consent record between a professional (vet/shop) and an animal."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        DENIED = "denied", _("Denied")
        REVOKED = "revoked", _("Revoked")

    requester = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="consent_requests_made",
        verbose_name=_("requesting professional"),
    )
    animal = models.ForeignKey(
        "animals.Animal",
        on_delete=models.CASCADE,
        related_name="consents",
    )
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="consent_requests_received",
        verbose_name=_("animal owner"),
    )
    status = models.CharField(
        _("status"),
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    message = models.TextField(
        _("request message"),
        blank=True,
        help_text=_(
            "Message from professional to owner explaining why access is needed."
        ),
    )
    responded_at = models.DateTimeField(
        _("responded at"), null=True, blank=True
    )
    expires_at = models.DateTimeField(
        _("access expires at"),
        null=True,
        blank=True,
        help_text=_(
            "If set, access is automatically revoked after this date."
        ),
    )

    # Scoped permissions
    can_view_medical = models.BooleanField(
        _("can view medical history"), default=True
    )
    can_add_medical = models.BooleanField(
        _("can add medical records"), default=True
    )
    can_add_services = models.BooleanField(
        _("can register services"), default=True
    )

    class Meta:
        verbose_name = _("consent")
        unique_together = [("requester", "animal")]
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Consent: {self.requester} -> {self.animal} "
            f"({self.get_status_display()})"
        )

    @property
    def is_valid(self):
        if self.status != self.Status.APPROVED:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True


class VetMedicalRecord(TimeStampedModel):
    """Medical record added by an authorized vet/shop."""

    class RecordType(models.TextChoices):
        CHECKUP = "checkup", _("Checkup")
        VACCINATION = "vaccination", _("Vaccination")
        SURGERY = "surgery", _("Surgery")
        DIAGNOSIS = "diagnosis", _("Diagnosis")
        LAB_RESULT = "lab_result", _("Lab Result")
        PRESCRIPTION = "prescription", _("Prescription")
        OTHER = "other", _("Other")

    animal = models.ForeignKey(
        "animals.Animal",
        on_delete=models.CASCADE,
        related_name="vet_records",
    )
    professional = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="vet_records_created",
    )
    consent = models.ForeignKey(
        Consent,
        on_delete=models.SET_NULL,
        null=True,
        help_text=_("The consent under which this record was created."),
    )
    record_type = models.CharField(
        _("record type"),
        max_length=20,
        choices=RecordType.choices,
    )
    title = models.CharField(_("title"), max_length=255)
    description = models.TextField(_("description"))
    date_performed = models.DateField(_("date performed"))
    next_due_date = models.DateField(
        _("next due date"), null=True, blank=True
    )
    attachment = models.FileField(
        _("attachment"),
        upload_to="vet_records/%Y/%m/",
        blank=True,
    )

    class Meta:
        verbose_name = _("veterinary medical record")
        ordering = ["-date_performed"]

    def __str__(self):
        return f"{self.get_record_type_display()}: {self.title}"


class ServiceRecord(TimeStampedModel):
    """Service provided by a vet/shop (grooming, boarding, purchase, etc.)."""

    animal = models.ForeignKey(
        "animals.Animal",
        on_delete=models.CASCADE,
        related_name="service_records",
    )
    professional = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="services_provided",
    )
    consent = models.ForeignKey(
        Consent, on_delete=models.SET_NULL, null=True
    )
    service_name = models.CharField(_("service"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    date_provided = models.DateField(_("date provided"))
    cost = models.DecimalField(
        _("cost"), max_digits=10, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(_("currency"), max_length=3, default="MXN")

    class Meta:
        verbose_name = _("service record")
        ordering = ["-date_provided"]

    def __str__(self):
        return f"{self.service_name} - {self.animal.name}"
