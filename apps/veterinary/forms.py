from django import forms
from django.utils.translation import gettext_lazy as _

from .models import Consent, VetMedicalRecord, ServiceRecord


class ConsentRequestForm(forms.ModelForm):
    class Meta:
        model = Consent
        fields = ["message"]
        widgets = {"message": forms.Textarea(attrs={"rows": 3})}


class ConsentResponseForm(forms.Form):
    action = forms.ChoiceField(
        choices=[("approve", _("Approve")), ("deny", _("Deny"))],
    )
    can_view_medical = forms.BooleanField(required=False, initial=True)
    can_add_medical = forms.BooleanField(required=False, initial=True)
    can_add_services = forms.BooleanField(required=False, initial=True)


class VetMedicalRecordForm(forms.ModelForm):
    class Meta:
        model = VetMedicalRecord
        fields = [
            "record_type",
            "title",
            "description",
            "date_performed",
            "next_due_date",
            "attachment",
        ]
        widgets = {
            "date_performed": forms.DateInput(attrs={"type": "date"}),
            "next_due_date": forms.DateInput(attrs={"type": "date"}),
            "description": forms.Textarea(attrs={"rows": 4}),
        }


class ServiceRecordForm(forms.ModelForm):
    class Meta:
        model = ServiceRecord
        fields = [
            "service_name",
            "description",
            "date_provided",
            "cost",
            "currency",
        ]
        widgets = {
            "date_provided": forms.DateInput(attrs={"type": "date"}),
            "description": forms.Textarea(attrs={"rows": 3}),
        }


class AnimalSearchForm(forms.Form):
    """Form for vets to search for animals."""

    query = forms.CharField(
        max_length=255,
        label=_("Search"),
        help_text=_(
            "Search by microchip ID, QR token, or owner email."
        ),
    )
