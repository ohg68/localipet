from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import (
    CreateView,
    DetailView,
    ListView,
    TemplateView,
)

from apps.core.mixins import OwnerRequiredMixin

from .forms import FinderContactForm
from .models import QRCode, ScanLog, FinderMessage
from .qr import generate_qr_image


# --- Public views (no auth required) ---


class PublicScanView(DetailView):
    """Public page shown when someone scans a QR code. No auth required."""

    model = QRCode
    template_name = "scanning/public_profile.html"
    context_object_name = "qr_code"

    def get_object(self, queryset=None):
        qr_code = get_object_or_404(
            QRCode.objects.select_related("animal"),
            token=self.kwargs["token"],
            is_active=True,
        )
        self._log_scan(qr_code)
        return qr_code

    def _log_scan(self, qr_code):
        ip = self._get_client_ip()
        user_agent = self.request.META.get("HTTP_USER_AGENT", "")

        scan_log = ScanLog.objects.create(
            qr_code=qr_code,
            ip_address=ip,
            user_agent=user_agent,
        )

        # Trigger notification asynchronously
        try:
            from apps.notifications.tasks import notify_scan_task

            notify_scan_task.delay(str(scan_log.id))
        except Exception:
            pass

    def _get_client_ip(self):
        x_forwarded_for = self.request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return self.request.META.get("REMOTE_ADDR")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["animal"] = self.object.animal
        context["contact_form"] = FinderContactForm()
        return context


class FinderContactView(CreateView):
    """Form where a finder can send a message to the owner."""

    model = FinderMessage
    form_class = FinderContactForm
    template_name = "scanning/contact_owner_form.html"

    def get_qr_code(self):
        return get_object_or_404(
            QRCode.objects.select_related("animal"),
            token=self.kwargs["token"],
            is_active=True,
        )

    def form_valid(self, form):
        qr_code = self.get_qr_code()
        form.instance.qr_code = qr_code
        response = super().form_valid(form)

        try:
            from apps.notifications.tasks import notify_finder_message_task

            notify_finder_message_task.delay(str(self.object.id))
        except Exception:
            pass

        return response

    def get_success_url(self):
        return f"/s/{self.kwargs['token']}/contact/success/"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["qr_code"] = self.get_qr_code()
        context["animal"] = context["qr_code"].animal
        return context


class FinderSuccessView(TemplateView):
    template_name = "scanning/finder_success.html"


# --- Authenticated owner views ---


class ScanHistoryView(LoginRequiredMixin, ListView):
    model = ScanLog
    template_name = "scanning/scan_history.html"
    context_object_name = "scans"
    paginate_by = 20

    def get_queryset(self):
        from apps.animals.models import Animal

        animal = get_object_or_404(
            Animal, pk=self.kwargs["animal_pk"], owner=self.request.user
        )
        if hasattr(animal, "qr_code"):
            return animal.qr_code.scans.all()
        return ScanLog.objects.none()


class FinderMessagesView(LoginRequiredMixin, ListView):
    model = FinderMessage
    template_name = "scanning/finder_messages.html"
    context_object_name = "messages"
    paginate_by = 20

    def get_queryset(self):
        from apps.animals.models import Animal

        animal = get_object_or_404(
            Animal, pk=self.kwargs["animal_pk"], owner=self.request.user
        )
        if hasattr(animal, "qr_code"):
            return animal.qr_code.finder_messages.all()
        return FinderMessage.objects.none()


class MarkMessageReadView(LoginRequiredMixin, View):
    def post(self, request, message_pk):
        message = get_object_or_404(
            FinderMessage,
            pk=message_pk,
            qr_code__animal__owner=request.user,
        )
        message.is_read = True
        message.save(update_fields=["is_read"])
        return redirect(
            "scanning:messages", animal_pk=message.qr_code.animal.pk
        )


class QRCodeView(LoginRequiredMixin, DetailView):
    model = QRCode
    template_name = "scanning/qr_view.html"

    def get_object(self, queryset=None):
        from apps.animals.models import Animal

        animal = get_object_or_404(
            Animal, pk=self.kwargs["animal_pk"], owner=self.request.user
        )
        return get_object_or_404(QRCode, animal=animal)


class QRDownloadView(LoginRequiredMixin, View):
    def get(self, request, animal_pk):
        from apps.animals.models import Animal

        animal = get_object_or_404(Animal, pk=animal_pk, owner=request.user)
        qr_code = get_object_or_404(QRCode, animal=animal)

        if not qr_code.qr_image:
            image = generate_qr_image(qr_code.get_scan_url())
            qr_code.qr_image.save(
                f"qr_{qr_code.token}.png", image, save=True
            )

        response = HttpResponse(
            qr_code.qr_image.read(), content_type="image/png"
        )
        response[
            "Content-Disposition"
        ] = f'attachment; filename="qr_{animal.name}.png"'
        return response


class QRRegenerateView(LoginRequiredMixin, View):
    def post(self, request, animal_pk):
        from apps.animals.models import Animal
        from .models import generate_scan_token

        animal = get_object_or_404(Animal, pk=animal_pk, owner=request.user)
        qr_code = get_object_or_404(QRCode, animal=animal)

        qr_code.token = generate_scan_token()
        image = generate_qr_image(qr_code.get_scan_url())
        qr_code.qr_image.save(f"qr_{qr_code.token}.png", image, save=True)
        qr_code.save()

        return redirect("scanning:qr-view", animal_pk=animal.pk)


class LabelPreviewView(LoginRequiredMixin, DetailView):
    template_name = "scanning/label_preview.html"

    def get_object(self, queryset=None):
        from apps.animals.models import Animal

        return get_object_or_404(
            Animal, pk=self.kwargs["animal_pk"], owner=self.request.user
        )


class LabelDownloadView(LoginRequiredMixin, View):
    def get(self, request, animal_pk):
        from apps.animals.models import Animal
        from .labels import generate_label_pdf

        animal = get_object_or_404(Animal, pk=animal_pk, owner=request.user)
        qr_code = get_object_or_404(QRCode, animal=animal)

        label_type = request.GET.get("type", "standard")
        pdf_content = generate_label_pdf(animal, qr_code, label_type)

        response = HttpResponse(
            pdf_content.read(), content_type="application/pdf"
        )
        response[
            "Content-Disposition"
        ] = f'attachment; filename="label_{animal.name}.pdf"'
        return response
