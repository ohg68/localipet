from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.utils.translation import gettext_lazy as _

from .models import User, Profile


class OwnerRegistrationForm(UserCreationForm):
    first_name = forms.CharField(
        max_length=150, required=True, label=_("First name")
    )
    last_name = forms.CharField(
        max_length=150, required=True, label=_("Last name")
    )

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "password1",
            "password2",
        ]


class VetRegistrationForm(UserCreationForm):
    first_name = forms.CharField(
        max_length=150, required=True, label=_("First name")
    )
    last_name = forms.CharField(
        max_length=150, required=True, label=_("Last name")
    )
    business_name = forms.CharField(
        max_length=255, required=True, label=_("Business name")
    )
    license_number = forms.CharField(
        max_length=100, required=True, label=_("License number")
    )
    role = forms.ChoiceField(
        choices=[("vet", _("Veterinarian")), ("shop", _("Pet Shop"))],
        label=_("Account type"),
    )

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "password1",
            "password2",
        ]


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = [
            "phone",
            "address",
            "city",
            "country",
            "avatar",
            "language_preference",
            "email_on_scan",
            "email_on_message",
            "email_on_consent_request",
        ]
