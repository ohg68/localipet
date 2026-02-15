from django.apps import AppConfig


class ScanningConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.scanning"
    verbose_name = "Scanning"

    def ready(self):
        import apps.scanning.signals  # noqa: F401
