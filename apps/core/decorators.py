from functools import wraps

from django.core.exceptions import PermissionDenied


def role_required(*roles):
    """Decorator that checks if the user has one of the specified roles."""

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                from django.contrib.auth.views import redirect_to_login

                return redirect_to_login(request.get_full_path())
            if request.user.profile.role not in roles:
                raise PermissionDenied
            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator
