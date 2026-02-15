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
]
