from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views import View
from django.views.generic import (
    CreateView,
    DeleteView,
    DetailView,
    ListView,
    TemplateView,
    UpdateView,
)

from apps.core.mixins import OwnerRequiredMixin

from .forms import (
    AnimalCoOwnerForm,
    AnimalForm,
    AnimalPhotoForm,
    AppointmentForm,
    VaccinationForm,
    WeightRecordForm,
)
from .models import (
    Animal,
    AnimalCoOwner,
    AnimalPhoto,
    Appointment,
    Vaccination,
    WeightRecord,
)


# ── Dashboard ────────────────────────────────────────


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "animals/dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        animals_qs = user.animals.filter(
            is_active=True
        ).prefetch_related("qr_code")
        context["animals"] = animals_qs
        context["animals_count"] = animals_qs.count()
        context["lost_count"] = animals_qs.filter(is_lost=True).count()
        # Recent scan activity
        from apps.scanning.models import ScanLog

        animal_ids = animals_qs.values_list("id", flat=True)
        context["recent_scans"] = (
            ScanLog.objects.filter(qr_code__animal_id__in=animal_ids)
            .select_related("qr_code__animal")
            .order_by("-created_at")[:10]
        )
        # Unread messages
        from apps.scanning.models import FinderMessage

        context["unread_messages"] = FinderMessage.objects.filter(
            qr_code__animal_id__in=animal_ids, is_read=False
        ).count()
        # Unread notifications
        context["unread_notifications"] = user.notifications.filter(
            is_read=False
        ).count()
        # Upcoming appointments
        today = timezone.now().date()
        context["upcoming_appointments"] = (
            Appointment.objects.filter(
                owner=user,
                date__gte=today,
                status__in=["scheduled", "confirmed"],
            )
            .select_related("animal")
            .order_by("date", "time")[:5]
        )
        # Overdue vaccinations
        context["overdue_vaccinations"] = (
            Vaccination.objects.filter(
                animal__in=animals_qs,
                next_due_date__lt=today,
                reminder_sent=False,
            )
            .select_related("animal")
            .order_by("next_due_date")[:5]
        )
        return context


# ── Animal CRUD ──────────────────────────────────────


class AnimalListView(LoginRequiredMixin, ListView):
    model = Animal
    template_name = "animals/animal_list.html"
    context_object_name = "animals"
    paginate_by = 12

    def get_queryset(self):
        return (
            self.request.user.animals.filter(is_active=True)
            .prefetch_related("qr_code", "photos")
            .order_by("-created_at")
        )


class AnimalDetailView(OwnerRequiredMixin, DetailView):
    model = Animal
    template_name = "animals/animal_detail.html"
    context_object_name = "animal"

    def get_queryset(self):
        return Animal.objects.select_related("owner__profile").prefetch_related(
            "qr_code", "photos"
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        animal = self.object
        context["photos"] = animal.photos.all()
        try:
            qr_code = animal.qr_code
            context["qr_code"] = qr_code
            context["recent_scans"] = qr_code.scans.order_by(
                "-created_at"
            )[:5]
        except Animal.qr_code.RelatedObjectDoesNotExist:
            pass
        context["vet_records"] = animal.vet_records.select_related(
            "professional"
        ).order_by("-date_performed")[:5]
        context["vaccinations"] = animal.vaccinations.all()[:5]
        context["weight_records"] = animal.weight_records.all()[:5]
        context["co_owners"] = animal.co_owners.select_related("user")
        context["appointments"] = animal.appointments.filter(
            date__gte=timezone.now().date(),
            status__in=["scheduled", "confirmed"],
        ).order_by("date", "time")[:3]
        return context


class AnimalCreateView(LoginRequiredMixin, CreateView):
    model = Animal
    form_class = AnimalForm
    template_name = "animals/animal_form.html"

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy("animals:detail", kwargs={"pk": self.object.pk})


class AnimalUpdateView(OwnerRequiredMixin, UpdateView):
    model = Animal
    form_class = AnimalForm
    template_name = "animals/animal_form.html"

    def get_success_url(self):
        return reverse_lazy("animals:detail", kwargs={"pk": self.object.pk})


class AnimalDeleteView(OwnerRequiredMixin, DeleteView):
    model = Animal
    template_name = "animals/animal_confirm_delete.html"
    success_url = reverse_lazy("animals:list")

    def form_valid(self, form):
        # Soft delete
        self.object.is_active = False
        self.object.save(update_fields=["is_active"])
        return HttpResponseRedirect(self.success_url)


class ToggleLostStatusView(OwnerRequiredMixin, View):
    def post(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk, owner=request.user)
        animal.is_lost = not animal.is_lost
        if animal.is_lost:
            animal.lost_since = timezone.now()
        else:
            animal.lost_since = None
        animal.save(update_fields=["is_lost", "lost_since"])
        return redirect("animals:detail", pk=animal.pk)

    def get_object(self, queryset=None):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )


class AnimalPhotoUploadView(LoginRequiredMixin, CreateView):
    model = AnimalPhoto
    form_class = AnimalPhotoForm
    template_name = "animals/photo_upload.html"

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def form_valid(self, form):
        form.instance.animal = self.get_animal()
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy(
            "animals:detail", kwargs={"pk": self.kwargs["pk"]}
        )


# ── Vaccination Calendar ─────────────────────────────


class VaccinationListView(LoginRequiredMixin, ListView):
    """List all vaccinations for a specific animal."""

    model = Vaccination
    template_name = "animals/vaccination_list.html"
    context_object_name = "vaccinations"
    paginate_by = 20

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def get_queryset(self):
        return self.get_animal().vaccinations.all()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        return context


class VaccinationCreateView(LoginRequiredMixin, CreateView):
    model = Vaccination
    form_class = VaccinationForm
    template_name = "animals/vaccination_form.html"

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def form_valid(self, form):
        form.instance.animal = self.get_animal()
        messages.success(self.request, _("Vaccination record added."))
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        return context

    def get_success_url(self):
        return reverse("animals:vaccination-list", kwargs={"pk": self.kwargs["pk"]})


class VaccinationUpdateView(LoginRequiredMixin, UpdateView):
    model = Vaccination
    form_class = VaccinationForm
    template_name = "animals/vaccination_form.html"
    pk_url_kwarg = "vacc_pk"

    def get_queryset(self):
        return Vaccination.objects.filter(animal__owner=self.request.user)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.object.animal
        return context

    def get_success_url(self):
        return reverse(
            "animals:vaccination-list",
            kwargs={"pk": self.object.animal.pk},
        )


class VaccinationDeleteView(LoginRequiredMixin, DeleteView):
    model = Vaccination
    pk_url_kwarg = "vacc_pk"
    template_name = "animals/vaccination_confirm_delete.html"

    def get_queryset(self):
        return Vaccination.objects.filter(animal__owner=self.request.user)

    def get_success_url(self):
        return reverse(
            "animals:vaccination-list",
            kwargs={"pk": self.object.animal.pk},
        )


# ── Weight Tracking ──────────────────────────────────


class WeightHistoryView(LoginRequiredMixin, ListView):
    """Weight history with data for chart display."""

    model = WeightRecord
    template_name = "animals/weight_history.html"
    context_object_name = "weight_records"
    paginate_by = 30

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def get_queryset(self):
        return self.get_animal().weight_records.all()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        animal = self.get_animal()
        context["animal"] = animal
        # Chart data (JSON-friendly)
        all_records = animal.weight_records.order_by("date_recorded").values_list(
            "date_recorded", "weight_kg"
        )
        context["chart_labels"] = [
            r[0].isoformat() for r in all_records
        ]
        context["chart_data"] = [float(r[1]) for r in all_records]
        return context


class WeightRecordCreateView(LoginRequiredMixin, CreateView):
    model = WeightRecord
    form_class = WeightRecordForm
    template_name = "animals/weight_form.html"

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def form_valid(self, form):
        animal = self.get_animal()
        form.instance.animal = animal
        # Also update the animal's current weight
        animal.weight_kg = form.cleaned_data["weight_kg"]
        animal.save(update_fields=["weight_kg"])
        messages.success(self.request, _("Weight recorded."))
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        return context

    def get_success_url(self):
        return reverse("animals:weight-history", kwargs={"pk": self.kwargs["pk"]})


class WeightChartDataView(LoginRequiredMixin, View):
    """Return JSON weight data for HTMX/Chart.js."""

    def get(self, request, pk):
        animal = get_object_or_404(Animal, pk=pk, owner=request.user)
        records = animal.weight_records.order_by("date_recorded").values_list(
            "date_recorded", "weight_kg"
        )
        return JsonResponse({
            "labels": [r[0].isoformat() for r in records],
            "data": [float(r[1]) for r in records],
        })


# ── Family / Shared Access ───────────────────────────


class CoOwnerListView(LoginRequiredMixin, ListView):
    """List co-owners of a specific animal."""

    model = AnimalCoOwner
    template_name = "animals/co_owner_list.html"
    context_object_name = "co_owners"

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def get_queryset(self):
        return self.get_animal().co_owners.select_related("user")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        context["form"] = AnimalCoOwnerForm()
        return context


class CoOwnerAddView(LoginRequiredMixin, View):
    """Add a co-owner by email."""

    def post(self, request, pk):
        from apps.accounts.models import User

        animal = get_object_or_404(Animal, pk=pk, owner=request.user)
        form = AnimalCoOwnerForm(request.POST)
        if not form.is_valid():
            messages.error(request, _("Please enter a valid email."))
            return redirect("animals:co-owner-list", pk=pk)

        email = form.cleaned_data["email"]
        permission = form.cleaned_data["permission"]

        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(
                request,
                _("No user found with that email. They must register first."),
            )
            return redirect("animals:co-owner-list", pk=pk)

        if target_user == request.user:
            messages.warning(request, _("You can't share with yourself."))
            return redirect("animals:co-owner-list", pk=pk)

        _, created = AnimalCoOwner.objects.get_or_create(
            animal=animal,
            user=target_user,
            defaults={
                "permission": permission,
                "invited_by": request.user,
            },
        )

        if created:
            messages.success(
                request,
                _("Access shared with %(name)s.")
                % {"name": target_user.get_full_name() or email},
            )
        else:
            messages.info(request, _("This person already has access."))

        return redirect("animals:co-owner-list", pk=pk)


class CoOwnerRemoveView(LoginRequiredMixin, View):
    """Remove a co-owner."""

    def post(self, request, pk, co_owner_pk):
        animal = get_object_or_404(Animal, pk=pk, owner=request.user)
        co_owner = get_object_or_404(
            AnimalCoOwner, pk=co_owner_pk, animal=animal
        )
        co_owner.delete()
        messages.success(request, _("Access revoked."))
        return redirect("animals:co-owner-list", pk=pk)


# ── Appointments ─────────────────────────────────────


class AppointmentListView(LoginRequiredMixin, ListView):
    """List appointments for the logged-in user."""

    model = Appointment
    template_name = "animals/appointment_list.html"
    context_object_name = "appointments"
    paginate_by = 20

    def get_queryset(self):
        return (
            Appointment.objects.filter(owner=self.request.user)
            .select_related("animal", "vet")
            .order_by("date", "time")
        )


class AppointmentCreateView(LoginRequiredMixin, CreateView):
    model = Appointment
    form_class = AppointmentForm
    template_name = "animals/appointment_form.html"

    def get_animal(self):
        return get_object_or_404(
            Animal, pk=self.kwargs["pk"], owner=self.request.user
        )

    def form_valid(self, form):
        form.instance.animal = self.get_animal()
        form.instance.owner = self.request.user
        messages.success(self.request, _("Appointment scheduled."))
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.get_animal()
        return context

    def get_success_url(self):
        return reverse("animals:appointment-list")


class AppointmentUpdateView(LoginRequiredMixin, UpdateView):
    model = Appointment
    form_class = AppointmentForm
    template_name = "animals/appointment_form.html"
    pk_url_kwarg = "appt_pk"

    def get_queryset(self):
        return Appointment.objects.filter(owner=self.request.user)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.object.animal
        return context

    def get_success_url(self):
        return reverse("animals:appointment-list")


class AppointmentCancelView(LoginRequiredMixin, View):
    """Cancel an appointment."""

    def post(self, request, appt_pk):
        appointment = get_object_or_404(
            Appointment, pk=appt_pk, owner=request.user
        )
        appointment.status = Appointment.Status.CANCELED
        appointment.save(update_fields=["status"])
        messages.info(request, _("Appointment canceled."))
        return redirect("animals:appointment-list")


# ── Public Lost Pet Page ─────────────────────────────


class LostPetsPublicView(ListView):
    """Public directory of lost pets in the platform."""

    model = Animal
    template_name = "animals/lost_pets_public.html"
    context_object_name = "lost_animals"
    paginate_by = 12

    def get_queryset(self):
        return (
            Animal.objects.filter(is_lost=True, is_active=True)
            .select_related("owner")
            .order_by("-lost_since")
        )
