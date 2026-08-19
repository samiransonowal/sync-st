# 🛡️ Cross-Architecture 3-Tier Governance Mandate
**Studio Tunnel / Cineloom Postworks Pvt. Ltd.**

---

## 1. Executive Summary & Policy Statement

To maintain 100% data sanity, prevent accidental corruption of live ledger data, and safeguard financial compliance, the entire Studio Tunnel infrastructure operates under a **strictly enforced 3-Tier Environment Architecture**:

1. **Dev (`dev`)**: ⭐️ **PERMANENT DEFAULT BRANCH & WORKING ENVIRONMENT**.
2. **Test (`test`)**: ⚠️ **AUXILIARY SANDBOX (HUMAN INTERVENTION & ESCALATION ONLY)**.
3. **PML (`pml`)**: 🔒 **PRODUCTION MAIN LIVE (MANDATORY 2-PARTY CONFIRMATION)**.

This policy applies universally across **Git/GitHub**, **Google Sheets**, **Google Apps Script**, **Google BigQuery**, **Python Automation Engines**, and **Cloud Functions**.

---

## 2. Universal 3-Tier Architecture Matrix

| Layer | Tier 1: DEV (Default) | Tier 2: TEST (Escalation Only) | Tier 3: PML (2-Party Confirmed) |
| :--- | :--- | :--- | :--- |
| **Git & GitHub** | `dev` *(Default branch on GitHub & Local)* | `test` *(Protected testing branch)* | `pml` *(Production Main Live branch)* |
| **Access Policy** | Unrestricted development | Restricted; Human escalation required | Restricted; 2-Party confirmation required |
| **Google Apps Script** | `ST-IN-gen-dev` | `ST-IN-gen-test` | `ST-IN-gen-pml` |
| **GAS UI Menu** | `🚀 Studio Tunnel [DEV]` | `🚀 Studio Tunnel [TEST]` | `🚀 Studio Tunnel [PML]` |
| **Dry Run Safeguard** | `DRY_RUN_MODE = true` | `DRY_RUN_MODE = true` | `DRY_RUN_MODE = false` |
| **GCP Project** | `st-in-gen` (`972643538415`) | `st-in-gen` (`972643538415`) | `st-in-gen` (`972643538415`) |
| **BigQuery Dataset** | `st_fin_com_prog_dev` | `st_fin_com_prog_test` | `st_fin_com_prog_pml` |
| **GCP Region** | `asia-south1` (Mumbai) | `asia-south1` (Mumbai) | `asia-south1` (Mumbai) |
| **Google Sheets** | Sandbox Dev copy / Mock sheets | Sandbox Staging copy | Live Master (`PROJECT TRACKER`, `ACCOUNTS`) |
| **Outbound Email** | Suppressed / Internal only | Suppressed / Internal only | Internal review routing + 2-Party prompt |

---

## 3. Governance Rules by Component

### A. 🐙 Git & GitHub Repository (`IN-gen`)
1. **Permanent Default Branch (`dev`)**:
   - Every workstation clone, new feature branch, and pull request targets `dev` by default.
   - Developers work freely on `dev` without blocking permissions.
2. **Restricted Sandbox (`test`)**:
   - No engineer may push or attempt to work on `test` without prior manual testing verification and explicit human escalation.
   - Used exclusively for staging validation before release.
3. **Production Main Live (`pml`)**:
   - Direct pushing to `pml` is strictly prohibited.
   - Pushing, updating, or deploying to `pml` requires **2-party confirmation**:
     - **Party 1:** Requesting Developer / Author (`jay@studiotunnel.com` / `samiran@studiotunnel.com`).
     - **Party 2:** GCP Administrator (`lab@studiotunnel.com`) via the interactive push consent system (`python scripts/request_push_consent.py`).

---

### B. 📊 Google Sheets & Apps Script
1. **Dynamic Environment Banner**:
   - When any Google Spreadsheet is opened, the custom menu dynamically reflects the active tier:
     - `🚀 Studio Tunnel [DEV]`
     - `🚀 Studio Tunnel [TEST]`
     - `🚀 Studio Tunnel [PML]`
2. **Environment & Policy Status Inspector**:
   - Accessible via `🚀 Studio Tunnel [...]` > `🛡️ Environment & Governance Status`.
   - Displays active tier, BigQuery target dataset, and active safety rules.
3. **Execution Guards**:
   - In `DEV` and `TEST`, `DRY_RUN_MODE = true` ensures no external client emails, Drive overwrites, or live ledger writes can occur.
   - In `PML`, triggering `📧 Generate & Email Invoice to Client` displays an interactive **2-Party Production Confirmation Dialog** requiring explicit user confirmation before dispatching.

---

### C. 🗄️ Google BigQuery Datasets
1. **1 Single GCP Project (`st-in-gen`)**:
   - All environments reside inside project `st-in-gen` in region `asia-south1` (Mumbai).
2. **3 Isolated Datasets**:
   - `st-in-gen.st_fin_com_prog_dev`: For experimental schema adjustments and test data.
   - `st-in-gen.st_fin_com_prog_test`: For automated integration test suites.
   - `st-in-gen.st_fin_com_prog_pml`: For live operational tax invoices, bank reconciliation records, and financial statements.
3. **DDL & Ingestion Enforcement**:
   - `scripts/setup_bigquery_tables.py --env <dev|test|pml>`
   - `scripts/bigquery_sync_pipeline.py --env <dev|test|pml>`
   - Any CLI command targeting `pml` will automatically halt and require `--confirm-pml`.

---

### D. 🐍 Python Automation & Master Comptroller
All background engines (`payment_aging_engine`, `ca_compliance_dispatcher`, `bank_reconciliation_matcher`, `run_comptroller_engines.py`) default to `dev`:
```bash
# Default (Dev sandbox — 100% safe):
python scripts/run_comptroller_engines.py

# Test environment (Human escalation):
python scripts/run_comptroller_engines.py --env test

# PML production run (Requires 2-party confirmation flag):
python scripts/run_comptroller_engines.py --env pml --confirm-pml
```

---

## 4. Verification & Audit Trail

| Test Script | Execution Command | Assertion |
|---|---|---|
| **System Integrity Suite** | `python engine/python-scripts/test_system_integrity.py` | 6/6 tests passing across GSTIN, users, PAN, and 3-tier datasets. |
| **Apps Script Self-Test** | `6_SelfTest.gs` -> `runSelfTest()` | 7/7 tests passing including T7 (3-Tier & BigQuery dataset isolation). |
| **BigQuery Multi-Tier Dry Run** | `python engine/python-scripts/dry_run_bigquery.py --env all` | Simulates isolated SQL insertion across Dev, Test, and PML. |
