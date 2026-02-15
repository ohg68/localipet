import stripe
from django.conf import settings
from django.http import HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        # Dispatch to handler
        handler = WEBHOOK_HANDLERS.get(event["type"])
        if handler:
            handler(event)

        return HttpResponse(status=200)


def handle_checkout_completed(event):
    """Handle checkout.session.completed event."""
    session = event["data"]["object"]
    metadata = session.get("metadata", {})

    if session.get("mode") == "subscription":
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
    except Exception:
        pass


def _handle_product_checkout(session, metadata):
    """Create local order after Stripe product checkout."""
    from apps.accounts.models import User
    from .models import Order

    user_id = metadata.get("user_id")

    try:
        user = User.objects.get(pk=user_id)
        order = Order.objects.filter(
            stripe_checkout_session_id=session["id"]
        ).first()

        if order:
            order.status = Order.Status.PAID
            order.stripe_payment_intent_id = session.get(
                "payment_intent", ""
            )
            order.save()

            # Sync to Odoo if enabled
            try:
                from apps.odoo_sync.tasks import sync_order_to_odoo

                sync_order_to_odoo.delay(str(order.id))
            except Exception:
                pass
    except Exception:
        pass


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
        subscription.save()
    except Subscription.DoesNotExist:
        pass


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
        pass


WEBHOOK_HANDLERS = {
    "checkout.session.completed": handle_checkout_completed,
    "customer.subscription.updated": handle_subscription_updated,
    "customer.subscription.deleted": handle_subscription_deleted,
}
