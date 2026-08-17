#!/usr/bin/env python3
"""
ST-IN-gen — Multi-Format Mock Invoice Generator & Google Drive Ingestion (WIP)
Script: scripts/generate_mock_invoice_multiformat.py

Generates a complete mock invoice across 4 distinct formats:
1. Vector HTML (Web Invoice)
2. Vector PDF (Print Ready A4)
3. Excel Spreadsheet (.xlsx with Formulas & Styles)
4. Word Document (.docx Styled Letterhead)

Uploads all generated documents to Google Drive via Drive API.
"""

import os
import sys
import json
import shutil
import subprocess
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path
from datetime import datetime

# UTF-8 stdout configuration for Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
        sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

# Optional document generation imports
try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

try:
    import docx
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml import OxmlElement, parse_xml
    from docx.oxml.ns import nsdecls, qn
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Required Google Drive & Gmail scopes
SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/gmail.send'
]

# -----------------------------------------------------------------------------
# 🏢 MOCK INVOICE DATA (Based on Studio Tunnel Specs & Zomato Ryze Job #91)
# -----------------------------------------------------------------------------
MOCK_INVOICE = {
    "company": {
        "legal_name": "CINELOOM POSTWORKS PRIVATE LIMITED",
        "brand_name": "Studio Tunnel",
        "address": "311, Kamla Spaces, SV Road, Santacruz (West), Mumbai - 400 054",
        "phone": "8928249081",
        "email": "contact@studiotunnel.com",
        "invoice_email": "invoices@studiotunnel.com",
        "gstin": "27AAMCC8604R1ZV",
        "pan": "AAMCC8604R",
        "tan": "PNEC20959B",
        "state": "27-Maharashtra",
        "hsn": "999612"
    },
    "bank": {
        "name": "HDFC Bank",
        "account_no": "50200084321948",
        "ifsc": "HDFC0000079",
        "holder": "CINELOOM POSTWORKS PRIVATE LIMITED",
        "branch": "Santacruz West, Mumbai"
    },
    "client": {
        "name": "ZOMATO MEDIA PRIVATE LIMITED",
        "address": "Ground Floor, 12A, 94 Meghdoot, Nehru Place, New Delhi - 110 019",
        "gstin": "07AAACZ1823G1Z1",
        "pan": "AAACZ1823G",
        "state": "07-Delhi",
        "contact_person": "Production Accounts Team",
        "contact_phone": "+91 98110 00000",
        "contact_email": "accounts@zomato.com"
    },
    "invoice": {
        "number": "INV-91",
        "display_no": "91",
        "date": "01/07/2026",
        "due_date": "16/07/2026",
        "place_of_supply": "07-Delhi",
        "is_inter_state": True,  # MH -> DL = IGST (18%)
        "project_name": "Zomato Ryze Studio Commercial (Director's Cut)",
        "colorist": "Sujith / Yash",
        "line_producer": "Samiran Sonowal"
    },
    "items": [
        {
            "sr_no": 1,
            "description": "Color Grading & Digital Intermediate (DI) Mastering\nProject: Zomato Ryze Commercial (60s + 30s Cutdowns)",
            "hsn": "999612",
            "quantity": 1,
            "unit": "Job",
            "rate": 100000.00,
            "gst_rate": 18,
            "gst_amount": 18000.00,
            "total_amount": 100000.00
        }
    ],
    "financials": {
        "subtotal": 100000.00,
        "cgst": 0.00,
        "sgst": 0.00,
        "igst": 18000.00,
        "total_tax": 18000.00,
        "grand_total": 118000.00,
        "amount_in_words": "One Lakh Eighteen Thousand Rupees Only",
        "received": 0.00,
        "balance": 118000.00
    }
}


# -----------------------------------------------------------------------------
# 1. RENDER HTML INVOICE
# -----------------------------------------------------------------------------
def generate_html_invoice(data, output_path):
    c = data["company"]
    cl = data["client"]
    inv = data["invoice"]
    fin = data["financials"]
    b = data["bank"]

    items_html = ""
    for item in data["items"]:
        desc = item["description"].replace("\n", "<br>")
        items_html += f"""
        <tr>
          <td class="text-center">{item['sr_no']}</td>
          <td><strong>{desc}</strong></td>
          <td class="text-center">{item['hsn']}</td>
          <td class="text-center">{item['quantity']}</td>
          <td class="text-center">{item['unit']}</td>
          <td class="text-right">₹ {item['rate']:,.2f}</td>
          <td class="text-right">₹ {item['gst_amount']:,.2f}<br><small style="color:#64748b;">({item['gst_rate']}%)</small></td>
          <td class="text-right">₹ {item['total_amount']:,.2f}</td>
        </tr>
        """

    tax_rows = ""
    if inv["is_inter_state"]:
        tax_rows = f"""
        <tr>
          <td>IGST @ 18%</td>
          <td class="text-right">₹ {fin['igst']:,.2f}</td>
        </tr>
        """
    else:
        tax_rows = f"""
        <tr>
          <td>CGST @ 9%</td>
          <td class="text-right">₹ {fin['cgst']:,.2f}</td>
        </tr>
        <tr>
          <td>SGST @ 9%</td>
          <td class="text-right">₹ {fin['sgst']:,.2f}</td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #{inv['display_no']} - {c['brand_name']}</title>
  <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {{
      size: A4;
      margin: 12mm 12mm 12mm 12mm;
    }}
    body {{
      font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1A1A1A;
      font-size: 10.5px;
      line-height: 1.45;
      margin: 0;
      padding: 24px;
      background-color: #FFFFFF;
    }}
    .container {{
      max-width: 800px;
      margin: 0 auto;
    }}
    .header-table {{
      width: 100%;
      margin-bottom: 12px;
      border-collapse: collapse;
    }}
    .company-title {{
      font-size: 15px;
      font-weight: 700;
      color: #1A1A1A;
      letter-spacing: 0.3px;
      margin-bottom: 3px;
    }}
    .brand-badge {{
      background: #1A1A1A;
      color: #00E599;
      display: inline-block;
      padding: 8px 16px;
      font-weight: 700;
      font-size: 15px;
      border-radius: 4px;
      letter-spacing: 1px;
    }}
    .divider-bar {{
      height: 3px;
      background: linear-gradient(90deg, #1A1A1A 0%, #00E599 100%);
      margin: 10px 0 16px 0;
    }}
    .title-banner {{
      font-size: 18px;
      font-weight: 700;
      color: #1A1A1A;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 16px;
    }}
    .meta-table {{
      width: 100%;
      margin-bottom: 18px;
      border-collapse: collapse;
    }}
    .meta-table td {{
      vertical-align: top;
    }}
    .card-box {{
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
    }}
    .section-label {{
      font-weight: 700;
      font-size: 11px;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      border-bottom: 2px solid #00E599;
      display: inline-block;
      padding-bottom: 2px;
    }}
    .item-table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }}
    .item-table th {{
      background-color: #1A1A1A;
      color: #CCCCCC;
      font-weight: 600;
      padding: 8px;
      text-align: left;
      font-size: 10px;
    }}
    .item-table td {{
      padding: 8px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 10px;
    }}
    .text-right {{ text-align: right; }}
    .text-center {{ text-align: center; }}
    .summary-wrap {{
      width: 100%;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }}
    .words-box {{
      width: 48%;
      float: left;
      font-size: 10.5px;
    }}
    .totals-table {{
      width: 46%;
      float: right;
      border-collapse: collapse;
    }}
    .totals-table td {{
      padding: 6px 8px;
      font-size: 10.5px;
    }}
    .grand-total-row {{
      background-color: #1A1A1A;
      color: #00E599 !important;
      font-weight: 700;
      font-size: 12px !important;
    }}
    .grand-total-row td {{
      color: #00E599 !important;
    }}
    .clearfix {{ clear: both; }}
    .footer-table {{
      width: 100%;
      margin-top: 28px;
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      border-collapse: collapse;
    }}
    .signature-line {{
      border-bottom: 1.5px solid #1A1A1A;
      display: inline-block;
      padding: 0 25px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 20px;
    }}
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="width: 65%; vertical-align: top;">
        <div class="company-title">{c['legal_name']}</div>
        <div>{c['address']}</div>
        <div><strong>Phone:</strong> {c['phone']} | <strong>Email:</strong> {c['email']}</div>
        <div><strong>GSTIN:</strong> {c['gstin']} | <strong>PAN:</strong> {c['pan']} | <strong>State:</strong> {c['state']}</div>
        <div><strong>TAN:</strong> {c['tan']} | <strong>Default SAC:</strong> {c['hsn']}</div>
      </td>
      <td style="width: 35%; text-align: right; vertical-align: top;">
        <div class="brand-badge">STUDIO TUNNEL</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 6px;">Color Grading &bull; DI &bull; Finishing</div>
      </td>
    </tr>
  </table>

  <div class="divider-bar"></div>
  <div class="title-banner">TAX INVOICE</div>

  <!-- Metadata Cards -->
  <table class="meta-table">
    <tr>
      <td style="width: 52%; padding-right: 10px;">
        <div class="card-box">
          <div class="section-label">Bill To</div>
          <div style="font-weight: 700; font-size: 12px; color: #0F172A; margin-bottom: 3px;">{cl['name']}</div>
          <div>{cl['address']}</div>
          <div><strong>GSTIN:</strong> {cl['gstin']}</div>
          <div><strong>PAN:</strong> {cl['pan']} | <strong>State:</strong> {cl['state']}</div>
          <div><strong>Contact:</strong> {cl['contact_person']} ({cl['contact_email']})</div>
        </div>
      </td>
      <td style="width: 48%; padding-left: 10px;">
        <div class="card-box">
          <div class="section-label">Invoice Details</div>
          <div><strong>Invoice No:</strong> <span style="font-size:12px; font-weight:700; color:#0F172A;">{inv['number']}</span></div>
          <div><strong>Invoice Date:</strong> {inv['date']}</div>
          <div><strong>Due Date:</strong> {inv['due_date']} (Net 15 Days)</div>
          <div><strong>Place of Supply:</strong> {inv['place_of_supply']}</div>
          <div><strong>Project:</strong> {inv['project_name']}</div>
          <div><strong>Colorist:</strong> {inv['colorist']}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Line Items -->
  <table class="item-table">
    <thead>
      <tr>
        <th style="width: 5%;" class="text-center">#</th>
        <th style="width: 40%;">Description of Services</th>
        <th style="width: 10%;" class="text-center">SAC</th>
        <th style="width: 8%;" class="text-center">Qty</th>
        <th style="width: 7%;" class="text-center">Unit</th>
        <th style="width: 15%;" class="text-right">Rate</th>
        <th style="width: 15%;" class="text-right">GST</th>
        <th style="width: 15%;" class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      {items_html}
    </tbody>
  </table>

  <!-- Summary Section -->
  <div style="width: 100%;">
    <div class="words-box">
      <div style="font-weight: 700; color: #0F172A; margin-bottom: 2px;">Invoice Amount in Words:</div>
      <div style="color: #334155; font-style: italic; margin-bottom: 16px;">{fin['amount_in_words']}</div>

      <div style="font-weight: 700; color: #0F172A; margin-bottom: 2px;">Terms & Notes:</div>
      <div style="color: #64748b; font-size: 9.5px;">
        1. Payment due within 15 days of invoice date.<br>
        2. Electronic remittance preferred. Please quote invoice number during transfer.<br>
        3. Subject to Mumbai Jurisdiction.
      </div>
    </div>

    <table class="totals-table">
      <tr>
        <td>Sub Total</td>
        <td class="text-right">₹ {fin['subtotal']:,.2f}</td>
      </tr>
      {tax_rows}
      <tr class="grand-total-row">
        <td>Grand Total</td>
        <td class="text-right">₹ {fin['grand_total']:,.2f}</td>
      </tr>
      <tr>
        <td>Amount Received</td>
        <td class="text-right">₹ {fin['received']:,.2f}</td>
      </tr>
      <tr style="font-weight:700; border-top:1px solid #CBD5E1;">
        <td>Balance Due</td>
        <td class="text-right" style="color:#0F172A;">₹ {fin['balance']:,.2f}</td>
      </tr>
    </table>
    <div class="clearfix"></div>
  </div>

  <!-- Footer Banking & Signatory -->
  <table class="footer-table">
    <tr>
      <td style="width: 55%; vertical-align: top;">
        <div style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">Electronic Bank Transfer Details:</div>
        <div><strong>Bank Name:</strong> {b['name']}</div>
        <div><strong>Account Number:</strong> <span style="font-family:monospace; font-weight:700; font-size:11px;">{b['account_no']}</span></div>
        <div><strong>IFSC Code:</strong> {b['ifsc']}</div>
        <div><strong>Account Name:</strong> {b['holder']}</div>
        <div><strong>Branch:</strong> {b['branch']}</div>
      </td>
      <td style="width: 45%; text-align: right; vertical-align: top;">
        <div>For <strong>{c['legal_name']}</strong></div>
        <div class="signature-line">{inv['line_producer']}</div><br>
        <div style="color: #64748b; font-size: 9.5px; margin-top: 4px;">Authorized Signatory</div>
      </td>
    </tr>
  </table>

</div>
</body>
</html>
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"  [OK] Rendered HTML Invoice -> {output_path}")
    return output_path


# -----------------------------------------------------------------------------
# 2. RENDER VECTOR PDF INVOICE (Via Headless Chrome/Edge)
# -----------------------------------------------------------------------------
def generate_pdf_invoice(html_path, output_path):
    browsers = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        shutil.which("msedge"),
        shutil.which("chrome"),
        shutil.which("google-chrome")
    ]
    browser_bin = next((b for b in browsers if b and os.path.exists(b)), None)

    if browser_bin:
        abs_html = os.path.abspath(html_path)
        abs_pdf = os.path.abspath(output_path)
        cmd = [
            browser_bin,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={abs_pdf}",
            abs_html
        ]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
            if os.path.exists(output_path):
                print(f"  [OK] Vector PDF Invoice -> {output_path}")
                return output_path
        except Exception as e:
            print(f"  [WARN] Headless browser PDF failed: {e}")

    # Fallback to ReportLab if browser is unavailable
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        doc = SimpleDocTemplate(str(output_path), pagesize=A4)
        styles = getSampleStyleSheet()
        story = [
            Paragraph("<b>CINELOOM POSTWORKS PVT. LTD. / STUDIO TUNNEL</b>", styles["Title"]),
            Spacer(1, 12),
            Paragraph(f"Tax Invoice #{MOCK_INVOICE['invoice']['number']}", styles["Heading2"]),
            Paragraph(f"Billed to: {MOCK_INVOICE['client']['name']}", styles["Normal"]),
            Paragraph(f"Grand Total: Rs. {MOCK_INVOICE['financials']['grand_total']:,.2f}", styles["Normal"])
        ]
        doc.build(story)
        print(f"  [OK] Fallback PDF Invoice -> {output_path}")
        return output_path
    except Exception as e:
        print(f"  [FAIL] Could not generate PDF: {e}")
        return None


# -----------------------------------------------------------------------------
# 3. RENDER EXCEL SPREADSHEET (.xlsx)
# -----------------------------------------------------------------------------
def generate_excel_invoice(data, output_path):
    if not HAS_OPENPYXL:
        print("  [SKIP] openpyxl not installed.")
        return None

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Tax Invoice"

    # Theme colors
    dark_fill = PatternFill(start_color="1A1A1A", end_color="1A1A1A", fill_type="solid")
    light_gray_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    green_font = Font(name="Lexend", size=14, bold=True, color="00E599")
    header_font = Font(name="Lexend", size=10, bold=True, color="CCCCCC")
    bold_dark = Font(name="Lexend", size=11, bold=True, color="0F172A")
    regular_font = Font(name="Lexend", size=10, color="1A1A1A")
    small_font = Font(name="Lexend", size=9, color="64748B")

    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    # 1. Company Header
    c = data["company"]
    ws.merge_cells("A1:E1")
    ws["A1"] = c["legal_name"]
    ws["A1"].font = Font(name="Lexend", size=13, bold=True, color="1A1A1A")

    ws.merge_cells("F1:H1")
    ws["F1"] = "STUDIO TUNNEL"
    ws["F1"].fill = dark_fill
    ws["F1"].font = green_font
    ws["F1"].alignment = Alignment(horizontal="center", vertical="center")

    ws["A2"] = c["address"]
    ws["A2"].font = small_font
    ws["A3"] = f"Phone: {c['phone']} | Email: {c['email']} | GSTIN: {c['gstin']} | State: {c['state']}"
    ws["A3"].font = small_font

    # 2. Document Title
    ws.merge_cells("A5:H5")
    ws["A5"] = "TAX INVOICE"
    ws["A5"].font = Font(name="Lexend", size=14, bold=True, color="0F172A")
    ws["A5"].alignment = Alignment(horizontal="center")

    # 3. Bill To & Invoice Meta Grid
    cl = data["client"]
    inv = data["invoice"]

    ws["A7"] = "BILL TO:"
    ws["A7"].font = bold_dark
    ws["A8"] = cl["name"]
    ws["A8"].font = Font(name="Lexend", size=10, bold=True)
    ws["A9"] = cl["address"]
    ws["A9"].font = regular_font
    ws["A10"] = f"GSTIN: {cl['gstin']} | PAN: {cl['pan']} | State: {cl['state']}"
    ws["A10"].font = regular_font

    ws["E7"] = "INVOICE DETAILS:"
    ws["E7"].font = bold_dark
    ws["E8"] = f"Invoice No: {inv['number']}"
    ws["E8"].font = Font(name="Lexend", size=10, bold=True)
    ws["E9"] = f"Invoice Date: {inv['date']} | Due Date: {inv['due_date']}"
    ws["E9"].font = regular_font
    ws["E10"] = f"Project: {inv['project_name']} ({inv['colorist']})"
    ws["E10"].font = regular_font

    # 4. Item Table Header
    headers = ["#", "Description of Services", "SAC", "Qty", "Unit", "Rate (₹)", "GST Amount (₹)", "Total (₹)"]
    row_idx = 12
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=header)
        cell.fill = dark_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center" if col_idx in [1, 3, 4, 5] else ("right" if col_idx >= 6 else "left"))

    # 5. Items
    row_idx = 13
    for item in data["items"]:
        ws.cell(row=row_idx, column=1, value=item["sr_no"]).alignment = Alignment(horizontal="center")
        ws.cell(row=row_idx, column=2, value=item["description"]).font = regular_font
        ws.cell(row=row_idx, column=3, value=item["hsn"]).alignment = Alignment(horizontal="center")
        ws.cell(row=row_idx, column=4, value=item["quantity"]).alignment = Alignment(horizontal="center")
        ws.cell(row=row_idx, column=5, value=item["unit"]).alignment = Alignment(horizontal="center")

        cell_rate = ws.cell(row=row_idx, column=6, value=item["rate"])
        cell_rate.number_format = '₹ #,##,##0.00'
        cell_rate.alignment = Alignment(horizontal="right")

        cell_gst = ws.cell(row=row_idx, column=7, value=f"=F{row_idx}*0.18")
        cell_gst.number_format = '₹ #,##,##0.00'
        cell_gst.alignment = Alignment(horizontal="right")

        cell_tot = ws.cell(row=row_idx, column=8, value=f"=F{row_idx}+G{row_idx}")
        cell_tot.number_format = '₹ #,##,##0.00'
        cell_tot.alignment = Alignment(horizontal="right")

        for c_idx in range(1, 9):
            ws.cell(row=row_idx, column=c_idx).border = thin_border
        row_idx += 1

    # 6. Totals Block
    row_idx += 1
    ws.cell(row=row_idx, column=6, value="Sub Total").font = bold_dark
    ws.cell(row=row_idx, column=8, value="=SUM(F13:F13)").number_format = '₹ #,##,##0.00'

    row_idx += 1
    ws.cell(row=row_idx, column=6, value="IGST @ 18%").font = bold_dark
    ws.cell(row=row_idx, column=8, value="=SUM(G13:G13)").number_format = '₹ #,##,##0.00'

    row_idx += 1
    cell_lbl = ws.cell(row=row_idx, column=6, value="Grand Total")
    cell_lbl.fill = dark_fill
    cell_lbl.font = Font(name="Lexend", size=11, bold=True, color="00E599")

    cell_gt = ws.cell(row=row_idx, column=8, value="=SUM(H13:H13)")
    cell_gt.fill = dark_fill
    cell_gt.font = Font(name="Lexend", size=11, bold=True, color="00E599")
    cell_gt.number_format = '₹ #,##,##0.00'

    # Auto column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)
    ws.column_dimensions["B"].width = 38

    wb.save(output_path)
    print(f"  [OK] Excel Spreadsheet Invoice -> {output_path}")
    return output_path


# -----------------------------------------------------------------------------
# 4. RENDER WORD DOCUMENT (.docx)
# -----------------------------------------------------------------------------
def generate_docx_invoice(data, output_path):
    if not HAS_DOCX:
        print("  [SKIP] python-docx not installed.")
        return None

    doc = Document()
    c = data["company"]
    cl = data["client"]
    inv = data["invoice"]
    fin = data["financials"]
    b = data["bank"]

    # Header
    p = doc.add_paragraph()
    run = p.add_run(f"{c['legal_name']}  |  STUDIO TUNNEL\n")
    run.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(0x1A, 0x1A, 0x1A)

    p_sub = doc.add_paragraph()
    p_sub.add_run(f"{c['address']}\nPhone: {c['phone']} | Email: {c['email']} | GSTIN: {c['gstin']}")
    p_sub.runs[0].font.size = Pt(9)
    p_sub.runs[0].font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("TAX INVOICE")
    r_title.bold = True
    r_title.font.size = Pt(16)

    # Bill To & Invoice Info Table
    meta_table = doc.add_table(rows=1, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_left, cell_right = meta_table.rows[0].cells

    p_left = cell_left.paragraphs[0]
    p_left.add_run("BILL TO:\n").bold = True
    p_left.add_run(f"{cl['name']}\n{cl['address']}\nGSTIN: {cl['gstin']} | PAN: {cl['pan']}\nState: {cl['state']}")

    p_right = cell_right.paragraphs[0]
    p_right.add_run("INVOICE DETAILS:\n").bold = True
    p_right.add_run(f"Invoice No: {inv['number']}\nDate: {inv['date']}\nDue Date: {inv['due_date']}\nPlace of Supply: {inv['place_of_supply']}\nProject: {inv['project_name']}")

    doc.add_paragraph()

    # Item Table
    item_table = doc.add_table(rows=1, cols=6)
    item_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = item_table.rows[0].cells
    hdr_titles = ["#", "Description", "SAC", "Qty", "Rate (₹)", "Total (₹)"]
    for i, title in enumerate(hdr_titles):
        hdr_cells[i].text = title
        hdr_cells[i].paragraphs[0].runs[0].bold = True

    for item in data["items"]:
        row_cells = item_table.add_row().cells
        row_cells[0].text = str(item["sr_no"])
        row_cells[1].text = item["description"]
        row_cells[2].text = str(item["hsn"])
        row_cells[3].text = str(item["quantity"])
        row_cells[4].text = f"₹ {item['rate']:,.2f}"
        row_cells[5].text = f"₹ {item['total_amount']:,.2f}"

    doc.add_paragraph()

    # Totals
    p_tot = doc.add_paragraph()
    p_tot.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_tot.add_run(f"Sub Total: ₹ {fin['subtotal']:,.2f}\n")
    p_tot.add_run(f"IGST @ 18%: ₹ {fin['igst']:,.2f}\n")
    r_gt = p_tot.add_run(f"Grand Total: ₹ {fin['grand_total']:,.2f}\n")
    r_gt.bold = True
    r_gt.font.size = Pt(13)

    # Words
    p_words = doc.add_paragraph()
    p_words.add_run("Amount in Words: ").bold = True
    p_words.add_run(fin["amount_in_words"]).italic = True

    # Banking & Signatory
    footer_table = doc.add_table(rows=1, cols=2)
    f_left, f_right = footer_table.rows[0].cells
    p_bank = f_left.paragraphs[0]
    p_bank.add_run("PAYMENT DETAILS:\n").bold = True
    p_bank.add_run(f"Bank: {b['name']}\nAccount: {b['account_no']}\nIFSC: {b['ifsc']}\nHolder: {b['holder']}")

    p_sig = f_right.paragraphs[0]
    p_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.add_run(f"For {c['legal_name']}\n\n\nSamiran Sonowal\nAuthorized Signatory")

    doc.save(output_path)
    print(f"  [OK] Word Document Invoice -> {output_path}")
    return output_path


# -----------------------------------------------------------------------------
# 5. GOOGLE DRIVE UPLOAD MODULE
# -----------------------------------------------------------------------------
def get_drive_service(repo_root):
    token_path = repo_root / "credentials" / "private" / "google_drive_token.json"
    gmail_token_path = repo_root / "credentials" / "private" / "gmail_token.json"
    client_secret_path = repo_root / "credentials" / "private" / "client_secret_972643538415-iotqsas6uh5uanjjgdmal16phvfnsvup.apps.googleusercontent.com.json"

    creds = None
    # Check Drive specific token
    if token_path.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception:
            creds = None

    # Check unified gmail token if scopes match
    if not creds and gmail_token_path.exists():
        try:
            c = Credentials.from_authorized_user_file(str(gmail_token_path))
            if any('drive' in s for s in c.scopes):
                creds = c
        except Exception:
            pass

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(token_path, 'w', encoding='utf-8') as f:
                f.write(creds.to_json())
        except Exception:
            creds = None

    if not creds or not creds.valid:
        if not client_secret_path.exists():
            print("[WARN] Client secret not found; skipping Google Drive upload.")
            return None

        with open(client_secret_path, 'r', encoding='utf-8') as f:
            secret_data = json.load(f)

        web_config = secret_data.get("web", secret_data.get("installed", {}))
        client_id = web_config.get("client_id")
        client_secret = web_config.get("client_secret")
        redirect_uri = "https://developers.google.com/oauthplayground"

        auth_params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send",
            "access_type": "offline",
            "prompt": "consent"
        }
        auth_url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(auth_params)

        print("\n" + "=" * 75)
        print("☁️ GOOGLE DRIVE OAUTH AUTHORIZATION REQUIRED")
        print("=" * 75)
        print("1. Opening Google sign-in page to grant Google Drive upload permissions...")
        print("2. Sign in as: lab@studiotunnel.com")
        print(f"👉 Direct Link: {auth_url}")
        print("=" * 75)

        try:
            webbrowser.open(auth_url, new=2)
        except Exception:
            pass

        auth_code = input("👉 Paste Authorization Code from OAuth Playground (or press Enter to skip upload): ").strip()
        if not auth_code:
            print("[INFO] Skipping Google Drive upload. Files are saved locally.")
            return None

        if "code=" in auth_code:
            parsed = urllib.parse.urlparse(auth_code)
            params = urllib.parse.parse_qs(parsed.query)
            if "code" in params:
                auth_code = params["code"][0]

        token_url = "https://oauth2.googleapis.com/token"
        data = urllib.parse.urlencode({
            "code": auth_code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }).encode('utf-8')

        req = urllib.request.Request(token_url, data=data, method="POST")
        with urllib.request.urlopen(req) as resp:
            token_resp = json.loads(resp.read().decode('utf-8'))

        creds = Credentials(
            token=token_resp.get("access_token"),
            refresh_token=token_resp.get("refresh_token"),
            token_uri=token_url,
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )

        with open(token_path, 'w', encoding='utf-8') as f:
            f.write(creds.to_json())
        print("[OK] Google Drive token saved to credentials/private/google_drive_token.json")

    return build('drive', 'v3', credentials=creds)


def upload_file_to_drive(drive_service, file_path, mime_type):
    file_name = os.path.basename(file_path)
    file_metadata = {'name': file_name}
    media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)

    print(f"  [DRIVE] Uploading {file_name} ...", flush=True)
    uploaded_file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink, webContentLink'
    ).execute()

    return uploaded_file


# -----------------------------------------------------------------------------
# MAIN PIPELINE EXECUTION
# -----------------------------------------------------------------------------
def main():
    repo_root = Path(__file__).resolve().parent.parent
    output_dir = repo_root / "output" / "mock-invoices"
    output_dir.mkdir(parents=True, exist_ok=True)

    base_name = f"INV91_ZOMATO_STUDIOTUNNEL_{datetime.now().strftime('%Y%m%d')}"
    html_file = output_dir / f"{base_name}.html"
    pdf_file = output_dir / f"{base_name}.pdf"
    excel_file = output_dir / f"{base_name}.xlsx"
    docx_file = output_dir / f"{base_name}.docx"

    print("=" * 75)
    print("🚀 ST-IN-gen — MULTI-FORMAT MOCK INVOICE PIPELINE (WIP)")
    print("=" * 75)
    print(f"Invoice Target : {MOCK_INVOICE['invoice']['number']} (Client: {MOCK_INVOICE['client']['name']})")
    print(f"Output Folder  : {output_dir}\n")

    print("📄 1. Generating Multi-Format Documents:")
    generate_html_invoice(MOCK_INVOICE, str(html_file))
    generate_pdf_invoice(str(html_file), str(pdf_file))
    generate_excel_invoice(MOCK_INVOICE, str(excel_file))
    generate_docx_invoice(MOCK_INVOICE, str(docx_file))

    print("\n" + "=" * 75)
    print("☁️ 2. Google Drive Ingestion:")
    print("=" * 75)

    drive_service = get_drive_service(repo_root)
    if drive_service:
        files_to_upload = [
            (html_file, "text/html"),
            (pdf_file, "application/pdf"),
            (excel_file, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            (docx_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        ]

        uploaded_links = []
        for f_path, m_type in files_to_upload:
            if os.path.exists(f_path):
                res = upload_file_to_drive(drive_service, str(f_path), m_type)
                uploaded_links.append((f_path.name, res.get('id'), res.get('webViewLink')))

        print("\n" + "=" * 75)
        print("✨ MULTI-FORMAT INVOICES UPLOADED TO GOOGLE DRIVE:")
        print("=" * 75)
        for name, file_id, link in uploaded_links:
            print(f"  • {name:<35} : {link}")
        print("=" * 75)

    print("\n✨ LOCAL FILES READY IN output/mock-invoices/ :")
    print(f"  1. HTML   : {html_file}")
    print(f"  2. PDF    : {pdf_file}")
    print(f"  3. Excel  : {excel_file}")
    print(f"  4. Word   : {docx_file}")
    print("=" * 75)


if __name__ == "__main__":
    sys.exit(main())
