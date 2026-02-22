import logging

import stripe
from django.conf import settings
from django.db.models import F
from django.http import HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(View):
    """Handle Stripe webhook events."""

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.warning("Stripe webhook: invalid payload")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            logger.warning("Stripe webhook: signature verification failed")
            return HttpResponse(status=400)

        # Dispatch to handler
        handler = WEBHOOK_HANDLERS.get(event["type"])
        if handler:
            handler(event)
        else:
            logger.info("Unhandled Stripe event type: %s", event["type"])

        return HttpResponse(status=200)


def handle_checkout_completed(event):
    """Handle checkout.session.completed event."""
    session = event["data"]["object"]
    metadata = session.get("metadata", {})

    if metadata.get("type") == "org_subscription":
        _handle_org_subscription_checkout(session, metadata)
    elif metadata.get("type") == "org_product_purchase":
        _handle_org_product_checkout(session, metadata)
    elif session.get("mode") == "subscription":
        _handle_subscription_checkout(session, metadata)
    elif metadata.get("type") == "product_purchase":
        _handle_product_checkout(session, metadata)


def _handle_subscription_checkout(session, metadata):
    """Create local subscription after Stripe checkout."""
    from apps.accounts.models import User
    from .models import Subscription, SubscriptionPlan

    user_id = metadata.get("user_id")
    plan_slug = metadata.get("plan_slug")

    try:
        user = User.objects.get(pk=user_id)
        plan = SubscriptionPlan.objects.get(slug=plan_slug)
        stripe_sub = stripe.Subscription.retrieve(
            session["subscription"]
        )

        Subscription.objects.update_or_create(
            stripe_subscription_id=stripe_sub.id,
            defaults={
                "user": user,
                "plan": plan,
                "status": stripe_sub.status,
                "current_period_start": stripe_sub.current_period_start,
                "current_period_end": stripe_sub.current_period_end,
            },
        )
    except User.DoesNotExist:
        logger.error("Webhook: User %s not found for subscription", user_id)
    except SubscriptionPlan.DoesNotExist:
        logger.error("Webhook: Plan '%s' not found", plan_slug)
    except Exception:
        logger.exception("Webhook: Error handling subscription checkout")


def _handle_product_checkout(session, metadata):
    """Mark order as paid, deduct stock, and sync to Odoo."""
    from .models import Order, Product

    order_id = metadata.get("order_id")

    try:
        order = Order.objects.prefetch_related("items__product").get(
            pk=order_id
        )
    except Order.DoesNotExist:
        # Fallback: look up by checkout session ID
        order = Order.objects.prefetch_related("items__product").filter(
            stripe_checkout_session_id=session["id"]
        ).first()

    if not order:
        logger.error(
            "Webhook: Order not found for session %s", session["id"]
        )
        return

    order.status = Order.Status.PAID
    order.stripe_payment_intent_id = session.get("payment_intent", "")
    order.save(update_fields=["status", "stripe_payment_intent_id"])

    # Deduct stock for each order item
    for item in order.items.select_related("product").all():
        Product.objects.filter(pk=item.product_id).update(
            stock=F("stock") - item.quantity
        )

    logger.info("Order %s marked as paid, stock deducted", order.pk)

    # Generate invoice PDF
    try:
        from .invoice_utils import create_invoice_for_order

        create_invoice_for_order(order)
    except Exception:
        logger.exception("Failed to generate invoice for order %s", order.pk)

    # Send order notification
    try:
        from apps.notifications.services import notify_order_status

        notify_order_status(order, order.get_status_display())
    except Exception:
        logger.exception("Failed to send order notification for %s", order.pk)

    # Sync to Odoo if enabled
    try:
        from apps.odoo_sync.tasks import sync_order_to_odoo

        sync_order_to_odoo.delay(str(order.id))
    except Exception:
        logger.exception("Failed to queue Odoo sync for order %s", order.pk)


def _handle_org_subscription_checkout(session, metadata):
    """Create local org subscription after Stripe checkout."""
    from apps.organizations.models import (
        Organization,
        OrganizationPlan,
        OrganizationSubscription,
    )

    org_id = metadata.get("organization_id")
    plan_slug = metadata.get("plan_slug")

    try:
        org = Organization.objects.get(pk=org_id)
        plan = OrganizationPlan.objects.get(slug=plan_slug)
        stripe_sub = stripe.Subscription.retrieve(session["subscription"])

        OrganizationSubscription.objects.update_or_create(
            stripe_subscription_id=stripe_sub.id,
            defaults={
                "organization": org,
                "plan": plan,
                "status": stripe_sub.status,
                "current_period_start": stripe_sub.current_period_start,
                "current_period_end": stripe_sub.current_period_end,
            },
        )
        logger.info("Org subscription created for %s (plan: %s)", org.name, plan.name)
    except Organization.DoesNotExist:
        logger.error("Webhook: Organization %s not found", org_id)
    except OrganizationPlan.DoesNotExist:
        logger.error("Webhook: OrgPlan '%s' not found", plan_slug)
    except Exception:
        logger.exception("Webhook: Error handling org subscription checkout")


def _handle_org_product_checkout(session, metadata):
    """Mark org order as paid, deduct stock, and create OrganizationSale."""
    from .models import Order, Product
    from apps.organizations.models import (
        Organization,
        OrganizationClient,
        OrganizationSale,
    )

    order_id = metadata.get("order_id")
    org_id = metadata.get("organization_id")

    try:
        order = Order.objects.prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        order = (
            Order.objects.prefetch_related("items__product")
            .filter(stripe_checkout_session_id=session["id"])
            .first()
        )

    if not order:
        logger.error("Webhook: Org order not found for session %s", session["id"])
        return

    order.status = Order.Status.PAID
    order.stripe_payment_intent_id = session.get("payment_intent", "")
    order.save(update_fields=["status", "stripe_payment_intent_id"])

    # Deduct stock
    for item in order.items.select_related("product").all():
        Product.objects.filter(pk=item.product_id).update(
            stock=F("stock") - item.quantity
        )

    logger.info("Org order %s marked as paid, stock deducted", order.pk)

    # Calculate commission and create sale record
    try:
        org = Organization.objects.get(pk=org_id)
        sub = org.active_subscription
        commission_rate = sub.plan.commission_rate if sub else 0
        commission = order.total * commission_rate

        # Find client
        client = OrganizationClient.objects.filter(
            organization=org, user=order.user
        ).first()

        OrganizationSale.objects.create(
            organization=org,
            order=order,
            client=client,
            sold_by_id=metadata.get("sold_by_user_id"),
            commission_amount=commission,
        )
    except Organization.DoesNotExist:
        logger.error("Webhook: Organization %s not found for sale record", org_id)
    except Exception:
        logger.exception("Webhook: Error creating org sale record for order %s", order.pk)

    # Generate invoice
    try:
        from .invoice_utils import create_invoice_for_order
        create_invoice_for_order(order)
    except Exception:
        logger.exception("Failed to generate invoice for org order %s", order.pk)

    # Send notification
    try:
        from apps.notifications.services import notify_order_status
        notify_order_status(order, order.get_status_display())
    except Exception:
        logger.exception("Failed to send notification for org order %s", order.pk)


def handle_subscription_updated(event):
    """Handle customer.subscription.updated event."""
    from .models import Subscription

    sub_data = event["data"]["object"]
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=sub_data["id"]
        )
        subscription.status = sub_data["status"]
        subscription.cancel_at_period_end = sub_data.get(
            "cancel_at_period_end", False
        )
        subscription.save(update_fields=["status", "cancel_at_period_end"])
    except Subscription.DoesNotExist:
        # Try org subscription
        from apps.organizations.models import OrganizationSubscription

        try:
            org_sub = OrganizationSubscription.objects.get(
                stripe_subscription_id=sub_data["id"]
            )
            org_sub.status = sub_data["status"]
            org_sub.cancel_at_period_end = sub_data.get(
                "cancel_at_period_end", False
            )
            org_sub.save(update_fields=["status", "cancel_at_period_end"])
        except OrganizationSubscription.DoesNotExist:
            logger.warning(
                "Webhook: Subscription %s not found", sub_data["id"]
            )


def handle_subscription_deleted(event):
    """Handle customer.subscription.deleted event."""
    from .models import Subscription

    sub_data = event["data"]["object"]
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=sub_data["id"]
        )
        subscription.status = "canceled"
        subscription.save(update_fields=["status"])
    except Subscription.DoesNotExist:
        logger.warning(
            "Webhook: Subscription %s not found for deletion",
            sub_data["id"],
        )


def handle_payment_failed(event):
    """Handle payment_intent.payment_failed event."""
    intent = event["data"]["object"]
    logger.warning(
        "Payment failed for intent %s: %s",
        intent["id"],
        intent.get("last_payment_error", {}).get("message", "unknown"),
    )


def handle_charge_refunded(event):
    """Handle charge.refunded event."""
    from .models import Order

    charge = event["data"]["object"]
    payment_intent_id = charge.get("payment_intent")

    if not payment_intent_id:
        return

    try:
        order = Order.objects.get(
            stripe_payment_intent_id=payment_intent_id
        )
        order.status = Order.Status.REFUNDED
        order.save(update_fields=["status"])
        logger.info("Order %s marked as refunded", order.pk)

        from apps.notifications.services import notify_order_status

        notify_order_status(order, order.get_status_display())
    except Order.DoesNotExist:
        logger.warning(
            "Webhook: Order not found for refund, payment_intent=%s",
            payment_intent_id,
        )


def handle_invoice_payment_failed(event):
    """Handle invoice.payment_failed for subscription renewals."""
    from .models import Subscription

    invoice = event["data"]["object"]
    stripe_sub_id = invoice.get("subscription")

    if not stripe_sub_id:
        return

    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_sub_id
        )
        subscription.status = "past_due"
        subscription.save(update_fields=["status"])
        logger.warning(
            "Subscription %s marked as past_due (invoice payment failed)",
            stripe_sub_id,
        )
    except Subscription.DoesNotExist:
        logger.warning(
            "Webhook: Subscription %s not found for failed invoice",
            stripe_sub_id,
        )


WEBHOOK_HANDLERS = {
    "checkout.session.completed": handle_checkout_completed,
    "customer.subscription.updated": handle_subscription_updated,
    "customer.subscription.deleted": handle_subscription_deleted,
    "payment_intent.payment_failed": handle_payment_failed,
    "charge.refunded": handle_charge_refunded,
    "invoice.payment_failed": handle_invoice_payment_failed,
}
