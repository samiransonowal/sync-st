#!/usr/bin/env python3
"""
ST-IN-gen — Daily Work Summary Dispatcher (v0.7 -> v0.9 Release Summary)
Script: scripts/send_daily_summary.py

Sends the comprehensive v0.7 -> v0.9 release architecture and governance summary
from lab@studiotunnel.com to samiran@studiotunnel.com via the Google Gmail API.
"""

import os
import sys
import base64
import subprocess
from pathlib import Path
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
        sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

SENDER_NAME = "Studio Tunnel Tech Dev Lab"
SENDER_EMAIL = "lab@studiotunnel.com"
RECIPIENT_EMAIL = "samiran@studiotunnel.com"
CC_EMAILS = ["lab@studiotunnel.com", "jay@studiotunnel.com"]
REPO_URL = "https://github.com/jd-tunnel/IN-gen"


def get_recent_commits(count=8):
    try:
        cmd = ["git", "log", f"-{count}", "--pretty=format:%h|%an|%ad|%s", "--date=format:%Y-%m-%d %H:%M"]
        output = subprocess.check_output(cmd, text=True).strip()
        commits = []
        for line in output.split('\n'):
            if line:
                parts = line.split('|')
                if len(parts) == 4:
                    commits.append({
                        "hash": parts[0],
                        "author": parts[1],
                        "date": parts[2],
                        "subject": parts[3]
                    })
        return commits
    except Exception:
        return []


def get_gmail_service(repo_root):
    creds = None
    private_dir = repo_root / "credentials" / "private"
    token_path = private_dir / "gmail_token.json"

    if token_path.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception as e:
            print(f"[WARN] Error reading gmail_token.json: {e}")
            creds = None

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(token_path, 'w', encoding='utf-8') as f:
                f.write(creds.to_json())
            print("🔑 Refreshed Gmail API OAuth Token successfully.")
        except Exception as e:
            print(f"[WARN] Error refreshing Gmail token: {e}")
            creds = None

    if not creds or not creds.valid:
        print("[ERROR] Valid Gmail credentials not available.")
        return None

    return build('gmail', 'v1', credentials=creds)


def send_summary_email():
    repo_root = Path(__file__).resolve().parent.parent
    commits = get_recent_commits(8)
    today_str = datetime.now().strftime("%d %B %Y")

    subject = f"📊 [ST-fin-com-prog] Architecture & Governance Upgrades Summary (v0.7 → v0.9) — {today_str}"

    commit_rows = ""
    for c in commits:
        commit_rows += f"""
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-family: monospace; font-weight: bold; font-size: 12px; color: #0F172A;">{c['hash']}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #334155;">{c['subject']}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">{c['date']}</td>
        </tr>
        """

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F1F5F9; color: #1E293B; margin: 0; padding: 24px; }}
    .card {{ max-width: 720px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); }}
    .header {{ background: #0F172A; color: #FFFFFF; padding: 28px 24px; text-align: center; border-bottom: 3px solid #10B981; }}
    .header h1 {{ margin: 0 0 6px 0; font-size: 20px; letter-spacing: 0.5px; color: #F8FAFC; }}
    .header .subtitle {{ margin: 0; font-size: 13px; color: #10B981; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }}
    .content {{ padding: 28px 24px; font-size: 14px; line-height: 1.65; }}
    .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }}
    .badge-dev {{ background-color: #DBEAFE; color: #1E40AF; }}
    .badge-test {{ background-color: #FEF3C7; color: #92400E; }}
    .badge-pml {{ background-color: #D1FAE5; color: #065F46; }}
    .section-title {{ font-weight: 700; font-size: 13px; text-transform: uppercase; color: #0F172A; letter-spacing: 0.5px; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #10B981; display: inline-block; padding-bottom: 3px; }}
    .highlight-box {{ background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #10B981; padding: 14px 18px; margin: 16px 0; border-radius: 6px; }}
    table {{ width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }}
    th {{ background-color: #0F172A; color: #F8FAFC; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }}
    td {{ padding: 10px 12px; border-bottom: 1px solid #E2E8F0; }}
    .footer {{ font-size: 12px; color: #64748B; text-align: center; padding: 20px; border-top: 1px solid #E2E8F0; background: #F8FAFC; }}
    a {{ color: #0284C7; text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>CINELOOM &bull; STUDIO TUNNEL</h1>
      <div class="subtitle">ST-fin-com-prog &bull; Release v0.7 → v0.9 Summary</div>
    </div>
    <div class="content">
      <p>Dear <strong>Samiran</strong> (<code>samiran@studiotunnel.com</code>),</p>
      <p>We have completed major architectural, data isolation, and governance upgrades for the <strong>Studio Tunnel Financial Comptroller Program (<code>ST-fin-com-prog</code>)</strong>, advancing the system from <strong><code>v0.7</code></strong> through <strong><code>v0.9</code> (`0.9.0`)</strong>.</p>

      <div class="highlight-box">
        <strong>🚀 Key Milestone:</strong> Universal 3-tier architecture (<strong>Dev, Test, PML</strong>) with dedicated Google Sheets suites, isolated BigQuery datasets, dynamic CI/CD branch injection, and mandatory multi-party sign-offs.
      </div>

      <div class="section-title">1. 🛡️ Universal 3-Tier Architecture & Governance Policy</div>
      <p>To ensure 100% data sanity and prevent test runs from polluting live financial records, all systems follow a standardized 3-tier structure:</p>
      
      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Git Branch</th>
            <th>Access & Promotion Policy</th>
            <th>GAS Project</th>
            <th>BigQuery Dataset</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge badge-dev">DEV</span></td>
            <td><code>dev</code></td>
            <td>⭐️ <strong>Permanent Default Branch</strong> (Unrestricted development & local tests)</td>
            <td><code>ST-IN-gen-dev</code></td>
            <td><code>st_fin_com_prog_dev</code></td>
          </tr>
          <tr>
            <td><span class="badge badge-test">TEST</span></td>
            <td><code>test</code></td>
            <td>⚠️ <strong>Human Escalation Only</strong> (Manual verification before promotion)</td>
            <td><code>ST-IN-gen-test</code></td>
            <td><code>st_fin_com_prog_test</code></td>
          </tr>
          <tr>
            <td><span class="badge badge-pml">PML</span></td>
            <td><code>pml</code></td>
            <td>🔒 <strong>Mandatory 2-Party Confirmation</strong> (Production Main Live)</td>
            <td><code>ST-IN-gen-pml</code></td>
            <td><code>st_fin_com_prog_pml</code></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">2. 📊 3 Dedicated Sets of Google Sheets Suites</div>
      <p>Each environment tier now connects to its own dedicated suite of Google Sheets:</p>
      <ul style="padding-left: 20px; margin-top: 6px; color: #334155;">
        <li><strong>Dev Suite:</strong> Dev copy of Accounts & Daily Bookings Project Tracker for safe local iterations.</li>
        <li><strong>Test Suite:</strong> Staging sandbox spreadsheets for automated integration test suites.</li>
        <li><strong>PML Suite:</strong> Official live operations <code>PROJECT TRACKER</code> and master <code>ACCOUNTS</code> sheet.</li>
        <li><strong>Dynamic CI/CD Injection (<code>scripts/setEnv.js</code>):</strong> Automatically writes the respective tier's sheet IDs into <code>0_Config.gs</code> and <code>.clasp.json</code> on every push.</li>
      </ul>

      <div class="section-title">3. 🗄️ Google BigQuery 3-Dataset Isolation</div>
      <ul style="padding-left: 20px; margin-top: 6px; color: #334155;">
        <li>Single GCP Project: <strong><code>st-in-gen</code> (<code>972643538415</code>)</strong> in <strong><code>asia-south1</code> (Mumbai)</strong>.</li>
        <li>3 isolated datasets: <code>st_fin_com_prog_dev</code>, <code>st_fin_com_prog_test</code>, and <code>st_fin_com_prog_pml</code>.</li>
        <li>Table setup (<code>scripts/setup_bigquery_tables.py</code>) and sync pipeline (<code>scripts/bigquery_sync_pipeline.py</code>) default to <code>dev</code> and require <code>--confirm-pml</code> for production modifications.</li>
      </ul>

      <div class="section-title">4. 🔒 Apps Script UI & Production Safeguards</div>
      <ul style="padding-left: 20px; margin-top: 6px; color: #334155;">
        <li><strong>Dynamic Menu Badge:</strong> Google Sheets top menu displays <code>🚀 Studio Tunnel [DEV]</code>, <code>[TEST]</code>, or <code>[PML]</code>.</li>
        <li><strong>Environment Status Inspector:</strong> Check active dataset, dry-run mode, and policies directly via <code>🛡️ Environment & Governance Status</code>.</li>
        <li><strong>PML 2-Party Prompt:</strong> Interactive confirmation prompt required in Google Sheets before any live invoice dispatch.</li>
        <li><strong>Outbound Email Safety:</strong> All outbound emails remain hard-locked to internal review addresses (<code>finance@</code>, <code>samiran@</code>, <code>contact@</code>, <code>tamash@</code>).</li>
      </ul>

      <div class="section-title">5. 🧪 Verification & Release Status</div>
      <p style="margin-bottom: 6px;">
        • <strong>System Integrity Test Suite:</strong> <strong style="color: #10B981;">6/6 Tests Passed (100%)</strong>.<br>
        • <strong>BigQuery Multi-Tier Dry Run:</strong> Passed across Dev, Test, and PML.<br>
        • <strong>Release Tags:</strong> Published <code>v0.9</code> and <code>v0.9.0</code> on GitHub.
      </p>

      <div class="section-title">Recent Git Commits</div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Commit</th>
            <th style="width: 60%;">Description</th>
            <th style="width: 25%;">Date</th>
          </tr>
        </thead>
        <tbody>
          {commit_rows}
        </tbody>
      </table>

      <div class="section-title">Repository Quick Links</div>
      <p style="font-size: 13px; line-height: 1.8;">
        • <strong>GitHub Repository:</strong> <a href="{REPO_URL}" style="font-weight: bold;">github.com/jd-tunnel/IN-gen</a><br>
        • <strong>Default Dev Branch:</strong> <a href="{REPO_URL}/tree/dev" style="font-weight: bold;">github.com/jd-tunnel/IN-gen/tree/dev</a><br>
        • <strong>Production PML Branch:</strong> <a href="{REPO_URL}/tree/pml" style="font-weight: bold;">github.com/jd-tunnel/IN-gen/tree/pml</a><br>
        • <strong>Architecture Mandate Doc:</strong> <a href="{REPO_URL}/blob/dev/documentation/organization/cross_architecture_3tier_mandate.md" style="font-weight: bold;">cross_architecture_3tier_mandate.md</a>
      </p>
    </div>
    <div class="footer">
      Studio Tunnel / Cineloom Postworks Pvt. Ltd. &bull; Financial Comptroller Automation (ST-fin-com-prog)
    </div>
  </div>
</body>
</html>
"""

    service = get_gmail_service(repo_root)
    if not service:
        print("[ERROR] Gmail API service unavailable.")
        return False

    msg = MIMEMultipart('alternative')
    msg['To'] = RECIPIENT_EMAIL
    msg['From'] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg['Cc'] = ", ".join(CC_EMAILS)
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
    try:
        sent_msg = service.users().messages().send(userId='me', body={'raw': raw_msg}).execute()
        print(f"✨ SUCCESS: Release Summary Email (v0.7 -> v0.9) dispatched to {RECIPIENT_EMAIL}!")
        print(f"   Sender: {SENDER_EMAIL}")
        print(f"   CC: {', '.join(CC_EMAILS)}")
        print(f"   Message ID: {sent_msg.get('id')}\n")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False


if __name__ == "__main__":
    send_summary_email()
