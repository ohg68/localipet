"""Celery tasks for vaccination reminders and appointment notifications."""

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def send_vaccination_reminders():
    """
    Send reminders for vaccinations due within the next 7 days.
    Intended to run daily via Celery Beat.
    """
    from .models import Vaccination

    today = timezone.now().date()
    reminder_window = today + timedelta(days=7)

    due_vaccinations = Vaccination.objects.filter(
        next_due_date__range=(today, reminder_window),
        reminder_sent=False,
        animal__is_active=True,
    ).select_related("animal__owner")

    count = 0
    for vacc in due_vaccinations:
        try:
            from apps.notifications.services import create_notification
            from apps.notifications.models import Notification

            days_until = (vacc.next_due_date - today).days
            create_notification(
                recipient=vacc.animal.owner,
                notification_type=Notification.Type.REMINDER,
                title=f"Vaccination reminder: {vacc.name}",
                message=(
                    f"{vacc.animal.name} is due for {vacc.name} "
                    f"in {days_until} day{'s' if days_until != 1 else ''}. "
                    f"Due date: {vacc.next_due_date.strftime('%Y-%m-%d')}"
                ),
            )
            vacc.reminder_sent = True
            vacc.save(update_fields=["reminder_sent"])
            count += 1
        except Exception:
            logger.exception(
                "Failed to send vaccination reminder for %s", vacc.pk
            )

    logger.info("Sent %d vaccination reminders", count)
    return count


@shared_task
def send_appointment_reminders():
    """
    Send reminders for appointments scheduled tomorrow.
    Intended to run daily via Celery Beat.
    """
    from .models import Appointment

    tomorrow = timezone.now().date() + timedelta(days=1)

    upcoming = Appointment.objects.filter(
        date=tomorrow,
        status__in=["scheduled", "confirmed"],
        reminder_sent=False,
    ).select_related("animal", "owner")

    count = 0
    for appt in upcoming:
        try:
            from apps.notifications.services import create_notification
            from apps.notifications.models import Notification

            create_notification(
                recipient=appt.owner,
                notification_type=Notification.Type.REMINDER,
                title=f"Appointment tomorrow: {appt.title}",
                message=(
                    f"You have an appointment for {appt.animal.name} "
                    f"tomorrow at {appt.time.strftime('%H:%M')}. "
                    f"{appt.title}"
                ),
            )
            appt.reminder_sent = True
            appt.save(update_fields=["reminder_sent"])
            count += 1
        except Exception:
            logger.exception(
                "Failed to send appointment reminder for %s", appt.pk
            )

    logger.info("Sent %d appointment reminders", count)
    return count
