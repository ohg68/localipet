import logging

logger = logging.getLogger(__name__)


class ActiveOrganizationMiddleware:
    """
    Inject ``request.organization`` and ``request.org_membership``
    based on the session value ``active_organization_id``.

    Falls back to ``None`` for individual users (backward compatible).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.organization = None
        request.org_membership = None

        if request.user.is_authenticated:
            org_id = request.session.get("active_organization_id")
            if org_id:
                from .models import OrganizationMember

                membership = (
                    OrganizationMember.objects.filter(
                        user=request.user,
                        organization_id=org_id,
                        is_active=True,
                        organization__is_active=True,
                    )
                    .select_related("organization")
                    .first()
                )
                if membership:
                    request.organization = membership.organization
                    request.org_membership = membership
                else:
                    # Stale session — clear it
                    del request.session["active_organization_id"]

        return self.get_response(request)
