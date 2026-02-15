"""
Celery tasks for Odoo synchronization.

All tasks check ODOO_SYNC_ENABLED first and no-op if disabled.
Failures are logged to OdooSyncLog and retried.
"""

import logging

from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _log_sync(model_name, local_id, odoo_model, operation, **kwargs):
    """Helper to create a sync log entry."""
    from .models import OdooSyncLog

    return OdooSyncLog.objects.create(
        model_name=model_name,
        local_id=str(local_id),
        odoo_model=odoo_model,
        operation=operation,
        **kwargs,
    )


# ── Contact (Profile → res.partner) ─────────────────────


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def sync_contact_to_odoo(self, user_id):
    """Sync a user profile to Odoo as res.partner."""
    if not settings.ODOO_SYNC_ENABLED:
        return

    from apps.accounts.models import User

    from .client import get_odoo_client

    try:
        user = User.objects.select_related("profile").get(pk=user_id)
        profile = user.profile
        client = get_odoo_client()
        if not client:
            return

        partner_data = {
            "name": user.get_full_name() or user.email,
            "email": user.email,
            "phone": profile.phone or "",
            "street": profile.address or "",
            "comment": f"Localipet user {user.pk}",
            "is_company": profile.role in ("vet", "shop"),
        }

        if profile.business_name:
            partner_data["company_name"] = profile.business_name

        if profile.odoo_partner_id:
            # Update existing
            client.write(
                "res.partner", [profile.odoo_partner_id], partner_data
            )
            _log_sync(
                "Profile",
                user.pk,
                "res.partner",
                "update",
                odoo_id=profile.odoo_partner_id,
                status="success",
                synced_at=timezone.now(),
                request_data=partner_data,
            )
        else:
            # Create new
            odoo_id = client.create("res.partner", partner_data)
            profile.odoo_partner_id = odoo_id
            profile.save(update_fields=["odoo_partner_id"])
            _log_sync(
                "Profile",
                user.pk,
                "res.partner",
                "create",
                odoo_id=odoo_id,
                status="success",
                synced_at=timezone.now(),
                request_data=partner_data,
            )

        logger.info("Synced user %s to Odoo partner", user.pk)

    except Exception as exc:
        _log_sync(
            "Profile",
            user_id,
            "res.partner",
            "create",
            status="failed",
            error_message=str(exc),
        )
        logger.error("Failed to sync user %s to Odoo: %s", user_id, exc)
        raise self.retry(exc=exc)


# ── Order (Order → sale.order) ───────────────────────────


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def sync_order_to_odoo(self, order_id):
    """Sync a paid order to Odoo as sale.order."""
    if not settings.ODOO_SYNC_ENABLED:
        return

    from apps.billing.models import Order

    from .client import get_odoo_client

    try:
        order = Order.objects.select_related(
            "user__profile"
        ).prefetch_related("items__product").get(pk=order_id)

        client = get_odoo_client()
        if not client:
            return

        # Ensure partner exists in Odoo
        profile = order.user.profile
        if not profile.odoo_partner_id:
            sync_contact_to_odoo(str(order.user.pk))
            profile.refresh_from_db()

        if not profile.odoo_partner_id:
            raise ValueError(
                f"Cannot sync order — user {order.user.pk} "
                f"has no Odoo partner"
            )

        # Build order lines
        order_lines = []
        for item in order.items.all():
            line = {
                "name": item.product.name,
                "product_uom_qty": item.quantity,
                "price_unit": float(item.unit_price),
            }
            order_lines.append((0, 0, line))

        order_data = {
            "partner_id": profile.odoo_partner_id,
            "order_line": order_lines,
            "note": f"Localipet order {order.pk}",
            "client_order_ref": str(order.pk),
        }

        if order.odoo_order_id:
            client.write(
                "sale.order", [order.odoo_order_id], order_data
            )
            _log_sync(
                "Order",
                order.pk,
                "sale.order",
                "update",
                odoo_id=order.odoo_order_id,
                status="success",
                synced_at=timezone.now(),
                request_data=order_data,
            )
        else:
            odoo_id = client.create("sale.order", order_data)
            order.odoo_order_id = odoo_id
            order.save(update_fields=["odoo_order_id"])
            _log_sync(
                "Order",
                order.pk,
                "sale.order",
                "create",
                odoo_id=odoo_id,
                status="success",
                synced_at=timezone.now(),
                request_data=order_data,
            )

        logger.info("Synced order %s to Odoo", order.pk)

    except Exception as exc:
        _log_sync(
            "Order",
            order_id,
            "sale.order",
            "create",
            status="failed",
            error_message=str(exc),
        )
        logger.error("Failed to sync order %s to Odoo: %s", order_id, exc)
        raise self.retry(exc=exc)


# ── Stock Sync (bidirectional) ───────────────────────────


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def sync_stock_from_odoo(self):
    """Pull stock levels from Odoo and update local products."""
    if not settings.ODOO_SYNC_ENABLED:
        return

    from apps.billing.models import Product

    from .client import get_odoo_client

    try:
        client = get_odoo_client()
        if not client:
            return

        # Get products that have Odoo price IDs
        products = Product.objects.filter(
            stripe_price_id__isnull=False, is_active=True
        )

        for product in products:
            # Search by product name in Odoo
            odoo_products = client.search_read(
                "product.template",
                [("name", "=", product.name)],
                fields=["qty_available"],
                limit=1,
            )
            if odoo_products:
                new_stock = int(odoo_products[0].get("qty_available", 0))
                if product.stock != new_stock:
                    product.stock = new_stock
                    product.save(update_fields=["stock"])
                    logger.info(
                        "Updated stock for %s to %d from Odoo",
                        product.name,
                        new_stock,
                    )

    except Exception as exc:
        logger.error("Failed to sync stock from Odoo: %s", exc)
        raise self.retry(exc=exc)


# ── Medical Records ──────────────────────────────────────


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def sync_medical_record_to_odoo(self, record_id):
    """Sync a vet medical record to Odoo custom model."""
    if not settings.ODOO_SYNC_ENABLED:
        return

    from apps.veterinary.models import VetMedicalRecord

    from .client import get_odoo_client

    try:
        record = VetMedicalRecord.objects.select_related(
            "animal__owner__profile",
            "professional__profile",
        ).get(pk=record_id)

        client = get_odoo_client()
        if not client:
            return

        record_data = {
            "name": record.title,
            "animal_name": record.animal.name,
            "record_type": record.record_type,
            "description": record.description or "",
            "date_performed": (
                record.date_performed.isoformat()
                if record.date_performed
                else ""
            ),
            "professional_name": (
                record.professional.get_full_name()
                or record.professional.email
            ),
            "localipet_id": str(record.pk),
        }

        # Try to find owner partner in Odoo
        owner_profile = record.animal.owner.profile
        if owner_profile.odoo_partner_id:
            record_data["partner_id"] = owner_profile.odoo_partner_id

        odoo_id = client.create(
            "localipet.medical.record", record_data
        )
        _log_sync(
            "VetMedicalRecord",
            record.pk,
            "localipet.medical.record",
            "create",
            odoo_id=odoo_id,
            status="success",
            synced_at=timezone.now(),
            request_data=record_data,
        )
        logger.info("Synced medical record %s to Odoo", record.pk)

    except Exception as exc:
        _log_sync(
            "VetMedicalRecord",
            record_id,
            "localipet.medical.record",
            "create",
            status="failed",
            error_message=str(exc),
        )
        logger.error(
            "Failed to sync medical record %s to Odoo: %s",
            record_id,
            exc,
        )
        raise self.retry(exc=exc)


# ── Invoice Sync ─────────────────────────────────────────


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def sync_invoice_to_odoo(self, invoice_id):
    """Sync an invoice to Odoo as account.move."""
    if not settings.ODOO_SYNC_ENABLED:
        return

    from apps.billing.models import Invoice

    from .client import get_odoo_client

    try:
        invoice = Invoice.objects.select_related(
            "user__profile", "order"
        ).get(pk=invoice_id)

        client = get_odoo_client()
        if not client:
            return

        profile = invoice.user.profile
        if not profile.odoo_partner_id:
            sync_contact_to_odoo(str(invoice.user.pk))
            profile.refresh_from_db()

        if not profile.odoo_partner_id:
            raise ValueError("User has no Odoo partner")

        move_data = {
            "move_type": "out_invoice",
            "partner_id": profile.odoo_partner_id,
            "ref": invoice.invoice_number,
            "invoice_line_ids": [
                (
                    0,
                    0,
                    {
                        "name": f"Localipet Invoice {invoice.invoice_number}",
                        "quantity": 1,
                        "price_unit": float(invoice.total),
                    },
                )
            ],
        }

        odoo_id = client.create("account.move", move_data)
        _log_sync(
            "Invoice",
            invoice.pk,
            "account.move",
            "create",
            odoo_id=odoo_id,
            status="success",
            synced_at=timezone.now(),
            request_data=move_data,
        )
        logger.info("Synced invoice %s to Odoo", invoice.pk)

    except Exception as exc:
        _log_sync(
            "Invoice",
            invoice_id,
            "account.move",
            "create",
            status="failed",
            error_message=str(exc),
        )
        logger.error(
            "Failed to sync invoice %s to Odoo: %s", invoice_id, exc
        )
        raise self.retry(exc=exc)


# ── Periodic Sync (Celery Beat) ──────────────────────────


@shared_task
def periodic_stock_sync():
    """Periodic task to sync stock levels (every 15 min)."""
    if not settings.ODOO_SYNC_ENABLED:
        return
    sync_stock_from_odoo.delay()


@shared_task
def retry_failed_syncs():
    """Retry failed sync operations (every hour)."""
    if not settings.ODOO_SYNC_ENABLED:
        return

    from .models import OdooSyncLog

    failed = OdooSyncLog.objects.filter(
        status="failed",
        created_at__gte=timezone.now() - timezone.timedelta(hours=24),
    ).order_by("created_at")[:50]

    for log in failed:
        task_map = {
            "Profile": sync_contact_to_odoo,
            "Order": sync_order_to_odoo,
            "VetMedicalRecord": sync_medical_record_to_odoo,
            "Invoice": sync_invoice_to_odoo,
        }
        task = task_map.get(log.model_name)
        if task:
            task.delay(log.local_id)
            logger.info(
                "Retrying failed sync for %s(%s)",
                log.model_name,
                log.local_id,
            )
