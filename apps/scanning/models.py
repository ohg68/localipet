import secrets

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


def generate_scan_token():
    return secrets.token_urlsafe(16)


class QRCode(TimeStampedModel):
    """Each animal gets one QR code. The token is used in the public scan URL."""

    animal = models.OneToOneField(
        "animals.Animal",
        on_delete=models.CASCADE,
        related_name="qr_code",
    )
    token = models.CharField(
        _("scan token"),
        max_length=32,
        unique=True,
        default=generate_scan_token,
        db_index=True,
    )
    is_active = models.BooleanField(_("active"), default=True)
    qr_image = models.ImageField(
        _("QR image"),
        upload_to="qr_codes/%Y/%m/",
        blank=True,
    )

    class Meta:
        verbose_name = _("QR code")

    def __str__(self):
        return f"QR: {self.animal.name} ({self.token[:8]}...)"

    def get_scan_url(self):
        return f"{settings.BASE_URL}/s/{self.token}/"


class ScanLog(TimeStampedModel):
    """Records every scan event."""

    qr_code = models.ForeignKey(
        QRCode, on_delete=models.CASCADE, related_name="scans"
    )
    ip_address = models.GenericIPAddressField(
        _("IP address"), null=True, blank=True
    )
    user_agent = models.TextField(_("user agent"), blank=True)
    latitude = models.DecimalField(
        _("latitude"), max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        _("longitude"), max_digits=9, decimal_places=6, null=True, blank=True
    )
    city_guess = models.CharField(
        _("approximate city"), max_length=100, blank=True
    )
    country_guess = models.CharField(
        _("approximate country"), max_length=100, blank=True
    )

    class Meta:
        verbose_name = _("scan log")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["qr_code", "-created_at"],
                name="scanlog_qr_created_idx",
            ),
        ]


class FinderMessage(TimeStampedModel):
    """Message sent by someone who scanned a QR code to the animal's owner."""

    scan_log = models.ForeignKey(
        ScanLog,
        on_delete=models.SET_NULL,
        null=True,
        related_name="messages",
    )
    qr_code = models.ForeignKey(
        QRCode, on_delete=models.CASCADE, related_name="finder_messages"
    )
    sender_name = models.CharField(_("your name"), max_length=100)
    sender_phone = models.CharField(_("your phone"), max_length=30, blank=True)
    sender_email = models.EmailField(_("your email"), blank=True)
    message = models.TextField(_("message"), max_length=1000)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    is_read = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("finder message")
        ordering = ["-created_at"]


class NFCTag(TimeStampedModel):
    """Links a physical NFC/RFID tag to an animal. Future feature."""

    animal = models.ForeignKey(
        "animals.Animal",
        on_delete=models.CASCADE,
        related_name="nfc_tags",
    )
    tag_uid = models.CharField(
        _("NFC tag UID"), max_length=100, unique=True, db_index=True
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("NFC tag")
