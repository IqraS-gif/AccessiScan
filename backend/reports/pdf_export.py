import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


PRIMARY_COLOR = HexColor("#b32b48")
DARK_BG = HexColor("#1a1a2e")
LIGHT_TEXT = HexColor("#fcffe3")
WHITE = HexColor("#ffffff")
GRAY = HexColor("#666666")


def _clean_text(text: str) -> str:
    """Escape HTML and handle newlines for ReportLab Paragraphs."""
    if not text:
        return ""
    # Escape standard HTML markers that crash ReportLab
    text = str(text).replace("<", "&lt;").replace(">", "&gt;")
    # Convert newlines to breaks to preserve formatting
    return text.replace("\n", "<br/>")


def generate_pdf_report(scan_data: dict) -> bytes:
    """Generate a professional PDF accessibility report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=16,
        textColor=PRIMARY_COLOR,
        spaceBefore=15,
        spaceAfter=10,
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontSize=10,
        textColor=HexColor("#333333"),
        spaceAfter=6,
    )
    small_style = ParagraphStyle(
        "SmallText",
        parent=styles["Normal"],
        fontSize=8,
        textColor=GRAY,
    )

    elements = []

    # Title
    elements.append(Paragraph("AccessiScan Audit Report", title_style))
    elements.append(Spacer(1, 10))

    # Scan info
    elements.append(Paragraph(f"<b>URL:</b> {scan_data.get('url', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Scan ID:</b> {scan_data.get('scan_id', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Date:</b> {scan_data.get('created_at', 'N/A')}", body_style))
    elements.append(Paragraph(f"<b>Overall Score:</b> {scan_data.get('score', 0)}/100", body_style))
    elements.append(Spacer(1, 15))

    # POUR Scores
    elements.append(Paragraph("POUR Principle Scores", heading_style))
    pour = scan_data.get("pour_scores", {})
    pour_data = [
        ["Principle", "Score"],
        ["Perceivable", f"{pour.get('perceivable', 0)}%"],
        ["Operable", f"{pour.get('operable', 0)}%"],
        ["Understandable", f"{pour.get('understandable', 0)}%"],
        ["Robust", f"{pour.get('robust', 0)}%"],
    ]
    pour_table = Table(pour_data, colWidths=[3 * inch, 2 * inch])
    pour_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_COLOR),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#f8f8f8"), WHITE]),
    ]))
    elements.append(pour_table)
    elements.append(Spacer(1, 15))

    # Violations Summary
    elements.append(Paragraph("Violations Summary", heading_style))
    violations = scan_data.get("violations", [])
    elements.append(Paragraph(
        f"Total: {len(violations)} | "
        f"Critical: {scan_data.get('critical_count', 0)} | "
        f"Serious: {scan_data.get('serious_count', 0)} | "
        f"Moderate: {scan_data.get('moderate_count', 0)} | "
        f"Minor: {scan_data.get('minor_count', 0)}",
        body_style,
    ))
    elements.append(Spacer(1, 10))

    # Violations Detail
    if violations:
        elements.append(Paragraph("Violation Details", heading_style))
        for i, v in enumerate(violations[:20], 1):  # Limit to 20 for PDF length
            elements.append(Paragraph(
                f"<b>{i}. [{v.get('impact', '').upper()}] {v.get('help', '')}</b>",
                body_style,
            ))
            elements.append(Paragraph(
                f"Rule: {v.get('id', '')} | WCAG: {', '.join(v.get('wcag_tags', []))}",
                small_style,
            ))
            for node in v.get("nodes", [])[:2]:
                html_snippet = node.get("html", "")[:200].replace("<", "&lt;").replace(">", "&gt;")
                elements.append(Paragraph(
                    f"<font face='Courier' size='8'>{html_snippet}</font>",
                    body_style,
                ))
            elements.append(Spacer(1, 8))

    # AI Analysis
    ai = scan_data.get("ai_analysis", {})
    if ai and ai.get("overview"):
        elements.append(PageBreak())
        elements.append(Paragraph("AI Analysis Overview", heading_style))
        elements.append(Paragraph(_clean_text(ai.get("overview", "")), body_style))
        elements.append(Spacer(1, 10))

        if ai.get("human_impact"):
            elements.append(Paragraph("Human Impact", heading_style))
            elements.append(Paragraph(_clean_text(ai.get("human_impact", "")), body_style))
            elements.append(Spacer(1, 10))

        if ai.get("remediation_strategy"):
            elements.append(Paragraph("Remediation Strategy", heading_style))
            elements.append(Paragraph(_clean_text(ai.get("remediation_strategy", "")), body_style))

    doc.build(elements)
    return buffer.getvalue()
