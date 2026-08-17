# IAM Permissions & User Identity Access Matrix

**Program:** Studio Tunnel Financial Comptroller Program  
**Engine Shortcode:** `ST-IN-gen`  
**GCP Project:** `st-in-gen` (`972643538415`)  
**Target Owner Identity:** Samiran Sonowal (`samiran@studiotunnel.com`)  
**Infrastructure Admin Identity:** Tech Dev Lab (`lab@studiotunnel.com`)  
**Document Status:** 📝 **OPEN FOR REVIEW & SIGN-OFF**  
**Date:** 17 August 2026  

---

## 1. Overview & Identity Scope

While `lab@studiotunnel.com` serves as the service and infrastructure administration account for automated pipelines, **`samiran@studiotunnel.com`** operates as the **Studio Owner, Managing Director, and Data Owner**.

This document outlines the precise permission matrix required for `samiran@studiotunnel.com` to operate, debug, test, and deploy `ST-IN-gen` across Google Cloud Platform, Google Workspace, Google Apps Script, and GitHub.

---

## 2. Required Permission Matrix

### A. ☁️ Google Cloud Platform (GCP Project: `st-in-gen` / `972643538415`)

| GCP Service | Required IAM Role | Purpose / Scope | Granting Identity |
| :--- | :--- | :--- | :--- |
| **GCP Project** | `Project Editor` or `Project Owner` | Administer GCP APIs, Service Accounts, and IAM bindings | `lab@studiotunnel.com` |
| **BigQuery Data Warehouse** | `BigQuery Data Owner` / `BigQuery Admin` | Create, query, and modify tables in dataset `st_fin_com_prog` (`asia-south1`) | `lab@studiotunnel.com` |
| **BigQuery Engine** | `BigQuery Job User` | Execute SQL dry-runs, schema validation, and reporting queries | `lab@studiotunnel.com` |
| **Service Accounts** | `Service Account User` | Inspect/utilize service accounts for local dry-runs and schema tests | `lab@studiotunnel.com` |

> [!TIP]
> **Automated Delegation Script Available**:  
> To execute these IAM role bindings automatically, `lab@studiotunnel.com` can run:
> ```bash
> bash scripts/grant_iam_permissions.sh
> ```

---

### B. 📊 Google Drive & Sheets Access

| Asset / Resource | Permission Level | Required URL / ID | Purpose |
| :--- | :--- | :--- | :--- |
| **ACCOUNTS Sheet** | `Editor` | `1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A` | Client master dataset & ledger billing doorway |
| **PROJECT TRACKER Sheet** | `Editor` | `1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0` | Production job tracking doorway |
| **INVOICES_GENERATED Folder**| `Editor` | Google Drive Target Folder | Auto-ingestion location for generated PDF/HTML/XLSX/DOCX |
| **STEM User Registry Sheet** | `Viewer` / `Editor` | `1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA` | Cross-reference user directory spreadsheet |

---

### C. ⚙️ Google Apps Script & Clasp Deployment

| System | Setting / Role | Configuration Link / Command | Purpose |
| :--- | :--- | :--- | :--- |
| **Apps Script Project** | `Editor` | Bound container script on Master Sheet | Edit, test, and run `6_SelfTest.gs` and invoice generation |
| **Google Apps Script API** | `ON` | [script.google.com/home/usersettings](https://script.google.com/home/usersettings) | Enable CLI deployments via `clasp push` from local machine |
| **OAuth Consent Screen** | `Test User` | GCP Console > APIs & Services > OAuth Consent Screen | Authorize local OAuth tokens for `samiran@studiotunnel.com` |

---

### D. 📧 Gmail & Email Dispatch API

| System | Role / Setting | Scope / Reference | Purpose |
| :--- | :--- | :--- | :--- |
| **Gmail API OAuth Scope** | `https://www.googleapis.com/auth/gmail.send` | `scripts/send_dispatch_email.py` | Dispatch onboarding and review emails |
| **Internal Review Matrix** | `AUTHORIZED_INTERNAL_EMAIL_RECIPIENTS` | `engine/google-apps-script/0_Config.gs` | Receive strict internal draft previews and audit logs |

---

### E. 🐙 GitHub Repository & Branch Push Governance (`IN-gen`)

| Branch | Permission Level | Consent Requirement | Purpose / Scope |
| :--- | :--- | :--- | :--- |
| **`dev` (Development)** | `UNRESTRICTED` | **No permission required** | Direct commit and push access for Samiran (`samiran@studiotunnel.com`) |
| **`test` (Testing)** | `UNRESTRICTED` | **No permission required** | Direct commit and push access for Samiran (`samiran@studiotunnel.com`) |
| **`prod` / `main` (Production)** | `APPROVAL REQUIRED` | **Consent required from `lab@`** | Production deployment requires approval email dispatch & "Give Consent" button click by `lab@studiotunnel.com` |

> [!CAUTION]
> ### 🛑 BRANCH PUSH PERMISSION & CONSENT POLICY
> 1. **`dev` & `test` Branches**: Pushing to development (`dev`) and testing (`test`) branches does **not** require any prior approval or permission. Samiran (`samiran@studiotunnel.com`) has unrestricted push access to `dev` and `test`.
> 2. **`prod` (`main`) Production Branch**: Pushing or promoting code to the production branch (`prod` / `main`) **REQUIRES PRIOR CONSENT FROM `lab@studiotunnel.com`**.
> 3. **Production Consent Mechanism**: For production pushes, `lab@studiotunnel.com` receives an automated approval request email sent from `samiran@studiotunnel.com` (via `python scripts/request_push_consent.py`) and clicks the interactive **"Give Consent"** button or hyperlink inside the email.

---

## 3. Team Verification & Sign-off Checklist

> [!IMPORTANT]
> Please review the status of each requirement below and update the table as permissions are verified.

| # | Item | Status | Verified By | Date Verified | Notes / Review Comments |
| :-: | :--- | :-: | :--- | :--- | :--- |
| 1 | GCP Project Owner/Editor on `st-in-gen` | 🔲 PENDING | `lab@studiotunnel.com` | | Pending IAM invitation from `lab@` |
| 2 | BigQuery Data Owner on `st_fin_com_prog` | 🔲 PENDING | `lab@studiotunnel.com` | | Dataset created in `asia-south1` |
| 3 | Editor access on ACCOUNTS Sheet | ✅ VERIFIED | `samiran@studiotunnel.com` | 17 Aug 2026 | Active access confirmed |
| 4 | Editor access on PROJECT TRACKER Sheet | ✅ VERIFIED | `samiran@studiotunnel.com` | 17 Aug 2026 | Active access confirmed |
| 5 | Google Apps Script API enabled (ON) | ✅ VERIFIED | `samiran@studiotunnel.com` | 17 Aug 2026 | Local `clasp` v2.5.0 verified |
| 6 | Git Author Identity set to `samiran@...` | ✅ VERIFIED | `samiran@studiotunnel.com` | 17 Aug 2026 | Verified via diagnostic script |
| 7 | Added to `0_Config.gs` internal emails | ✅ VERIFIED | `samiran@studiotunnel.com` | 17 Aug 2026 | Hardcoded in `AUTHORIZED_INTERNAL_EMAIL_RECIPIENTS` |
| 8 | Git Push Consent & Main Branch Lock Rule | ✅ VERIFIED | `lab@studiotunnel.com` | 17 Aug 2026 | Consent requirement & main branch lock documented |

---

## 4. Review Comments & Notes

> [!NOTE]
> Team members can add inline comments and review notes below before final sign-off.

* **Reviewer (Samiran Sonowal - `samiran@studiotunnel.com`):**
  * *Comment:* "Local environment verified with 10/10 checks. Git push rules updated: Pushes require `lab@` consent, and `main` branch is locked after initial synchronized push."
* **Reviewer (Tech Dev - `lab@studiotunnel.com`):**
  * *Comment:* "Approved push governance policy and main branch lock. Pending review of IAM role binding script."

