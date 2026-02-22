"""Tests for billing app: Stripe utils, invoices, webhooks."""

from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import TestCase

from apps.accounts.models import User
from apps.animals.models import Animal, Species

from .models import (
    Invoice,
    Order,
    OrderItem,
    Product,
    SubscriptionPlan,
)
from .stripe_utils import create_product_checkout, create_subscription_checkout
from .invoice_utils import generate_invoice_number


class StripeUtilsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="stripeuser",
            email="stripe@example.com",
            password="testpass123",
        )
        self.user.profile.stripe_customer_id = "cus_test123"
        self.user.profile.save()

        self.plan = SubscriptionPlan.objects.create(
            name="Pro",
            slug="pro",
            stripe_price_id="price_test",
            price_monthly=Decimal("99.00"),
        )

    @patch("apps.billing.stripe_utils.stripe.checkout.Session.create")
    def test_subscription_checkout_accepts_urls(self, mock_create):
        mock_create.return_value = MagicMock(id="cs_test", url="https://stripe.com")
        session = create_subscription_checkout(
            self.user,
            self.plan,
            success_url="https://example.com/success/",
            cancel_url="https://example.com/cancel/",
        )
        self.assertIsNotNone(session)
        call_kwargs = mock_create.call_args[1]
        self.assertEqual(call_kwargs["success_url"], "https://example.com/success/")
        self.assertEqual(call_kwargs["cancel_url"], "https://example.com/cancel/")

    @patch("apps.billing.stripe_utils.stripe.checkout.Session.create")
    def test_subscription_checkout_default_urls(self, mock_create):
        mock_create.return_value = MagicMock(id="cs_test", url="https://stripe.com")
        session = create_subscription_checkout(self.user, self.plan)
        self.assertIsNotNone(session)
        call_kwargs = mock_create.call_args[1]
        self.assertIn("success", call_kwargs["success_url"])

    @patch("apps.billing.stripe_utils.stripe.checkout.Session.create")
    def test_product_checkout_builds_line_items(self, mock_create):
        mock_create.return_value = MagicMock(id="cs_prod", url="https://stripe.com")

        product = Product.objects.create(
            name="Premium Tag",
            slug="premium-tag",
            product_type="premium_tag",
            description="A premium tag",
            price=Decimal("29.99"),
            stripe_price_id="price_tag",
            stock=10,
        )
        order = Order.objects.create(
            user=self.user,
            shipping_name="Test",
            shipping_address="123 St",
            shipping_city="CDMX",
            shipping_zip="06600",
            total=Decimal("59.98"),
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=2,
            unit_price=Decimal("29.99"),
        )

        session = create_product_checkout(self.user, order)
        self.assertIsNotNone(session)
        call_kwargs = mock_create.call_args[1]
        self.assertEqual(len(call_kwargs["line_items"]), 1)
        self.assertEqual(call_kwargs["line_items"][0]["price"], "price_tag")
        self.assertEqual(call_kwargs["line_items"][0]["quantity"], 2)

    @patch("apps.billing.stripe_utils.stripe.checkout.Session.create")
    def test_product_checkout_fallback_price_data(self, mock_create):
        """Products without stripe_price_id use inline price_data."""
        mock_create.return_value = MagicMock(id="cs_prod2", url="https://stripe.com")

        product = Product.objects.create(
            name="Medal",
            slug="medal",
            product_type="medal",
            description="A medal",
            price=Decimal("15.00"),
            stripe_price_id="",  # No Stripe price
            stock=5,
        )
        order = Order.objects.create(
            user=self.user,
            shipping_name="Test",
            shipping_address="123 St",
            shipping_city="CDMX",
            shipping_zip="06600",
            total=Decimal("15.00"),
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=1,
            unit_price=Decimal("15.00"),
        )

        session = create_product_checkout(self.user, order)
        self.assertIsNotNone(session)
        call_kwargs = mock_create.call_args[1]
        self.assertIn("price_data", call_kwargs["line_items"][0])

    @patch("apps.billing.stripe_utils.stripe.checkout.Session.create")
    def test_empty_order_returns_none(self, mock_create):
        """Order with no items should return None."""
        order = Order.objects.create(
            user=self.user,
            shipping_name="Test",
            shipping_address="123 St",
            shipping_city="CDMX",
            shipping_zip="06600",
            total=Decimal("0.00"),
        )
        result = create_product_checkout(self.user, order)
        self.assertIsNone(result)
        mock_create.assert_not_called()


class InvoiceNumberTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="invoiceuser",
            email="invoice@example.com",
            password="testpass123",
        )

    def test_generates_sequential_numbers(self):
        num1 = generate_invoice_number()
        self.assertTrue(num1.startswith("LP-"))
        self.assertTrue(num1.endswith("00001"))

        # Create an invoice with that number
        Invoice.objects.create(
            user=self.user,
            invoice_number=num1,
            subtotal=Decimal("100.00"),
            tax=Decimal("16.00"),
            total=Decimal("116.00"),
        )

        num2 = generate_invoice_number()
        self.assertTrue(num2.endswith("00002"))


class OrderModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="orderuser",
            email="order@example.com",
            password="testpass123",
        )

    def test_order_statuses(self):
        order = Order.objects.create(
            user=self.user,
            shipping_name="Test",
            shipping_address="123 St",
            shipping_city="CDMX",
            shipping_zip="06600",
        )
        self.assertEqual(order.status, Order.Status.PENDING)
        order.status = Order.Status.PAID
        order.save()
        order.refresh_from_db()
        self.assertEqual(order.status, "paid")

    def test_order_item_subtotal(self):
        order = Order.objects.create(
            user=self.user,
            shipping_name="Test",
            shipping_address="123 St",
            shipping_city="CDMX",
            shipping_zip="06600",
        )
        product = Product.objects.create(
            name="Tag",
            slug="tag-test",
            product_type="premium_tag",
            description="test",
            price=Decimal("25.00"),
            stock=10,
        )
        item = OrderItem.objects.create(
            order=order,
            product=product,
            quantity=3,
            unit_price=Decimal("25.00"),
        )
        self.assertEqual(item.subtotal, Decimal("75.00"))
