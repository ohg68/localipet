from django import template

register = template.Library()


@register.filter
def is_role(user, role):
    """Check if user has a specific role. Usage: {% if user|is_role:'vet' %}"""
    if not user.is_authenticated:
        return False
    return user.profile.role == role
