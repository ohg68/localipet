from django import template

register = template.Library()


@register.filter
def species_icon(species):
    """Return a Font Awesome icon class for the species."""
    icons = {
        "dog": "fa-dog",
        "cat": "fa-cat",
        "bird": "fa-dove",
        "rabbit": "fa-rabbit",
        "reptile": "fa-dragon",
        "other": "fa-paw",
    }
    return icons.get(species, "fa-paw")
