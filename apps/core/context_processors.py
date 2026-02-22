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
    # Organization context (set by ActiveOrganizationMiddleware)
    if hasattr(request, "organization") and request.organization:
        context["current_organization"] = request.organization
        context["org_membership"] = getattr(request, "org_membership", None)
    return context
