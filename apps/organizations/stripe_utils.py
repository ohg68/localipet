import logging

import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


def _ensure_org_stripe_customer(organization):
    """Ensure organization has a Stripe customer ID."""
    if not organization.stripe_customer_id:
        customer = stripe.Customer.create(
            email=organization.email,
            name=organization.razon_social or organization.name,
            metadata={
                "organization_id": str(organization.pk),
                "rfc": organization.rfc,
            },
        )
        organization.stripe_customer_id = customer.id
        organization.save(update_fields=["stripe_customer_id"])


def create_org_subscription_checkout(
    organization, plan, success_url=None, cancel_url=None
):
    """Create a Stripe Checkout Session for an organization subscription."""
    _ensure_org_stripe_customer(organization)

    if not success_url:
        success_url = (
            settings.BASE_URL
            + "/org/billing/subscription/?session_id={CHECKOUT_SESSION_ID}"
        )
    if not cancel_url:
        cancel_url = settings.BASE_URL + "/org/billing/plans/"

    try:
        session = stripe.checkout.Session.create(
            customer=organization.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{"price": plan.stripe_price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "organization_id": str(organization.pk),
                "plan_slug": plan.slug,
                "type": "org_subscription",
            },
        )
        return session
    except stripe.error.StripeError as e:
        logger.error("Stripe org subscription checkout error: %s", e)
        return None


def create_org_product_checkout(
    organization, order, sold_by, success_url=None, cancel_url=None
):
    """Create Stripe checkout for org purchasing products on behalf of client."""
    _ensure_org_stripe_customer(organization)

    if not success_url:
        success_url = (
            settings.BASE_URL
            + f"/org/sales/{order.pk}/?session_id={{CHECKOUT_SESSION_ID}}"
        )
    if not cancel_url:
        cancel_url = settings.BASE_URL + "/org/sales/new/"

    line_items = []
    for item in order.items.select_related("product").all():
        if item.product.stripe_price_id:
            line_items.append({
                "price": item.product.stripe_price_id,
                "quantity": item.quantity,
            })
        else:
            line_items.append({
                "price_data": {
                    "currency": order.currency.lower(),
                    "unit_amount": int(item.unit_price * 100),
                    "product_data": {"name": item.product.name},
                },
                "quantity": item.quantity,
            })

    if not line_items:
        logger.error("No line items for org order %s", order.pk)
        return None

    try:
        session = stripe.checkout.Session.create(
            customer=organization.stripe_customer_id,
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "organization_id": str(organization.pk),
                "order_id": str(order.pk),
                "sold_by_user_id": str(sold_by.pk),
                "type": "org_product_purchase",
            },
        )
        return session
    except stripe.error.StripeError as e:
        logger.error("Stripe org product checkout error: %s", e)
        return None
