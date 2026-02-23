"""Compliance views: legal pages, GDPR rights, cookie consent."""

import json
import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views import View
from django.views.generic import TemplateView

from .models import AuditLog, CookieConsent, LegalConsent, LegalDocument
from .utils import export_user_data, get_client_ip, log_audit, record_legal_consent

logger = logging.getLogger(__name__)


# ── Legal Pages ─────────────────────────────────────────────────────────


class PrivacyPolicyView(TemplateView):
    template_name = "legal/privacy_policy.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["active_doc"] = LegalDocument.get_active(
            LegalDocument.DocType.PRIVACY_POLICY
        )
        ctx["contact_email"] = "privacidad@localipet.com"
        return ctx


class TermsOfServiceView(TemplateView):
    template_name = "legal/terms_of_service.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["active_doc"] = LegalDocument.get_active(
            LegalDocument.DocType.TERMS_OF_SERVICE
        )
        return ctx


class CookiePolicyView(TemplateView):
    template_name = "legal/cookie_policy.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["active_doc"] = LegalDocument.get_active(
            LegalDocument.DocType.COOKIE_POLICY
        )
        return ctx


class RefundPolicyView(TemplateView):
    template_name = "legal/refund_policy.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["active_doc"] = LegalDocument.get_active(
            LegalDocument.DocType.REFUND_POLICY
        )
        return ctx


# ── Cookie Consent API ──────────────────────────────────────────────────


class CookieConsentView(View):
    """Accept/update cookie preferences via POST (AJAX)."""

    def post(self, request):
        try:
            data = json.loads(request.body) if request.body else {}
        except json.JSONDecodeError:
            data = {}

        analytics = data.get("analytics", False)
        marketing = data.get("marketing", False)

        CookieConsent.objects.create(
            session_key=request.session.session_key or "",
            user=request.user if request.user.is_authenticated else None,
            essential=True,
            analytics=bool(analytics),
            marketing=bool(marketing),
            ip_address=get_client_ip(request),
        )

        # Set cookie to remember preference
        response = JsonResponse({"status": "ok"})
        response.set_cookie(
            "cookie_consent",
            "accepted",
            max_age=365 * 24 * 60 * 60,  # 1 year
            httponly=False,
            samesite="Lax",
        )
        return response


# ── GDPR User Rights ───────────────────────────────────────────────────


class DataPrivacyDashboardView(LoginRequiredMixin, TemplateView):
    """User's privacy dashboard: view consents, export/delete data."""
    template_name = "legal/data_privacy_dashboard.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        ctx["consents"] = (
            LegalConsent.objects.filter(user=user, consent_given=True)
            .select_related("document")
            .order_by("-created_at")
        )
        ctx["recent_audit"] = (
            AuditLog.objects.filter(user=user)
            .order_by("-created_at")[:20]
        )
        return ctx


class DataExportView(LoginRequiredMixin, View):
    """GDPR Art. 20 - Data Portability: export user data as JSON."""

    def post(self, request):
        user = request.user
        data = export_user_data(user)

        log_audit(
            request,
            AuditLog.Action.DATA_EXPORT,
            description=f"Data export requested by {user.email}",
        )

        response = JsonResponse(data, json_dumps_params={"indent": 2, "ensure_ascii": False})
        response["Content-Disposition"] = (
            f'attachment; filename="localipet_data_{user.username}.json"'
        )
        return response


class DataDeleteView(LoginRequiredMixin, TemplateView):
    """GDPR Art. 17 - Right to Erasure: request account deletion."""
    template_name = "legal/data_delete_confirm.html"


class DataDeleteConfirmView(LoginRequiredMixin, View):
    """Process the actual account deletion."""

    def post(self, request):
        user = request.user
        email = user.email

        # Log before deletion
        log_audit(
            request,
            AuditLog.Action.DATA_DELETE,
            description=f"Account deletion confirmed by {email}",
            metadata={"email": email, "username": user.username},
        )

        # Anonymize audit logs (keep for compliance but remove PII)
        AuditLog.objects.filter(user=user).update(user=None)

        # Delete the user (cascades to profile, consents, etc.)
        user.delete()

        # Logout and redirect
        logout(request)
        messages.success(
            request,
            _("Your account and all associated data have been permanently deleted."),
        )
        return redirect("accounts:login")


class WithdrawConsentView(LoginRequiredMixin, View):
    """GDPR Art. 7(3) - Withdraw consent for a specific document."""

    def post(self, request, consent_id):
        try:
            consent = LegalConsent.objects.get(
                id=consent_id, user=request.user, consent_given=True
            )
        except LegalConsent.DoesNotExist:
            messages.error(request, _("Consent record not found."))
            return redirect("compliance:privacy-dashboard")

        consent.consent_given = False
        consent.withdrawn_at = timezone.now()
        consent.save()

        log_audit(
            request,
            AuditLog.Action.CONSENT_WITHDRAWN,
            description=f"Withdrew consent for {consent.document}",
            metadata={"document_id": str(consent.document.id)},
        )

        messages.success(
            request,
            _("Your consent has been withdrawn. Some features may be affected."),
        )
        return redirect("compliance:privacy-dashboard")


class AcceptLegalDocumentView(LoginRequiredMixin, View):
    """Record user acceptance of a legal document."""

    def post(self, request, doc_type):
        document = LegalDocument.get_active(doc_type)
        if not document:
            messages.error(request, _("Document not found."))
            return redirect("compliance:privacy-dashboard")

        record_legal_consent(request, document, consent_given=True)
        messages.success(request, _("Thank you for accepting the document."))

        next_url = request.POST.get("next", reverse("compliance:privacy-dashboard"))
        return redirect(next_url)
