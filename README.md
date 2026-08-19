# ST-fin-com-prog — Studio Tunnel Financial Comptroller Program

**Release Version:** `v0.8` (*services_apis_enabled*)  
**Shortcode:** `ST-IN-gen`  
**Organization:** Cineloom Postworks Pvt. Ltd. / Studio Tunnel  
**Lead Developer:** Jay (`jay@studiotunnel.com` / GitHub: `jd-tunnel`)  
**Studio Owner & Lead Collaborator:** Samiran Sonowal (`samiran@studiotunnel.com` / GitHub: `samiransonowal`)  
**GCP Administration Account:** `lab@studiotunnel.com`  
**GCP Project ID:** `st-in-gen` (Project Number: `972643538415`)  
**Master Organization Directory (YAML):** [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml)  
**Workstation Diagnostic Suite:** `python scripts/check_dev_environment.py` *(10/10 Passed)*  
**System Verification Suite:** `python engine/python-scripts/test_system_integrity.py` *(5/5 Passed)*  
**BigQuery Dry-Run Engine:** `python engine/python-scripts/dry_run_bigquery.py` *(Passed)*  
**Design System:** [`engine/google-apps-script/DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)  
**Documentation Index:** [`documentation/documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md)  
**Changelog & Version History:** [`CHANGELOG.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/CHANGELOG.md)  
**GitHub Repository:** [github.com/jd-tunnel/IN-gen](https://github.com/jd-tunnel/IN-gen)  

> [!CAUTION]
> ### 🛑 MANDATORY OUTBOUND EMAIL SAFETY RULE
> **UNTIL EXPLICITLY NOTIFIED OTHERWISE, THIS AUTOMATION WILL NEVER SEND EMAILS DIRECTLY TO EXTERNAL CLIENTS UNDER ANY CIRCUMSTANCES.**  
> All generated invoices, draft previews, and email dispatches are strictly locked and routed exclusively to authorized internal Studio Tunnel addresses:
> - `finance@studiotunnel.com`
> - `samiran@studiotunnel.com`
> - `contact@studiotunnel.com`
> - `tamash@studiotunnel.com`

> [!CAUTION]
> ### 🛑 BRANCH PROMOTION & GOVERNANCE MANDATE
> - **`dev` Branch (Permanent Default)**: Primary branch for all development work. Direct commits and iterative feature branches must originate here.
> - **`test` Branch (Restricted Sandbox)**: **HUMAN ESCALATION MANDATORY.** Attempting to work on or push to `test` is permitted only after explicit human testing verification and formal escalation.
> - **`pml` Branch (Production Main Live)**: **2-PARTY CONFIRMATION REQUIRED.** Promoting or deploying to `pml` requires dual authorization from the Lead Developer/Author AND GCP Admin (`lab@studiotunnel.com`) via the interactive push consent system.


---

## 🚀 Overview

`ST-fin-com-prog` is the automated financial comptroller, vector PDF invoice generation system, and CI/CD deployment engine for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

It features a **Hybrid Architecture**:
1. **Google Sheets (`PROJECT TRACKER`, `ACCOUNTS` & `STEM User Registry`)**: Human-friendly data input doorway for Samiran, Line Producers, and project managers.
2. **Google BigQuery (`st-in-gen.st_fin_com_prog`)**: Master relational data warehouse, tax modeling engine, and historical audit ledger.
3. **Google Looker Studio**: Executive financial reporting portal & real-time overdue chase list dashboards.
4. **Google Apps Script Master Engine (`ST-IN-gen`)**: Event-driven vector HTML web & PDF invoice generation, Drive archiving, Gmail routing, and Discord `#invoices-log` alerts.
5. **Automated 3-Silo CI/CD Pipeline**: Branch-mapped deployments (`dev`, `test`, `prod`) to isolated Google Apps Script cloud projects via GitHub Actions.

---

## 📁 Repository Structure

```text
INVOICE_APP/
├── CHANGELOG.md                         <-- Version History (Data Logic, Data Flow, UI/UX)
├── README.md                            <-- Sole Root Project Overview & Navigation Index
├── package.json                         <-- Node npm scripts & @google/clasp tooling
├── .gitignore                           <-- Git Security Filters (.env, keys, clasp credentials)
│
├── ⚙️ .github/                          <-- GitHub Automation Workflows
│   └── workflows/
│       └── gas-ci.yml                   <-- Automated 3-Silo CI/CD Pipeline (dev/test/prod)
│
├── 🔐 credentials/                     <-- Security & Access Configuration
│   ├── private/                         <-- [Git-Ignored] Local Secrets & Private Keys
│   │   ├── secrets.env                 <-- Unified private secrets file
│   │   └── client_secret_*.json        <-- Google OAuth client JSON key
│   └── public/                          <-- Public Configuration Templates & Synced Data
│       ├── credentials.env.example     <-- Safe public environment template for developers
│       └── users.json                   <-- Synced public JSON user matrix
│
├── ⚙️ engine/                          <-- Automation Scripts & Processing Engine
│   ├── google-apps-script/             <-- Google Apps Script Master Engine (ST-IN-gen)
│   │   ├── 0_Config.gs                 <-- Core cell maps, constants, DRY_RUN_MODE & timezone
│   │   ├── constants.gs                <-- External master spreadsheets (STEM Registry, Accounts)
│   │   ├── 1_Utils.gs                  <-- Date formatters, currency converter & validators
│   │   ├── 2_InvoiceParser.gs          <-- Sheet range & line-item parser
│   │   ├── 3_PdfAndEmailer.gs          <-- Vector HTML & PDF generator with Drive permissions
│   │   ├── 4_MenuUI.gs                 <-- Google Sheets top menu bar
│   │   ├── 5_DiscordNotifier.gs        <-- Discord embed notifications
│   │   ├── 6_SelfTest.gs               <-- 7-point in-script self-test & reachability suite
│   │   ├── DesignSystem.gs             <-- Lexend typography & color contrast spec
│   │   ├── HTMLTemplate.html           <-- Vector HTML invoice print template
│   │   └── apps_script_guide.md        <-- Beginner Guide for Artists & Apps Script Usage
│   └── python-scripts/                 <-- Local Utilities & Dry-Run Test Scripts
│       ├── dry_run_bigquery.py         <-- BigQuery SQL generation & data flow dry-run test
│       ├── sync_users.py               <-- Auto-sync script (users.yaml -> users.json)
│       └── test_system_integrity.py    <-- System Integrity & Validation Test Suite (100% Pass)
│
├── 🛠️ scripts/                         <-- CI/CD & Workstation Tooling
│   ├── check_dev_environment.py        <-- Cross-platform OS diagnostic (Win/Mac/Debian/Rocky)
│   └── setEnv.js                       <-- Dynamic branch resolver & .clasp.json generator
│
├── 📚 documentation/                   <-- Specifications, Schemas & User Directory
│   ├── ci_setup.md                     <-- CI/CD Deployment & 3-Silo Pipeline Guide
│   ├── master-specs/                   <-- Master Specifications & Versions
│   │   ├── cineloom-comptroller.md     <-- [LOCKED & READONLY] Version 1.0 Original Spec
│   │   └── cineloom-comptroller-v2.md  <-- Version 2.0 Active BigQuery Hybrid Architecture Spec
│   ├── schemas/                        <-- Database Schemas & DDL Scripts
│   │   └── bigquery_schema.sql         <-- BigQuery st_fin_com_prog DDL script
│   ├── organization/                   <-- Verified Team Directory & Identity Matrices
│   │   ├── users.yaml                  <-- Master User Directory (YAML source of truth)
│   │   ├── user_log.json               <-- Formatted Google Workspace Admin API export
│   │   └── stem_user_registry.md       <-- STEM External User Registry Specification
│   ├── tech-stack/                     <-- Technical Choice Modules (01 to 07)
│   │   ├── 01_core_architecture.md
│   │   ├── 02_database_and_warehouse.md
│   │   ├── 03_automation_and_webhooks.md
│   │   ├── 04_design_system_and_pdf.md
│   │   ├── 05_security_and_credentials.md
│   │   ├── 06_verification_and_dry_runs.md
│   │   ├── 07_developer_environment_and_os_support.md
│   │   └── tech_stack_index.md         <-- Tech Stack Module Navigation Index
│   └── documentation_index.md          <-- Master Documentation Index
│
└── 📑 sample-documents/                <-- Reference Samples & Customer PDF Specs
    └── 91_ZOMATO_RYZE STUDIO_REVISED INVOICE_010726.pdf
```

---

## 🔬 Workstation Diagnostic & Verification Commands

```bash
# 1. Check Local Workstation Readiness (Windows 11, macOS, Debian, Rocky Linux)
npm run check-env
# or: python scripts/check_dev_environment.py

# 2. Run System Integrity & Schema Validation Suite (100% Pass Rate)
npm test
# or: python engine/python-scripts/test_system_integrity.py

# 3. Run BigQuery Data Flow & SQL Generation Dry-Run Engine
python engine/python-scripts/dry_run_bigquery.py

# 4. Sync Master YAML User Directory to Public JSON Matrix
python engine/python-scripts/sync_users.py
```

---

## 🏷️ Release History Summary

- **v0.8 (`services_apis_enabled`)**: GCP Enabled APIs & Zero-Cost Financial Ledger (`08_gcp_apis_and_free_tier_limits.md`), legacy Firebase web app ingestion specification (`firebase_ingestion_specification.md`), and raw staging schema for Firestore collections.
- **v0.7 (`gas-cicd-pipeline`)**: Automated Google Apps Script CI/CD deployment (`ST-IN-gen-dev`, `ST-IN-gen-test`, `ST-IN-gen-prod`) with branch-to-project mapping, cross-platform workstation diagnostic suite (`scripts/check_dev_environment.py`), STEM User Registry integration (`constants.gs`), and full OS support documentation.
- **v0.6 (`verification`)**: Created System Integrity & Validation Suite (`test_system_integrity.py` - 100% pass), BigQuery data flow dry runs, and tech stack verification module (`06_verification_and_dry_runs.md`).
- **v0.5 (`user-details`)**: Provisioned exact verified Google Workspace Admin Directory data (`customer_id: C00yqau03`), created formatted `user_log.json`, and integrated account aliases/phones into `users.yaml` & `sync_users.py`.
- **v0.4 (`additional structure`)**: Reorganized codebase into human-friendly folders (`engine/`, `documentation/`, `sample-documents/`) and renamed nested README files to specific names.
- **v0.3 (`aesthetic`)**: Created `DesignSystem.gs` (Lexend font, 90%/20% gray contrast rules), added Google Drive live HTML web invoice creation with domain permissions, and locked v1 spec.
- **v0.2 (`inclusion`)**: Provisioned full Google Workspace User Directory (`users.yaml` & `users.json`), IST `Asia/Kolkata` timezone standards, `YYYYMMDD` date formatting, and GSTIN/PAN regex validators.
- **v0.1 (`genesis`)**: Decoupled Sheets Doorway from BigQuery Data Warehouse (`st_fin_com_prog`), added Looker Studio visual dashboard architecture & modular Apps Script vector PDF generator.

*(Full categorized breakdown in [`CHANGELOG.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/CHANGELOG.md))*
