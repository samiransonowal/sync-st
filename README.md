# ST-fin-com-prog — Studio Tunnel Financial Comptroller Program

**Release Version:** `v0.5` (*user-details*)  
**Organization:** Cineloom Postworks Pvt. Ltd. / Studio Tunnel  
**Lead Developer:** Jay (`jay@studiotunnel.com` / GitHub: `jd-tunnel`)  
**Studio Owner & Lead Collaborator:** Samiran Sonowal (`samiran@studiotunnel.com` / GitHub: `samiransonowal`)  
**GCP Administration Account:** `lab@studiotunnel.com`  
**Master Organization Directory (YAML):** [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml)  
**Google Admin Raw Export (JSON):** [`documentation/organization/user_log.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/user_log.json)  
**Synced Directory Matrix (JSON):** [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json)  
**Design System:** [`engine/google-apps-script/DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)  
**Documentation Index:** [`documentation/documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md)  
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

## 📁 Repository Structure

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
│   ├── organization/                   <-- Verified Team Directory & Identity Matrices
│   │   ├── users.yaml                  <-- Master User Directory (YAML source of truth)
│   │   └── user_log.json               <-- Formatted Google Workspace Admin API export
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

## 👥 Verified Organization User Directory

| # | Primary Email | Full Name / Account Name | Secondary Aliases / Personal Emails | Contact Phone | Role & Privileges |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `samiran@studiotunnel.com` | **Samiran Sonowal** | `samiran26sonowal@gmail.com` | `7030168963` | Studio Owner, Managing Director & Data Owner |
| **2** | `lab@studiotunnel.com` | **Tech Dev (Studio Tunnel Lab)** | `jay@studiotunnel.com`, `postman@jaydantara.com` | `+91 80809 11109` | GCP Cloud Administrator & Lead Systems Architect |
| **3** | `accounts@studiotunnel.com` | **Accounts Cineloom Postworks** | `samiran26sonowal@gmail.com` | `7030168963` | Accounts Officer & Billing Inbox Operator |
| **4** | `art@studiotunnel.com` | **Artists @ Studio Tunnel** | `manoj@studiotunnel.com`, `sujith@studiotunnel.com`, `contactmanojsahu@gmail.com` | `+91 84549 81924`<br>`+91 83189 84245` | Senior Colorists & Post-Production Artists Group |
| **5** | `contact@studiotunnel.com` | **Studio Tunnel Contact** | `tamash@studiotunnel.com`, `prakash@studiotunnel.com`, `tamashansari4@gmail.com`, `prakashjai.tunnel@gmail.com` | `9372586002`<br>`8910460532` | Public Relations, Client Services & Inbound Billing |
| **6** | `ops@studiotunnel.com` | **Ops Tunnel** | `ayush@studiotunnel.com`, `vijay@studiotunnel.com`, `arjun@studiotunnel.com`, `golu@studiotunnel.com`, `aaditya@studiotunnel.com` | *N/A* | Line Producers & Production Operations Team |
| **7** | `yash@studiotunnel.com` | **Yash** | *Weekly Report Recipient* | *N/A* | Senior Colorist & Financial Comptroller |

---

## 🏷️ Release History Summary

- **v0.5 (`user-details`)**: Provisioned exact verified Google Workspace Admin Directory data (`customer_id: C00yqau03`), created formatted `user_log.json`, and integrated account aliases/phones into `users.yaml` & `sync_users.py`.
- **v0.4 (`additional structure`)**: Reorganized codebase into human-friendly folders (`engine/`, `documentation/`, `sample-documents/`) and renamed nested README files to specific names (`documentation_index.md`, `tech_stack_index.md`, `apps_script_guide.md`).
- **v0.3 (`aesthetic`)**: Created `DesignSystem.gs` (Lexend font, 90%/20% gray contrast rules), added Google Drive live HTML web invoice creation with domain permissions, and locked v1 spec.
- **v0.2 (`inclusion`)**: Provisioned full Google Workspace User Directory (`users.yaml` & `users.json`), IST `Asia/Kolkata` timezone standards, `YYYYMMDD` date formatting, and GSTIN/PAN regex validators.
- **v0.1 (`genesis`)**: Decoupled Sheets Doorway from BigQuery Data Warehouse (`st_fin_com_prog`), added Looker Studio visual dashboard architecture & modular Apps Script vector PDF generator.

*(Full categorized breakdown in [`CHANGELOG.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/CHANGELOG.md))*
