"""Comprehensive tests for the organizations app."""

from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase, RequestFactory
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from apps.animals.models import Animal
from apps.billing.models import Order, OrderItem, Product

from .models import (
    Organization,
    OrganizationClient,
    OrganizationInvitation,
    OrganizationMember,
    OrganizationPlan,
    OrganizationSale,
    OrganizationSubscription,
)
from .middleware import ActiveOrganizationMiddleware


class OrganizationModelTest(TestCase):
    """Test Organization model and its properties."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="Test Clinic",
            slug="test-clinic",
            org_type=Organization.Type.VET_CLINIC,
        )
        self.membership = OrganizationMember.objects.create(
            organization=self.org,
            user=self.user,
            role=OrganizationMember.Role.OWNER,
        )

    def test_str(self):
        self.assertEqual(str(self.org), "Test Clinic")

    def test_owner_property(self):
        self.assertEqual(self.org.owner, self.user)

    def test_owner_property_none(self):
        org2 = Organization.objects.create(
            name="Empty Org", slug="empty-org", org_type="pet_shop"
        )
        self.assertIsNone(org2.owner)

    def test_active_subscription_none(self):
        self.assertIsNone(self.org.active_subscription)

    def test_client_animal_ids(self):
        client_user = User.objects.create_user(
            email="client@test.com", password="test1234"
        )
        OrganizationClient.objects.create(
            organization=self.org, user=client_user
        )
        animal = Animal.objects.create(
            owner=client_user, name="Fido", species="dog"
        )
        ids = list(self.org.client_animal_ids())
        self.assertIn(animal.pk, ids)


class OrganizationMemberModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="vet@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="Vet Clinic", slug="vet-clinic", org_type="vet_clinic"
        )
        self.member = OrganizationMember.objects.create(
            organization=self.org,
            user=self.user,
            role=OrganizationMember.Role.VET,
        )

    def test_str(self):
        result = str(self.member)
        self.assertIn("Vet Clinic", result)
        self.assertIn("Veterinarian", result)

    def test_unique_together(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            OrganizationMember.objects.create(
                organization=self.org,
                user=self.user,
                role=OrganizationMember.Role.STAFF,
            )


class OrganizationClientModelTest(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="petowner@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="Pet Shop", slug="pet-shop", org_type="pet_shop"
        )
        self.client = OrganizationClient.objects.create(
            organization=self.org, user=self.owner
        )

    def test_str(self):
        result = str(self.client)
        self.assertIn("Pet Shop", result)

    def test_unique_together(self):
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            OrganizationClient.objects.create(
                organization=self.org, user=self.owner
            )


class OrganizationInvitationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="admin@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="Org", slug="org", org_type="vet_clinic"
        )
        self.invitation = OrganizationInvitation.objects.create(
            organization=self.org,
            email="invited@test.com",
            invite_type=OrganizationInvitation.InviteType.STAFF,
            role=OrganizationMember.Role.STAFF,
            invited_by=self.user,
            expires_at=timezone.now() + timedelta(days=7),
        )

    def test_str(self):
        result = str(self.invitation)
        self.assertIn("invited@test.com", result)
        self.assertIn("Org", result)

    def test_is_pending(self):
        self.assertTrue(self.invitation.is_pending)

    def test_is_expired(self):
        self.invitation.expires_at = timezone.now() - timedelta(days=1)
        self.invitation.save()
        self.assertTrue(self.invitation.is_expired)
        self.assertFalse(self.invitation.is_pending)

    def test_accepted_not_pending(self):
        self.invitation.accepted_at = timezone.now()
        self.invitation.save()
        self.assertFalse(self.invitation.is_pending)


class OrganizationPlanModelTest(TestCase):
    def test_str(self):
        plan = OrganizationPlan.objects.create(
            name="Pro Plan",
            slug="pro",
            price_monthly=Decimal("499.00"),
            max_staff=10,
            max_clients=200,
        )
        self.assertEqual(str(plan), "Pro Plan")


class OrganizationSubscriptionTest(TestCase):
    def test_str(self):
        org = Organization.objects.create(
            name="Clinic", slug="clinic", org_type="vet_clinic"
        )
        plan = OrganizationPlan.objects.create(
            name="Basic", slug="basic", price_monthly=Decimal("199.00")
        )
        sub = OrganizationSubscription.objects.create(
            organization=org,
            plan=plan,
            stripe_subscription_id="sub_test123",
            status=OrganizationSubscription.Status.ACTIVE,
        )
        result = str(sub)
        self.assertIn("Clinic", result)
        self.assertIn("Basic", result)


class OrganizationSaleTest(TestCase):
    def test_str(self):
        user = User.objects.create_user(
            email="client@test.com", password="test1234"
        )
        org = Organization.objects.create(
            name="Shop", slug="shop", org_type="pet_shop"
        )
        order = Order.objects.create(
            user=user,
            organization=org,
            status=Order.Status.PAID,
            total=Decimal("100.00"),
            shipping_name="Test",
            shipping_address="Addr",
            shipping_city="City",
            shipping_zip="12345",
        )
        sale = OrganizationSale.objects.create(
            organization=org, order=order
        )
        result = str(sale)
        self.assertIn("Shop", result)


# ─── Middleware ─────────────────────────────


class ActiveOrganizationMiddlewareTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email="mw@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="MW Org", slug="mw-org", org_type="vet_clinic"
        )
        OrganizationMember.objects.create(
            organization=self.org,
            user=self.user,
            role=OrganizationMember.Role.OWNER,
        )

    def _get_response(self, request):
        return None

    def test_sets_org_from_session(self):
        middleware = ActiveOrganizationMiddleware(self._get_response)
        request = self.factory.get("/")
        request.user = self.user
        request.session = {"active_organization_id": str(self.org.pk)}
        middleware(request)
        self.assertEqual(request.organization, self.org)
        self.assertIsNotNone(request.org_membership)

    def test_no_org_for_anon(self):
        from django.contrib.auth.models import AnonymousUser

        middleware = ActiveOrganizationMiddleware(self._get_response)
        request = self.factory.get("/")
        request.user = AnonymousUser()
        request.session = {}
        middleware(request)
        self.assertIsNone(request.organization)

    def test_stale_session_cleared(self):
        middleware = ActiveOrganizationMiddleware(self._get_response)
        request = self.factory.get("/")
        request.user = self.user
        request.session = {
            "active_organization_id": "00000000-0000-0000-0000-000000000000"
        }
        middleware(request)
        self.assertIsNone(request.organization)
        self.assertNotIn("active_organization_id", request.session)


# ─── Views ──────────────────────────────────


class OrgViewTestBase(TestCase):
    """Base class with common setup for org view tests."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="orguser@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="View Test Org",
            slug="view-test-org",
            org_type=Organization.Type.VET_CLINIC,
        )
        self.membership = OrganizationMember.objects.create(
            organization=self.org,
            user=self.user,
            role=OrganizationMember.Role.OWNER,
        )
        self.client.login(email="orguser@test.com", password="test1234")
        session = self.client.session
        session["active_organization_id"] = str(self.org.pk)
        session.save()


class SelectOrgViewTest(TestCase):
    def test_requires_login(self):
        resp = self.client.get(reverse("organizations:select-org"))
        self.assertEqual(resp.status_code, 302)

    def test_shows_organizations(self):
        user = User.objects.create_user(
            email="sel@test.com", password="test1234"
        )
        org = Organization.objects.create(
            name="Sel Org", slug="sel-org", org_type="vet_clinic"
        )
        OrganizationMember.objects.create(
            organization=org, user=user, role="owner"
        )
        self.client.login(email="sel@test.com", password="test1234")
        resp = self.client.get(reverse("organizations:select-org"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Sel Org")


class CreateOrgViewTest(TestCase):
    def test_create_organization(self):
        user = User.objects.create_user(
            email="create@test.com", password="test1234"
        )
        self.client.login(email="create@test.com", password="test1234")
        resp = self.client.post(
            reverse("organizations:create"),
            {
                "name": "New Clinic",
                "org_type": "vet_clinic",
                "country": "MX",
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(Organization.objects.filter(name="New Clinic").exists())
        # Creator should be OWNER
        org = Organization.objects.get(name="New Clinic")
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=org, user=user, role="owner"
            ).exists()
        )


class SwitchOrgViewTest(OrgViewTestBase):
    def test_switch_organization(self):
        org2 = Organization.objects.create(
            name="Org 2", slug="org-2", org_type="pet_shop"
        )
        OrganizationMember.objects.create(
            organization=org2, user=self.user, role="staff"
        )
        resp = self.client.post(
            reverse("organizations:switch", args=[org2.pk])
        )
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(
            self.client.session["active_organization_id"], str(org2.pk)
        )


class DashboardViewTest(OrgViewTestBase):
    def test_dashboard_loads(self):
        resp = self.client.get(reverse("organizations:dashboard"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "View Test Org")

    def test_dashboard_requires_org(self):
        user2 = User.objects.create_user(
            email="noorg@test.com", password="test1234"
        )
        self.client.login(email="noorg@test.com", password="test1234")
        resp = self.client.get(reverse("organizations:dashboard"))
        self.assertEqual(resp.status_code, 302)  # redirects to select-org


class StaffViewsTest(OrgViewTestBase):
    def test_staff_list(self):
        resp = self.client.get(reverse("organizations:staff-list"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, self.user.email)

    def test_invite_existing_user(self):
        new_user = User.objects.create_user(
            email="newstaff@test.com", password="test1234"
        )
        resp = self.client.post(
            reverse("organizations:staff-invite"),
            {"email": "newstaff@test.com", "role": "staff"},
        )
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=self.org, user=new_user
            ).exists()
        )

    def test_invite_nonexistent_creates_invitation(self):
        resp = self.client.post(
            reverse("organizations:staff-invite"),
            {"email": "future@test.com", "role": "vet"},
        )
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(
            OrganizationInvitation.objects.filter(
                organization=self.org, email="future@test.com"
            ).exists()
        )

    def test_remove_staff(self):
        staff_user = User.objects.create_user(
            email="removable@test.com", password="test1234"
        )
        member = OrganizationMember.objects.create(
            organization=self.org,
            user=staff_user,
            role=OrganizationMember.Role.STAFF,
        )
        resp = self.client.post(
            reverse("organizations:staff-remove", args=[member.pk])
        )
        self.assertEqual(resp.status_code, 302)
        member.refresh_from_db()
        self.assertFalse(member.is_active)

    def test_cannot_remove_owner(self):
        resp = self.client.post(
            reverse("organizations:staff-remove", args=[self.membership.pk])
        )
        self.assertEqual(resp.status_code, 302)
        self.membership.refresh_from_db()
        self.assertTrue(self.membership.is_active)


class ClientViewsTest(OrgViewTestBase):
    def test_client_list(self):
        resp = self.client.get(reverse("organizations:client-list"))
        self.assertEqual(resp.status_code, 200)

    def test_add_client(self):
        pet_owner = User.objects.create_user(
            email="petowner@test.com", password="test1234"
        )
        resp = self.client.post(
            reverse("organizations:client-add"),
            {"email": "petowner@test.com"},
        )
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(
            OrganizationClient.objects.filter(
                organization=self.org, user=pet_owner
            ).exists()
        )

    def test_add_nonexistent_client_fails(self):
        resp = self.client.post(
            reverse("organizations:client-add"),
            {"email": "nonexistent@test.com"},
        )
        self.assertEqual(resp.status_code, 200)  # re-renders form with error

    def test_client_detail(self):
        pet_owner = User.objects.create_user(
            email="detail@test.com", password="test1234"
        )
        oc = OrganizationClient.objects.create(
            organization=self.org, user=pet_owner
        )
        Animal.objects.create(
            owner=pet_owner, name="Rex", species="dog"
        )
        resp = self.client.get(
            reverse("organizations:client-detail", args=[oc.pk])
        )
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "Rex")

    def test_remove_client(self):
        pet_owner = User.objects.create_user(
            email="removeclient@test.com", password="test1234"
        )
        oc = OrganizationClient.objects.create(
            organization=self.org, user=pet_owner
        )
        resp = self.client.post(
            reverse("organizations:client-remove", args=[oc.pk])
        )
        self.assertEqual(resp.status_code, 302)
        oc.refresh_from_db()
        self.assertFalse(oc.is_active)

    def test_client_search(self):
        pet_owner = User.objects.create_user(
            email="searchable@test.com",
            password="test1234",
            first_name="Searchable",
        )
        OrganizationClient.objects.create(
            organization=self.org, user=pet_owner
        )
        resp = self.client.get(
            reverse("organizations:client-list") + "?q=searchable"
        )
        self.assertEqual(resp.status_code, 200)


class InvitationAcceptanceTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.com", password="test1234"
        )
        self.invited_user = User.objects.create_user(
            email="invited@test.com", password="test1234"
        )
        self.org = Organization.objects.create(
            name="Invite Org", slug="invite-org", org_type="vet_clinic"
        )
        self.invitation = OrganizationInvitation.objects.create(
            organization=self.org,
            email="invited@test.com",
            invite_type=OrganizationInvitation.InviteType.STAFF,
            role=OrganizationMember.Role.STAFF,
            invited_by=self.admin,
            expires_at=timezone.now() + timedelta(days=7),
        )

    def test_accept_invitation(self):
        self.client.login(email="invited@test.com", password="test1234")
        resp = self.client.get(
            reverse(
                "organizations:accept-invite",
                args=[self.invitation.token],
            )
        )
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=self.org, user=self.invited_user
            ).exists()
        )
        self.invitation.refresh_from_db()
        self.assertIsNotNone(self.invitation.accepted_at)

    def test_accept_expired_invitation(self):
        self.invitation.expires_at = timezone.now() - timedelta(days=1)
        self.invitation.save()
        self.client.login(email="invited@test.com", password="test1234")
        resp = self.client.get(
            reverse(
                "organizations:accept-invite",
                args=[self.invitation.token],
            )
        )
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(
            OrganizationMember.objects.filter(
                organization=self.org, user=self.invited_user
            ).exists()
        )

    def test_wrong_email_rejected(self):
        other_user = User.objects.create_user(
            email="wrong@test.com", password="test1234"
        )
        self.client.login(email="wrong@test.com", password="test1234")
        resp = self.client.get(
            reverse(
                "organizations:accept-invite",
                args=[self.invitation.token],
            )
        )
        self.assertEqual(resp.status_code, 302)
        self.assertFalse(
            OrganizationMember.objects.filter(
                organization=self.org, user=other_user
            ).exists()
        )


class SalesViewsTest(OrgViewTestBase):
    def test_sales_list(self):
        resp = self.client.get(reverse("organizations:sales-list"))
        self.assertEqual(resp.status_code, 200)


class BulkLabelViewTest(OrgViewTestBase):
    def test_bulk_labels_page(self):
        resp = self.client.get(reverse("organizations:bulk-labels"))
        self.assertEqual(resp.status_code, 200)


class CSVImportTest(OrgViewTestBase):
    def test_csv_import_page(self):
        resp = self.client.get(reverse("organizations:client-import"))
        self.assertEqual(resp.status_code, 200)


# ─── Stripe Utils (Mocked) ────────────────


class OrgStripeUtilsTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(
            name="Stripe Org",
            slug="stripe-org",
            org_type="pet_shop",
            email="stripe@test.com",
        )
        self.plan = OrganizationPlan.objects.create(
            name="Test Plan",
            slug="test-plan",
            price_monthly=Decimal("299.00"),
            stripe_price_id="price_test123",
        )

    @patch("apps.organizations.stripe_utils.stripe")
    def test_ensure_org_stripe_customer(self, mock_stripe):
        mock_stripe.Customer.create.return_value = MagicMock(id="cus_org_123")

        from .stripe_utils import _ensure_org_stripe_customer

        _ensure_org_stripe_customer(self.org)
        self.org.refresh_from_db()
        self.assertEqual(self.org.stripe_customer_id, "cus_org_123")

    @patch("apps.organizations.stripe_utils.stripe")
    def test_create_org_subscription_checkout(self, mock_stripe):
        self.org.stripe_customer_id = "cus_org_existing"
        self.org.save()

        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.com/test"
        mock_stripe.checkout.Session.create.return_value = mock_session

        from .stripe_utils import create_org_subscription_checkout

        session = create_org_subscription_checkout(self.org, self.plan)
        self.assertIsNotNone(session)
        mock_stripe.checkout.Session.create.assert_called_once()

    @patch("apps.organizations.stripe_utils.stripe")
    def test_create_org_product_checkout(self, mock_stripe):
        user = User.objects.create_user(
            email="buyer@test.com", password="test1234"
        )
        self.org.stripe_customer_id = "cus_org_existing"
        self.org.save()

        product = Product.objects.create(
            name="Tag",
            slug="tag",
            product_type="premium_tag",
            price=Decimal("150.00"),
            stripe_price_id="price_tag",
            stock=10,
        )
        order = Order.objects.create(
            user=user,
            organization=self.org,
            total=Decimal("150.00"),
            shipping_name="Test",
            shipping_address="Addr",
            shipping_city="City",
            shipping_zip="00000",
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=1,
            unit_price=Decimal("150.00"),
        )

        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.com/test"
        mock_stripe.checkout.Session.create.return_value = mock_session

        from .stripe_utils import create_org_product_checkout

        session = create_org_product_checkout(
            self.org, order, user
        )
        self.assertIsNotNone(session)
