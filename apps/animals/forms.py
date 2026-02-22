from django import forms
from django.utils.translation import gettext_lazy as _

from .models import (
    Animal,
    AnimalCoOwner,
    AnimalPhoto,
    Appointment,
    Vaccination,
    WeightRecord,
)


class AnimalForm(forms.ModelForm):
    class Meta:
        model = Animal
        fields = [
            "name",
            "species",
            "breed",
            "color",
            "date_of_birth",
            "weight_kg",
            "sex",
            "is_neutered",
            "microchip_id",
            "photo",
            "description",
            "medical_notes",
        ]
        widgets = {
            "date_of_birth": forms.DateInput(attrs={"type": "date"}),
            "description": forms.Textarea(attrs={"rows": 3}),
            "medical_notes": forms.Textarea(attrs={"rows": 3}),
        }


class AnimalPhotoForm(forms.ModelForm):
    class Meta:
        model = AnimalPhoto
        fields = ["image", "caption"]


class VaccinationForm(forms.ModelForm):
    class Meta:
        model = Vaccination
        fields = [
            "name",
            "date_administered",
            "next_due_date",
            "batch_number",
            "administered_by",
            "notes",
        ]
        widgets = {
            "date_administered": forms.DateInput(attrs={"type": "date"}),
            "next_due_date": forms.DateInput(attrs={"type": "date"}),
            "notes": forms.Textarea(attrs={"rows": 2}),
        }


class WeightRecordForm(forms.ModelForm):
    class Meta:
        model = WeightRecord
        fields = ["weight_kg", "date_recorded", "notes"]
        widgets = {
            "date_recorded": forms.DateInput(attrs={"type": "date"}),
        }


class AnimalCoOwnerForm(forms.Form):
    """Invite a family member to co-own an animal by email."""

    email = forms.EmailField(
        label=_("Email address"),
        help_text=_("Enter the email of the person you want to share access with."),
    )
    permission = forms.ChoiceField(
        choices=AnimalCoOwner.Permission.choices,
        initial=AnimalCoOwner.Permission.VIEW,
        label=_("Permission level"),
    )


class AppointmentForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = ["title", "description", "date", "time"]
        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "time": forms.TimeInput(attrs={"type": "time"}),
            "description": forms.Textarea(attrs={"rows": 3}),
        }
