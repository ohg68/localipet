"""Compliance utility functions."""

import hashlib
import json
import logging
import re
from decimal import Decimal

from django.conf import settings
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract real client IP from request (handles proxies)."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def log_audit(request, action, description="", metadata=None):
    """Create an audit log entry."""
    from .models import AuditLog

    user = request.user if request.user.is_authenticated else None
    AuditLog.objects.create(
        user=user,
        action=action,
        description=description,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        metadata=metadata or {},
    )


def record_legal_consent(request, document, consent_given=True):
    """Record a user's acceptance/withdrawal of a legal document."""
    from .models import LegalConsent

    consent = LegalConsent.objects.create(
        user=request.user,
        document=document,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        consent_given=consent_given,
    )
    action = "consent_given" if consent_given else "consent_withdrawn"
    log_audit(
        request,
        action,
        description=f"{document.get_doc_type_display()} v{document.version}",
        metadata={"document_id": str(document.id), "version": document.version},
    )
    return consent


def hash_document_content(content):
    """Generate SHA-256 hash of document content for integrity."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


# ── Mexican RFC Validation ──────────────────────────────────────────────

RFC_PATTERN = r"^[A-Z&Ñ]{3,4}\d{6}[A-V0-9][A-Z0-9]\d$"
RFC_GENERIC_PUBLIC = "XAXX010101000"
RFC_GENERIC_FOREIGN = "XEXX010101000"

rfc_validator = RegexValidator(
    regex=RFC_PATTERN,
    message=_("Enter a valid Mexican RFC (e.g., ABCD123456XY1)."),
    flags=re.IGNORECASE,
)


def validate_rfc(rfc):
    """Validate a Mexican RFC format. Returns (is_valid, error_message)."""
    if not rfc:
        return True, ""
    rfc = rfc.upper().strip()
    if rfc in (RFC_GENERIC_PUBLIC, RFC_GENERIC_FOREIGN):
        return True, ""
    if not re.match(RFC_PATTERN, rfc):
        return False, str(_(
            "Invalid RFC format. Must be 12-13 alphanumeric characters."
        ))
    return True, ""


# ── Tax Calculation ─────────────────────────────────────────────────────

def get_tax_rate(country="MX"):
    """Return the applicable tax rate for a country."""
    rates = {
        "MX": Decimal("0.16"),  # IVA Mexico 16%
    }
    return rates.get(country, getattr(settings, "TAX_RATE", Decimal("0")))


def calculate_tax(subtotal, country="MX"):
    """Calculate tax amount for a given subtotal and country."""
    rate = get_tax_rate(country)
    return (subtotal * rate).quantize(Decimal("0.01"))


# ── Data Export ─────────────────────────────────────────────────────────

def export_user_data(user):
    """
    Export all user data as a dictionary (GDPR Art. 20 - Data Portability).
    Returns a JSON-serializable dict.
    """
    data = {
        "account": {
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
        },
    }

    # Profile
    if hasattr(user, "profile"):
        p = user.profile
        data["profile"] = {
            "role": p.role,
            "phone": p.phone,
            "address": p.address,
            "city": p.city,
            "country": p.country,
            "language_preference": p.language_preference,
            "business_name": p.business_name,
            "license_number": p.license_number,
            "notification_preferences": {
                "email_on_scan": p.email_on_scan,
                "email_on_message": p.email_on_message,
                "email_on_consent_request": p.email_on_consent_request,
            },
        }

    # Animals
    animals = []
    for animal in user.animals.all():
        animal_data = {
            "name": animal.name,
            "species": animal.species,
            "breed": getattr(animal, "breed", ""),
            "color": getattr(animal, "color", ""),
            "date_of_birth": str(animal.date_of_birth) if getattr(animal, "date_of_birth", None) else None,
            "microchip_number": getattr(animal, "microchip_number", ""),
            "created_at": animal.created_at.isoformat(),
        }
        animals.append(animal_data)
    data["animals"] = animals

    # Orders
    orders = []
    for order in user.orders.all():
        order_data = {
            "id": str(order.id),
            "status": order.status,
            "total": str(order.total),
            "currency": order.currency,
            "created_at": order.created_at.isoformat(),
            "items": [
                {
                    "product": item.product.name,
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                }
                for item in order.items.all()
            ],
        }
        orders.append(order_data)
    data["orders"] = orders

    # Subscriptions
    subs = []
    for sub in user.subscriptions.all():
        subs.append({
            "plan": sub.plan.name,
            "status": sub.status,
            "created_at": sub.created_at.isoformat(),
        })
    data["subscriptions"] = subs

    # Scan logs
    scan_logs = []
    for animal in user.animals.all():
        for scan in animal.scans.all()[:100]:
            scan_logs.append({
                "animal": animal.name,
                "scanned_at": scan.created_at.isoformat(),
                "latitude": str(scan.latitude) if hasattr(scan, "latitude") and scan.latitude else None,
                "longitude": str(scan.longitude) if hasattr(scan, "longitude") and scan.longitude else None,
            })
    data["scan_logs"] = scan_logs

    # Legal consents
    consents = []
    for consent in user.legal_consents.select_related("document").all():
        consents.append({
            "document": str(consent.document),
            "consent_given": consent.consent_given,
            "created_at": consent.created_at.isoformat(),
            "withdrawn_at": consent.withdrawn_at.isoformat() if consent.withdrawn_at else None,
        })
    data["legal_consents"] = consents

    return data
