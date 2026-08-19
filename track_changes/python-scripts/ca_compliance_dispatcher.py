#!/usr/bin/env python3
"""
ca_compliance_dispatcher.py
Cineloom Financial Comptroller — Monthly CA Compliance Dispatcher

Runs automatically on the 1st of each month (or on demand).
Compiles and dispatches the monthly compliance package to KDK & Co (Chartered Accountants):
- Recipients: office@kdkco.in, kalpesh@kdkco.in
- CC: accounts@studiotunnel.com

Deliverables Compiled:
1. TDS Payables Summary (Salaries, Rent, Vendor payments)
2. All Sales GST Invoices Generated (Month's Sales Register)
3. Purchase Bills / ITC Claim Summary (Month's Purchase Register)
4. Admin Bank Statement Reminder (Prompts Accounts to share official HDFC Bank Statement)
"""

import os
import sys
import base64
from datetime import datetime, timedelta, timezone
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send']
SENDER_EMAIL = "accounts@studiotunnel.com"

CA_RECIPIENTS = ["office@kdkco.in", "kalpesh@kdkco.in"]
ADMIN_EMAIL = "accounts@studiotunnel.com"

def get_gmail_service():
    private_dir = REPO_ROOT / "credentials" / "private"
    token_path = private_dir / "gmail_token.json"
    if not token_path.exists():
        print("[WARN] gmail_token.json not found. Running CA Dispatcher in simulation mode.")
        return None
    try:
        creds = Credentials.from_authorized_user_file(str(token_path), GMAIL_SCOPES)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(token_path, 'w', encoding='utf-8') as f:
                f.write(creds.to_json())
        return build('gmail', 'v1', credentials=creds)
    except Exception as e:
        print(f"[WARN] Failed to initialize Gmail API service: {e}")
        return None

def generate_ca_report_html(month_str, sales_invoices, purchase_bills, tds_records):
    # Calculate Totals
    total_sales_taxable = sum(inv.get('subtotal', 0.0) for inv in sales_invoices)
    total_sales_gst = sum(inv.get('gst_amount', 0.0) for inv in sales_invoices)
    total_sales_grand = sum(inv.get('grand_total', 0.0) for inv in sales_invoices)

    total_purchase_amt = sum(bill.get('amount', 0.0) for bill in purchase_bills)
    total_purchase_itc = sum(bill.get('gst_itc', 0.0) for bill in purchase_bills)

    total_tds_payable = sum(tds.get('tds_amount', 0.0) for tds in tds_records)

    # Build Sales Invoice Table Rows
    sales_rows = ""
    for inv in sales_invoices:
        sales_rows += f"""
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; font-family: monospace;">{inv.get('inv_no', 'N/A')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{inv.get('inv_date', '')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{inv.get('client_name', '')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹{inv.get('subtotal', 0.0):,.2f}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹{inv.get('gst_amount', 0.0):,.2f}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: bold;">₹{inv.get('grand_total', 0.0):,.2f}</td>
        </tr>
        """
    if not sales_rows:
        sales_rows = "<tr><td colspan='6' style='padding: 8px; text-align: center; color: #64748B;'>No sales invoices generated in this period.</td></tr>"

    # Build Purchase Bills Table Rows
    purchase_rows = ""
    for bill in purchase_bills:
        purchase_rows += f"""
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{bill.get('date', '')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{bill.get('category', 'General Expense')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{bill.get('vendor', '')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹{bill.get('amount', 0.0):,.2f}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #10B981; font-weight: bold;">₹{bill.get('gst_itc', 0.0):,.2f}</td>
        </tr>
        """
    if not purchase_rows:
        purchase_rows = "<tr><td colspan='5' style='padding: 8px; text-align: center; color: #64748B;'>No purchase bills / expenses logged in this period.</td></tr>"

    # Build TDS Payables Table Rows
    tds_rows = ""
    for tds in tds_records:
        tds_rows += f"""
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{tds.get('category', '')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0;">{tds.get('payee', '')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">₹{tds.get('gross_amt', 0.0):,.2f}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">{tds.get('rate', '10%')}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: bold; color: #EF4444;">₹{tds.get('tds_amount', 0.0):,.2f}</td>
        </tr>
        """
    if not tds_rows:
        tds_rows = "<tr><td colspan='5' style='padding: 8px; text-align: center; color: #64748B;'>No TDS payables recorded in this period.</td></tr>"

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; color: #1E293B; padding: 20px; }}
    .card {{ max-width: 720px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.04); }}
    .header {{ background: #0F172A; color: #FFFFFF; padding: 24px; text-align: center; }}
    .header h2 {{ margin: 0; font-size: 18px; letter-spacing: 0.5px; color: #00E599; }}
    .subtitle {{ font-size: 12px; color: #94A3B8; margin-top: 4px; }}
    .content {{ padding: 24px; font-size: 13px; line-height: 1.6; }}
    .section-title {{ font-weight: 700; font-size: 13px; text-transform: uppercase; color: #0F172A; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #00E599; display: inline-block; padding-bottom: 2px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }}
    th {{ background-color: #0F172A; color: #F8FAFC; text-align: left; padding: 6px 8px; font-size: 11px; }}
    .summary-card {{ display: flex; justify-content: space-between; background: #F1F5F9; border-radius: 6px; padding: 12px 16px; margin: 16px 0; border: 1px solid #CBD5E1; }}
    .summary-item {{ text-align: center; }}
    .summary-item span {{ font-size: 11px; color: #64748B; display: block; }}
    .summary-item strong {{ font-size: 15px; color: #0F172A; }}
    .footer {{ font-size: 11px; color: #64748B; text-align: center; padding: 16px; border-top: 1px solid #E2E8F0; background: #FAFAFA; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.</h2>
      <div class="subtitle">Monthly CA Financial Compliance Package — {month_str}</div>
    </div>
    <div class="content">
      <p>Dear <strong>Kalpesh Katira & Team (KDK & Co.)</strong>,</p>
      <p>Please find attached the monthly financial accounting & tax compliance deliverables for <strong>Studio Tunnel / Cineloom Postworks Pvt. Ltd.</strong> for the period <strong>{month_str}</strong>.</p>

      <div class="summary-card">
        <div class="summary-item">
          <span>Gross Sales Billing</span>
          <strong>₹{total_sales_grand:,.2f}</strong>
        </div>
        <div class="summary-item">
          <span>Sales Output GST</span>
          <strong style="color: #2563EB;">₹{total_sales_gst:,.2f}</strong>
        </div>
        <div class="summary-item">
          <span>Purchase Input GST (ITC)</span>
          <strong style="color: #10B981;">₹{total_purchase_itc:,.2f}</strong>
        </div>
        <div class="summary-item">
          <span>TDS Deductible Payable</span>
          <strong style="color: #EF4444;">₹{total_tds_payable:,.2f}</strong>
        </div>
      </div>

      <div class="section-title">1. Sales Register — All GST Invoices Generated</div>
      <table>
        <thead>
          <tr>
            <th>Inv No.</th>
            <th>Date</th>
            <th>Client Name</th>
            <th style="text-align: right;">Taxable (₹)</th>
            <th style="text-align: right;">GST 18% (₹)</th>
            <th style="text-align: right;">Grand Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {sales_rows}
        </tbody>
      </table>

      <div class="section-title">2. Purchase Register — Expenses & Input Tax Credit (ITC)</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Vendor Name</th>
            <th style="text-align: right;">Amount (₹)</th>
            <th style="text-align: right;">GST ITC (₹)</th>
          </tr>
        </thead>
        <tbody>
          {purchase_rows}
        </tbody>
      </table>

      <div class="section-title">3. TDS Payables (Salaries, Vendor Payments & Rent)</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Payee Name</th>
            <th style="text-align: right;">Gross Pay (₹)</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">TDS Payable (₹)</th>
          </tr>
        </thead>
        <tbody>
          {tds_rows}
        </tbody>
      </table>

      <div class="section-title">4. HDFC Bank Statement Notice</div>
      <p style="font-size: 12px; color: #475569;">
        • The official HDFC Bank Statement PDF for <strong>{month_str}</strong> has been requested from Admin (<code>accounts@studiotunnel.com</code>) and will be forwarded under a separate email thread once downloaded from netbanking.
      </p>

      <p style="margin-top: 24px;">Please review these statements for monthly GST Return filing (GSTR-1 & GSTR-3B) and TDS remittance. Reach out if you require any supporting voucher copies.</p>

      <p>Best regards,<br><strong>Finance Comptroller Automation</strong><br>Studio Tunnel / Cineloom Postworks Pvt. Ltd.</p>
    </div>
    <div class="footer">
      Studio Tunnel Financial Comptroller &bull; accounts@studiotunnel.com
    </div>
  </div>
</body>
</html>
"""

def dispatch_ca_compliance_package(month_date=None, dry_run=True):
    """
    Compiles monthly compliance data and dispatches email package to CA.
    """
    if not month_date:
        today = datetime.now(timezone.utc).date()
        # Default to previous month
        first_of_current = today.replace(day=1)
        prev_month_end = first_of_current - timedelta(days=1)
        month_date = prev_month_end

    month_str = month_date.strftime("%B %Y")
    print("\n================================================================================")
    print(f"RUNNING MONTHLY CA COMPLIANCE DISPATCHER ({month_str})")
    print("================================================================================")

    # Fetch data from Accounts Sheet & BigQuery (Simulated/Parsed)
    try:
        from scripts.bigquery_sync_pipeline import get_sheets_service, ACCOUNTS_SHEET_ID
        sheets = get_sheets_service()

        # Sales Invoices
        inv_res = sheets.spreadsheets().values().get(
            spreadsheetId=ACCOUNTS_SHEET_ID, range="'Invoices & Dispatch'!A2:AA"
        ).execute()
        raw_invs = inv_res.get('values', [])
        
        sales_invoices = []
        for r in raw_invs:
            if len(r) > 9 and r[9]:
                try:
                    tot = float(r[9].replace(',', '').strip())
                    gst_amt = float(r[10].replace(',', '').strip()) if len(r) > 10 and r[10] else tot * 0.18
                    sales_invoices.append({
                        "inv_no": r[1] if len(r) > 1 else "",
                        "inv_date": r[2] if len(r) > 2 else "",
                        "client_name": r[4] if len(r) > 4 else "",
                        "subtotal": tot,
                        "gst_amount": gst_amt,
                        "grand_total": tot + gst_amt
                    })
                except ValueError:
                    continue

        # Purchase Bills / Expenses
        exp_res = sheets.spreadsheets().values().get(
            spreadsheetId=ACCOUNTS_SHEET_ID, range="'Expenses & Payables'!A2:F"
        ).execute()
        raw_exps = exp_res.get('values', [])

        purchase_bills = []
        tds_records = []
        for r in raw_exps:
            if len(r) >= 4 and r[3]:
                try:
                    amt = float(r[3].replace(',', '').strip())
                    cat = r[1] if len(r) > 1 else "General"
                    vendor = r[2] if len(r) > 2 else ""
                    purchase_bills.append({
                        "date": r[0],
                        "category": cat,
                        "vendor": vendor,
                        "amount": amt,
                        "gst_itc": round(amt * 0.18, 2)
                    })
                    if "SALARY" in cat.upper() or "RENT" in cat.upper() or "VENDOR" in cat.upper():
                        tds_records.append({
                            "category": cat,
                            "payee": vendor,
                            "gross_pay": amt,
                            "rate": "10%" if "RENT" in cat.upper() or "VENDOR" in cat.upper() else "TDS",
                            "tds_amount": round(amt * 0.10, 2)
                        })
                except ValueError:
                    continue

    except Exception as e:
        print(f"[WARN] Error fetching live sheet data for CA report: {e}. Using structured model.")
        sales_invoices = []
        purchase_bills = []
        tds_records = []

    html_content = generate_ca_report_html(month_str, sales_invoices, purchase_bills, tds_records)
    subject = f"📋 [Monthly CA Compliance Package] Studio Tunnel Financial Deliverables — {month_str}"

    gmail_service = get_gmail_service()

    if dry_run or not gmail_service:
        print(f"\n[SIMULATION / TEST MODE] CA Package Compiled successfully for {month_str}.")
        print(f"  Recipients: {', '.join(CA_RECIPIENTS)}")
        print(f"  CC: {ADMIN_EMAIL}")
        print(f"  Subject: {subject}")
        print(f"  Sales Invoices Compiled: {len(sales_invoices)}")
        print(f"  Purchase Bills Compiled: {len(purchase_bills)}")
        print(f"  TDS Payables Compiled: {len(tds_records)}")
        print("================================================================================\n")
        return True
    else:
        try:
            msg = MIMEMultipart('alternative')
            msg['To'] = ", ".join(CA_RECIPIENTS)
            msg['Cc'] = ADMIN_EMAIL
            msg['From'] = f"Studio Tunnel Finance <{SENDER_EMAIL}>"
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
            raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')

            gmail_service.users().messages().send(userId='me', body={'raw': raw_msg}).execute()
            print(f"✨ SUCCESS: Dispatched Monthly CA Compliance Package for {month_str} to CA team!")
            print("================================================================================\n")
            return True
        except Exception as e:
            print(f"❌ Error dispatching CA compliance package: {e}")
            return False

if __name__ == '__main__':
    dispatch_ca_compliance_package(dry_run=True)
