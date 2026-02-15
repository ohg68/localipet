from django.urls import path

from . import views

urlpatterns = [
    path("", views.PublicScanView.as_view(), name="public-scan"),
    path("contact/", views.FinderContactView.as_view(), name="finder-contact"),
    path(
        "contact/success/",
        views.FinderSuccessView.as_view(),
        name="finder-success",
    ),
]
