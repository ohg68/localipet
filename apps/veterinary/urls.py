from django.urls import path

from . import views

app_name = "veterinary"

urlpatterns = [
    path("dashboard/", views.VetDashboardView.as_view(), name="dashboard"),
    path("search/", views.AnimalSearchView.as_view(), name="animal-search"),
    path(
        "request/<uuid:animal_pk>/",
        views.RequestConsentView.as_view(),
        name="request-consent",
    ),
    path(
        "consent/<uuid:pk>/respond/",
        views.RespondConsentView.as_view(),
        name="respond-consent",
    ),
    path(
        "consent/<uuid:pk>/revoke/",
        views.RevokeConsentView.as_view(),
        name="revoke-consent",
    ),
    path("consents/", views.ConsentListView.as_view(), name="consent-list"),
    path(
        "animal/<uuid:animal_pk>/medical/",
        views.VetMedicalRecordListView.as_view(),
        name="medical-list",
    ),
    path(
        "animal/<uuid:animal_pk>/medical/add/",
        views.VetMedicalRecordCreateView.as_view(),
        name="medical-add",
    ),
    path(
        "animal/<uuid:animal_pk>/service/add/",
        views.ServiceRecordCreateView.as_view(),
        name="service-add",
    ),
]
