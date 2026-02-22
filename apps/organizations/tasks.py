"""Celery tasks for organizations."""

import csv
import logging
from io import StringIO

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def import_clients_from_csv(org_id, csv_content, imported_by_id):
    """
    Process CSV and create/link client records asynchronously.

    CSV columns: email, first_name, last_name, phone, notes
    Users must already have a Localipet account.
    """
    from apps.accounts.models import User
    from .models import Organization, OrganizationClient

    org = Organization.objects.get(pk=org_id)
    reader = csv.DictReader(StringIO(csv_content))

    created = 0
    skipped = 0
    errors = []

    for row in reader:
        email = row.get("email", "").strip().lower()
        if not email:
            continue

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            errors.append(email)
            skipped += 1
            continue

        _, was_created = OrganizationClient.objects.get_or_create(
            organization=org,
            user=user,
            defaults={
                "registered_by_id": imported_by_id,
                "notes": row.get("notes", ""),
            },
        )
        if was_created:
            created += 1
        else:
            skipped += 1

    logger.info(
        "CSV import for org %s: created=%d, skipped=%d, errors=%d",
        org.name,
        created,
        skipped,
        len(errors),
    )
    return {"created": created, "skipped": skipped, "errors": errors}


@shared_task
def send_org_invitation_email(invitation_id):
    """Send invitation email to a user."""
    from django.conf import settings
    from django.core.mail import send_mail

    from .models import OrganizationInvitation

    try:
        invitation = OrganizationInvitation.objects.select_related(
            "organization", "invited_by"
        ).get(pk=invitation_id)
    except OrganizationInvitation.DoesNotExist:
        return

    invite_url = (
        f"{settings.BASE_URL}/org/invite/{invitation.token}/"
    )

    send_mail(
        subject=f"Invitation to join {invitation.organization.name} on Localipet",
        message=(
            f"You have been invited to join {invitation.organization.name} "
            f"by {invitation.invited_by.get_full_name()}.\n\n"
            f"Click here to accept: {invite_url}\n\n"
            f"This invitation expires on {invitation.expires_at.strftime('%Y-%m-%d')}."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.email],
        fail_silently=True,
    )
