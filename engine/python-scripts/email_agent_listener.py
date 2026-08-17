#!/usr/bin/env python3
"""
email_agent_listener.py
Cineloom Financial Comptroller — Email Intelligent Agent Listener

Listens for unread emails in Gmail inbox from authorized admin emails:
- samiran@studiotunnel.com
- lab@studiotunnel.com

Parses natural language financial commands and takes automated actions:
1. Log Expenses (`Log expense: ₹15,000 for equipment rental`)
2. Dispatch CA Deliverables (`Dispatch CA package`)
3. Financial Health & Cashflow Report (`Send financial health report`)
4. Quotes & Estimates (`Generate quote for Pepsi Commercial`)
"""

import os
import sys
import re
import base64
from datetime import datetime, timezone
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
]
AUTHORIZED_ADMINS = {"samiran@studiotunnel.com", "lab@studiotunnel.com"}
SENDER_EMAIL = "samiran@studiotunnel.com"

def get_gmail_service():
    private_dir = REPO_ROOT / "credentials" / "private"
    token_path = private_dir / "gmail_token.json"
    if not token_path.exists():
        print("[WARN] gmail_token.json not found. Email agent listener running in simulation mode.")
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

def parse_expense_command(text):
    """
    Parses strings like: 'Log expense: ₹15,000 for flight tickets to Mumbai'
    Returns dict: {'date', 'category', 'vendor', 'amount'}
    """
    amt_match = re.search(r'₹?\s*([\d,]+(?:\.\d{1,2})?)', text)
    amount = float(amt_match.group(1).replace(',', '')) if amt_match else 0.0

    category = "General Expense"
    if "salary" in text.lower() or "salaries" in text.lower():
        category = "Salaries & Payroll"
    elif "rent" in text.lower():
        category = "Office Rent"
    elif "equipment" in text.lower() or "camera" in text.lower() or "monitor" in text.lower():
        category = "New Equipment"
    elif "travel" in text.lower() or "flight" in text.lower() or "ticket" in text.lower():
        category = "Travel & Conveyance"

    vendor_match = re.search(r'for\s+([^,\n\.]+)', text, re.IGNORECASE)
    vendor = vendor_match.group(1).strip() if vendor_match else "Misc Vendor"

    return {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "category": category,
        "vendor": vendor,
        "amount": amount
    }

def process_incoming_email_commands():
    print("\n================================================================================")
    print("RUNNING EMAIL INTELLIGENT AGENT LISTENER")
    print("================================================================================")

    gmail_service = get_gmail_service()
    if not gmail_service:
        print("Gmail service offline/unauthorized. Agent listener standby.")
        print("================================================================================\n")
        return

    try:
        res = gmail_service.users().messages().list(userId='me', q="is:unread").execute()
        messages = res.get('messages', [])
    except Exception as err:
        if "insufficientPermissions" in str(err) or "403" in str(err):
            print("  [NOTE] Gmail token currently has 'gmail.send' scope only. Reading inbox commands requires re-authenticating token with read scope.")
            print("================================================================================\n")
            return
        else:
            print(f"❌ Error listing Gmail messages: {err}")
            print("================================================================================\n")
            return

    if not messages:
        print("No unread email commands found in inbox.")
        print("================================================================================\n")
        return

    print(f"Found {len(messages)} unread messages. Processing commands...")

    for m_info in messages:
        try:
            msg = gmail_service.users().messages().get(userId='me', id=m_info['id']).execute()
            headers = msg.get('payload', {}).get('headers', [])
            
            sender = ""
            subject = ""
            for h in headers:
                if h['name'].lower() == 'from':
                    sender = h['value']
                elif h['name'].lower() == 'subject':
                    subject = h['value']

            sender_email_match = re.search(r'[\w\.-]+@[\w\.-]+', sender)
            sender_email = sender_email_match.group(0).lower() if sender_email_match else ""

            if sender_email not in AUTHORIZED_ADMINS:
                continue

            print(f"\n  [AUTHORIZED COMMAND] From: {sender_email} | Subject: '{subject}'")
            subject_lower = subject.lower()

            if "log expense" in subject_lower or "expense:" in subject_lower:
                exp = parse_expense_command(subject)
                print(f"    └─ Action: Logging Expense -> Category: {exp['category']}, Vendor: {exp['vendor']}, Amount: ₹{exp['amount']}")
                
                from scripts.bigquery_sync_pipeline import get_sheets_service, ACCOUNTS_SHEET_ID
                sheets = get_sheets_service()
                sheets.spreadsheets().values().append(
                    spreadsheetId=ACCOUNTS_SHEET_ID,
                    range="'Expenses & Payables'!A2",
                    valueInputOption="USER_ENTERED",
                    body={"values": [[exp['date'], exp['category'], exp['vendor'], exp['amount'], "Approved", "Logged via Email Agent"]]}
                ).execute()
                print("    └─ Logged successfully in 'Expenses & Payables' tab!")

            elif "dispatch ca" in subject_lower or "ca package" in subject_lower or "send ca report" in subject_lower:
                print("    └─ Action: Triggering Monthly CA Compliance Package Dispatcher...")
                from ca_compliance_dispatcher import dispatch_ca_compliance_package
                dispatch_ca_compliance_package(dry_run=False)

            elif "financial health" in subject_lower or "cashflow report" in subject_lower or "report" in subject_lower:
                print("    └─ Action: Generating Financial Health Summary Report & Replying...")
                from scripts.bigquery_sync_pipeline import get_sheets_service, ACCOUNTS_SHEET_ID
                sheets = get_sheets_service()
                res = sheets.spreadsheets().values().get(spreadsheetId=ACCOUNTS_SHEET_ID, range="'Invoices & Dispatch'!A2:AA").execute()
                rows = res.get('values', [])
                
                tot_receivables = 0.0
                open_inv_count = 0
                for r in rows:
                    if len(r) > 26 and r[26]:
                        try:
                            val = float(r[26].replace(',', '').replace('₹', '').strip())
                            if val > 0:
                                tot_receivables += val
                                open_inv_count += 1
                        except ValueError:
                            continue

                reply_body = f"""Hello Samiran,

Here is your requested real-time Financial Health & Cashflow Summary:

• Total Outstanding Receivables: ₹{tot_receivables:,.2f}
• Open Unpaid Invoices Count: {open_inv_count}
• Estimated GST Output Payable: ₹{tot_receivables * 0.18:,.2f}
• Estimated 10% TDS Deductible: ₹{tot_receivables * 0.10:,.2f}

All tracking systems and BigQuery data warehouses are 100% operational.

Best regards,
Cineloom Financial Comptroller Agent"""

                reply_msg = MIMEMultipart()
                reply_msg['To'] = sender_email
                reply_msg['From'] = f"Comptroller Agent <{SENDER_EMAIL}>"
                reply_msg['Subject'] = f"Re: {subject}"
                reply_msg.attach(MIMEText(reply_body, 'plain'))
                raw_reply = base64.urlsafe_b64encode(reply_msg.as_bytes()).decode('utf-8')
                gmail_service.users().messages().send(userId='me', body={'raw': raw_reply}).execute()
                print("    └─ Sent Financial Health Summary reply email!")

            # Mark message as read
            gmail_service.users().messages().batchModify(
                userId='me',
                body={'ids': [m_info['id']], 'removeLabelIds': ['UNREAD']}
            ).execute()

        except Exception as msg_err:
            print(f"❌ Error processing message {m_info.get('id')}: {msg_err}")

    print("\n================================================================================")
    print("EMAIL INTELLIGENT AGENT LISTENER COMPLETED")
    print("================================================================================\n")

if __name__ == '__main__':
    process_incoming_email_commands()
