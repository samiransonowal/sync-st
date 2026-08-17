# Cineloom Comptroller Documentation Index

Index of active architectural specifications and source document references for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

**Release Version:** `v0.7` (*gas-cicd-pipeline*)  
**Program:** `ST-fin-com-prog`  
**Engine Shortcode:** `ST-IN-gen`

---

## 📜 Specifications & Version History

1. **[`master-specs/cineloom-comptroller.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller.md)** 🔒 `[LOCKED & READONLY]`:
   - **Version 1.0 Original Specification.**
   - Primary Google Sheets architecture, Single Writer Rules, and historical reconciliation engine spec.

2. **[`master-specs/cineloom-comptroller-v2.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller-v2.md)** ✨ `[ACTIVE ARCHITECTURE]`:
   - **Version 2.0 Hybrid Architecture.**
   - Decouples Google Sheets (Human Data Input Doorway) from Google BigQuery (Relational Data Warehouse & Modeling Engine).
   - Defines BigQuery Star Schema (`dim_clients`, `dim_invoices`, `fact_bank_transactions`, `fact_payments`), bidirectional Apps Script sync, event-driven PDF builds, and Discord notification integration.

3. **[`ci_setup.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/ci_setup.md)** 🚀 `[CI/CD PIPELINE]`:
   - Automated 3-silo deployment guide (`dev`, `test`, `prod`) to isolated Google Apps Script projects via GitHub Actions.

---

## 👥 Organization Directory & External Sheets

- **Master YAML Directory:** [`organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml)
- **Google Admin Raw Export:** [`organization/user_log.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/user_log.json)
- **STEM External User Registry:** [`organization/stem_user_registry.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/stem_user_registry.md)
- **Synced Public JSON Matrix:** [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json)
- **Sync Script:** `python engine/python-scripts/sync_users.py`

---

## 📚 Technical Stack Architecture Modules

- **[`tech-stack/01_core_architecture.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/01_core_architecture.md)** — Core Hybrid Architecture
- **[`tech-stack/02_database_and_warehouse.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/02_database_and_warehouse.md)** — BigQuery Star Schema
- **[`tech-stack/03_automation_and_webhooks.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/03_automation_and_webhooks.md)** — GAS Master Engine & Discord Webhooks
- **[`tech-stack/04_design_system_and_pdf.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/04_design_system_and_pdf.md)** — Lexend Design System & Vector HTML/PDF
- **[`tech-stack/05_security_and_credentials.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/05_security_and_credentials.md)** — Security, OAuth & Credential Isolation
- **[`tech-stack/06_verification_and_dry_runs.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/06_verification_and_dry_runs.md)** — 5-Layer Testing Architecture
- **[`tech-stack/07_developer_environment_and_os_support.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/07_developer_environment_and_os_support.md)** — Cross-Platform OS Support & Workstation Diagnostics
- **[`tech-stack/tech_stack_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/tech_stack_index.md)** — Tech Stack Master Index

---

## 🔬 Workstation Diagnostic & Verification Suites

- **Cross-Platform Workstation Diagnostic:** `python scripts/check_dev_environment.py` *(10/10 Passed)*
- **System Integrity Test Suite:** `python engine/python-scripts/test_system_integrity.py` *(5/5 Passed)*
- **BigQuery Dry-Run Engine:** `python engine/python-scripts/dry_run_bigquery.py` *(Passed)*

---

## 📊 Linked Source Google Sheets

- **ACCOUNTS Sheet:** [`1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A`](https://docs.google.com/spreadsheets/d/1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A/edit?gid=0#gid=0)
- **PROJECT TRACKER Sheet:** [`1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0`](https://docs.google.com/spreadsheets/d/1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0/edit?pli=1&gid=0#gid=0)
- **STEM User Registry Sheet:** [`1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA`](https://docs.google.com/spreadsheets/d/1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA/edit?gid=24356659#gid=24356659)
