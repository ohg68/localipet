from django.urls import path

from . import views

app_name = "scanning"

urlpatterns = [
    path(
        "history/<uuid:animal_pk>/",
        views.ScanHistoryView.as_view(),
        name="history",
    ),
    path(
        "messages/<uuid:animal_pk>/",
        views.FinderMessagesView.as_view(),
        name="messages",
    ),
    path(
        "messages/<uuid:message_pk>/read/",
        views.MarkMessageReadView.as_view(),
        name="message-read",
    ),
    path(
        "qr/<uuid:animal_pk>/",
        views.QRCodeView.as_view(),
        name="qr-view",
    ),
    path(
        "qr/<uuid:animal_pk>/download/",
        views.QRDownloadView.as_view(),
        name="qr-download",
    ),
    path(
        "qr/<uuid:animal_pk>/regenerate/",
        views.QRRegenerateView.as_view(),
        name="qr-regenerate",
    ),
    path(
        "label/<uuid:animal_pk>/",
        views.LabelPreviewView.as_view(),
        name="label-preview",
    ),
    path(
        "label/<uuid:animal_pk>/download/",
        views.LabelDownloadView.as_view(),
        name="label-download",
    ),
]
