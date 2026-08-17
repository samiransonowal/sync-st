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
    private_dir = repo_root / "credentials" / "private"
    token_path = private_dir / "gmail_token.json"
    
    # Find any client_secret_*.json file in credentials/private
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
        if not client_secret_path.exists():
            print(f"[WARN] Client secret not found at {client_secret_path}; cannot send push approval email automatically.")
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

        print("\n" + "=" * 75, flush=True)
        print("🔑 GOOGLE CLOUD OAUTH AUTHORIZATION (Project: st-in-gen)", flush=True)
        print("=" * 75, flush=True)
        print("1. Opening Google sign-in page in your browser...")
        print(f"2. Sign in with: {SENDER_EMAIL}")
        print("3. Click 'Allow / Continue' to grant Gmail send permission.")
        print("4. Copy the Authorization Code (or address bar URL) and paste it below.")
        print("=" * 75, flush=True)
        print(f"\n👉 Direct Link:\n{auth_url}\n", flush=True)
        print("=" * 75, flush=True)

        try:
            import webbrowser
            webbrowser.open(auth_url, new=2)
        except Exception:
            pass

        auth_code = input("👉 Paste the Authorization Code (or press Enter to skip automatic email): ").strip()
        if not auth_code:
            print("[INFO] Automatic email skipped.")
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
            token_response = json.loads(resp.read().decode('utf-8'))

        creds = Credentials(
            token=token_response.get("access_token"),
            refresh_token=token_response.get("refresh_token"),
            token_uri=token_url,
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )

        token_path.parent.mkdir(parents=True, exist_ok=True)
        with open(token_path, 'w', encoding='utf-8') as f:
            f.write(creds.to_json())
        print("[OK] OAuth token saved to credentials/private/gmail_token.json\n", flush=True)

    return build('gmail', 'v1', credentials=creds)


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
        <a href="{consent_url}" class="btn-consent">✅ Give Consent & Review Repo</a>
      </div>

      <p style="font-size:12px; color:#64748B; text-align:center;">
        <strong>Direct Hyperlink:</strong> <a href="{consent_url}" style="color:#00E599; font-weight:bold;">{consent_url}</a><br>
        <small><i>Note: If GitHub shows "404 Page Not Found", ensure you are signed into GitHub as <strong>jd-tunnel / lab@studiotunnel.com</strong> to access private repository resources.</i></small>
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
    consent_url = f"{REPO_URL}"

    print("=" * 75)
    print("🔒 ST-IN-gen — DISPATCH GIT PUSH CONSENT REQUEST EMAIL")
    print("=" * 75)
    print(f"  Sender   : {SENDER_EMAIL}")
    print(f"  Recipient: {RECIPIENT_EMAIL}")
    print(f"  Branch   : {branch}")
    print(f"  Commit   : {commit_hash} ({commit_msg})")
    print(f"  Consent  : {consent_url}")
    print("=" * 75 + "\n")

    service = get_gmail_service(repo_root)

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
