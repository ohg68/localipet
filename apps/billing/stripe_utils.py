import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_subscription_checkout(user, plan):
    """Create a Stripe Checkout Session for subscription."""
    if not user.profile.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.get_full_name(),
            metadata={"user_id": str(user.pk)},
        )
        user.profile.stripe_customer_id = customer.id
        user.profile.save(update_fields=["stripe_customer_id"])

    session = stripe.checkout.Session.create(
        customer=user.profile.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": plan.stripe_price_id, "quantity": 1}],
        mode="subscription",
        success_url=(
            settings.BASE_URL
            + "/billing/success/?session_id={CHECKOUT_SESSION_ID}"
        ),
        cancel_url=settings.BASE_URL + "/billing/cancel/",
        metadata={
            "user_id": str(user.pk),
            "plan_slug": plan.slug,
        },
    )
    return session


def create_product_checkout(user, product, quantity=1):
    """Create a Stripe Checkout Session for one-time product purchase."""
    if not user.profile.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.get_full_name(),
            metadata={"user_id": str(user.pk)},
        )
        user.profile.stripe_customer_id = customer.id
        user.profile.save(update_fields=["stripe_customer_id"])

    session = stripe.checkout.Session.create(
        customer=user.profile.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[
            {"price": product.stripe_price_id, "quantity": quantity}
        ],
        mode="payment",
        shipping_address_collection={
            "allowed_countries": ["MX", "US", "CO", "AR", "CL", "ES"]
        },
        success_url=(
            settings.BASE_URL
            + "/billing/success/?session_id={CHECKOUT_SESSION_ID}"
        ),
        cancel_url=settings.BASE_URL + "/billing/cancel/",
        metadata={
            "user_id": str(user.pk),
            "product_slug": product.slug,
            "type": "product_purchase",
        },
    )
    return session
