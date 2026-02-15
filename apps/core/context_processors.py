from django.conf import settings


def global_context(request):
    """Add global context variables available in all templates."""
    context = {
        "BASE_URL": settings.BASE_URL,
        "STRIPE_PUBLISHABLE_KEY": settings.STRIPE_PUBLISHABLE_KEY,
    }
    if request.user.is_authenticated:
        context["unread_notifications_count"] = (
            request.user.notifications.filter(is_read=False).count()
        )
    return context
