from django import forms
from django.utils.translation import gettext_lazy as _

from .models import Order


class ShippingAddressForm(forms.Form):
    """Shipping address for product orders."""

    shipping_name = forms.CharField(
        max_length=200,
        label=_("Full name"),
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
    shipping_address = forms.CharField(
        max_length=500,
        label=_("Address"),
        widget=forms.Textarea(attrs={"class": "form-control", "rows": 2}),
    )
    shipping_city = forms.CharField(
        max_length=100,
        label=_("City"),
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
    shipping_state = forms.CharField(
        max_length=100,
        label=_("State"),
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
    shipping_zip = forms.CharField(
        max_length=20,
        label=_("ZIP code"),
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
    shipping_country = forms.CharField(
        max_length=100,
        label=_("Country"),
        initial="México",
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
