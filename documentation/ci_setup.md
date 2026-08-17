# ST-IN-gen CI/CD & Pipeline Setup Guide

This guide documents the automated Google Apps Script CI/CD pipeline for **ST-IN-gen (Studio Tunnel Invoice Generator)**.

---

## 1. Overview & Architecture

The deployment architecture uses three isolated Google Apps Script projects tied to specific Git branches:

| Environment | Branch | Apps Script Title | Mode / Permissions |
|-------------|--------|-------------------|-------------------|
| **Development** | `dev` | `ST-IN-gen-dev` | `DRY_RUN_MODE = true` (Iterative coding, isolated Drive writes) |
| **Testing / Staging** | `test` | `ST-IN-gen-test` | `DRY_RUN_MODE = true` (Full integration testing, sandbox verification) |
| **Production** | `prod` (or `main`) | `ST-IN-gen-prod` | `DRY_RUN_MODE = false` (Live PDF invoice generation, real emails/Discord) |

---

## 2. Google Cloud Platform Details

- **GCP Project ID**: `st-in-gen`
- **GCP Project Number**: `972643538415`
- **GCP Admin Account**: `lab@studiotunnel.com`
- **OAuth Client**: `ST-IN-gen-v1` (`972643538415-iotqsas6uh5uanjjgdmal16phvfnsvup.apps.googleusercontent.com`)

---

## 3. One-Time Setup: Creating Apps Script Projects

Run the following commands using clasp:

```bash
cd "d:/Studio Tunnel/INVOICE_APP"

# Create DEV project
clasp create --title "ST-IN-gen-dev" --type standalone --rootDir ./engine/google-apps-script
# -> Output provides <DEV_SCRIPT_ID>

# Create TEST project
clasp create --title "ST-IN-gen-test" --type standalone --rootDir ./engine/google-apps-script
# -> Output provides <TEST_SCRIPT_ID>

# Create PROD project
clasp create --title "ST-IN-gen-prod" --type standalone --rootDir ./engine/google-apps-script
# -> Output provides <PROD_SCRIPT_ID>
```

Construct the `SCRIPT_IDS_JSON` configuration:
```json
{
  "dev": "<DEV_SCRIPT_ID>",
  "test": "<TEST_SCRIPT_ID>",
  "prod": "<PROD_SCRIPT_ID>",
  "main": "<PROD_SCRIPT_ID>"
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

# 2. Run system integrity & schema tests (Python)
npm test

# 3. Test environment config injection (dry-run mode switch and .clasp.json generation)
npm run set-env

# 4. Push to current linked script project (manual sanity check)
npm run clasp-push
```

---

## 6. Pipeline Workflow Summary

1. Pushes to `dev`, `test`, or `prod` trigger `.github/workflows/gas-ci.yml`.
2. Python validates schemas (`users.yaml`, `users.json`, GSTIN/PAN regex rules).
3. `scripts/setEnv.js` detects the branch, writes `.clasp.json` with the corresponding `scriptId`, and toggles `DRY_RUN_MODE` in `0_Config.gs`.
4. Clasp authenticates and deploys the code directly to Google Apps Script.
