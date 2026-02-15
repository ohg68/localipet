from django import forms

from .models import FinderMessage


class FinderContactForm(forms.ModelForm):
    class Meta:
        model = FinderMessage
        fields = ["sender_name", "sender_phone", "sender_email", "message"]
        widgets = {
            "message": forms.Textarea(
                attrs={"rows": 4, "maxlength": 1000}
            ),
        }
