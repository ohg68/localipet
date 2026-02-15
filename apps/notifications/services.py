"""
Notification service layer.

Centralizes notification creation and dispatch logic.
All other apps should create notifications through these functions.
"""

from django.conf import settings
from django.utils.translation import gettext as _

from .models import Notification


def create_notification(
    recipient,
    notification_type,
    title,
    message,
    url="",
    send_email=True,
):
    """Create an in-app notification and optionally queue email."""
    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        url=url,
    )

    # Send email asynchronously if enabled
    if send_email and _should_send_email(recipient, notification_type):
        from .tasks import send_notification_email

        send_notification_email.delay(str(notification.id))

    return notification


def _should_send_email(user, notification_type):
    """Check if user wants email for this notification type."""
    try:
        profile = user.profile
    except Exception:
        return True  # Default to sending

    # Map notification types to profile preferences
    pref_map = {
        Notification.Type.SCAN_ALERT: profile.notify_scan_email,
        Notification.Type.FINDER_MESSAGE: profile.notify_finder_email,
        Notification.Type.CONSENT_REQUEST: profile.notify_consent_email,
        Notification.Type.CONSENT_RESPONSE: profile.notify_consent_email,
        Notification.Type.CONSENT_REVOKED: profile.notify_consent_email,
    }

    return pref_map.get(notification_type, True)


# ── Convenience functions ────────────────────────────────


def notify_scan_alert(animal, scan_log):
    """Notify owner that their animal's QR was scanned."""
    return create_notification(
        recipient=animal.owner,
        notification_type=Notification.Type.SCAN_ALERT,
        title=_("QR Code Scanned: %(name)s") % {"name": animal.name},
        message=_(
            "Your pet %(name)s's QR code was scanned from "
            "%(city)s, %(country)s."
        )
        % {
            "name": animal.name,
            "city": scan_log.city_guess or _("Unknown"),
            "country": scan_log.country_guess or _("Unknown"),
        },
        url=f"/scan/history/{animal.pk}/",
    )


def notify_finder_message(finder_message):
    """Notify owner about a new finder message."""
    animal = finder_message.qr_code.animal
    return create_notification(
        recipient=animal.owner,
        notification_type=Notification.Type.FINDER_MESSAGE,
        title=_("New message about %(name)s") % {"name": animal.name},
        message=_(
            "%(sender)s sent a message about your pet %(name)s."
        )
        % {
            "sender": finder_message.sender_name,
            "name": animal.name,
        },
        url=f"/scan/messages/{animal.pk}/",
    )


def notify_consent_request(consent):
    """Notify owner about a new consent request."""
    return create_notification(
        recipient=consent.owner,
        notification_type=Notification.Type.CONSENT_REQUEST,
        title=_("Access request for %(name)s")
        % {"name": consent.animal.name},
        message=_(
            "%(requester)s is requesting access to "
            "%(animal)s's records."
        )
        % {
            "requester": (
                consent.requester.profile.business_name
                or consent.requester.get_full_name()
            ),
            "animal": consent.animal.name,
        },
        url=f"/vet/consent/{consent.pk}/respond/",
    )


def notify_consent_response(consent):
    """Notify requester about consent approval/denial."""
    status_text = (
        _("approved") if consent.status == "approved" else _("denied")
    )
    return create_notification(
        recipient=consent.requester,
        notification_type=Notification.Type.CONSENT_RESPONSE,
        title=_("Consent %(status)s for %(name)s")
        % {"status": status_text, "name": consent.animal.name},
        message=_(
            "The owner of %(animal)s has %(status)s your access request."
        )
        % {"animal": consent.animal.name, "status": status_text},
        url="/vet/dashboard/",
    )


def notify_consent_revoked(consent):
    """Notify requester that consent was revoked."""
    return create_notification(
        recipient=consent.requester,
        notification_type=Notification.Type.CONSENT_REVOKED,
        title=_("Access revoked for %(name)s")
        % {"name": consent.animal.name},
        message=_(
            "The owner of %(animal)s has revoked your access."
        )
        % {"animal": consent.animal.name},
        url="/vet/dashboard/",
    )


def notify_order_status(order, new_status):
    """Notify user about order status change."""
    return create_notification(
        recipient=order.user,
        notification_type=Notification.Type.ORDER_STATUS,
        title=_("Order update"),
        message=_(
            "Your order #%(order_id)s status has been updated "
            "to: %(status)s."
        )
        % {
            "order_id": str(order.id)[:8],
            "status": new_status,
        },
        url=f"/billing/orders/{order.pk}/",
    )
