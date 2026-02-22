"""Bulk operations for organizations: multi-label PDF and QR generation."""

from io import BytesIO

from reportlab.lib.pagesizes import letter, inch
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from django.core.files.base import ContentFile


def generate_bulk_labels_pdf(animals_with_qr, label_type="standard"):
    """
    Generate a multi-page PDF with labels for multiple animals.

    Arranges labels in a grid on letter-size (8.5 x 11 inch) pages.

    Args:
        animals_with_qr: list of (animal, qr_code) tuples
        label_type: 'standard' (2x2 in) or 'collar' (1.5x1 in)

    Returns:
        ContentFile with the PDF data.
    """
    buffer = BytesIO()

    if label_type == "collar":
        label_w, label_h = 1.5 * inch, 1 * inch
        cols, rows = 4, 8
    else:
        label_w, label_h = 2 * inch, 2 * inch
        cols, rows = 3, 4

    page_w, page_h = letter
    margin_x = (page_w - cols * label_w) / 2
    margin_y = (page_h - rows * label_h) / 2

    c = canvas.Canvas(buffer, pagesize=letter)

    labels_per_page = cols * rows

    for idx, (animal, qr_code) in enumerate(animals_with_qr):
        if idx > 0 and idx % labels_per_page == 0:
            c.showPage()

        pos = idx % labels_per_page
        col = pos % cols
        row = pos // cols

        x = margin_x + col * label_w
        y = page_h - margin_y - (row + 1) * label_h

        _draw_single_label(c, x, y, label_w, label_h, animal, qr_code)

    c.save()
    buffer.seek(0)
    return ContentFile(buffer.getvalue())


def _draw_single_label(c, x, y, w, h, animal, qr_code):
    """Draw one label at position (x, y) with size (w, h)."""
    # Light border
    c.setStrokeColorRGB(0.8, 0.8, 0.8)
    c.rect(x, y, w, h)

    # QR code image
    if qr_code.qr_image:
        try:
            qr_img = ImageReader(qr_code.qr_image.path)
            qr_size = min(w, h) * 0.55
            qr_x = x + (w - qr_size) / 2
            qr_y = y + h - qr_size - 4 * mm
            c.drawImage(qr_img, qr_x, qr_y, qr_size, qr_size)
        except Exception:
            pass

    # Animal name
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(x + w / 2, y + 10 * mm, animal.name)

    # Owner name
    owner_name = animal.owner.get_full_name() or animal.owner.email
    c.setFont("Helvetica", 5)
    c.drawCentredString(x + w / 2, y + 6 * mm, owner_name[:30])

    # Scan instruction
    c.setFont("Helvetica", 5)
    c.drawCentredString(x + w / 2, y + 3 * mm, "Scan me! localipet.com")


def generate_bulk_qr_images(animals_with_qr):
    """
    Ensure all animals have QR images generated.

    Returns count of newly generated QRs.
    """
    from apps.scanning.qr import generate_qr_image

    count = 0
    for animal, qr_code in animals_with_qr:
        if not qr_code.qr_image:
            image = generate_qr_image(qr_code.get_scan_url())
            qr_code.qr_image.save(
                f"qr_{qr_code.token}.png", image, save=True
            )
            count += 1
    return count
