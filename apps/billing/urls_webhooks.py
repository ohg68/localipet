from django.urls import path

from .webhooks import StripeWebhookView

urlpatterns = [
    path("", StripeWebhookView.as_view(), name="stripe-webhook"),
]
