import logging

import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


def _ensure_stripe_customer(user):
    """Ensure user has a Stripe customer ID, creating one if needed."""
    if not user.profile.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.get_full_name(),
            metadata={"user_id": str(user.pk)},
        )
        user.profile.stripe_customer_id = customer.id
        user.profile.save(update_fields=["stripe_customer_id"])


def create_subscription_checkout(user, plan, success_url=None, cancel_url=None):
    """Create a Stripe Checkout Session for subscription."""
    _ensure_stripe_customer(user)

    if not success_url:
        success_url = (
            settings.BASE_URL
            + "/billing/success/?session_id={CHECKOUT_SESSION_ID}"
        )
    if not cancel_url:
        cancel_url = settings.BASE_URL + "/billing/cancel/"

    try:
        session = stripe.checkout.Session.create(
            customer=user.profile.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": plan.stripe_price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": str(user.pk),
                "plan_slug": plan.slug,
            },
        )
        return session
    except stripe.error.StripeError as e:
        logger.error("Stripe subscription checkout error: %s", e)
        return None


def create_product_checkout(user, order, success_url=None, cancel_url=None):
    """Create a Stripe Checkout Session for one-time product purchase."""
    _ensure_stripe_customer(user)

    if not success_url:
        success_url = (
            settings.BASE_URL
            + "/billing/success/?session_id={CHECKOUT_SESSION_ID}"
        )
    if not cancel_url:
        cancel_url = settings.BASE_URL + "/billing/cancel/"

    # Build line items from order items
    line_items = []
    for item in order.items.select_related("product").all():
        if item.product.stripe_price_id:
            line_items.append({
                "price": item.product.stripe_price_id,
                "quantity": item.quantity,
            })
        else:
            # Fallback: create price_data inline for products without a Stripe price
            line_items.append({
                "price_data": {
                    "currency": order.currency.lower(),
                    "unit_amount": int(item.unit_price * 100),
                    "product_data": {"name": item.product.name},
                },
                "quantity": item.quantity,
            })

    if not line_items:
        logger.error("No line items for order %s", order.pk)
        return None

    try:
        session = stripe.checkout.Session.create(
            customer=user.profile.stripe_customer_id,
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            shipping_address_collection={
                "allowed_countries": ["MX", "US", "CO", "AR", "CL", "ES"]
            },
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": str(user.pk),
                "order_id": str(order.pk),
                "type": "product_purchase",
            },
        )
        return session
    except stripe.error.StripeError as e:
        logger.error("Stripe product checkout error: %s", e)
        return None
