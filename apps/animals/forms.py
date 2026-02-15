from django import forms

from .models import Animal, AnimalPhoto


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
