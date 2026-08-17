#!/usr/bin/env python3
"""
ST-IN-gen — Interactive Git Push Consent Dispatcher
Script: scripts/request_push_consent.py

Dispatches an official HTML push approval request email from samiran@studiotunnel.com
to lab@studiotunnel.com with an interactive "Give Consent" button/link.
"""

import os
import sys
import json
import base64
import argparse
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path
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


def get_git_info():
    try:
        branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], text=True).strip()
        commit_hash = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
        commit_msg = subprocess.check_output(["git", "log", "-1", "--pretty=%B"], text=True).strip()
        return branch, commit_hash, commit_msg
    except Exception:
        return "dev", "HEAD", "Working tree updates"


def get_gmail_service(repo_root):
    creds = None
    token_path = repo_root / "credentials" / "private" / "gmail_token.json"
    client_secret_path = repo_root / "credentials" / "private" / "client_secret_972643538415-iotqsas6uh5uanjjgdmal16phvfnsvup.apps.googleusercontent.com.json"

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
        if not client_secret_path.exists():
            print("[WARN] Client secret not found; cannot send push approval email automatically.")
            return None, None

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
            "scope": "https://www.googleapis.com/auth/gmail.send",
            "access_type": "offline",
            "prompt": "consent"
        }
        auth_url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(auth_params)
        return None, auth_url

    return build('gmail', 'v1', credentials=creds), None


def create_consent_email(branch, commit_hash, commit_msg, consent_url):
    msg = MIMEMultipart('alternative')
    msg['To'] = RECIPIENT_EMAIL
    msg['From'] = f"Samiran Sonowal <{SENDER_EMAIL}>"
    msg['Subject'] = f"🔒 [ST-IN-gen] Request for Git Push Consent — Branch: '{branch}' ({commit_hash})"

    text_body = f"""
ST-IN-gen Git Push Consent Request

From: Samiran Sonowal ({SENDER_EMAIL})
To: Tech Dev Lab ({RECIPIENT_EMAIL})

Target Branch : {branch}
Commit Hash   : {commit_hash}
Commit Message: {commit_msg}

To give consent for this push, click the link below:
{consent_url}
    """

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; color: #1A1A1A; padding: 20px; }}
    .card {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
    .header {{ background: #1A1A1A; color: #FFFFFF; padding: 20px; text-align: center; }}
    .header h2 {{ margin: 0; font-size: 18px; letter-spacing: 0.5px; color: #00E599; }}
    .content {{ padding: 24px; font-size: 14px; line-height: 1.6; }}
    .info-box {{ background: #F1F5F9; border-left: 4px solid #00E599; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 13px; }}
    .btn-container {{ text-align: center; margin: 30px 0 20px 0; }}
    .btn-consent {{ display: inline-block; background-color: #00E599; color: #1A1A1A; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
    .footer {{ font-size: 11px; color: #64748B; text-align: center; padding: 16px; border-top: 1px solid #E2E8F0; background: #FAFAFA; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>STUDIO TUNNEL — GIT PUSH CONSENT REQUEST</h2>
    </div>
    <div class="content">
      <p>Hello <strong>Tech Dev Lab</strong> (<code>lab@studiotunnel.com</code>),</p>
      <p>Samiran Sonowal (<code>samiran@studiotunnel.com</code>) is requesting explicit consent to push commits from local workstation to repository <strong><code>IN-gen</code></strong>.</p>
      
      <div class="info-box">
        <strong>Target Branch:</strong> <code>{branch}</code><br>
        <strong>Commit Hash:</strong> <code>{commit_hash}</code><br>
        <strong>Commit Message:</strong> {commit_msg}
      </div>

      <p>Please review the proposed changes and click the button below to authorize this push:</p>

      <div class="btn-container">
        <a href="{consent_url}" class="btn-consent">✅ Give Consent</a>
      </div>

      <p style="font-size:12px; color:#64748B; text-align:center;">
        If the button above does not open, copy and paste this hyperlink into your browser:<br>
        <a href="{consent_url}" style="color:#00E599;">{consent_url}</a>
      </p>
    </div>
    <div class="footer">
      Studio Tunnel Financial Comptroller Program (ST-IN-gen) &bull; Automated Security Governance
    </div>
  </div>
</body>
</html>
"""

    msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    return msg


def main():
    repo_root = Path(__file__).resolve().parent.parent
    branch, commit_hash, commit_msg = get_git_info()
    consent_url = f"{REPO_URL}/pulls"

    print("=" * 75)
    print("🔒 ST-IN-gen — DISPATCH GIT PUSH CONSENT REQUEST EMAIL")
    print("=" * 75)
    print(f"  Sender   : {SENDER_EMAIL}")
    print(f"  Recipient: {RECIPIENT_EMAIL}")
    print(f"  Branch   : {branch}")
    print(f"  Commit   : {commit_hash} ({commit_msg})")
    print(f"  Consent  : {consent_url}")
    print("=" * 75 + "\n")

    service, auth_url = get_gmail_service(repo_root)

    if service:
        msg = create_consent_email(branch, commit_hash, commit_msg, consent_url)
        raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
        try:
            sent_msg = service.users().messages().send(userId='me', body={'raw': raw_msg}).execute()
            print(f"✨ SUCCESS: Push consent request email dispatched to {RECIPIENT_EMAIL}!")
            print(f"   Message ID: {sent_msg.get('id')}")
            print(f"   Direct 'Give Consent' Link: {consent_url}\n")
        except Exception as e:
            print(f"❌ Error sending email: {e}")
    else:
        print(f"[INFO] Gmail service offline. Direct 'Give Consent' link generated for {RECIPIENT_EMAIL}:")
        print(f"👉 {consent_url}\n")


if __name__ == "__main__":
    main()
