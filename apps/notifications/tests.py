"""Tests for notifications app: services, models, views."""

from django.test import TestCase, Client
from django.urls import reverse

from apps.accounts.models import User

from .models import Notification
from .services import create_notification, _should_send_email


class NotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="notifuser",
            email="notif@example.com",
            password="testpass123",
        )

    def test_create_notification(self):
        notif = Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.Type.SCAN_ALERT,
            title="Test notification",
            message="A test notification body.",
        )
        self.assertFalse(notif.is_read)
        self.assertFalse(notif.email_sent)
        self.assertIn("Test notification", str(notif))

    def test_mark_read(self):
        notif = Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.Type.SYSTEM,
            title="Read me",
            message="Body text.",
        )
        self.assertFalse(notif.is_read)
        notif.mark_read()
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)

    def test_mark_read_idempotent(self):
        notif = Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.Type.SYSTEM,
            title="Already read",
            message="Body text.",
            is_read=True,
        )
        notif.mark_read()
        self.assertTrue(notif.is_read)


class NotificationServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="svcuser",
            email="svc@example.com",
            password="testpass123",
        )

    def test_create_notification_creates_in_db(self):
        notif = create_notification(
            recipient=self.user,
            notification_type=Notification.Type.REMINDER,
            title="Reminder test",
            message="Don't forget!",
            send_email=False,
        )
        self.assertTrue(
            Notification.objects.filter(pk=notif.pk).exists()
        )
        self.assertEqual(notif.recipient, self.user)

    def test_should_send_email_respects_preferences(self):
        # Default: all True
        self.assertTrue(
            _should_send_email(self.user, Notification.Type.SCAN_ALERT)
        )
        # Disable scan emails
        self.user.profile.email_on_scan = False
        self.user.profile.save()
        self.assertFalse(
            _should_send_email(self.user, Notification.Type.SCAN_ALERT)
        )

    def test_should_send_email_message_pref(self):
        self.user.profile.email_on_message = False
        self.user.profile.save()
        self.assertFalse(
            _should_send_email(self.user, Notification.Type.FINDER_MESSAGE)
        )

    def test_should_send_email_consent_pref(self):
        self.user.profile.email_on_consent_request = False
        self.user.profile.save()
        self.assertFalse(
            _should_send_email(self.user, Notification.Type.CONSENT_REQUEST)
        )
        self.assertFalse(
            _should_send_email(self.user, Notification.Type.CONSENT_RESPONSE)
        )

    def test_unknown_type_defaults_to_true(self):
        self.assertTrue(
            _should_send_email(self.user, Notification.Type.ORDER_STATUS)
        )


class NotificationViewsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="viewuser",
            email="viewuser@example.com",
            password="testpass123",
        )
        self.client = Client()
        self.client.login(email="viewuser@example.com", password="testpass123")

        self.n1 = Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.Type.SYSTEM,
            title="First",
            message="First message",
        )
        self.n2 = Notification.objects.create(
            recipient=self.user,
            notification_type=Notification.Type.SYSTEM,
            title="Second",
            message="Second message",
        )

    def test_notification_list(self):
        response = self.client.get(reverse("notifications:list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context["notifications"]), 2)

    def test_mark_read(self):
        response = self.client.post(
            reverse("notifications:mark-read", kwargs={"pk": self.n1.pk})
        )
        self.assertEqual(response.status_code, 302)
        self.n1.refresh_from_db()
        self.assertTrue(self.n1.is_read)

    def test_mark_all_read(self):
        response = self.client.post(reverse("notifications:mark-all-read"))
        self.assertEqual(response.status_code, 302)
        self.n1.refresh_from_db()
        self.n2.refresh_from_db()
        self.assertTrue(self.n1.is_read)
        self.assertTrue(self.n2.is_read)

    def test_unread_count_json(self):
        response = self.client.get(reverse("notifications:unread-count"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["unread_count"], 2)

    def test_unread_count_after_read(self):
        self.n1.mark_read()
        response = self.client.get(reverse("notifications:unread-count"))
        data = response.json()
        self.assertEqual(data["unread_count"], 1)

    def test_requires_login(self):
        self.client.logout()
        response = self.client.get(reverse("notifications:list"))
        self.assertEqual(response.status_code, 302)
