from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect


class OrganizationRequiredMixin(LoginRequiredMixin):
    """Ensures ``request.organization`` is set."""

    def dispatch(self, request, *args, **kwargs):
        if not getattr(request, "organization", None):
            return redirect("organizations:select-org")
        return super().dispatch(request, *args, **kwargs)


class OrgRoleRequiredMixin(OrganizationRequiredMixin):
    """Ensures user has one of the required roles within the org."""

    required_org_roles: list[str] = []

    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        if response.status_code == 302:
            # redirect from parent — pass through
            return response
        membership = getattr(request, "org_membership", None)
        if not membership or membership.role not in self.required_org_roles:
            raise PermissionDenied
        return response


class OrgOwnerOrAdminMixin(OrgRoleRequiredMixin):
    required_org_roles = ["owner", "admin"]


class OrgStaffMixin(OrgRoleRequiredMixin):
    """Any active member of the org."""

    required_org_roles = ["owner", "admin", "staff", "vet"]
