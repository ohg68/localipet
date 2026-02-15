from io import BytesIO

import qrcode
from django.core.files.base import ContentFile


def generate_qr_image(scan_url: str) -> ContentFile:
    """Generate a QR code image as a Django ContentFile."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(scan_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue())
