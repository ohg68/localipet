from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.animals.models import Animal
from .models import QRCode
from .qr import generate_qr_image


@receiver(post_save, sender=Animal)
def create_qr_code(sender, instance, created, **kwargs):
    """Automatically create a QR code when a new Animal is created."""
    if created:
        qr_obj = QRCode.objects.create(animal=instance)
        image = generate_qr_image(qr_obj.get_scan_url())
        qr_obj.qr_image.save(f"qr_{qr_obj.token}.png", image, save=True)
