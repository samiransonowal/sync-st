#!/usr/bin/env python3
"""
payment_aging_engine.py
Cineloom Financial Comptroller — Payment Aging & Automated Client Reminder Engine

Tracks 30-day payment cycles and sends friendly reminders to clients on:
- Day 15 (Gentle heads-up)
- Day 21 (Standard reminder)
- Day 24 (Follow-up)
- Day 26 (Follow-up)
- Day 28 (Urgent reminder)
- Day 30 (Overdue notice)
- Day 31+ (Daily overdue reminder)

Respects admin opt-out: Skips sending if Notes/Remarks contain '[PAUSE REMINDERS]'.
"""

import os
import sys
import base64
from datetime import datetime, timezone
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send']
SENDER_EMAIL = "samiran@studiotunnel.com"

# Target reminder trigger days
REMINDER_DAYS = {15, 21, 24, 26, 28, 30}

def get_gmail_service():
    private_dir = REPO_ROOT / "credentials" / "private"
    token_path = private_dir / "gmail_token.json"
    
    if not token_path.exists():
        print("[WARN] gmail_token.json not found. Running in simulation mode (no actual emails will be dispatched).")
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

def parse_date(date_str):
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None

def generate_reminder_html(client_name, proj_name, inv_no, inv_date, amount, age_days):
    if age_days <= 15:
        header_title = "Upcoming Invoice Payment Reminder"
        badge_color = "#3B82F6"
        urgency_text = f"This is a friendly heads-up that invoice <strong>{inv_no}</strong> for project <strong>{proj_name}</strong> is scheduled for payment under your standard 30-day payment cycle."
    elif age_days <= 24:
        header_title = "Payment Cycle Reminder (Day 21)"
        badge_color = "#F59E0B"
        urgency_text = f"We are checking in regarding invoice <strong>{inv_no}</strong> for <strong>{proj_name}</strong>. It has been {age_days} days since billing, and payment is due shortly."
    elif age_days <= 29:
        header_title = "Follow-up: Payment Due Soon"
        badge_color = "#F97316"
        urgency_text = f"This is an urgent follow-up regarding outstanding invoice <strong>{inv_no}</strong> for <strong>{proj_name}</strong>. We request you to schedule the payment remittance at your earliest."
    else:
        header_title = "Overdue Invoice Payment Notice"
        badge_color = "#EF4444"
        urgency_text = f"Invoice <strong>{inv_no}</strong> for <strong>{proj_name}</strong> is now <strong>{age_days} days old</strong> and past its 30-day payment cycle. Please confirm the payment transfer details."

    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; color: #1E293B; padding: 20px; }}
    .card {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.04); }}
    .header {{ background: #0F172A; color: #FFFFFF; padding: 24px; text-align: center; }}
    .header h2 {{ margin: 0; font-size: 18px; letter-spacing: 0.5px; color: #00E599; }}
    .badge {{ display: inline-block; background-color: {badge_color}; color: #FFFFFF; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px; margin-top: 8px; }}
    .content {{ padding: 24px; font-size: 14px; line-height: 1.6; }}
    .details-box {{ background-color: #F1F5F9; border-left: 4px solid #0F172A; padding: 16px; margin: 16px 0; border-radius: 4px; font-size: 13px; }}
    .footer {{ font-size: 12px; color: #64748B; text-align: center; padding: 16px; border-top: 1px solid #E2E8F0; background: #FAFAFA; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>STUDIO TUNNEL / CINELOOM POSTWORKS</h2>
      <div class="badge">{header_title}</div>
    </div>
    <div class="content">
      <p>Dear <strong>{client_name}</strong>,</p>
      <p>{urgency_text}</p>
      
      <div class="details-box">
        <strong>Invoice Details:</strong><br>
        • <strong>Invoice Number:</strong> {inv_no}<br>
        • <strong>Project Name:</strong> {proj_name}<br>
        • <strong>Invoice Date:</strong> {inv_date}<br>
        • <strong>Pending Amount:</strong> ₹{amount}<br>
        • <strong>Days Elapsed:</strong> {age_days} Days
      </div>

      <p>Kindly process the payment to Studio Tunnel Postworks Pvt. Ltd. at your earliest convenience. If payment has already been initiated, please share the UTR/transaction reference so we can update our accounts ledger.</p>

      <p>Thank you,<br><strong>Accounts & Finance Team</strong><br>Studio Tunnel / Cineloom Postworks</p>
    </div>
    <div class="footer">
      Studio Tunnel Financial Comptroller System &bull; samiran@studiotunnel.com
    </div>
  </div>
</body>
</html>
"""

def process_aging_and_reminders(invoices, dry_run=False):
    """
    Evaluates aging and fires email reminders based on exact trigger rules:
    - Days: 15, 21, 24, 26, 28, 30, and >=31 daily.
    - Excludes invoices with '[PAUSE REMINDERS]' in notes/remarks.
    """
    gmail_service = get_gmail_service()
    today = datetime.now(timezone.utc).date()
    
    print("\n================================================================================")
    print(f"RUNNING PAYMENT AGING & REMINDER ENGINE ({today.strftime('%Y-%m-%d')})")
    print("================================================================================")
    
    sent_count = 0
    skipped_count = 0

    for inv in invoices:
        inv_no = inv.get('inv_no', 'N/A')
        proj_name = inv.get('proj_name', 'Untitled')
        client_name = inv.get('client_name', 'Valued Client')
        email = inv.get('email', '').strip()
        inv_date_str = inv.get('inv_date', '')
        amt = inv.get('amount', '0.00')
        pay_status = inv.get('payment_status', 'Unpaid').lower()
        notes = inv.get('notes', '') + " " + inv.get('remark', '')

        # Skip paid or written-off invoices
        if pay_status in ('paid', 'cleared', 'written-off'):
            continue

        # Check Admin Opt-Out
        if '[PAUSE REMINDERS]' in notes.upper() or '[NO REMINDERS]' in notes.upper():
            print(f"  [OPT-OUT] Skipping {inv_no} ({proj_name}) — Admin set pause flag.")
            skipped_count += 1
            continue

        inv_date = parse_date(inv_date_str)
        if not inv_date:
            continue

        age_days = (today - inv_date).days

        # Trigger logic: 15, 21, 24, 26, 28, 30, or every day after 30
        should_send = (age_days in REMINDER_DAYS) or (age_days >= 31)

        if should_send:
            print(f"  [TRIGGERED] Invoice {inv_no} ({proj_name}) is {age_days} days old. Target Email: {email or 'No Email Specified'}")
            
            if not email or "@" not in email:
                print(f"    └─ [WARN] Skipping dispatch — Invalid or missing email address.")
                continue

            html_content = generate_reminder_html(client_name, proj_name, inv_no, inv_date_str, amt, age_days)
            subject = f"Payment Reminder: Invoice {inv_no} — {proj_name} (Day {age_days})"

            if dry_run or not gmail_service:
                print(f"    └─ [SIMULATION] Would send reminder to {email} (Subject: '{subject}')")
                sent_count += 1
            else:
                try:
                    msg = MIMEMultipart('alternative')
                    msg['To'] = email
                    msg['From'] = f"Studio Tunnel Accounts <{SENDER_EMAIL}>"
                    msg['Subject'] = subject
                    msg.attach(MIMEText(html_content, 'html', 'utf-8'))
                    raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')

                    gmail_service.users().messages().send(userId='me', body={'raw': raw_msg}).execute()
                    print(f"    └─ [SENT] Successfully dispatched payment reminder email to {email}!")
                    sent_count += 1
                except Exception as e:
                    print(f"    └─ [ERROR] Failed to send email via Gmail API: {e}")

    print(f"\nAging Engine Completed: {sent_count} reminders processed, {skipped_count} skipped by admin opt-out.")
    print("================================================================================\n")
    return sent_count

if __name__ == '__main__':
    # Standalone demo test
    sample_invoices = [
        {"inv_no": "INV-2627-001", "proj_name": "Hero MotoCorp Ad", "client_name": "Chrome Pictures", "email": "poc@chromepictures.com", "inv_date": "2026-07-28", "amount": "1,50,000", "payment_status": "Unpaid", "notes": ""},
        {"inv_no": "INV-2627-002", "proj_name": "Bajaj Finserv Commercial", "client_name": "Director Cut", "email": "accounts@directorscut.in", "inv_date": "2026-07-18", "amount": "85,000", "payment_status": "Unpaid", "notes": "[PAUSE REMINDERS] Admin requested delay"},
    ]
    process_aging_and_reminders(sample_invoices, dry_run=True)
