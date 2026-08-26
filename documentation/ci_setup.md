# ST-Comptroller CI/CD & Pipeline Setup Guide

This guide documents the automated Google Apps Script CI/CD pipeline for **ST-Comptroller (st-comptroller)**.

---

## 1. Overview & Architecture

The deployment architecture uses three isolated Google Apps Script projects tied to specific Git branches:

| Environment Tier | Git Branch | Apps Script Title | BigQuery Dataset ID | Mode / Permissions |
|---|---|---|---|---|
| **Dev** | `dev` | `ST-IN-gen-dev` | `st_comptroller_dev` | `DRY_RUN_MODE = true` (Iterative coding, isolated Drive writes) |
| **Test** | `test` | `ST-IN-gen-test` | `st_comptroller_test` | `DRY_RUN_MODE = true` (Full integration testing, sandbox verification) |
| **PML** *(Production Main Live)* | `pml` | `ST-IN-gen-pml` | `st_comptroller_pml` | `DRY_RUN_MODE = false` (Live PDF invoice generation, real emails/alerts) |

---

## 2. Google Cloud Platform Details

- **GCP Project ID**: `sync-st`
- **GCP Project Number**: `972643538415`
- **GCP Admin Account**: `lab@studiotunnel.com`
- **OAuth Client**: `ST-IN-gen-v1` (`972643538415-iotqsas6uh5uanjjgdmal16phvfnsvup.apps.googleusercontent.com`)

---

## 3. One-Time Setup: Creating Apps Script Projects

Run the following commands using clasp:

```bash
# Create DEV project
clasp create --title "ST-IN-gen-dev" --type standalone --rootDir ./engine/google-apps-script
# -> Output provides <DEV_SCRIPT_ID>

# Create TEST project
clasp create --title "ST-IN-gen-test" --type standalone --rootDir ./engine/google-apps-script
# -> Output provides <TEST_SCRIPT_ID>

# Create PML project
clasp create --title "ST-IN-gen-pml" --type standalone --rootDir ./engine/google-apps-script
# -> Output provides <PML_SCRIPT_ID>
```

Construct the `SCRIPT_IDS_JSON` configuration:
```json
{
  "dev": "<DEV_SCRIPT_ID>",
  "test": "<TEST_SCRIPT_ID>",
  "pml": "<PML_SCRIPT_ID>"
}
```

---

## 4. GitHub Secrets Configuration

Navigate to **GitHub Repository → Settings → Secrets and variables → Actions** and add the following repository secrets:

| Secret Name | Description | Source |
|-------------|-------------|--------|
| `SCRIPT_IDS_JSON` | JSON string of branch-to-ScriptID mapping | Generated in Step 3 |
| `CLASP_TOKEN` | Clasp credentials JSON | Contents of `~/.clasprc.json` after running `clasp login` |
| `GCP_SA_KEY` | GCP Service Account Key JSON | Service account with Drive, Sheets, and Apps Script API roles |

---

## 5. Local Verification & Pipeline Execution

```bash
# 1. Install Node dependencies
npm ci

# 2. Run validations
npm test

# 3. Deploy to current linked script project
npm run clasp-push
```

---

## 6. Pipeline Workflow Summary

1. Pushes to `dev`, `test`, or `pml` trigger `.github/workflows/gas-ci.yml`.
2. Cloud deployment assets are validated.
3. Clasp authenticates and deploys the code directly to Google Apps Script.

---

## 7. Git Push & Branch Governance Mandate

> [!CAUTION]
> ### 🛑 BRANCH PROMOTION & GOVERNANCE MANDATE
> - **`dev` Branch (Permanent Default)**: Primary branch for all development work. Direct commits and feature branches must originate here.
> - **`test` Branch (Restricted Sandbox)**: **HUMAN ESCALATION MANDATORY.** Pushing to `test` is permitted only after explicit human testing verification and formal escalation.
> - **`pml` Branch (Production Main Live)**: **2-PARTY CONFIRMATION REQUIRED.** Promoting or deploying to `pml` requires dual authorization:
>   1. Lead Developer / Studio Owner (`jay@studiotunnel.com` / `samiran@studiotunnel.com`).
>   2. GCP Admin (`lab@studiotunnel.com`) via cloud push consent workflow.
