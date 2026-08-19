# Cineloom Comptroller Documentation Index

Index of active architectural specifications and source document references for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

**Release Version:** `v0.9` (*3tier-governance-dedicated-sheets*)  
**Program:** `ST-fin-com-prog`  
**Engine Shortcode:** `ST-IN-gen`

---

## 📜 Specifications & Version History

1. **[`organization/cross_architecture_3tier_mandate.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/cross_architecture_3tier_mandate.md)** 🛡️ `[GOVERNANCE MANDATE]`:
   - Universal 3-tier environment architecture across Git (Dev default, Test escalation, PML 2-party confirmation), 3 dedicated Google Sheets suites, isolated BigQuery datasets, and Apps Script.

2. **[`master-specs/cineloom-comptroller.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller.md)** 🔒 `[LOCKED & READONLY]`:
   - **Version 1.0 Original Specification.**
   - Primary Google Sheets architecture, Single Writer Rules, and historical reconciliation engine spec.

3. **[`master-specs/cineloom-comptroller-v2.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller-v2.md)** ✨ `[ACTIVE ARCHITECTURE]`:
   - **Version 2.0 Hybrid Architecture.**
   - Decouples Google Sheets (Human Data Input Doorway) from Google BigQuery (Relational Data Warehouse & Modeling Engine).
   - Defines BigQuery Star Schema (`dim_clients`, `dim_invoices`, `fact_bank_transactions`, `fact_payments`), bidirectional Apps Script sync, event-driven PDF builds, and Discord notification integration.

4. **[`ci_setup.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/ci_setup.md)** 🚀 `[CI/CD PIPELINE]`:
   - Automated 3-tier deployment guide (`dev`, `test`, `pml`) to isolated Google Apps Script projects via GitHub Actions.

5. **[`data-flow/data_flow_and_bigquery_model.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/data-flow/data_flow_and_bigquery_model.md)** 📊 `[ACTIVE DATA FLOW & BQ MODEL]`:
   - End-to-end data flow specification: Source inventory, canonical tagging rules, 9-table BigQuery relational model (Staging, Dimensions, Facts), and open architectural decisions for review.

---

## 👥 Organization Directory & External Sheets

- **Master YAML Directory:** [`organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml)
- **IAM & Owner Permissions Matrix:** [`organization/iam_permissions_matrix.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/iam_permissions_matrix.md)
- **Google Admin Raw Export:** [`organization/user_log.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/user_log.json)
- **STEM External User Registry:** [`organization/stem_user_registry.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/stem_user_registry.md)
- **Synced Public JSON Matrix:** [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json)
- **Sync Script:** `python engine/python-scripts/sync_users.py`

---

## 📚 Technical Stack Architecture Modules

- **[`tech-stack/01_core_architecture.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/01_core_architecture.md)** — Core Hybrid Architecture
- **[`tech-stack/02_database_and_warehouse.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/02_database_and_warehouse.md)** — BigQuery Star Schema & 3-Tier Datasets
- **[`tech-stack/03_automation_and_webhooks.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/03_automation_and_webhooks.md)** — GAS Master Engine & Discord Webhooks
- **[`tech-stack/04_design_system_and_pdf.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/04_design_system_and_pdf.md)** — Lexend Design System & Vector HTML/PDF
- **[`tech-stack/05_security_and_credentials.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/05_security_and_credentials.md)** — Security, OAuth & Credential Isolation
- **[`tech-stack/06_verification_and_dry_runs.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/06_verification_and_dry_runs.md)** — Multi-Tier Testing Architecture
- **[`tech-stack/07_developer_environment_and_os_support.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/07_developer_environment_and_os_support.md)** — Cross-Platform OS Support & Workstation Diagnostics
- **[`tech-stack/08_gcp_apis_and_free_tier_limits.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/08_gcp_apis_and_free_tier_limits.md)** — GCP Enabled APIs, Quota Limits & ₹0 Cost Control
- **[`tech-stack/ingestion-pipeline/sheets_to_bigquery_pipeline_guide.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/ingestion-pipeline/sheets_to_bigquery_pipeline_guide.md)** — Sheets to BigQuery Ingestion Pipeline Guide
- **[`tech-stack/tech_stack_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/tech_stack_index.md)** — Tech Stack Master Index
- **[`data-flow/firebase_ingestion_specification.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/data-flow/firebase_ingestion_specification.md)** — Legacy Firebase Firestore Ingestion & Delta Sync Spec

---

## 🔬 Workstation Diagnostic & Verification Suites

- **Cross-Platform Workstation Diagnostic:** `python scripts/check_dev_environment.py` *(10/10 Passed)*
- **System Integrity Test Suite:** `python engine/python-scripts/test_system_integrity.py` *(6/6 Passed)*
- **BigQuery Multi-Tier Dry-Run Engine:** `python engine/python-scripts/dry_run_bigquery.py --env all` *(Passed across Dev, Test, PML)*

---

## 📊 Linked Source Google Sheets

- **ACCOUNTS Sheet:** [`1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A`](https://docs.google.com/spreadsheets/d/1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A/edit?gid=0#gid=0)
- **PROJECT TRACKER Sheet:** [`1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0`](https://docs.google.com/spreadsheets/d/1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0/edit?pli=1&gid=0#gid=0)
- **STEM User Registry Sheet:** [`1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA`](https://docs.google.com/spreadsheets/d/1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA/edit?gid=24356659#gid=24356659)
