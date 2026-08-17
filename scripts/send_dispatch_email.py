#!/usr/bin/env python3
"""
ST-IN-gen — Automated Email Dispatch via Google Cloud Platform (Gmail API)
Script: scripts/send_dispatch_email.py

Sends the official ST-IN-gen v0.7 intro and onboarding email to Samiran
from lab@studiotunnel.com using Google Cloud Platform OAuth2 & Gmail API.
"""

import os
import sys
import base64
import json
import urllib.parse
import urllib.request
import webbrowser
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

RECIPIENT_EMAIL = "samiran@studiotunnel.com"
SENDER_EMAIL = "lab@studiotunnel.com"
SUBJECT = "Welcome to ST-IN-gen (v0.7) — Invoice Comptroller, CI/CD Pipeline & Workstation Setup"


def get_gmail_service(repo_root):
    creds = None
    token_path = repo_root / "credentials" / "private" / "gmail_token.json"
    client_secret_path = repo_root / "credentials" / "private" / "client_secret_972643538415-iotqsas6uh5uanjjgdmal16phvfnsvup.apps.googleusercontent.com.json"

    # 1. Check existing cached token
    if token_path.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception as e:
            print(f"[WARN] Existing token read error: {e}", flush=True)

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(token_path, 'w', encoding='utf-8') as f:
                f.write(creds.to_json())
            print("[OK] Token refreshed successfully.", flush=True)
        except Exception as e:
            print(f"[WARN] Token refresh failed: {e}", flush=True)
            creds = None

    # 2. Perform OAuth2 flow if no valid credentials
    if not creds or not creds.valid:
        if not client_secret_path.exists():
            raise FileNotFoundError(f"Missing client secret file at {client_secret_path}")

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
        print("2. Sign in with: lab@studiotunnel.com (or select lab@studiotunnel.com)")
        print("3. Click 'Allow / Continue' to grant Gmail send permission.")
        print("4. Google will redirect to OAuth Playground with an Authorization Code.")
        print("5. Copy that code (or the value of 'code=' from the address bar) and paste it below.")
        print("=" * 75, flush=True)
        print(f"\n👉 Direct Link:\n{auth_url}\n", flush=True)
        print("=" * 75, flush=True)

        try:
            webbrowser.open(auth_url, new=2)
        except Exception:
            pass

        auth_code = input("👉 Paste the Authorization Code here: ").strip()

        # If user pasted the whole redirect URL by accident, extract 'code' parameter
        if "code=" in auth_code:
            parsed = urllib.parse.urlparse(auth_code)
            params = urllib.parse.parse_qs(parsed.query)
            if "code" in params:
                auth_code = params["code"][0]
            else:
                # Check fragment
                params_frag = urllib.parse.parse_qs(parsed.fragment)
                if "code" in params_frag:
                    auth_code = params_frag["code"][0]

        print("\n[INFO] Exchanging authorization code for OAuth tokens...", flush=True)
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


def create_email_message():
    msg = MIMEMultipart('alternative')
    msg['To'] = RECIPIENT_EMAIL
    msg['From'] = f"Studio Tunnel Admin <{SENDER_EMAIL}>"
    msg['Subject'] = SUBJECT

    plain_text = """Hi Samiran,

We’ve reached a major milestone for ST-IN-gen (Studio Tunnel Financial Comptroller & Vector Invoice Engine), now released at v0.7 with full CI/CD automation and multi-OS developer support.

Here is everything you need to get your laptop configured and start collaborating using Antigravity IDE or VS Code.

---------------------------------------------------------------------------
1. 🛠️ 1-Minute Workstation Diagnostic
---------------------------------------------------------------------------
Before writing code or running scripts, we’ve built an automated diagnostic tool that tests your laptop (whether you are on Windows 11, macOS, Debian/Ubuntu, or Rocky Linux / RHEL in the studio):

# Clone the repository:
git clone https://github.com/jd-tunnel/IN-gen.git
cd IN-gen

# Run the workstation diagnostic:
python scripts/check_dev_environment.py
# (or via npm shortcut: npm run check-env)

The script automatically verifies:
- Python (3.8+) & pyyaml
- Node.js (18+) & npm
- Git configuration (user.name & user.email)
- Google Clasp CLI (@google/clasp)
- Google Cloud SDK (gcloud)
- Local codebase and configuration integrity

If any dependency is missing, the diagnostic prints the exact copy-paste install command for your specific operating system.

---------------------------------------------------------------------------
2. 📦 Core Project Architecture (3-Silo Environments)
---------------------------------------------------------------------------
The project now maintains 3 isolated cloud environments mapped to Git branches:

- Development (branch: dev) -> ST-IN-gen-dev [DRY_RUN_MODE = true]
- Staging/Testing (branch: test) -> ST-IN-gen-test [DRY_RUN_MODE = true]
- Production (branch: prod / main) -> ST-IN-gen-prod [DRY_RUN_MODE = false] (Live PDFs, Gmail & Discord alerts)

---------------------------------------------------------------------------
3. 🧪 Testing & Verification Commands
---------------------------------------------------------------------------
Whenever you make changes, you can run our test suite locally:

# 1. Run System Integrity Suite (Schemas, GSTIN/PAN regex, IST dates, tax math):
npm test
# (or: python engine/python-scripts/test_system_integrity.py)

# 2. Run BigQuery Data Flow & SQL Dry-Run:
python engine/python-scripts/dry_run_bigquery.py

# 3. Sync Users Directory:
python engine/python-scripts/sync_users.py

---------------------------------------------------------------------------
4. 📚 Key Documentation Links
---------------------------------------------------------------------------
All specifications and guides are indexed in the repository:
- Master Documentation Index: documentation/documentation_index.md
- CI/CD Pipeline Guide: documentation/ci_setup.md
- OS Support & Setup Matrix: documentation/tech-stack/07_developer_environment_and_os_support.md
- STEM External User Registry: documentation/organization/stem_user_registry.md

Let me know once you’ve run the diagnostic on your machine!

Best regards,
Jay
Lead Developer — Studio Tunnel / Cineloom Postworks Pvt. Ltd.
jay@studiotunnel.com

===========================================================================
⚡ Sent automatically by ST-IN-gen (Studio Tunnel Financial Comptroller Program)
   via Google Cloud Platform (Project: st-in-gen, 972643538415) & Gmail API.
   Sender Account: lab@studiotunnel.com
===========================================================================
"""

    html_content = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #1A1A1A; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #00E599; padding-bottom: 16px; margin-bottom: 24px; }
    .header h2 { margin: 0; color: #0f172a; font-size: 22px; }
    .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-top: 6px; }
    .section-title { color: #1e293b; font-size: 16px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; border-left: 4px solid #00E599; padding-left: 10px; }
    pre { background: #0f172a; color: #38bdf8; padding: 14px; border-radius: 8px; font-size: 13px; overflow-x: auto; font-family: 'Consolas', 'Courier New', monospace; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 600; }
    td { padding: 8px 12px; border: 1px solid #cbd5e1; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; background: #f8fafc; padding: 14px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚀 Welcome to ST-IN-gen (v0.7)</h2>
      <div class="badge">Studio Tunnel Financial Comptroller Program &bull; CI/CD Release</div>
    </div>

    <p>Hi Samiran,</p>
    <p>We’ve reached a major milestone for <strong><code>ST-IN-gen</code></strong> (<em>Studio Tunnel Financial Comptroller &amp; Vector Invoice Engine</em>), now released at <strong><code>v0.7</code></strong> with full CI/CD automation and multi-OS developer support.</p>
    <p>Here is everything you need to get your laptop configured and start collaborating using <strong>Antigravity IDE</strong> or <strong>VS Code</strong>.</p>

    <div class="section-title">1. 🛠️ 1-Minute Workstation Diagnostic</div>
    <p>Before writing code or running scripts, we’ve built an automated diagnostic tool that tests your laptop (whether you are on <strong>Windows 11</strong>, <strong>macOS</strong>, <strong>Debian/Ubuntu</strong>, or <strong>Rocky Linux / RHEL</strong> in the studio):</p>
    <pre># Clone the repository:
git clone https://github.com/jd-tunnel/IN-gen.git
cd IN-gen

# Run the workstation diagnostic:
python scripts/check_dev_environment.py
# (or via npm shortcut: npm run check-env)</pre>
    <p>The script automatically verifies:</p>
    <ul>
      <li><strong>Python (3.8+)</strong> &amp; <code>pyyaml</code></li>
      <li><strong>Node.js (18+)</strong> &amp; <strong>npm</strong></li>
      <li><strong>Git configuration</strong> (<code>user.name</code> &amp; <code>user.email</code>)</li>
      <li><strong>Google Clasp CLI</strong> (<code>@google/clasp</code>)</li>
      <li><strong>Google Cloud SDK</strong> (<code>gcloud</code>)</li>
      <li>Local codebase and configuration integrity</li>
    </ul>

    <div class="section-title">2. 📦 Core Project Architecture (3-Silo Environments)</div>
    <table>
      <thead>
        <tr><th>Environment</th><th>Branch</th><th>Apps Script Target</th><th>Mode &amp; Permissions</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Development</strong></td><td><code>dev</code></td><td><code>ST-IN-gen-dev</code></td><td><code>DRY_RUN_MODE = true</code> (Iterative coding)</td></tr>
        <tr><td><strong>Staging / Testing</strong></td><td><code>test</code></td><td><code>ST-IN-gen-test</code></td><td><code>DRY_RUN_MODE = true</code> (Pre-prod verification)</td></tr>
        <tr><td><strong>Production</strong></td><td><code>prod</code> / <code>main</code></td><td><code>ST-IN-gen-prod</code></td><td><code>DRY_RUN_MODE = false</code> (Live PDFs &amp; alerts)</td></tr>
      </tbody>
    </table>

    <div class="section-title">3. 🧪 Testing &amp; Verification Commands</div>
    <pre># 1. Run System Integrity Suite:
npm test

# 2. Run BigQuery Data Flow Dry-Run:
python engine/python-scripts/dry_run_bigquery.py

# 3. Sync Users Directory:
python engine/python-scripts/sync_users.py</pre>

    <div class="section-title">4. 📚 Key Documentation Links</div>
    <ul>
      <li><strong>Master Documentation Index:</strong> <code>documentation/documentation_index.md</code></li>
      <li><strong>CI/CD Pipeline Guide:</strong> <code>documentation/ci_setup.md</code></li>
      <li><strong>OS Support &amp; Setup Matrix:</strong> <code>documentation/tech-stack/07_developer_environment_and_os_support.md</code></li>
      <li><strong>STEM External User Registry:</strong> <code>documentation/organization/stem_user_registry.md</code></li>
    </ul>

    <p>Let me know once you’ve run the diagnostic on your machine!</p>

    <p>Best regards,<br>
    <strong>Jay</strong><br>
    Lead Developer &mdash; Studio Tunnel / Cineloom Postworks Pvt. Ltd.<br>
    <a href="mailto:jay@studiotunnel.com">jay@studiotunnel.com</a></p>

    <div class="footer">
      ⚡ <strong>Sent automatically by ST-IN-gen</strong> (Studio Tunnel Financial Comptroller Program) via <strong>Google Cloud Platform</strong> (Project: <code>st-in-gen</code>, <code>972643538415</code>) &amp; <strong>Gmail API</strong>.<br>
      <strong>Sender Identity:</strong> <code>lab@studiotunnel.com</code>
    </div>
  </div>
</body>
</html>
"""

    msg.attach(MIMEText(plain_text, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))
    return msg


def main():
    repo_root = Path(__file__).resolve().parent.parent
    print("=" * 75, flush=True)
    print("ST-IN-gen — GCP GMAIL API DISPATCHER", flush=True)
    print("=" * 75, flush=True)
    print(f"From      : {SENDER_EMAIL} (GCP Project: st-in-gen)")
    print(f"Recipient : {RECIPIENT_EMAIL}")
    print(f"Subject   : {SUBJECT}")
    print("=" * 75, flush=True)

    try:
        service = get_gmail_service(repo_root)
        message = create_email_message()
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        print("[INFO] Sending message via Gmail API...", flush=True)
        sent_message = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()

        print("\n" + "=" * 75, flush=True)
        print("✨ SUCCESS: EMAIL DISPATCHED VIA GCP GMAIL API!")
        print(f"   From       : {SENDER_EMAIL}")
        print(f"   To         : {RECIPIENT_EMAIL}")
        print(f"   Message ID : {sent_message.get('id')}")
        print(f"   Thread ID  : {sent_message.get('threadId')}")
        print("=" * 75, flush=True)
        return 0

    except Exception as e:
        print(f"\n[ERROR] Error during email dispatch: {e}", flush=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
