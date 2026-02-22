"""Tests for animals app: models, views, and new features."""

from datetime import date, time, timedelta
from decimal import Decimal

from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone

from apps.accounts.models import User
from .models import (
    Animal,
    AnimalCoOwner,
    AnimalPhoto,
    Appointment,
    Species,
    Vaccination,
    WeightRecord,
)


class AnimalModelTestMixin:
    """Shared setUp for tests that need a user and animal."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="owner1",
            email="owner1@example.com",
            password="testpass123",
        )
        self.animal = Animal.objects.create(
            owner=self.user,
            name="Firulais",
            species=Species.DOG,
            breed="Labrador",
            color="Golden",
            sex="male",
        )
        self.client = Client()
        self.client.login(email="owner1@example.com", password="testpass123")


# ── Animal CRUD ─────────────────────────────────────


class AnimalModelTest(AnimalModelTestMixin, TestCase):
    def test_str(self):
        self.assertIn("Firulais", str(self.animal))
        self.assertIn("Dog", str(self.animal))

    def test_default_values(self):
        self.assertFalse(self.animal.is_lost)
        self.assertTrue(self.animal.is_active)

    def test_soft_delete(self):
        self.animal.is_active = False
        self.animal.save(update_fields=["is_active"])
        self.assertFalse(
            Animal.objects.filter(pk=self.animal.pk, is_active=True).exists()
        )


class AnimalViewsTest(AnimalModelTestMixin, TestCase):
    def test_dashboard_requires_login(self):
        self.client.logout()
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 302)

    def test_dashboard_shows_animals(self):
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["animals_count"], 1)

    def test_animal_list(self):
        response = self.client.get(reverse("animals:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Firulais")

    def test_animal_detail(self):
        response = self.client.get(
            reverse("animals:detail", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Firulais")

    def test_animal_create(self):
        response = self.client.post(
            reverse("animals:create"),
            {
                "name": "Michi",
                "species": Species.CAT,
                "sex": "female",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Animal.objects.filter(name="Michi").exists())

    def test_animal_update(self):
        response = self.client.post(
            reverse("animals:edit", kwargs={"pk": self.animal.pk}),
            {
                "name": "Firulais Updated",
                "species": Species.DOG,
                "sex": "male",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.animal.refresh_from_db()
        self.assertEqual(self.animal.name, "Firulais Updated")

    def test_animal_soft_delete_view(self):
        response = self.client.post(
            reverse("animals:delete", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 302)
        self.animal.refresh_from_db()
        self.assertFalse(self.animal.is_active)

    def test_toggle_lost(self):
        self.assertFalse(self.animal.is_lost)
        response = self.client.post(
            reverse("animals:toggle-lost", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 302)
        self.animal.refresh_from_db()
        self.assertTrue(self.animal.is_lost)
        self.assertIsNotNone(self.animal.lost_since)

    def test_other_user_cannot_access(self):
        other = User.objects.create_user(
            username="other", email="other@example.com", password="pass123"
        )
        self.client.login(email="other@example.com", password="pass123")
        response = self.client.get(
            reverse("animals:detail", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 403)


# ── Vaccination ──────────────────────────────────────


class VaccinationTest(AnimalModelTestMixin, TestCase):
    def test_create_vaccination(self):
        vacc = Vaccination.objects.create(
            animal=self.animal,
            name="Rabies",
            date_administered=date.today(),
            next_due_date=date.today() + timedelta(days=365),
        )
        self.assertIn("Rabies", str(vacc))
        self.assertFalse(vacc.is_overdue)

    def test_overdue_vaccination(self):
        vacc = Vaccination.objects.create(
            animal=self.animal,
            name="DHPP",
            date_administered=date.today() - timedelta(days=400),
            next_due_date=date.today() - timedelta(days=30),
        )
        self.assertTrue(vacc.is_overdue)

    def test_vaccination_list_view(self):
        Vaccination.objects.create(
            animal=self.animal,
            name="Rabies",
            date_administered=date.today(),
        )
        response = self.client.get(
            reverse("animals:vaccination-list", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Rabies")

    def test_vaccination_create_view(self):
        response = self.client.post(
            reverse("animals:vaccination-add", kwargs={"pk": self.animal.pk}),
            {
                "name": "FVRCP",
                "date_administered": date.today().isoformat(),
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            Vaccination.objects.filter(name="FVRCP", animal=self.animal).exists()
        )


# ── Weight Tracking ──────────────────────────────────


class WeightTrackingTest(AnimalModelTestMixin, TestCase):
    def test_create_weight_record(self):
        wr = WeightRecord.objects.create(
            animal=self.animal,
            weight_kg=Decimal("12.50"),
            date_recorded=date.today(),
        )
        self.assertIn("12.50", str(wr))

    def test_weight_view_creates_and_updates_animal(self):
        response = self.client.post(
            reverse("animals:weight-add", kwargs={"pk": self.animal.pk}),
            {
                "weight_kg": "15.75",
                "date_recorded": date.today().isoformat(),
            },
        )
        self.assertEqual(response.status_code, 302)
        self.animal.refresh_from_db()
        self.assertEqual(self.animal.weight_kg, Decimal("15.75"))

    def test_weight_history_view(self):
        WeightRecord.objects.create(
            animal=self.animal,
            weight_kg=Decimal("10.00"),
            date_recorded=date.today() - timedelta(days=30),
        )
        WeightRecord.objects.create(
            animal=self.animal,
            weight_kg=Decimal("11.50"),
            date_recorded=date.today(),
        )
        response = self.client.get(
            reverse("animals:weight-history", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context["chart_data"]), 2)

    def test_weight_chart_data_json(self):
        WeightRecord.objects.create(
            animal=self.animal,
            weight_kg=Decimal("10.00"),
            date_recorded=date.today(),
        )
        response = self.client.get(
            reverse("animals:weight-chart-data", kwargs={"pk": self.animal.pk})
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("labels", data)
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)


# ── Co-Owner (Family Access) ────────────────────────


class CoOwnerTest(AnimalModelTestMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.family = User.objects.create_user(
            username="family1",
            email="family@example.com",
            password="testpass123",
        )

    def test_add_co_owner(self):
        response = self.client.post(
            reverse("animals:co-owner-add", kwargs={"pk": self.animal.pk}),
            {"email": "family@example.com", "permission": "view"},
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            AnimalCoOwner.objects.filter(
                animal=self.animal, user=self.family
            ).exists()
        )

    def test_cannot_add_self(self):
        response = self.client.post(
            reverse("animals:co-owner-add", kwargs={"pk": self.animal.pk}),
            {"email": "owner1@example.com", "permission": "view"},
        )
        self.assertEqual(response.status_code, 302)
        self.assertFalse(
            AnimalCoOwner.objects.filter(animal=self.animal).exists()
        )

    def test_duplicate_co_owner(self):
        AnimalCoOwner.objects.create(
            animal=self.animal,
            user=self.family,
            permission="view",
            invited_by=self.user,
        )
        response = self.client.post(
            reverse("animals:co-owner-add", kwargs={"pk": self.animal.pk}),
            {"email": "family@example.com", "permission": "edit"},
        )
        self.assertEqual(response.status_code, 302)
        # Should still be only one
        self.assertEqual(
            AnimalCoOwner.objects.filter(
                animal=self.animal, user=self.family
            ).count(),
            1,
        )

    def test_remove_co_owner(self):
        co = AnimalCoOwner.objects.create(
            animal=self.animal,
            user=self.family,
            permission="view",
            invited_by=self.user,
        )
        response = self.client.post(
            reverse(
                "animals:co-owner-remove",
                kwargs={"pk": self.animal.pk, "co_owner_pk": co.pk},
            )
        )
        self.assertEqual(response.status_code, 302)
        self.assertFalse(AnimalCoOwner.objects.filter(pk=co.pk).exists())

    def test_co_owner_str(self):
        co = AnimalCoOwner.objects.create(
            animal=self.animal,
            user=self.family,
            permission="view",
            invited_by=self.user,
        )
        self.assertIn("View Only", str(co))


# ── Appointments ─────────────────────────────────────


class AppointmentTest(AnimalModelTestMixin, TestCase):
    def test_create_appointment_view(self):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        response = self.client.post(
            reverse("animals:appointment-add", kwargs={"pk": self.animal.pk}),
            {
                "title": "Annual checkup",
                "date": tomorrow,
                "time": "10:00",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(
            Appointment.objects.filter(
                title="Annual checkup", animal=self.animal
            ).exists()
        )

    def test_cancel_appointment(self):
        appt = Appointment.objects.create(
            animal=self.animal,
            owner=self.user,
            title="Vaccination",
            date=date.today() + timedelta(days=7),
            time=time(14, 0),
        )
        response = self.client.post(
            reverse("animals:appointment-cancel", kwargs={"appt_pk": appt.pk})
        )
        self.assertEqual(response.status_code, 302)
        appt.refresh_from_db()
        self.assertEqual(appt.status, Appointment.Status.CANCELED)

    def test_appointment_list(self):
        Appointment.objects.create(
            animal=self.animal,
            owner=self.user,
            title="Dental cleaning",
            date=date.today() + timedelta(days=3),
            time=time(9, 30),
        )
        response = self.client.get(reverse("animals:appointment-list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Dental cleaning")

    def test_appointment_str(self):
        appt = Appointment.objects.create(
            animal=self.animal,
            owner=self.user,
            title="Checkup",
            date=date.today(),
            time=time(10, 0),
        )
        self.assertIn("Checkup", str(appt))
        self.assertIn("Firulais", str(appt))


# ── Lost Pets Public Page ────────────────────────────


class LostPetsPublicTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner2",
            email="owner2@example.com",
            password="testpass123",
        )
        self.lost_animal = Animal.objects.create(
            owner=self.user,
            name="Bobby",
            species=Species.DOG,
            is_lost=True,
            lost_since=timezone.now(),
            sex="male",
        )
        self.normal_animal = Animal.objects.create(
            owner=self.user,
            name="Happy",
            species=Species.CAT,
            is_lost=False,
            sex="female",
        )

    def test_lost_pets_page_no_auth_required(self):
        response = self.client.get("/lost-pets/")
        self.assertEqual(response.status_code, 200)

    def test_only_lost_animals_shown(self):
        response = self.client.get("/lost-pets/")
        self.assertContains(response, "Bobby")
        self.assertNotContains(response, "Happy")

    def test_inactive_lost_animals_not_shown(self):
        self.lost_animal.is_active = False
        self.lost_animal.save(update_fields=["is_active"])
        response = self.client.get("/lost-pets/")
        self.assertNotContains(response, "Bobby")
