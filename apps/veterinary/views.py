from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.utils import timezone
from django.views import View
from django.views.generic import CreateView, ListView, TemplateView

from apps.animals.models import Animal
from apps.core.mixins import VetRequiredMixin, ValidConsentRequiredMixin

from .forms import (
    AnimalSearchForm,
    ConsentRequestForm,
    ConsentResponseForm,
    ServiceRecordForm,
    VetMedicalRecordForm,
)
from .models import Consent, ServiceRecord, VetMedicalRecord


class VetDashboardView(VetRequiredMixin, TemplateView):
    template_name = "veterinary/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context["active_consents"] = Consent.objects.filter(
            requester=user, status=Consent.Status.APPROVED
        ).select_related("animal", "owner")
        context["pending_consents"] = Consent.objects.filter(
            requester=user, status=Consent.Status.PENDING
        ).select_related("animal", "owner")
        context["search_form"] = AnimalSearchForm()
        return context


class AnimalSearchView(VetRequiredMixin, ListView):
    template_name = "veterinary/search_results.html"
    context_object_name = "animals"

    def get_queryset(self):
        query = self.request.GET.get("query", "").strip()
        if not query:
            return Animal.objects.none()

        from apps.scanning.models import QRCode

        # Search by microchip ID
        animals = Animal.objects.filter(
            microchip_id__iexact=query, is_active=True
        )
        if animals.exists():
            return animals

        # Search by QR token
        qr = QRCode.objects.filter(token=query).first()
        if qr:
            return Animal.objects.filter(pk=qr.animal_id)

        # Search by owner email
        if "@" in query:
            return Animal.objects.filter(
                owner__email__iexact=query, is_active=True
            )

        return Animal.objects.none()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["search_form"] = AnimalSearchForm(self.request.GET)
        return context


class RequestConsentView(VetRequiredMixin, CreateView):
    model = Consent
    form_class = ConsentRequestForm
    template_name = "veterinary/request_access.html"

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["animal_pk"], is_active=True
        )

    def form_valid(self, form):
        animal = self.get_animal()
        form.instance.requester = self.request.user
        form.instance.animal = animal
        form.instance.owner = animal.owner
        response = super().form_valid(form)

        try:
            from apps.notifications.tasks import notify_consent_request_task

            notify_consent_request_task.delay(str(self.object.id))
        except Exception:
            pass

        return response

    def get_success_url(self):
        return reverse_lazy("veterinary:dashboard")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        return context


class RespondConsentView(LoginRequiredMixin, View):
    """Owner approves or denies a consent request."""

    def post(self, request, pk):
        consent = get_object_or_404(
            Consent,
            pk=pk,
            owner=request.user,
            status=Consent.Status.PENDING,
        )
        form = ConsentResponseForm(request.POST)
        if form.is_valid():
            action = form.cleaned_data["action"]
            if action == "approve":
                consent.status = Consent.Status.APPROVED
                consent.can_view_medical = form.cleaned_data[
                    "can_view_medical"
                ]
                consent.can_add_medical = form.cleaned_data[
                    "can_add_medical"
                ]
                consent.can_add_services = form.cleaned_data[
                    "can_add_services"
                ]
            else:
                consent.status = Consent.Status.DENIED
            consent.responded_at = timezone.now()
            consent.save()

            try:
                from apps.notifications.tasks import (
                    notify_consent_response_task,
                )

                notify_consent_response_task.delay(str(consent.id))
            except Exception:
                pass

        return redirect("animals:detail", pk=consent.animal.pk)


class RevokeConsentView(LoginRequiredMixin, View):
    """Owner revokes a previously approved consent."""

    def post(self, request, pk):
        consent = get_object_or_404(
            Consent,
            pk=pk,
            owner=request.user,
            status=Consent.Status.APPROVED,
        )
        consent.status = Consent.Status.REVOKED
        consent.save(update_fields=["status"])

        try:
            from apps.notifications.tasks import notify_consent_revoked_task

            notify_consent_revoked_task.delay(str(consent.id))
        except Exception:
            pass

        return redirect("animals:detail", pk=consent.animal.pk)


class ConsentListView(LoginRequiredMixin, ListView):
    model = Consent
    template_name = "veterinary/consent_list.html"
    context_object_name = "consents"

    def get_queryset(self):
        user = self.request.user
        if user.profile.role in ["vet", "shop"]:
            return Consent.objects.filter(
                requester=user
            ).select_related("animal", "owner")
        return Consent.objects.filter(owner=user).select_related(
            "animal", "requester"
        )


class VetMedicalRecordListView(ValidConsentRequiredMixin, ListView):
    model = VetMedicalRecord
    template_name = "veterinary/medical_list.html"
    context_object_name = "records"

    def get_queryset(self):
        return VetMedicalRecord.objects.filter(animal=self.get_animal())

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        context["consent"] = self.consent
        return context


class VetMedicalRecordCreateView(ValidConsentRequiredMixin, CreateView):
    model = VetMedicalRecord
    form_class = VetMedicalRecordForm
    template_name = "veterinary/medical_form.html"

    def form_valid(self, form):
        animal = self.get_animal()
        form.instance.animal = animal
        form.instance.professional = self.request.user
        form.instance.consent = self.consent
        response = super().form_valid(form)

        try:
            from apps.odoo_sync.tasks import sync_medical_record_to_odoo

            sync_medical_record_to_odoo.delay(str(self.object.id))
        except Exception:
            pass

        return response

    def get_success_url(self):
        return reverse_lazy(
            "veterinary:medical-list",
            kwargs={"animal_pk": self.kwargs["animal_pk"]},
        )


class ServiceRecordCreateView(ValidConsentRequiredMixin, CreateView):
    model = ServiceRecord
    form_class = ServiceRecordForm
    template_name = "veterinary/service_form.html"

    def form_valid(self, form):
        animal = self.get_animal()
        form.instance.animal = animal
        form.instance.professional = self.request.user
        form.instance.consent = self.consent
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy(
            "veterinary:medical-list",
            kwargs={"animal_pk": self.kwargs["animal_pk"]},
        )
