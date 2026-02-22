"""Tests for core app: health check, robots.txt."""

from django.test import TestCase


class HealthCheckViewTest(TestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})


class RobotsTxtViewTest(TestCase):
    def test_robots_txt_returns_text(self):
        response = self.client.get("/robots.txt")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/plain; charset=utf-8")
        self.assertIn("User-agent", response.content.decode())
        self.assertIn("Disallow: /admin/", response.content.decode())
