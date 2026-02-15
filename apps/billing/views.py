from django.conf import settings
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views import View
from django.views.generic import DetailView, ListView, TemplateView

from apps.animals.models import Animal
from apps.core.mixins import PremiumRequiredMixin

from .forms import ShippingAddressForm
from .models import (
    Invoice,
    Order,
    OrderItem,
    Product,
    Subscription,
    SubscriptionPlan,
)
from .stripe_utils import create_product_checkout, create_subscription_checkout


class PricingView(TemplateView):
    """Display subscription plans."""

    template_name = "billing/pricing.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["plans"] = SubscriptionPlan.objects.filter(
            is_active=True
        ).order_by("price_monthly")
        if self.request.user.is_authenticated:
            context["current_subscription"] = (
                Subscription.objects.filter(
                    user=self.request.user, status="active"
                ).first()
            )
        return context


class SubscriptionCheckoutView(LoginRequiredMixin, View):
    """Create Stripe checkout session for subscription."""

    def post(self, request, slug):
        plan = get_object_or_404(SubscriptionPlan, slug=slug, is_active=True)

        # Check if user already has an active subscription
        existing = Subscription.objects.filter(
            user=request.user, status="active"
        ).first()
        if existing:
            messages.warning(
                request,
                _("You already have an active subscription."),
            )
            return redirect("billing:pricing")

        success_url = request.build_absolute_uri(
            reverse("billing:subscription-success")
        )
        cancel_url = request.build_absolute_uri(reverse("billing:pricing"))

        session = create_subscription_checkout(
            user=request.user,
            plan=plan,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        if session:
            return redirect(session.url)

        messages.error(
            request,
            _("Could not create checkout session. Please try again."),
        )
        return redirect("billing:pricing")


class SubscriptionSuccessView(LoginRequiredMixin, TemplateView):
    """Subscription checkout success page."""

    template_name = "billing/subscription_success.html"


class SubscriptionCancelView(LoginRequiredMixin, View):
    """Cancel subscription at period end."""

    def post(self, request):
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

        subscription = Subscription.objects.filter(
            user=request.user, status="active"
        ).first()

        if not subscription:
            messages.error(request, _("No active subscription found."))
            return redirect("billing:pricing")

        try:
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True,
            )
            subscription.cancel_at_period_end = True
            subscription.save(update_fields=["cancel_at_period_end"])
            messages.success(
                request,
                _(
                    "Your subscription will be cancelled at the end "
                    "of the current billing period."
                ),
            )
        except Exception:
            messages.error(
                request,
                _("Could not cancel subscription. Please try again."),
            )

        return redirect("billing:my-subscription")


class MySubscriptionView(LoginRequiredMixin, TemplateView):
    """Show current subscription details."""

    template_name = "billing/my_subscription.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["subscription"] = Subscription.objects.filter(
            user=self.request.user
        ).select_related("plan").first()
        return context


# ── Product Shop ──────────────────────────────────────────


class ShopView(LoginRequiredMixin, ListView):
    """Product catalog."""

    model = Product
    template_name = "billing/shop.html"
    context_object_name = "products"

    def get_queryset(self):
        return Product.objects.filter(is_active=True).order_by("price")


class ProductDetailView(LoginRequiredMixin, DetailView):
    """Single product detail."""

    model = Product
    template_name = "billing/product_detail.html"
    context_object_name = "product"
    slug_field = "slug"


class AddToCartView(LoginRequiredMixin, View):
    """Add product to session cart."""

    def post(self, request, slug):
        product = get_object_or_404(Product, slug=slug, is_active=True)
        cart = request.session.get("cart", {})

        quantity = int(request.POST.get("quantity", 1))
        if slug in cart:
            cart[slug]["quantity"] += quantity
        else:
            cart[slug] = {
                "product_id": str(product.id),
                "name": product.name,
                "price": str(product.price),
                "quantity": quantity,
            }

        request.session["cart"] = cart
        messages.success(
            request,
            _("%(product)s added to cart.") % {"product": product.name},
        )
        return redirect("billing:shop")


class CartView(LoginRequiredMixin, TemplateView):
    """View shopping cart."""

    template_name = "billing/cart.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        cart = self.request.session.get("cart", {})
        items = []
        total = 0
        for slug, item in cart.items():
            from decimal import Decimal

            subtotal = Decimal(item["price"]) * item["quantity"]
            items.append(
                {
                    "slug": slug,
                    "name": item["name"],
                    "price": Decimal(item["price"]),
                    "quantity": item["quantity"],
                    "subtotal": subtotal,
                }
            )
            total += subtotal
        context["cart_items"] = items
        context["cart_total"] = total
        context["shipping_form"] = ShippingAddressForm()
        return context


class UpdateCartView(LoginRequiredMixin, View):
    """Update cart item quantity."""

    def post(self, request, slug):
        cart = request.session.get("cart", {})
        quantity = int(request.POST.get("quantity", 0))

        if slug in cart:
            if quantity <= 0:
                del cart[slug]
            else:
                cart[slug]["quantity"] = quantity
            request.session["cart"] = cart

        return redirect("billing:cart")


class RemoveFromCartView(LoginRequiredMixin, View):
    """Remove item from cart."""

    def post(self, request, slug):
        cart = request.session.get("cart", {})
        if slug in cart:
            del cart[slug]
            request.session["cart"] = cart

        return redirect("billing:cart")


class CheckoutView(LoginRequiredMixin, View):
    """Create Stripe checkout session for cart products."""

    def post(self, request):
        cart = request.session.get("cart", {})
        if not cart:
            messages.warning(request, _("Your cart is empty."))
            return redirect("billing:shop")

        form = ShippingAddressForm(request.POST)
        if not form.is_valid():
            messages.error(request, _("Please fill in your shipping address."))
            return redirect("billing:cart")

        # Create Order
        order = Order.objects.create(
            user=request.user,
            status=Order.Status.PENDING,
            shipping_name=form.cleaned_data["shipping_name"],
            shipping_address=form.cleaned_data["shipping_address"],
            shipping_city=form.cleaned_data["shipping_city"],
            shipping_state=form.cleaned_data["shipping_state"],
            shipping_zip=form.cleaned_data["shipping_zip"],
            shipping_country=form.cleaned_data["shipping_country"],
        )

        # Optionally link to an animal (for tags/medals)
        animal_id = request.POST.get("animal_id")
        if animal_id:
            try:
                animal = Animal.objects.get(
                    pk=animal_id, owner=request.user
                )
                order.animal = animal
                order.save(update_fields=["animal"])
            except Animal.DoesNotExist:
                pass

        # Create OrderItems
        for slug, item in cart.items():
            try:
                product = Product.objects.get(slug=slug, is_active=True)
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=item["quantity"],
                    unit_price=product.price,
                )
            except Product.DoesNotExist:
                continue

        # Recalculate total
        order.total = sum(
            oi.unit_price * oi.quantity for oi in order.items.all()
        )
        order.save(update_fields=["total"])

        if order.total <= 0:
            order.delete()
            messages.error(request, _("No valid products in cart."))
            return redirect("billing:shop")

        success_url = request.build_absolute_uri(
            reverse("billing:order-success", kwargs={"pk": order.pk})
        )
        cancel_url = request.build_absolute_uri(reverse("billing:cart"))

        session = create_product_checkout(
            user=request.user,
            order=order,
            success_url=success_url,
            cancel_url=cancel_url,
        )

        if session:
            order.stripe_checkout_session_id = session.id
            order.save(update_fields=["stripe_checkout_session_id"])
            # Clear cart
            request.session["cart"] = {}
            return redirect(session.url)

        messages.error(
            request,
            _("Could not create checkout session. Please try again."),
        )
        return redirect("billing:cart")


class OrderSuccessView(LoginRequiredMixin, DetailView):
    """Order checkout success page."""

    model = Order
    template_name = "billing/order_success.html"
    context_object_name = "order"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderListView(LoginRequiredMixin, ListView):
    """User's order history."""

    model = Order
    template_name = "billing/order_list.html"
    context_object_name = "orders"
    paginate_by = 20

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("animal")
            .order_by("-created_at")
        )


class OrderDetailView(LoginRequiredMixin, DetailView):
    """Order detail page."""

    model = Order
    template_name = "billing/order_detail.html"
    context_object_name = "order"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items__product"
        )


class InvoiceDetailView(LoginRequiredMixin, DetailView):
    """Invoice detail / download page."""

    model = Invoice
    template_name = "billing/invoice_detail.html"
    context_object_name = "invoice"

    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user).select_related(
            "order"
        )
