"""Celery tasks for compliance: data retention cleanup."""

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="compliance.cleanup_expired_data")
def cleanup_expired_data():
    """
    Run data retention policies — delete data past its retention period.
    Should be scheduled daily via Celery Beat.
    """
    from .models import AuditLog, CookieConsent, DataRetentionPolicy

    now = timezone.now()
    cleaned = {}

    for policy in DataRetentionPolicy.objects.filter(is_active=True, retention_days__gt=0):
        cutoff = now - timedelta(days=policy.retention_days)

        if policy.data_type == DataRetentionPolicy.DataType.SCAN_LOGS:
            try:
                from apps.scanning.models import ScanLog

                count, _ = ScanLog.objects.filter(created_at__lt=cutoff).delete()
                cleaned["scan_logs"] = count
            except ImportError:
                pass

        elif policy.data_type == DataRetentionPolicy.DataType.AUDIT_LOGS:
            count, _ = AuditLog.objects.filter(created_at__lt=cutoff).delete()
            cleaned["audit_logs"] = count

        elif policy.data_type == DataRetentionPolicy.DataType.COOKIE_CONSENTS:
            count, _ = CookieConsent.objects.filter(created_at__lt=cutoff).delete()
            cleaned["cookie_consents"] = count

        elif policy.data_type == DataRetentionPolicy.DataType.EXPIRED_CONSENTS:
            from .models import LegalConsent

            count, _ = LegalConsent.objects.filter(
                consent_given=False, withdrawn_at__lt=cutoff
            ).delete()
            cleaned["expired_consents"] = count

        # Update last_cleanup timestamp
        policy.last_cleanup = now
        policy.save(update_fields=["last_cleanup", "updated_at"])

    logger.info("Data retention cleanup completed: %s", cleaned)
    return cleaned


@shared_task(name="compliance.notify_inactive_accounts")
def notify_inactive_accounts():
    """
    Find accounts inactive for the configured retention period
    and send a warning email before deletion.
    """
    from django.conf import settings
    from django.core.mail import send_mail

    from .models import DataRetentionPolicy

    policy = DataRetentionPolicy.objects.filter(
        data_type=DataRetentionPolicy.DataType.INACTIVE_ACCOUNTS,
        is_active=True,
    ).first()

    if not policy or policy.retention_days == 0:
        return {"notified": 0}

    from apps.accounts.models import User

    # Warn 30 days before deletion
    warn_cutoff = timezone.now() - timedelta(days=max(policy.retention_days - 30, 0))
    delete_cutoff = timezone.now() - timedelta(days=policy.retention_days)

    inactive_users = User.objects.filter(
        last_login__lt=warn_cutoff,
        last_login__gt=delete_cutoff,
        is_active=True,
    )

    notified = 0
    for user in inactive_users[:100]:  # Batch limit
        try:
            send_mail(
                subject="Localipet: Your account will be deactivated",
                message=(
                    f"Hello {user.get_full_name() or user.username},\n\n"
                    f"Your Localipet account has been inactive for a while. "
                    f"If you don't log in within 30 days, your account and data "
                    f"will be permanently deleted per our data retention policy.\n\n"
                    f"Log in at {settings.BASE_URL} to keep your account active.\n\n"
                    f"- The Localipet Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            notified += 1
        except Exception:
            logger.warning("Failed to notify inactive user %s", user.email, exc_info=True)

    logger.info("Notified %d inactive accounts", notified)
    return {"notified": notified}
