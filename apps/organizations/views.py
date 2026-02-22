import csv
import logging
from io import StringIO

from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Sum
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django.views import View
from django.views.generic import (
    CreateView,
    DetailView,
    FormView,
    ListView,
    TemplateView,
    UpdateView,
)

from apps.accounts.models import User
from apps.animals.models import Animal
from apps.billing.models import Order, OrderItem, Product

from .forms import (
    ClientAddForm,
    ClientImportForm,
    NewSaleForm,
    OrganizationForm,
    StaffEditForm,
    StaffInviteForm,
)
from .mixins import OrgOwnerOrAdminMixin, OrgStaffMixin, OrganizationRequiredMixin
from .models import (
    Organization,
    OrganizationClient,
    OrganizationInvitation,
    OrganizationMember,
    OrganizationPlan,
    OrganizationSale,
    OrganizationSubscription,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Organization Selection / Creation
# ─────────────────────────────────────────────


class SelectOrganizationView(LoginRequiredMixin, TemplateView):
    """List user's organizations or redirect to create one."""

    template_name = "organizations/select_org.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["memberships"] = (
            self.request.user.org_memberships.filter(is_active=True)
            .select_related("organization")
            .order_by("organization__name")
        )
        return ctx


class CreateOrganizationView(LoginRequiredMixin, CreateView):
    """Create an organization — the creating user becomes OWNER."""

    model = Organization
    form_class = OrganizationForm
    template_name = "organizations/create_org.html"

    def form_valid(self, form):
        org = form.save(commit=False)
        # Auto-generate slug
        if not org.slug:
            base = slugify(org.name)
            slug, n = base, 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base}-{n}"
                n += 1
            org.slug = slug
        org.save()

        # Creator becomes OWNER
        OrganizationMember.objects.create(
            organization=org,
            user=self.request.user,
            role=OrganizationMember.Role.OWNER,
        )
        # Set as active org
        self.request.session["active_organization_id"] = str(org.pk)
        messages.success(
            self.request,
            _('Organization "%(name)s" created successfully.') % {"name": org.name},
        )
        return redirect("organizations:dashboard")


class SwitchOrganizationView(LoginRequiredMixin, View):
    """Set active organization in session."""

    def post(self, request, pk):
        get_object_or_404(
            OrganizationMember,
            organization_id=pk,
            user=request.user,
            is_active=True,
        )
        request.session["active_organization_id"] = str(pk)
        return redirect("organizations:dashboard")


# ─────────────────────────────────────────────
# Organization Dashboard
# ─────────────────────────────────────────────


class OrgDashboardView(OrgStaffMixin, TemplateView):
    """Main organization dashboard with stats."""

    template_name = "organizations/dashboard.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        org = self.request.organization

        # Counts
        ctx["client_count"] = org.clients.filter(is_active=True).count()
        ctx["staff_count"] = org.members.filter(is_active=True).count()

        # Pet count across all clients
        client_user_ids = org.clients.filter(
            is_active=True
        ).values_list("user_id", flat=True)
        ctx["pet_count"] = Animal.objects.filter(
            owner_id__in=client_user_ids, is_active=True
        ).count()

        # Recent sales
        ctx["recent_sales"] = (
            org.sales.select_related("order", "client__user", "sold_by")
            .order_by("-created_at")[:10]
        )

        # Revenue this month
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ctx["monthly_revenue"] = (
            org.sales.filter(created_at__gte=month_start).aggregate(
                total=Sum("order__total")
            )["total"]
            or 0
        )

        # Subscription
        ctx["org_subscription"] = org.active_subscription

        return ctx


# ─────────────────────────────────────────────
# Organization Settings
# ─────────────────────────────────────────────


class OrgSettingsView(OrgOwnerOrAdminMixin, TemplateView):
    template_name = "organizations/settings.html"


class OrgSettingsUpdateView(OrgOwnerOrAdminMixin, UpdateView):
    model = Organization
    form_class = OrganizationForm
    template_name = "organizations/settings_edit.html"
    success_url = reverse_lazy("organizations:settings")

    def get_object(self, queryset=None):
        return self.request.organization


# ─────────────────────────────────────────────
# Staff Management
# ─────────────────────────────────────────────


class StaffListView(OrgOwnerOrAdminMixin, ListView):
    template_name = "organizations/staff_list.html"
    context_object_name = "members"

    def get_queryset(self):
        return (
            self.request.organization.members.filter(is_active=True)
            .select_related("user", "user__profile")
            .order_by("role", "user__first_name")
        )


class StaffInviteView(OrgOwnerOrAdminMixin, FormView):
    template_name = "organizations/staff_invite.html"
    form_class = StaffInviteForm
    success_url = reverse_lazy("organizations:staff-list")

    def form_valid(self, form):
        email = form.cleaned_data["email"].lower()
        role = form.cleaned_data["role"]
        org = self.request.organization

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create invitation for future registration
            OrganizationInvitation.objects.create(
                organization=org,
                email=email,
                invite_type=OrganizationInvitation.InviteType.STAFF,
                role=role,
                invited_by=self.request.user,
                expires_at=timezone.now() + timezone.timedelta(days=7),
            )
            messages.info(
                self.request,
                _("Invitation sent to %(email)s. They will be added when they register.")
                % {"email": email},
            )
            return super().form_valid(form)

        # Check if already a member
        if org.members.filter(user=user).exists():
            messages.warning(self.request, _("This user is already a member."))
            return redirect("organizations:staff-list")

        OrganizationMember.objects.create(
            organization=org,
            user=user,
            role=role,
            invited_by=self.request.user,
        )
        messages.success(
            self.request,
            _("%(name)s added as %(role)s.")
            % {"name": user.get_full_name() or email, "role": role},
        )
        return super().form_valid(form)


class StaffEditView(OrgOwnerOrAdminMixin, UpdateView):
    model = OrganizationMember
    form_class = StaffEditForm
    template_name = "organizations/staff_edit.html"
    success_url = reverse_lazy("organizations:staff-list")

    def get_queryset(self):
        return self.request.organization.members.filter(is_active=True)


class StaffRemoveView(OrgOwnerOrAdminMixin, View):
    def post(self, request, pk):
        member = get_object_or_404(
            OrganizationMember,
            pk=pk,
            organization=request.organization,
            is_active=True,
        )
        if member.role == OrganizationMember.Role.OWNER:
            messages.error(request, _("Cannot remove the organization owner."))
        else:
            member.is_active = False
            member.save(update_fields=["is_active"])
            messages.success(
                request,
                _("%(name)s removed from the organization.")
                % {"name": member.user.get_full_name() or member.user.email},
            )
        return redirect("organizations:staff-list")


# ─────────────────────────────────────────────
# Client Management
# ─────────────────────────────────────────────


class ClientListView(OrgStaffMixin, ListView):
    template_name = "organizations/client_list.html"
    context_object_name = "clients"
    paginate_by = 25

    def get_queryset(self):
        qs = (
            self.request.organization.clients.filter(is_active=True)
            .select_related("user", "user__profile")
            .order_by("user__first_name", "user__last_name")
        )
        q = self.request.GET.get("q")
        if q:
            qs = qs.filter(
                user__email__icontains=q
            ) | qs.filter(
                user__first_name__icontains=q
            ) | qs.filter(
                user__last_name__icontains=q
            )
        return qs


class ClientAddView(OrgStaffMixin, FormView):
    template_name = "organizations/client_add.html"
    form_class = ClientAddForm
    success_url = reverse_lazy("organizations:client-list")

    def form_valid(self, form):
        email = form.cleaned_data["email"].lower()
        notes = form.cleaned_data.get("notes", "")
        org = self.request.organization

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            messages.error(
                self.request,
                _("No user found with that email. They must register first."),
            )
            return self.form_invalid(form)

        if org.clients.filter(user=user).exists():
            messages.warning(self.request, _("This user is already a client."))
            return redirect("organizations:client-list")

        OrganizationClient.objects.create(
            organization=org,
            user=user,
            registered_by=self.request.user,
            notes=notes,
        )
        messages.success(
            self.request,
            _("%(name)s added as client.") % {
                "name": user.get_full_name() or email
            },
        )
        return super().form_valid(form)


class ClientDetailView(OrgStaffMixin, DetailView):
    template_name = "organizations/client_detail.html"
    context_object_name = "client"

    def get_queryset(self):
        return self.request.organization.clients.filter(
            is_active=True
        ).select_related("user", "user__profile")

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["animals"] = Animal.objects.filter(
            owner=self.object.user, is_active=True
        ).select_related("qr_code").order_by("name")
        ctx["client_sales"] = OrganizationSale.objects.filter(
            organization=self.request.organization,
            client=self.object,
        ).select_related("order").order_by("-created_at")[:10]
        return ctx


class ClientRemoveView(OrgOwnerOrAdminMixin, View):
    def post(self, request, pk):
        client = get_object_or_404(
            OrganizationClient,
            pk=pk,
            organization=request.organization,
            is_active=True,
        )
        client.is_active = False
        client.save(update_fields=["is_active"])
        messages.success(
            request,
            _("Client removed from the organization."),
        )
        return redirect("organizations:client-list")


class ClientImportView(OrgOwnerOrAdminMixin, FormView):
    template_name = "organizations/client_import.html"
    form_class = ClientImportForm
    success_url = reverse_lazy("organizations:client-list")

    def form_valid(self, form):
        csv_file = form.cleaned_data["csv_file"]
        org = self.request.organization
        user = self.request.user

        try:
            content = csv_file.read().decode("utf-8")
        except UnicodeDecodeError:
            messages.error(self.request, _("File must be UTF-8 encoded."))
            return self.form_invalid(form)

        reader = csv.DictReader(StringIO(content))
        created, skipped, errors = 0, 0, []

        for row in reader:
            email = row.get("email", "").strip().lower()
            if not email:
                continue
            try:
                target_user = User.objects.get(email=email)
            except User.DoesNotExist:
                errors.append(email)
                skipped += 1
                continue

            _, was_created = OrganizationClient.objects.get_or_create(
                organization=org,
                user=target_user,
                defaults={
                    "registered_by": user,
                    "notes": row.get("notes", ""),
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        msg = _("Import complete: %(created)d added, %(skipped)d skipped.") % {
            "created": created,
            "skipped": skipped,
        }
        if errors:
            msg += _(" Emails not found: %(emails)s") % {
                "emails": ", ".join(errors[:10])
            }
        messages.info(self.request, msg)
        return super().form_valid(form)


# ─────────────────────────────────────────────
# Organization Billing
# ─────────────────────────────────────────────


class OrgPricingView(OrganizationRequiredMixin, ListView):
    template_name = "organizations/org_pricing.html"
    context_object_name = "plans"

    def get_queryset(self):
        return OrganizationPlan.objects.filter(is_active=True)


class OrgSubscribeView(OrgOwnerOrAdminMixin, View):
    """Create Stripe checkout for org subscription."""

    def post(self, request, slug):
        plan = get_object_or_404(OrganizationPlan, slug=slug, is_active=True)
        org = request.organization

        from .stripe_utils import create_org_subscription_checkout

        success_url = request.build_absolute_uri(
            reverse("organizations:org-subscription")
        ) + "?session_id={CHECKOUT_SESSION_ID}"
        cancel_url = request.build_absolute_uri(
            reverse("organizations:org-pricing")
        )

        session = create_org_subscription_checkout(
            org, plan, success_url, cancel_url
        )
        if session:
            return redirect(session.url)

        messages.error(request, _("Error creating checkout session."))
        return redirect("organizations:org-pricing")


class OrgSubscriptionView(OrganizationRequiredMixin, TemplateView):
    template_name = "organizations/org_subscription.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["subscription"] = self.request.organization.active_subscription
        return ctx


# ─────────────────────────────────────────────
# Sales (orders on behalf of clients)
# ─────────────────────────────────────────────


class SalesListView(OrgStaffMixin, ListView):
    template_name = "organizations/sales_list.html"
    context_object_name = "sales"
    paginate_by = 25

    def get_queryset(self):
        return (
            self.request.organization.sales.select_related(
                "order", "client__user", "sold_by"
            )
            .order_by("-created_at")
        )

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ctx["monthly_total"] = (
            self.request.organization.sales.filter(
                created_at__gte=month_start
            ).aggregate(total=Sum("order__total"))["total"]
            or 0
        )
        return ctx


class NewSaleView(OrgStaffMixin, TemplateView):
    """Select client + products to create a sale."""

    template_name = "organizations/new_sale.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["clients"] = (
            self.request.organization.clients.filter(is_active=True)
            .select_related("user")
            .order_by("user__first_name")
        )
        ctx["products"] = Product.objects.filter(is_active=True, stock__gt=0)
        return ctx

    def post(self, request):
        """Create order on behalf of client."""
        org = request.organization
        client_id = request.POST.get("client_id")
        product_items = request.POST.getlist("product_ids")

        client = get_object_or_404(
            OrganizationClient, pk=client_id, organization=org, is_active=True
        )

        if not product_items:
            messages.error(request, _("Select at least one product."))
            return redirect("organizations:new-sale")

        # Create order
        order = Order.objects.create(
            user=client.user,
            organization=org,
            status=Order.Status.PENDING,
            shipping_name=client.user.get_full_name(),
            shipping_address=client.user.profile.address or "",
            shipping_city=client.user.profile.city or "",
            shipping_zip="",
            total=0,
        )

        total = 0
        for pid in product_items:
            product = Product.objects.filter(pk=pid, is_active=True).first()
            if product:
                qty = int(request.POST.get(f"qty_{pid}", 1))
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=qty,
                    unit_price=product.price,
                )
                total += product.price * qty

        order.total = total
        order.save(update_fields=["total"])

        # Create Stripe checkout
        from .stripe_utils import create_org_product_checkout

        success_url = request.build_absolute_uri(
            reverse("organizations:sale-detail", args=[order.pk])
        )
        cancel_url = request.build_absolute_uri(
            reverse("organizations:new-sale")
        )

        session = create_org_product_checkout(
            org, order, request.user, success_url, cancel_url
        )
        if session:
            order.stripe_checkout_session_id = session.id
            order.save(update_fields=["stripe_checkout_session_id"])
            return redirect(session.url)

        messages.error(request, _("Error creating checkout session."))
        return redirect("organizations:new-sale")


class SaleDetailView(OrgStaffMixin, DetailView):
    template_name = "organizations/sale_detail.html"
    context_object_name = "sale"

    def get_queryset(self):
        return OrganizationSale.objects.filter(
            organization=self.request.organization
        ).select_related("order", "client__user", "sold_by")

    def get_object(self, queryset=None):
        """Fallback: also allow viewing by Order pk if no sale yet."""
        try:
            return super().get_object(queryset)
        except Exception:
            order = get_object_or_404(
                Order, pk=self.kwargs["pk"], organization=self.request.organization
            )
            return order


# ─────────────────────────────────────────────
# Bulk Operations
# ─────────────────────────────────────────────


class BulkLabelView(OrgStaffMixin, TemplateView):
    """Select multiple client pets for bulk label generation."""

    template_name = "organizations/bulk_labels.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        org = self.request.organization
        client_user_ids = org.clients.filter(
            is_active=True
        ).values_list("user_id", flat=True)
        ctx["animals"] = (
            Animal.objects.filter(
                owner_id__in=client_user_ids, is_active=True
            )
            .select_related("owner", "qr_code")
            .order_by("owner__first_name", "name")
        )
        return ctx


class BulkLabelGenerateView(OrgStaffMixin, View):
    """Generate a multi-label PDF for selected animals."""

    def post(self, request):
        animal_ids = request.POST.getlist("animal_ids")
        label_type = request.POST.get("label_type", "standard")

        if not animal_ids:
            messages.error(request, _("Select at least one pet."))
            return redirect("organizations:bulk-labels")

        from .bulk import generate_bulk_labels_pdf

        animals = (
            Animal.objects.filter(pk__in=animal_ids)
            .select_related("qr_code")
        )

        animals_with_qr = []
        for animal in animals:
            try:
                qr = animal.qr_code
                animals_with_qr.append((animal, qr))
            except Animal.qr_code.RelatedObjectDoesNotExist:
                continue

        if not animals_with_qr:
            messages.error(request, _("No pets with QR codes found."))
            return redirect("organizations:bulk-labels")

        pdf_content = generate_bulk_labels_pdf(animals_with_qr, label_type)
        response = HttpResponse(
            pdf_content.read(), content_type="application/pdf"
        )
        org_slug = request.organization.slug
        response["Content-Disposition"] = (
            f'attachment; filename="labels_{org_slug}.pdf"'
        )
        return response


# ─────────────────────────────────────────────
# Invitation Acceptance
# ─────────────────────────────────────────────


class AcceptInvitationView(LoginRequiredMixin, View):
    """Accept an organization invitation via token."""

    def get(self, request, token):
        invitation = get_object_or_404(
            OrganizationInvitation, token=token
        )

        if not invitation.is_pending:
            messages.error(request, _("This invitation has expired or was already used."))
            return redirect("organizations:select-org")

        if invitation.email.lower() != request.user.email.lower():
            messages.error(
                request,
                _("This invitation was sent to a different email address."),
            )
            return redirect("organizations:select-org")

        org = invitation.organization

        if invitation.invite_type == OrganizationInvitation.InviteType.STAFF:
            OrganizationMember.objects.get_or_create(
                organization=org,
                user=request.user,
                defaults={
                    "role": invitation.role or OrganizationMember.Role.STAFF,
                    "invited_by": invitation.invited_by,
                },
            )
        else:
            OrganizationClient.objects.get_or_create(
                organization=org,
                user=request.user,
                defaults={
                    "registered_by": invitation.invited_by,
                },
            )

        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_at"])

        request.session["active_organization_id"] = str(org.pk)
        messages.success(
            request,
            _('You have joined "%(org)s".') % {"org": org.name},
        )
        return redirect("organizations:dashboard")
