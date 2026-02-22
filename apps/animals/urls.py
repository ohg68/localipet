from django.urls import path

from . import views

app_name = "animals"

urlpatterns = [
    path("", views.AnimalListView.as_view(), name="list"),
    path("create/", views.AnimalCreateView.as_view(), name="create"),
    path("<uuid:pk>/", views.AnimalDetailView.as_view(), name="detail"),
    path("<uuid:pk>/edit/", views.AnimalUpdateView.as_view(), name="edit"),
    path("<uuid:pk>/delete/", views.AnimalDeleteView.as_view(), name="delete"),
    path(
        "<uuid:pk>/lost/toggle/",
        views.ToggleLostStatusView.as_view(),
        name="toggle-lost",
    ),
    path(
        "<uuid:pk>/photos/upload/",
        views.AnimalPhotoUploadView.as_view(),
        name="photo-upload",
    ),
    # Vaccinations
    path(
        "<uuid:pk>/vaccinations/",
        views.VaccinationListView.as_view(),
        name="vaccination-list",
    ),
    path(
        "<uuid:pk>/vaccinations/add/",
        views.VaccinationCreateView.as_view(),
        name="vaccination-add",
    ),
    path(
        "<uuid:pk>/vaccinations/<uuid:vacc_pk>/edit/",
        views.VaccinationUpdateView.as_view(),
        name="vaccination-edit",
    ),
    path(
        "<uuid:pk>/vaccinations/<uuid:vacc_pk>/delete/",
        views.VaccinationDeleteView.as_view(),
        name="vaccination-delete",
    ),
    # Weight tracking
    path(
        "<uuid:pk>/weight/",
        views.WeightHistoryView.as_view(),
        name="weight-history",
    ),
    path(
        "<uuid:pk>/weight/add/",
        views.WeightRecordCreateView.as_view(),
        name="weight-add",
    ),
    path(
        "<uuid:pk>/weight/chart-data/",
        views.WeightChartDataView.as_view(),
        name="weight-chart-data",
    ),
    # Co-owners (family access)
    path(
        "<uuid:pk>/sharing/",
        views.CoOwnerListView.as_view(),
        name="co-owner-list",
    ),
    path(
        "<uuid:pk>/sharing/add/",
        views.CoOwnerAddView.as_view(),
        name="co-owner-add",
    ),
    path(
        "<uuid:pk>/sharing/<uuid:co_owner_pk>/remove/",
        views.CoOwnerRemoveView.as_view(),
        name="co-owner-remove",
    ),
    # Appointments
    path(
        "appointments/",
        views.AppointmentListView.as_view(),
        name="appointment-list",
    ),
    path(
        "<uuid:pk>/appointments/add/",
        views.AppointmentCreateView.as_view(),
        name="appointment-add",
    ),
    path(
        "appointments/<uuid:appt_pk>/edit/",
        views.AppointmentUpdateView.as_view(),
        name="appointment-edit",
    ),
    path(
        "appointments/<uuid:appt_pk>/cancel/",
        views.AppointmentCancelView.as_view(),
        name="appointment-cancel",
    ),
]
