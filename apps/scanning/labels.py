from io import BytesIO

from reportlab.lib.pagesizes import inch
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from django.core.files.base import ContentFile


def generate_label_pdf(animal, qr_code, label_type="standard"):
    """Generate a printable PDF label with QR code and animal info."""
    buffer = BytesIO()

    if label_type == "collar":
        width, height = 1.5 * inch, 1 * inch
    else:  # standard
        width, height = 2 * inch, 2 * inch

    c = canvas.Canvas(buffer, pagesize=(width, height))

    # Draw QR code
    if qr_code.qr_image:
        try:
            qr_img = ImageReader(qr_code.qr_image.path)
            qr_size = min(width, height) * 0.6
            x = (width - qr_size) / 2
            y = height - qr_size - 5 * mm
            c.drawImage(qr_img, x, y, qr_size, qr_size)
        except Exception:
            pass

    # Animal name
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2, 12 * mm, animal.name)

    # Scan instruction
    c.setFont("Helvetica", 6)
    c.drawCentredString(width / 2, 7 * mm, "Scan me! localipet.com")

    c.save()
    buffer.seek(0)
    return ContentFile(buffer.getvalue())
