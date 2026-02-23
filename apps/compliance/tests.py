"""Tests for the compliance app."""

import json
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, RequestFactory, override_settings
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User


# Use StaticFilesStorage for tests to avoid manifest errors
# Use ROOT_URLCONF to ensure all URL patterns are available
@override_settings(
    STORAGES={
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    },
    ROOT_URLCONF="config.urls",
)
class ComplianceTestBase(TestCase):
    pass


class LegalDocumentModelTest(TestCase):
    """Test LegalDocument model."""

    def setUp(self):
        from apps.compliance.models import LegalDocument

        self.doc = LegalDocument.objects.create(
            doc_type=LegalDocument.DocType.PRIVACY_POLICY,
            version="1.0",
            effective_date=date.today(),
            is_active=True,
        )

    def test_str(self):
        self.assertIn("1.0", str(self.doc))

    def test_get_active(self):
        from apps.compliance.models import LegalDocument

        active = LegalDocument.get_active(LegalDocument.DocType.PRIVACY_POLICY)
        self.assertEqual(active, self.doc)

    def test_get_active_none(self):
        from apps.compliance.models import LegalDocument

        result = LegalDocument.get_active(LegalDocument.DocType.TERMS_OF_SERVICE)
        self.assertIsNone(result)

    def test_unique_together(self):
        from django.db import IntegrityError
        from apps.compliance.models import LegalDocument

        with self.assertRaises(IntegrityError):
            LegalDocument.objects.create(
                doc_type=LegalDocument.DocType.PRIVACY_POLICY,
                version="1.0",
                effective_date=date.today(),
            )


class LegalConsentModelTest(TestCase):
    """Test LegalConsent model."""

    def setUp(self):
        from apps.compliance.models import LegalConsent, LegalDocument

        self.user = User.objects.create_user(
            email="test@example.com", username="testuser", password="testpass123"
        )
        self.doc = LegalDocument.objects.create(
            doc_type=LegalDocument.DocType.PRIVACY_POLICY,
            version="1.0",
            effective_date=date.today(),
            is_active=True,
        )
        self.consent = LegalConsent.objects.create(
            user=self.user, document=self.doc, consent_given=True
        )

    def test_str_accepted(self):
        self.assertIn("test@example.com", str(self.consent))

    def test_str_withdrawn(self):
        self.consent.consent_given = False
        self.consent.save()
        self.assertIn("test@example.com", str(self.consent))


class CookieConsentModelTest(TestCase):
    """Test CookieConsent model."""

    def test_create_anonymous(self):
        from apps.compliance.models import CookieConsent

        cc = CookieConsent.objects.create(
            session_key="abc12345", essential=True, analytics=False
        )
        self.assertIn("abc12345", str(cc))

    def test_create_with_user(self):
        from apps.compliance.models import CookieConsent

        user = User.objects.create_user(
            email="test2@example.com", username="testuser2", password="testpass123"
        )
        cc = CookieConsent.objects.create(
            user=user, essential=True, analytics=True
        )
        self.assertIn("test2@example.com", str(cc))


class AuditLogModelTest(TestCase):
    """Test AuditLog model."""

    def test_create_and_str(self):
        from apps.compliance.models import AuditLog

        user = User.objects.create_user(
            email="audit@example.com", username="audituser", password="testpass123"
        )
        log = AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.LOGIN,
            ip_address="192.168.1.1",
        )
        self.assertIn("audit@example.com", str(log))

    def test_anonymous_log(self):
        from apps.compliance.models import AuditLog

        log = AuditLog.objects.create(
            action=AuditLog.Action.LOGIN,
            ip_address="10.0.0.1",
        )
        self.assertIn("anonymous", str(log))


class DataRetentionPolicyTest(TestCase):
    """Test DataRetentionPolicy model."""

    def test_str(self):
        from apps.compliance.models import DataRetentionPolicy

        policy = DataRetentionPolicy.objects.create(
            data_type=DataRetentionPolicy.DataType.SCAN_LOGS,
            retention_days=90,
            is_active=True,
        )
        self.assertIn("90", str(policy))


class UtilsTest(TestCase):
    """Test compliance utility functions."""

    def test_validate_rfc_valid(self):
        from apps.compliance.utils import validate_rfc

        valid, msg = validate_rfc("GARC850101AB1")
        self.assertTrue(valid)

    def test_validate_rfc_empty(self):
        from apps.compliance.utils import validate_rfc

        valid, msg = validate_rfc("")
        self.assertTrue(valid)

    def test_validate_rfc_invalid(self):
        from apps.compliance.utils import validate_rfc

        valid, msg = validate_rfc("INVALID")
        self.assertFalse(valid)

    def test_validate_rfc_generic_public(self):
        from apps.compliance.utils import validate_rfc

        valid, _ = validate_rfc("XAXX010101000")
        self.assertTrue(valid)

    @override_settings(TAX_RATE=Decimal("0.16"))
    def test_get_tax_rate_mexico(self):
        from apps.compliance.utils import get_tax_rate

        rate = get_tax_rate("MX")
        self.assertEqual(rate, Decimal("0.16"))

    @override_settings(TAX_RATE=Decimal("0"))
    def test_get_tax_rate_unknown(self):
        from apps.compliance.utils import get_tax_rate

        rate = get_tax_rate("JP")
        self.assertEqual(rate, Decimal("0"))

    @override_settings(TAX_RATE=Decimal("0.16"))
    def test_calculate_tax(self):
        from apps.compliance.utils import calculate_tax

        tax = calculate_tax(Decimal("100.00"), "MX")
        self.assertEqual(tax, Decimal("16.00"))

    def test_get_client_ip_direct(self):
        from apps.compliance.utils import get_client_ip

        factory = RequestFactory()
        request = factory.get("/")
        ip = get_client_ip(request)
        self.assertEqual(ip, "127.0.0.1")

    def test_get_client_ip_forwarded(self):
        from apps.compliance.utils import get_client_ip

        factory = RequestFactory()
        request = factory.get("/", HTTP_X_FORWARDED_FOR="203.0.113.1, 70.0.0.1")
        ip = get_client_ip(request)
        self.assertEqual(ip, "203.0.113.1")

    def test_export_user_data(self):
        from apps.compliance.utils import export_user_data

        user = User.objects.create_user(
            email="export@example.com",
            username="exportuser",
            password="testpass123",
            first_name="Export",
            last_name="User",
        )
        data = export_user_data(user)
        self.assertEqual(data["account"]["email"], "export@example.com")
        self.assertIn("profile", data)
        self.assertIn("animals", data)
        self.assertIn("orders", data)
        self.assertIn("subscriptions", data)
        self.assertIn("legal_consents", data)

    def test_log_audit(self):
        from apps.compliance.models import AuditLog
        from apps.compliance.utils import log_audit

        user = User.objects.create_user(
            email="logtest@example.com", username="logtest", password="testpass123"
        )
        factory = RequestFactory()
        request = factory.get("/")
        request.user = user
        log_audit(request, AuditLog.Action.LOGIN, "Test login")
        self.assertTrue(AuditLog.objects.filter(user=user, action="login").exists())


class LegalPageViewsTest(ComplianceTestBase):
    """Test legal page views are publicly accessible."""

    def test_privacy_policy(self):
        response = self.client.get(reverse("compliance:privacy-policy"))
        self.assertEqual(response.status_code, 200)

    def test_terms_of_service(self):
        response = self.client.get(reverse("compliance:terms-of-service"))
        self.assertEqual(response.status_code, 200)

    def test_cookie_policy(self):
        response = self.client.get(reverse("compliance:cookie-policy"))
        self.assertEqual(response.status_code, 200)

    def test_refund_policy(self):
        response = self.client.get(reverse("compliance:refund-policy"))
        self.assertEqual(response.status_code, 200)


class CookieConsentViewTest(ComplianceTestBase):
    """Test cookie consent API endpoint."""

    def test_accept_all(self):
        # Ensure session exists
        self.client.get("/")
        response = self.client.post(
            reverse("compliance:cookie-consent"),
            data=json.dumps({"analytics": True, "marketing": False}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("cookie_consent", response.cookies)

    def test_essential_only(self):
        self.client.get("/")
        response = self.client.post(
            reverse("compliance:cookie-consent"),
            data=json.dumps({"analytics": False, "marketing": False}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)


class GDPRUserRightsTest(ComplianceTestBase):
    """Test GDPR data subject rights views."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="gdpr@example.com",
            username="gdpruser",
            password="testpass123",
            first_name="GDPR",
            last_name="User",
        )
        self.client.login(email="gdpr@example.com", password="testpass123")

    def test_privacy_dashboard(self):
        response = self.client.get(reverse("compliance:privacy-dashboard"))
        self.assertEqual(response.status_code, 200)

    def test_data_export(self):
        response = self.client.post(reverse("compliance:data-export"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/json")
        data = json.loads(response.content)
        self.assertEqual(data["account"]["email"], "gdpr@example.com")

    def test_data_delete_page(self):
        response = self.client.get(reverse("compliance:data-delete"))
        self.assertEqual(response.status_code, 200)

    def test_data_delete_confirm(self):
        response = self.client.post(reverse("compliance:data-delete-confirm"))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(User.objects.filter(email="gdpr@example.com").exists())

    def test_privacy_dashboard_requires_login(self):
        self.client.logout()
        response = self.client.get(reverse("compliance:privacy-dashboard"))
        self.assertEqual(response.status_code, 302)

    def test_data_export_requires_login(self):
        self.client.logout()
        response = self.client.post(reverse("compliance:data-export"))
        self.assertEqual(response.status_code, 302)


class WithdrawConsentViewTest(ComplianceTestBase):
    """Test consent withdrawal."""

    def setUp(self):
        from apps.compliance.models import LegalConsent, LegalDocument

        self.user = User.objects.create_user(
            email="withdraw@example.com",
            username="withdrawuser",
            password="testpass123",
        )
        self.doc = LegalDocument.objects.create(
            doc_type=LegalDocument.DocType.PRIVACY_POLICY,
            version="1.0",
            effective_date=date.today(),
            is_active=True,
        )
        self.consent = LegalConsent.objects.create(
            user=self.user, document=self.doc, consent_given=True
        )
        self.client.login(email="withdraw@example.com", password="testpass123")

    def test_withdraw_consent(self):
        response = self.client.post(
            reverse("compliance:withdraw-consent", args=[self.consent.id])
        )
        self.assertEqual(response.status_code, 302)
        self.consent.refresh_from_db()
        self.assertFalse(self.consent.consent_given)
        self.assertIsNotNone(self.consent.withdrawn_at)

    def test_withdraw_nonexistent(self):
        import uuid

        response = self.client.post(
            reverse("compliance:withdraw-consent", args=[uuid.uuid4()])
        )
        self.assertEqual(response.status_code, 302)


class AcceptLegalDocumentViewTest(ComplianceTestBase):
    """Test accepting legal documents."""

    def setUp(self):
        from apps.compliance.models import LegalDocument

        self.user = User.objects.create_user(
            email="accept@example.com",
            username="acceptuser",
            password="testpass123",
        )
        self.doc = LegalDocument.objects.create(
            doc_type=LegalDocument.DocType.PRIVACY_POLICY,
            version="1.0",
            effective_date=date.today(),
            is_active=True,
        )
        self.client.login(email="accept@example.com", password="testpass123")

    def test_accept_document(self):
        from apps.compliance.models import LegalConsent

        response = self.client.post(
            reverse("compliance:accept-document", args=["privacy_policy"])
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            LegalConsent.objects.filter(
                user=self.user, document=self.doc, consent_given=True
            ).exists()
        )


class RegistrationConsentTest(ComplianceTestBase):
    """Test that registration records legal consent."""

    def setUp(self):
        from apps.compliance.models import LegalDocument

        self.pp = LegalDocument.objects.create(
            doc_type=LegalDocument.DocType.PRIVACY_POLICY,
            version="1.0",
            effective_date=date.today(),
            is_active=True,
        )
        self.tos = LegalDocument.objects.create(
            doc_type=LegalDocument.DocType.TERMS_OF_SERVICE,
            version="1.0",
            effective_date=date.today(),
            is_active=True,
        )

    def test_owner_registration_records_consent(self):
        from apps.compliance.models import LegalConsent

        response = self.client.post(
            reverse("accounts:register"),
            {
                "email": "newowner@example.com",
                "username": "newowner",
                "first_name": "New",
                "last_name": "Owner",
                "password1": "SuperSecure123!",
                "password2": "SuperSecure123!",
                "accept_privacy": True,
            },
        )
        user = User.objects.get(email="newowner@example.com")
        consents = LegalConsent.objects.filter(user=user)
        self.assertEqual(consents.count(), 2)

    def test_registration_requires_accept_privacy(self):
        response = self.client.post(
            reverse("accounts:register"),
            {
                "email": "noaccept@example.com",
                "username": "noaccept",
                "first_name": "No",
                "last_name": "Accept",
                "password1": "SuperSecure123!",
                "password2": "SuperSecure123!",
                # accept_privacy intentionally omitted
            },
        )
        self.assertFalse(User.objects.filter(email="noaccept@example.com").exists())


class DataRetentionTaskTest(TestCase):
    """Test data retention cleanup task."""

    def test_cleanup_audit_logs(self):
        from apps.compliance.models import AuditLog, DataRetentionPolicy

        DataRetentionPolicy.objects.create(
            data_type=DataRetentionPolicy.DataType.AUDIT_LOGS,
            retention_days=30,
            is_active=True,
        )

        user = User.objects.create_user(
            email="retention@example.com", username="retuser", password="testpass123"
        )

        # Create old and new audit logs
        old_log = AuditLog.objects.create(
            user=user, action=AuditLog.Action.LOGIN
        )
        AuditLog.objects.filter(id=old_log.id).update(
            created_at=timezone.now() - timedelta(days=60)
        )

        new_log = AuditLog.objects.create(
            user=user, action=AuditLog.Action.LOGIN
        )

        from apps.compliance.tasks import cleanup_expired_data

        result = cleanup_expired_data()

        self.assertEqual(result.get("audit_logs", 0), 1)
        self.assertFalse(AuditLog.objects.filter(id=old_log.id).exists())
        self.assertTrue(AuditLog.objects.filter(id=new_log.id).exists())

    def test_cleanup_cookie_consents(self):
        from apps.compliance.models import CookieConsent, DataRetentionPolicy

        DataRetentionPolicy.objects.create(
            data_type=DataRetentionPolicy.DataType.COOKIE_CONSENTS,
            retention_days=365,
            is_active=True,
        )

        old_cc = CookieConsent.objects.create(
            session_key="old123", essential=True
        )
        CookieConsent.objects.filter(id=old_cc.id).update(
            created_at=timezone.now() - timedelta(days=400)
        )

        new_cc = CookieConsent.objects.create(
            session_key="new456", essential=True
        )

        from apps.compliance.tasks import cleanup_expired_data

        result = cleanup_expired_data()

        self.assertEqual(result.get("cookie_consents", 0), 1)
        self.assertFalse(CookieConsent.objects.filter(id=old_cc.id).exists())
        self.assertTrue(CookieConsent.objects.filter(id=new_cc.id).exists())
