# ST-fin-com-prog — Studio Tunnel Financial Comptroller Program

**Release Version:** `v0.4` (*additional structure*)  
**Organization:** Cineloom Postworks Pvt. Ltd. / Studio Tunnel  
**Lead Developer:** Jay (`jay@studiotunnel.com` / GitHub: `jd-tunnel`)  
**Studio Owner & Lead Collaborator:** Samiran Sonowal (`samiran@studiotunnel.com` / GitHub: `samiransonowal`)  
**GCP Administration Account:** `lab@studiotunnel.com`  
**Master Organization Directory (YAML):** [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml)  
**Synced Directory Matrix (JSON):** [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json)  
**Design System:** [`engine/google-apps-script/DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)  
**Documentation Index:** [`documentation/documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md)  
**Tech Stack Index:** [`documentation/tech-stack/tech_stack_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/tech_stack_index.md)  
**Changelog & Version History:** [`CHANGELOG.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/CHANGELOG.md)  
**GitHub Repository:** [github.com/jd-tunnel/IN-gen](https://github.com/jd-tunnel/IN-gen)

---

## 🚀 Overview

`ST-fin-com-prog` is the automated financial comptroller and vector PDF invoice generation system for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

It features a **Hybrid Architecture**:
1. **Google Sheets (`PROJECT TRACKER` & `ACCOUNTS`)**: Human-friendly data input doorway for Samiran and Line Producers.
2. **Google BigQuery (`st-in-gen.st_fin_com_prog`)**: Master relational data warehouse, tax modeling engine, and historical audit ledger.
3. **Google Looker Studio**: Executive financial reporting portal & real-time overdue chase list dashboards.
4. **Google Apps Script & Discord Engine**: Event-driven vector HTML web & PDF invoice generation, Drive archiving, Gmail routing, and Discord `#invoices-log` alerts.

---

## 📁 Human-Friendly Repository Structure

```text
INVOICE_APP/
├── CHANGELOG.md                         <-- Version History (Data Logic, Data Flow, UI/UX)
├── README.md                            <-- Sole Root Project Overview & Navigation Index
├── .gitignore                           <-- Git Security Filters
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
│   ├── google-apps-script/             <-- Google Apps Script Master Engine
│   │   ├── 0_Config.gs                 <-- Core cell maps, constants & timezone
│   │   ├── 1_Utils.gs                  <-- Date formatters, currency converter & validators
│   │   ├── 2_InvoiceParser.gs          <-- Sheet range & line-item parser
│   │   ├── 3_PdfAndEmailer.gs          <-- Vector HTML & PDF generator with Drive permissions
│   │   ├── 4_MenuUI.gs                 <-- Google Sheets top menu bar
│   │   ├── 5_DiscordNotifier.gs        <-- Discord embed notifications
│   │   ├── DesignSystem.gs             <-- Lexend typography & color contrast spec
│   │   ├── HTMLTemplate.html           <-- Vector HTML invoice print template
│   │   └── apps_script_guide.md        <-- Beginner Guide for Artists & Apps Script Usage
│   └── python-scripts/                 <-- Local Utilities & Dry-Run Test Scripts
│       ├── dry_run_bigquery.py         <-- BigQuery SQL generation & data flow dry-run test
│       └── sync_users.py               <-- Auto-sync script (users.yaml -> users.json)
│
├── 📚 documentation/                   <-- Specifications, Schemas & User Directory
│   ├── master-specs/                   <-- Master Specifications & Versions
│   │   ├── cineloom-comptroller.md     <-- [LOCKED & READONLY] Version 1.0 Original Spec
│   │   └── cineloom-comptroller-v2.md  <-- Version 2.0 Active BigQuery Hybrid Architecture Spec
│   ├── schemas/                        <-- Database Schemas & DDL Scripts
│   │   └── bigquery_schema.sql         <-- BigQuery st_fin_com_prog DDL script
│   ├── organization/                   <-- Team Directory & Identity Matrices
│   │   └── users.yaml                  <-- Master User Directory (YAML source of truth)
│   ├── tech-stack/                     <-- Technical Choice Modules (01 to 05)
│   │   ├── 01_core_architecture.md
│   │   ├── 02_database_and_warehouse.md
│   │   ├── 03_automation_and_webhooks.md
│   │   ├── 04_design_system_and_pdf.md
│   │   ├── 05_security_and_credentials.md
│   │   └── tech_stack_index.md         <-- Tech Stack Module Navigation Index
│   └── documentation_index.md          <-- Master Documentation Index
│
└── 📑 sample-documents/                <-- Reference Samples & Customer PDF Specs
    └── 91_ZOMATO_RYZE STUDIO_REVISED INVOICE_010726.pdf
```

---

## 👥 Key Collaborators & Contact Matrix

| Identity | Role | System Privilege | Contact |
| :--- | :--- | :--- | :--- |
| **Samiran Sonowal** | Studio Owner | Primary Escalation Target, Data Owner | `samiran@studiotunnel.com` |
| **Jay** | Lead Developer | Git & Repository Commit Author | `jay@studiotunnel.com` |
| **Lab Account** | GCP Admin | GCP Owner (`st-in-gen`), OAuth Client ID | `lab@studiotunnel.com` |
| **Yash** | Colorist / Executive | Weekly Accounts Report Recipient | `yash@studiotunnel.com` |
| **Contact / Invoices** | Business Public | Inbound Billing & Public Alias | `contact@studiotunnel.com` |

---

## 🏷️ Release History Summary

- **v0.4 (`additional structure`)**: Reorganized codebase into human-friendly folders (`engine/`, `documentation/`, `sample-documents/`) and renamed nested README files to specific names (`documentation_index.md`, `tech_stack_index.md`, `apps_script_guide.md`).
- **v0.3 (`aesthetic`)**: Created `DesignSystem.gs` (Lexend font, 90%/20% gray contrast rules), added Google Drive live HTML web invoice creation with domain permissions, and locked v1 spec.
- **v0.2 (`inclusion`)**: Provisioned full Google Workspace User Directory (`users.yaml` & `users.json`), IST `Asia/Kolkata` timezone standards, `YYYYMMDD` date formatting, and GSTIN/PAN regex validators.
- **v0.1 (`genesis`)**: Decoupled Sheets Doorway from BigQuery Data Warehouse (`st_fin_com_prog`), added Looker Studio visual dashboard architecture & modular Apps Script vector PDF generator.

*(Full categorized breakdown in [`CHANGELOG.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/CHANGELOG.md))*
