"""
Odoo XML-RPC Client.

Encapsulates authentication and CRUD operations against Odoo Online.
Only instantiated when ODOO_SYNC_ENABLED=True.

Usage:
    from apps.odoo_sync.client import get_odoo_client

    client = get_odoo_client()
    if client:
        partners = client.search_read("res.partner", [("name", "ilike", "test")])
"""

import logging
import xmlrpc.client

from django.conf import settings

logger = logging.getLogger(__name__)

_client_instance = None


class OdooClient:
    """XML-RPC client for Odoo Online."""

    def __init__(self, url, db, username, api_key):
        self.url = url.rstrip("/")
        self.db = db
        self.username = username
        self.api_key = api_key
        self._uid = None
        self._models = None

    def _authenticate(self):
        """Authenticate and store UID."""
        common = xmlrpc.client.ServerProxy(
            f"{self.url}/xmlrpc/2/common"
        )
        self._uid = common.authenticate(
            self.db, self.username, self.api_key, {}
        )
        if not self._uid:
            raise ConnectionError(
                f"Failed to authenticate with Odoo at {self.url}"
            )
        self._models = xmlrpc.client.ServerProxy(
            f"{self.url}/xmlrpc/2/object"
        )
        logger.info("Authenticated with Odoo as UID %s", self._uid)

    @property
    def uid(self):
        if self._uid is None:
            self._authenticate()
        return self._uid

    @property
    def models(self):
        if self._models is None:
            self._authenticate()
        return self._models

    def execute(self, model, method, *args, **kwargs):
        """Execute an XML-RPC method on an Odoo model."""
        return self.models.execute_kw(
            self.db,
            self.uid,
            self.api_key,
            model,
            method,
            args,
            kwargs,
        )

    def search(self, model, domain, **kwargs):
        """Search for record IDs."""
        return self.execute(model, "search", domain, **kwargs)

    def search_read(self, model, domain, fields=None, **kwargs):
        """Search and read records."""
        params = {}
        if fields:
            params["fields"] = fields
        params.update(kwargs)
        return self.execute(model, "search_read", domain, **params)

    def read(self, model, ids, fields=None):
        """Read specific records by IDs."""
        params = {}
        if fields:
            params["fields"] = fields
        return self.execute(model, "read", ids, **params)

    def create(self, model, values):
        """Create a record, return its ID."""
        return self.execute(model, "create", [values])

    def write(self, model, ids, values):
        """Update records."""
        return self.execute(model, "write", ids, values)

    def unlink(self, model, ids):
        """Delete records."""
        return self.execute(model, "unlink", ids)


def get_odoo_client():
    """
    Get or create the singleton Odoo client.

    Returns None if Odoo sync is disabled or not configured.
    """
    global _client_instance

    if not getattr(settings, "ODOO_SYNC_ENABLED", False):
        return None

    if not all([
        settings.ODOO_URL,
        settings.ODOO_DB,
        settings.ODOO_USERNAME,
        settings.ODOO_API_KEY,
    ]):
        logger.warning(
            "ODOO_SYNC_ENABLED is True but Odoo credentials are "
            "not fully configured."
        )
        return None

    if _client_instance is None:
        _client_instance = OdooClient(
            url=settings.ODOO_URL,
            db=settings.ODOO_DB,
            username=settings.ODOO_USERNAME,
            api_key=settings.ODOO_API_KEY,
        )

    return _client_instance
