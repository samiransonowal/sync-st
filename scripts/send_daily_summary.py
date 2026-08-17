#!/usr/bin/env python3
"""
ST-IN-gen — Daily Work Summary Dispatcher
Script: scripts/send_daily_summary.py

Generates and sends an automated daily summary report of project changes,
commits, documentation updates, and test results from samiran@studiotunnel.com
to lab@studiotunnel.com.
"""

import os
import sys
import json
import base64
import subprocess
import urllib.parse
import urllib.request
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

SENDER_EMAIL = "samiran@studiotunnel.com"
RECIPIENT_EMAIL = "lab@studiotunnel.com"
REPO_URL = "https://github.com/jd-tunnel/IN-gen"


def get_recent_commits(count=5):
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
    client_secret_candidates = list(private_dir.glob("client_secret_*.json"))
    client_secret_path = client_secret_candidates[0] if client_secret_candidates else (private_dir / "client_secret_972643538415.json")

    if token_path.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception:
            creds = None

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(token_path, 'w', encoding='utf-8') as f:
                f.write(creds.to_json())
        except Exception:
            creds = None

    if not creds or not creds.valid:
        print("[WARN] Gmail credentials not authorized. Run python3 scripts/request_push_consent.py first to authorize token.")
        return None

    return build('gmail', 'v1', credentials=creds)


def send_summary_email(is_one_time_sync=False):
    repo_root = Path(__file__).resolve().parent.parent
    commits = get_recent_commits(7)
    today_str = datetime.now().strftime("%d %B %Y")

    subject = f"📊 [ST-IN-gen] Daily Work Summary & Main Branch Sync — {today_str}" if is_one_time_sync else f"📊 [ST-IN-gen] Daily Work Summary Report — {today_str}"

    commit_rows = ""
    for c in commits:
        commit_rows += f"""
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-family: monospace; font-weight: bold; font-size: 12px; color: #0F172A;">{c['hash']}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">{c['subject']}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">{c['date']}</td>
        </tr>
        """

    one_time_banner = ""
    if is_one_time_sync:
        one_time_banner = """
        <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px; font-size: 13px; color: #065F46;">
          <strong>✅ One-Time Sync Completed:</strong> All recent updates (multi-format invoice fixes, CI/CD graceful warnings, branch policies, and governance documentation) have been fast-forward merged and synchronized with the <code>main</code> branch.
        </div>
        """

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; color: #1A1A1A; padding: 20px; }}
    .card {{ max-width: 680px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
    .header {{ background: #1A1A1A; color: #FFFFFF; padding: 20px; text-align: center; }}
    .header h2 {{ margin: 0; font-size: 18px; letter-spacing: 0.5px; color: #00E599; }}
    .content {{ padding: 24px; font-size: 14px; line-height: 1.6; }}
    .section-title {{ font-weight: 700; font-size: 13px; text-transform: uppercase; color: #0F172A; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 8px; border-bottom: 2px solid #00E599; display: inline-block; padding-bottom: 2px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
    th {{ background-color: #1A1A1A; color: #CCCCCC; text-align: left; padding: 8px; font-size: 11px; }}
    .footer {{ font-size: 11px; color: #64748B; text-align: center; padding: 16px; border-top: 1px solid #E2E8F0; background: #FAFAFA; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>STUDIO TUNNEL — DAILY WORK SUMMARY REPORT</h2>
    </div>
    <div class="content">
      <p>Hello <strong>Tech Dev Lab</strong> (<code>lab@studiotunnel.com</code>),</p>
      <p>Here is the automated daily summary of work completed by Samiran Sonowal (<code>samiran@studiotunnel.com</code>) for project <strong>ST-IN-gen</strong>.</p>
      
      {one_time_banner}

      <div class="section-title">Key Work & Features Completed</div>
      <ul style="padding-left: 20px; margin-top: 6px;">
        <li><strong>Multi-Format Invoice Generator Fixes:</strong> Upgraded PDF, Excel (.xlsx), and Word (.docx) invoice engines with full Studio Tunnel Lexend design system, vector rendering, 8-column layout, number masks, and bank details.</li>
        <li><strong>GitHub Actions CI/CD Fix:</strong> Updated <code>scripts/setEnv.js</code> and <code>.github/workflows/gas-ci.yml</code> to handle missing repository secrets gracefully without triggering build failure emails.</li>
        <li><strong>Branch Push Policy Documented:</strong> Configured unrestricted push access for <code>dev</code> & <code>test</code> branches, and mandatory consent click-through for <code>prod</code> / <code>main</code> branch promotions.</li>
      </ul>

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
      <p style="font-size: 13px;">
        • <strong>Repository Root:</strong> <a href="{REPO_URL}" style="color: #00E599; font-weight: bold;">github.com/jd-tunnel/IN-gen</a><br>
        • <strong>Active Dev Branch:</strong> <a href="{REPO_URL}/tree/dev" style="color: #00E599; font-weight: bold;">github.com/jd-tunnel/IN-gen/tree/dev</a><br>
        • <strong>Main Branch:</strong> <a href="{REPO_URL}/tree/main" style="color: #00E599; font-weight: bold;">github.com/jd-tunnel/IN-gen/tree/main</a>
      </p>
    </div>
    <div class="footer">
      Studio Tunnel Financial Comptroller Program (ST-IN-gen) &bull; Automated Daily Work Report
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
    msg['From'] = f"Samiran Sonowal <{SENDER_EMAIL}>"
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
    try:
        sent_msg = service.users().messages().send(userId='me', body={'raw': raw_msg}).execute()
        print(f"✨ SUCCESS: Daily Work Summary email dispatched to {RECIPIENT_EMAIL}!")
        print(f"   Message ID: {sent_msg.get('id')}\n")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False


if __name__ == "__main__":
    is_one_time = "--one-time" in sys.argv or "-1" in sys.argv
    send_summary_email(is_one_time_sync=is_one_time)
