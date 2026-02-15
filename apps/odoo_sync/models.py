from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class OdooSyncLog(TimeStampedModel):
    """Log of sync operations with Odoo."""

    class Operation(models.TextChoices):
        CREATE = "create", _("Create")
        UPDATE = "update", _("Update")
        DELETE = "delete", _("Delete")

    class Status(models.TextChoices):
        SUCCESS = "success", _("Success")
        FAILED = "failed", _("Failed")
        PENDING = "pending", _("Pending")

    model_name = models.CharField(
        _("model name"),
        max_length=100,
        help_text=_("Django model that was synced (e.g., 'Order')."),
    )
    local_id = models.CharField(
        _("local ID"),
        max_length=36,
        help_text=_("UUID of the local object."),
    )
    odoo_id = models.IntegerField(
        _("Odoo ID"),
        null=True,
        blank=True,
        help_text=_("ID of the record in Odoo."),
    )
    odoo_model = models.CharField(
        _("Odoo model"),
        max_length=100,
        blank=True,
        help_text=_("Odoo model name (e.g., 'sale.order')."),
    )
    operation = models.CharField(
        _("operation"),
        max_length=10,
        choices=Operation.choices,
    )
    status = models.CharField(
        _("status"),
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    error_message = models.TextField(
        _("error message"),
        blank=True,
    )
    request_data = models.JSONField(
        _("request data"),
        null=True,
        blank=True,
        help_text=_("Payload sent to Odoo."),
    )
    synced_at = models.DateTimeField(
        _("synced at"),
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Odoo sync log")
        verbose_name_plural = _("Odoo sync logs")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["model_name", "local_id"],
                name="sync_model_local_idx",
            ),
            models.Index(
                fields=["status", "-created_at"],
                name="sync_status_date_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.operation} {self.model_name}({self.local_id}) "
            f"→ {self.odoo_model}({self.odoo_id}) [{self.status}]"
        )
