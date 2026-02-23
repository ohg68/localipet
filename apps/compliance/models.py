"""Compliance models: legal consent tracking, audit log, data retention."""

import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class LegalDocument(TimeStampedModel):
    """Versioned legal documents (Privacy Policy, ToS, Cookie Policy)."""

    class DocType(models.TextChoices):
        PRIVACY_POLICY = "privacy_policy", _("Privacy Policy")
        TERMS_OF_SERVICE = "terms_of_service", _("Terms of Service")
        COOKIE_POLICY = "cookie_policy", _("Cookie Policy")
        REFUND_POLICY = "refund_policy", _("Refund Policy")

    doc_type = models.CharField(
        _("document type"), max_length=30, choices=DocType.choices
    )
    version = models.CharField(_("version"), max_length=20)
    effective_date = models.DateField(_("effective date"))
    content_hash = models.CharField(
        _("content hash"), max_length=64, blank=True,
        help_text=_("SHA-256 hash of the document content for integrity verification"),
    )
    is_active = models.BooleanField(_("active"), default=True)
    changelog = models.TextField(
        _("changelog"), blank=True,
        help_text=_("Summary of changes from previous version"),
    )

    class Meta:
        verbose_name = _("legal document")
        verbose_name_plural = _("legal documents")
        unique_together = ["doc_type", "version"]
        ordering = ["-effective_date"]

    def __str__(self):
        return f"{self.get_doc_type_display()} v{self.version}"

    @classmethod
    def get_active(cls, doc_type):
        """Return the currently active version of a document type."""
        return cls.objects.filter(doc_type=doc_type, is_active=True).first()


class LegalConsent(TimeStampedModel):
    """Tracks user acceptance of legal documents (GDPR Art. 7)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="legal_consents",
    )
    document = models.ForeignKey(
        LegalDocument,
        on_delete=models.PROTECT,
        related_name="consents",
    )
    ip_address = models.GenericIPAddressField(
        _("IP address"), null=True, blank=True
    )
    user_agent = models.TextField(_("user agent"), blank=True)
    consent_given = models.BooleanField(_("consent given"), default=True)
    withdrawn_at = models.DateTimeField(
        _("withdrawn at"), null=True, blank=True
    )

    class Meta:
        verbose_name = _("legal consent")
        verbose_name_plural = _("legal consents")
        ordering = ["-created_at"]

    def __str__(self):
        status = _("accepted") if self.consent_given else _("withdrawn")
        return f"{self.user.email} - {self.document} ({status})"


class CookieConsent(TimeStampedModel):
    """Tracks cookie preference per user/session (GDPR + ePrivacy)."""

    session_key = models.CharField(
        _("session key"), max_length=40, blank=True, db_index=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cookie_consents",
    )
    essential = models.BooleanField(_("essential cookies"), default=True)
    analytics = models.BooleanField(_("analytics cookies"), default=False)
    marketing = models.BooleanField(_("marketing cookies"), default=False)
    ip_address = models.GenericIPAddressField(
        _("IP address"), null=True, blank=True
    )

    class Meta:
        verbose_name = _("cookie consent")
        verbose_name_plural = _("cookie consents")
        ordering = ["-created_at"]

    def __str__(self):
        who = self.user.email if self.user else self.session_key[:8]
        return f"Cookie consent: {who}"


class AuditLog(TimeStampedModel):
    """Immutable audit trail for compliance-relevant actions."""

    class Action(models.TextChoices):
        LOGIN = "login", _("Login")
        LOGOUT = "logout", _("Logout")
        REGISTER = "register", _("Registration")
        CONSENT_GIVEN = "consent_given", _("Consent Given")
        CONSENT_WITHDRAWN = "consent_withdrawn", _("Consent Withdrawn")
        DATA_EXPORT = "data_export", _("Data Export Requested")
        DATA_DELETE = "data_delete", _("Data Deletion Requested")
        PROFILE_UPDATE = "profile_update", _("Profile Updated")
        PASSWORD_CHANGE = "password_change", _("Password Changed")
        ANIMAL_CREATED = "animal_created", _("Animal Created")
        ANIMAL_DELETED = "animal_deleted", _("Animal Deleted")
        ORDER_PLACED = "order_placed", _("Order Placed")
        SUBSCRIPTION_CHANGE = "subscription_change", _("Subscription Changed")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(
        _("action"), max_length=30, choices=Action.choices
    )
    description = models.TextField(_("description"), blank=True)
    ip_address = models.GenericIPAddressField(
        _("IP address"), null=True, blank=True
    )
    user_agent = models.TextField(_("user agent"), blank=True)
    metadata = models.JSONField(
        _("metadata"), default=dict, blank=True,
        help_text=_("Additional structured data about the action"),
    )

    class Meta:
        verbose_name = _("audit log")
        verbose_name_plural = _("audit logs")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="audit_user_date_idx"),
            models.Index(fields=["action", "-created_at"], name="audit_action_date_idx"),
        ]

    def __str__(self):
        who = self.user.email if self.user else "anonymous"
        return f"[{self.created_at}] {who}: {self.get_action_display()}"


class DataRetentionPolicy(TimeStampedModel):
    """Configurable data retention periods per data type."""

    class DataType(models.TextChoices):
        SCAN_LOGS = "scan_logs", _("Scan Logs")
        AUDIT_LOGS = "audit_logs", _("Audit Logs")
        INACTIVE_ACCOUNTS = "inactive_accounts", _("Inactive Accounts")
        EXPIRED_CONSENTS = "expired_consents", _("Expired Consents")
        COOKIE_CONSENTS = "cookie_consents", _("Cookie Consents")
        DELETED_ANIMAL_DATA = "deleted_animal_data", _("Deleted Animal Data")

    data_type = models.CharField(
        _("data type"), max_length=30, choices=DataType.choices, unique=True
    )
    retention_days = models.PositiveIntegerField(
        _("retention period (days)"),
        help_text=_("Number of days to retain this data type. 0 = keep forever."),
    )
    is_active = models.BooleanField(_("active"), default=True)
    last_cleanup = models.DateTimeField(
        _("last cleanup"), null=True, blank=True
    )

    class Meta:
        verbose_name = _("data retention policy")
        verbose_name_plural = _("data retention policies")

    def __str__(self):
        return f"{self.get_data_type_display()}: {self.retention_days} days"
