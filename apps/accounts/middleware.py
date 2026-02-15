from django.utils import translation


class UserLanguageMiddleware:
    """Activate the user's preferred language for authenticated users."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and hasattr(request.user, "profile"):
            lang = request.user.profile.language_preference
            translation.activate(lang)
            request.LANGUAGE_CODE = lang
        response = self.get_response(request)
        return response
