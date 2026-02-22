from django import forms
from django.utils.translation import gettext_lazy as _

from .models import Organization, OrganizationMember


class OrganizationForm(forms.ModelForm):
    """Form for creating / editing an organization."""

    class Meta:
        model = Organization
        fields = [
            "name",
            "org_type",
            "logo",
            "description",
            "phone",
            "email",
            "website",
            "address",
            "city",
            "state",
            "zip_code",
            "country",
            "rfc",
            "razon_social",
            "regimen_fiscal",
        ]
        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
            "address": forms.Textarea(attrs={"rows": 2}),
        }


class StaffInviteForm(forms.Form):
    """Invite a staff member to the organization."""

    email = forms.EmailField(label=_("Email"))
    role = forms.ChoiceField(
        choices=[
            c
            for c in OrganizationMember.Role.choices
            if c[0] != "owner"  # cannot invite as owner
        ],
        label=_("Role"),
    )


class StaffEditForm(forms.ModelForm):
    """Edit a staff member's role."""

    class Meta:
        model = OrganizationMember
        fields = ["role"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Exclude 'owner' from editable roles
        self.fields["role"].choices = [
            c
            for c in OrganizationMember.Role.choices
            if c[0] != "owner"
        ]


class ClientAddForm(forms.Form):
    """Add an existing user as a client of the organization."""

    email = forms.EmailField(
        label=_("Client email"),
        help_text=_("The pet owner must already have a Localipet account."),
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={"rows": 2}),
        label=_("Internal notes"),
    )


class ClientImportForm(forms.Form):
    """Bulk import clients from CSV file."""

    csv_file = forms.FileField(
        label=_("CSV file"),
        help_text=_(
            "CSV with columns: email, first_name, last_name, phone. "
            "Users must already have a Localipet account."
        ),
    )


class NewSaleForm(forms.Form):
    """Form for creating a new sale on behalf of a client."""

    client = forms.UUIDField(
        label=_("Client"),
        widget=forms.HiddenInput(),
    )
    animal = forms.UUIDField(
        label=_("Animal"),
        required=False,
        widget=forms.HiddenInput(),
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={"rows": 2}),
        label=_("Notes"),
    )
