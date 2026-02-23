from django.urls import path

from . import views

app_name = "compliance"

urlpatterns = [
    # Legal pages (public)
    path("privacy/", views.PrivacyPolicyView.as_view(), name="privacy-policy"),
    path("terms/", views.TermsOfServiceView.as_view(), name="terms-of-service"),
    path("cookies/", views.CookiePolicyView.as_view(), name="cookie-policy"),
    path("refunds/", views.RefundPolicyView.as_view(), name="refund-policy"),
    # Cookie consent API
    path("cookie-consent/", views.CookieConsentView.as_view(), name="cookie-consent"),
    # GDPR user rights (authenticated)
    path("my-data/", views.DataPrivacyDashboardView.as_view(), name="privacy-dashboard"),
    path("my-data/export/", views.DataExportView.as_view(), name="data-export"),
    path("my-data/delete/", views.DataDeleteView.as_view(), name="data-delete"),
    path(
        "my-data/delete/confirm/",
        views.DataDeleteConfirmView.as_view(),
        name="data-delete-confirm",
    ),
    path(
        "my-data/withdraw/<uuid:consent_id>/",
        views.WithdrawConsentView.as_view(),
        name="withdraw-consent",
    ),
    path(
        "my-data/accept/<str:doc_type>/",
        views.AcceptLegalDocumentView.as_view(),
        name="accept-document",
    ),
]
