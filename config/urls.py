from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns

from apps.animals.views import LostPetsPublicView
from apps.core.views import HealthCheckView, RobotsTxtView

urlpatterns = [
    # Language-independent URLs
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("robots.txt", RobotsTxtView.as_view(), name="robots-txt"),
    path("lost-pets/", LostPetsPublicView.as_view(), name="lost-pets"),
    path("s/<str:token>/", include("apps.scanning.urls_public")),
    path("billing/webhooks/stripe/", include("apps.billing.urls_webhooks")),
    path("i18n/", include("django.conf.urls.i18n")),
]

urlpatterns += i18n_patterns(
    path("admin/", admin.site.urls),
    path("accounts/", include("apps.accounts.urls")),
    path("animals/", include("apps.animals.urls")),
    path("scan/", include("apps.scanning.urls")),
    path("vet/", include("apps.veterinary.urls")),
    path("billing/", include("apps.billing.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("", include("apps.animals.urls_dashboard")),
    prefix_default_language=True,
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar

        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls))
        ] + urlpatterns
    except ImportError:
        pass
