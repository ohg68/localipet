from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class Notification(TimeStampedModel):
    """In-app and email notifications."""

    class Type(models.TextChoices):
        SCAN_ALERT = "scan_alert", _("QR Scan Alert")
        FINDER_MESSAGE = "finder_message", _("Finder Message")
        CONSENT_REQUEST = "consent_request", _("Consent Request")
        CONSENT_RESPONSE = "consent_response", _("Consent Response")
        CONSENT_REVOKED = "consent_revoked", _("Consent Revoked")
        ORDER_STATUS = "order_status", _("Order Status Update")
        SUBSCRIPTION = "subscription", _("Subscription Update")
        REMINDER = "reminder", _("Reminder")
        SYSTEM = "system", _("System Notification")

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name=_("recipient"),
    )
    notification_type = models.CharField(
        _("type"),
        max_length=30,
        choices=Type.choices,
    )
    title = models.CharField(_("title"), max_length=200)
    message = models.TextField(_("message"))
    url = models.CharField(
        _("action URL"),
        max_length=500,
        blank=True,
        help_text=_("URL to redirect when notification is clicked."),
    )
    is_read = models.BooleanField(_("read"), default=False)
    email_sent = models.BooleanField(_("email sent"), default=False)

    class Meta:
        verbose_name = _("notification")
        verbose_name_plural = _("notifications")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["recipient", "is_read", "-created_at"],
                name="notif_recipient_read_idx",
            ),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title}"

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=["is_read"])
