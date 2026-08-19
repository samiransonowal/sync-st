# ST-fin-com-prog — Version History & Changelog
# Program: Studio Tunnel Financial Comptroller Program
# Repository: jd-tunnel/IN-gen

This document tracks all release versions of **`ST-fin-com-prog`**, categorized by **Data Logic**, **Data Flow**, and **UI / UX**.

---

## 🏷️ Version History

### 📦 Release Version `v0.9` — *"3tier-governance-dedicated-sheets"*
**Date:** 2026-08-19  
**Git Tag:** `v0.9` / `v0.9.0`  

#### 🛡️ 3-Tier Architecture & Governance Mandate
- **Permanent Default Branch (`dev`)**: Configured `dev` as the official default branch on GitHub and local development workstations. All feature branches, experiments, and daily development start on `dev`.
- **Restricted Testing Sandbox (`test`)**: Mandated that work or promotion to `test` is permitted only after local test validation and explicit human escalation.
- **Production Main Live (`pml`)**: Standardized nomenclature from `main` to `pml` (`ST-IN-gen-pml`, dataset `st_fin_com_prog_pml`). Mandated 2-party confirmation (Author + GCP Admin `lab@studiotunnel.com`) before any production push or live dispatch.

#### 📊 3 Dedicated Sets of Google Sheets Suites
- **Isolated Spreadsheet Suites per Tier**:
  - `DEV`: `DEV_ACCOUNTS_SPREADSHEET_ID`, `DEV_PROJECT_TRACKER_SPREADSHEET_ID`, `DEV_STEM_USER_REGISTRY_ID`
  - `TEST`: `TEST_ACCOUNTS_SPREADSHEET_ID`, `TEST_PROJECT_TRACKER_SPREADSHEET_ID`, `TEST_STEM_USER_REGISTRY_ID`
  - `PML`: `PML_ACCOUNTS_SPREADSHEET_ID`, `PML_PROJECT_TRACKER_SPREADSHEET_ID`, `PML_STEM_USER_REGISTRY_ID`
- **Dynamic CI/CD Injection ([`scripts/setEnv.js`](file:///d:/Studio%20Tunnel/INVOICE_APP/scripts/setEnv.js))**: Injects tier-specific sheet IDs, `DRY_RUN_MODE`, `BIGQUERY_DATASET_ID`, and `.clasp.json` script IDs based on the active Git branch.
- **Dynamic Sheets UI ([`4_MenuUI.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/4_MenuUI.gs))**: Top menu bar dynamically displays active environment badge (`🚀 Studio Tunnel [DEV|TEST|PML]`) with interactive `🛡️ Environment & Governance Status` inspector dialog and interactive 2-Party confirmation prompt in PML.

#### 🗄️ Google BigQuery 3-Tier Dataset Isolation
- Established 3 isolated BigQuery datasets under single GCP Project `st-in-gen` in `asia-south1` (Mumbai): `st_fin_com_prog_dev`, `st_fin_com_prog_test`, `st_fin_com_prog_pml`.
- Upgraded DDL initializer ([`scripts/setup_bigquery_tables.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/scripts/setup_bigquery_tables.py)) and sync pipeline ([`scripts/bigquery_sync_pipeline.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/scripts/bigquery_sync_pipeline.py)) with `--env dev|test|pml|all` CLI support and `--confirm-pml` execution guardrails.

#### 🧪 System Verification & Architecture Specs
- Upgraded System Integrity Suite ([`test_system_integrity.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/python-scripts/test_system_integrity.py)) to 6/6 tests passing (100%), asserting 3-tier environment standards, isolated datasets, and dedicated Google Sheets.
- Added Test 7 in Apps Script Self-Test doctor ([`6_SelfTest.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/6_SelfTest.gs)).
- Authored master cross-architecture mandate ([`cross_architecture_3tier_mandate.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/cross_architecture_3tier_mandate.md)) and Sheets-to-BigQuery ingestion guide.

---

### 📦 Release Version `v0.8` — *"services_apis_enabled"*
**Date:** 2026-08-17  
**Git Tag:** `v0.8`  

#### 🛑 Outbound Email Safety Enforcement
- **MANDATORY POLICY ENFORCED:** Until explicitly notified otherwise, all automated email dispatches are strictly hard-locked to NEVER send directly to external clients.
- Automated email dispatches in [`3_PdfAndEmailer.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/3_PdfAndEmailer.gs) and [`0_Config.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/0_Config.gs) are strictly redirected to authorized internal Studio Tunnel addresses: `finance@studiotunnel.com`, `samiran@studiotunnel.com`, `contact@studiotunnel.com`, `tamash@studiotunnel.com`.

#### 🧠 Data Logic & Ingestion
- Created Firebase Web App Ingestion & Delta Sync Specification ([`documentation/data-flow/firebase_ingestion_specification.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/data-flow/firebase_ingestion_specification.md)) covering collections (`clients`, `jobs`, `estimates`, `leads`, `team`, `rate_cards`).
- Designed incremental delta sync lifecycle filtering on `updated_at` timestamps to operate strictly inside Firestore Spark Free Tier (<50 reads/day).
- Defined BigQuery raw staging tables `raw_firebase_clients` and `raw_firebase_jobs` with unified views.

#### 🔄 Data Flow & API Infrastructure
- Created GCP Enabled APIs, Free-Tier Quotas & Zero-Cost Financial Ledger ([`documentation/tech-stack/08_gcp_apis_and_free_tier_limits.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/08_gcp_apis_and_free_tier_limits.md)).
- Documented complete inventory of 12 Google APIs (Gmail, Apps Script, Drive, Sheets, BigQuery, Firestore, Firebase, People, Calendar, Admin SDK) with exact free quotas.
- Formalized zero-surprise-billing safeguards: skipped paid Secret Manager, zero VM compute, 100% Google Workspace & GCP India Free Tier (₹0.00/month).

#### 🎨 UI / UX & Documentation
- Updated master documentation and tech-stack indexes to include modules 07, 08, and data flow blueprints.
  

#### 🧠 Data Logic
- Established 3-environment silo architecture (`dev`, `test`, `prod`) with automatic `DRY_RUN_MODE` toggling.
- Added `scripts/setEnv.js` to dynamically inject environment configuration and `.clasp.json` per target Git branch.
- Created `engine/google-apps-script/constants.gs` exporting global `EXTERNAL_SHEETS` configurations including the STEM User Registry.

#### 🔄 Data Flow
- Configured automated GitHub Actions workflow (`.github/workflows/gas-ci.yml`) for linting, system integrity checks, environment resolution, and Clasp deployment.
- Connected Apps Script project naming convention `ST-IN-gen` (`ST-IN-gen-dev`, `ST-IN-gen-test`, `ST-IN-gen-prod`) under GCP Project `st-in-gen` (`972643538415`).

#### 🎨 UI / UX & Documentation
- Authored comprehensive CI/CD deployment guide ([`documentation/ci_setup.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/ci_setup.md)).
- Prepared team pipeline onboarding documentation.  

#### 🧠 Data Logic
- Created automated System Integrity & Validation Suite ([`engine/python-scripts/test_system_integrity.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/python-scripts/test_system_integrity.py)) testing 5 core subsystems:
  1. Master `users.yaml` directory syntax.
  2. Synced `users.json` matrix alignment.
  3. Regulatory GSTIN (`27AAMCC8604R1ZV`) & PAN (`AAMCC8604R`) regex bounds.
  4. IST Timezone & `YYYYMMDD` date serial formatters.
  5. Intra/Inter-state GST tax math (9%/9%/18%) and TDS (10%) deductions.
- Achieved **100% PASS RATE** across all system integrity checks.

#### 🔄 Data Flow
- Verified BigQuery SQL statement generation and tax calculations via [`engine/python-scripts/dry_run_bigquery.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/python-scripts/dry_run_bigquery.py).
- Created Tech Stack Verification Module ([`documentation/tech-stack/06_verification_and_dry_runs.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/06_verification_and_dry_runs.md)).

#### 🎨 UI / UX
- Updated [`README.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/README.md) and [`documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md) with technical verification commands and test suite summaries.

---

### 📦 Release Version `v0.5` — *"user-details"*
**Date:** 2026-08-17  
**Git Tag:** `v0.5`  

#### 🧠 Data Logic
- Verified and imported exact Google Workspace Admin Directory data (`customer_id: C00yqau03`) into [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml).
- Created formatted raw export log [`documentation/organization/user_log.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/user_log.json).

---

### 📦 Release Version `v0.4` — *"additional structure"*
**Date:** 2026-08-17  
**Git Tag:** `v0.4`  

#### 🧠 Data Logic
- Reorganized codebase into human-friendly directories: `engine/`, `documentation/`, `credentials/`, and `sample-documents/`.
- Renamed nested README files to specific names (`documentation_index.md`, `tech_stack_index.md`, `apps_script_guide.md`).

---

### 📦 Release Version `v0.3` — *"aesthetic"*
**Date:** 2026-08-17  
**Git Tag:** `v0.3`  

#### 🧠 Data Logic
- Created GAS-compatible Design System specification ([`DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)) defining Lexend typography and contrast bounds.

---

### 📦 Release Version `v0.2` — *"inclusion"*
**Date:** 2026-08-17  
**Git Tag:** `v0.2`  

#### 🧠 Data Logic
- Established IST `Asia/Kolkata` timezone standard across all scripts, Apps Script functions, and BigQuery SQL queries.

---

### 📦 Release Version `v0.1` — *"genesis"*
**Date:** 2026-08-17  
**Git Tag:** `v0.1`  

#### 🧠 Data Logic
- Reverse-engineered sample PDF invoice into structured Google Sheets & BigQuery Star Schema (`st_fin_com_prog`).
