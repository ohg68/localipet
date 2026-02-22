"""Tests for scanning app: QR codes, scan logs, finder messages."""

from django.test import TestCase, Client
from django.urls import reverse

from apps.accounts.models import User
from apps.animals.models import Animal, Species

from .models import QRCode, ScanLog, FinderMessage


class QRCodeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="scanowner",
            email="scanowner@example.com",
            password="testpass123",
        )
        self.animal = Animal.objects.create(
            owner=self.user,
            name="Luna",
            species=Species.CAT,
            sex="female",
        )
        self.qr = QRCode.objects.create(animal=self.animal)

    def test_token_generated(self):
        self.assertIsNotNone(self.qr.token)
        self.assertGreater(len(self.qr.token), 10)

    def test_token_unique(self):
        qr2_animal = Animal.objects.create(
            owner=self.user,
            name="Sol",
            species=Species.DOG,
            sex="male",
        )
        qr2 = QRCode.objects.create(animal=qr2_animal)
        self.assertNotEqual(self.qr.token, qr2.token)

    def test_get_scan_url(self):
        url = self.qr.get_scan_url()
        self.assertIn(self.qr.token, url)
        self.assertIn("/s/", url)

    def test_str(self):
        s = str(self.qr)
        self.assertIn("Luna", s)
        self.assertIn("QR", s)


class PublicScanViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="scanuser",
            email="scanuser@example.com",
            password="testpass123",
        )
        self.animal = Animal.objects.create(
            owner=self.user,
            name="Rocky",
            species=Species.DOG,
            sex="male",
        )
        self.qr = QRCode.objects.create(animal=self.animal)

    def test_public_scan_creates_log(self):
        self.assertEqual(ScanLog.objects.count(), 0)
        response = self.client.get(f"/s/{self.qr.token}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ScanLog.objects.count(), 1)

    def test_scan_log_has_ip(self):
        self.client.get(f"/s/{self.qr.token}/")
        scan = ScanLog.objects.first()
        self.assertIsNotNone(scan.ip_address)

    def test_invalid_token_returns_404(self):
        response = self.client.get("/s/invalid-token-xyz/")
        self.assertEqual(response.status_code, 404)

    def test_inactive_qr_returns_404(self):
        self.qr.is_active = False
        self.qr.save()
        response = self.client.get(f"/s/{self.qr.token}/")
        self.assertEqual(response.status_code, 404)

    def test_scan_page_shows_animal_name(self):
        response = self.client.get(f"/s/{self.qr.token}/")
        self.assertContains(response, "Rocky")


class FinderContactViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="finderowner",
            email="finderowner@example.com",
            password="testpass123",
        )
        self.animal = Animal.objects.create(
            owner=self.user,
            name="Max",
            species=Species.DOG,
            sex="male",
        )
        self.qr = QRCode.objects.create(animal=self.animal)

    def test_finder_contact_creates_message(self):
        response = self.client.post(
            f"/s/{self.qr.token}/contact/",
            {
                "sender_name": "John Doe",
                "sender_email": "john@example.com",
                "message": "I found your dog near the park!",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(FinderMessage.objects.count(), 1)
        msg = FinderMessage.objects.first()
        self.assertEqual(msg.sender_name, "John Doe")
        self.assertEqual(msg.qr_code, self.qr)


class AuthenticatedScanViewsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="authowner",
            email="authowner@example.com",
            password="testpass123",
        )
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="testpass123",
        )
        self.animal = Animal.objects.create(
            owner=self.user,
            name="Buddy",
            species=Species.DOG,
            sex="male",
        )
        self.qr = QRCode.objects.create(animal=self.animal)
        ScanLog.objects.create(qr_code=self.qr, ip_address="127.0.0.1")
        self.client = Client()

    def test_scan_history_requires_login(self):
        url = reverse(
            "scanning:history", kwargs={"animal_pk": self.animal.pk}
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)

    def test_scan_history_shows_own_animal(self):
        self.client.login(email="authowner@example.com", password="testpass123")
        url = reverse(
            "scanning:history", kwargs={"animal_pk": self.animal.pk}
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_scan_history_blocks_other_user(self):
        self.client.login(email="other@example.com", password="testpass123")
        url = reverse(
            "scanning:history", kwargs={"animal_pk": self.animal.pk}
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)
