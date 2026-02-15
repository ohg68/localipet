"""Celery tasks for notification delivery."""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_notification_email(self, notification_id):
    """Send email for a notification."""
    from .models import Notification

    try:
        notification = Notification.objects.select_related(
            "recipient"
        ).get(pk=notification_id)
    except Notification.DoesNotExist:
        logger.warning(
            "Notification %s not found for email", notification_id
        )
        return

    if notification.email_sent:
        return

    recipient = notification.recipient

    # Build email context
    context = {
        "notification": notification,
        "user": recipient,
        "base_url": settings.BASE_URL,
        "action_url": (
            f"{settings.BASE_URL}{notification.url}"
            if notification.url
            else ""
        ),
    }

    # Render email templates
    try:
        html_message = render_to_string(
            "notifications/email/notification.html", context
        )
        plain_message = render_to_string(
            "notifications/email/notification.txt", context
        )
    except Exception:
        # Fallback to simple text email
        html_message = None
        plain_message = (
            f"{notification.title}\n\n{notification.message}"
        )

    try:
        send_mail(
            subject=notification.title,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            html_message=html_message,
            fail_silently=False,
        )
        notification.email_sent = True
        notification.save(update_fields=["email_sent"])
        logger.info(
            "Email sent for notification %s to %s",
            notification_id,
            recipient.email,
        )
    except Exception as exc:
        logger.error(
            "Failed to send email for notification %s: %s",
            notification_id,
            exc,
        )
        raise self.retry(exc=exc)


@shared_task
def send_finder_email(finder_message_id):
    """Send email to owner when someone finds their pet."""
    from apps.scanning.models import FinderMessage

    try:
        msg = FinderMessage.objects.select_related(
            "qr_code__animal__owner"
        ).get(pk=finder_message_id)
    except FinderMessage.DoesNotExist:
        logger.warning("FinderMessage %s not found", finder_message_id)
        return

    animal = msg.qr_code.animal
    owner = animal.owner

    context = {
        "finder_message": msg,
        "animal": animal,
        "owner": owner,
        "base_url": settings.BASE_URL,
    }

    try:
        html_message = render_to_string(
            "notifications/email/finder_message.html", context
        )
        plain_message = render_to_string(
            "notifications/email/finder_message.txt", context
        )
    except Exception:
        plain_message = (
            f"Someone found your pet {animal.name}!\n\n"
            f"Name: {msg.sender_name}\n"
            f"Phone: {msg.sender_phone}\n"
            f"Email: {msg.sender_email}\n"
            f"Message: {msg.message}"
        )
        html_message = None

    send_mail(
        subject=f"Someone found your pet {animal.name}!",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[owner.email],
        html_message=html_message,
        fail_silently=True,
    )


@shared_task
def cleanup_old_notifications(days=90):
    """Delete read notifications older than N days."""
    from datetime import timedelta

    from django.utils import timezone

    from .models import Notification

    cutoff = timezone.now() - timedelta(days=days)
    count, _ = Notification.objects.filter(
        is_read=True, created_at__lt=cutoff
    ).delete()
    logger.info("Cleaned up %d old notifications", count)
