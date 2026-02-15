from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class OdooSyncConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.odoo_sync"
    verbose_name = _("Odoo Sync")
