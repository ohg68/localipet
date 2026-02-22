from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.utils import timezone
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

from .forms import AnimalForm, AnimalPhotoForm
from .models import Animal, AnimalPhoto


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
        return context


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
