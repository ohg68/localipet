from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect


class OwnerRequiredMixin(LoginRequiredMixin):
    """Ensures the logged-in user owns the animal being accessed."""

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
        animal = getattr(obj, "animal", obj)
        if animal.owner != self.request.user:
            raise PermissionDenied
        return obj


class RoleRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    required_roles = []

    def test_func(self):
        return self.request.user.profile.role in self.required_roles


class VetRequiredMixin(RoleRequiredMixin):
    required_roles = ["vet", "shop"]


class PremiumRequiredMixin(LoginRequiredMixin):
    """Gates features behind an active premium subscription."""

    def dispatch(self, request, *args, **kwargs):
        if not request.user.profile.is_premium:
            return redirect("billing:pricing")
        return super().dispatch(request, *args, **kwargs)


class ValidConsentRequiredMixin(LoginRequiredMixin):
    """Ensures the vet/shop has a valid consent for the animal."""

    def get_animal(self):
        from apps.animals.models import Animal

        return Animal.objects.get(pk=self.kwargs["animal_pk"])

    def dispatch(self, request, *args, **kwargs):
        from django.db.models import Q
        from apps.veterinary.models import Consent

        animal = self.get_animal()

        # Check individual consent OR org-level consent
        q_filter = Q(
            requester=request.user,
            animal=animal,
            status=Consent.Status.APPROVED,
        )
        org = getattr(request, "organization", None)
        if org:
            q_filter = q_filter | Q(
                organization=org,
                animal=animal,
                status=Consent.Status.APPROVED,
            )

        consent = Consent.objects.filter(q_filter).first()
        if not consent or not consent.is_valid:
            raise PermissionDenied("No valid consent for this animal.")
        self.consent = consent
        return super().dispatch(request, *args, **kwargs)
