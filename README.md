# ST-fin-com-prog — Studio Tunnel Financial Comptroller Program

**Release Version:** `v0.3` (*aesthetic*)  
**Organization:** Cineloom Postworks Pvt. Ltd. / Studio Tunnel  
**Lead Developer:** Jay (`jay@studiotunnel.com` / GitHub: `jd-tunnel`)  
**Studio Owner & Lead Collaborator:** Samiran Sonowal (`samiran@studiotunnel.com` / GitHub: `samiransonowal`)  
**GCP Administration Account:** `lab@studiotunnel.com`  
**Master Organization Directory (YAML):** [`framework/documentation/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/documentation/users.yaml)  
**Synced Directory Matrix (JSON):** [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json)  
**Design System:** [`DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/GAS-all/DesignSystem.gs)  
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
├── credentials/
│   ├── private/secrets.env              <-- Private secrets & API keys (Git Ignored)
│   └── public/
│       ├── credentials.env.example     <-- Public template for co-developers
│       └── users.json                   <-- Synced User Directory Matrix (JSON)
├── framework/
│   ├── sync_users.py                    <-- Sync Script (users.yaml -> users.json)
│   ├── GAS-all/                         <-- Modular Apps Script Source Engine
│   │   ├── 0_Config.gs                  <-- Cell mappings & constants
│   │   ├── 1_Utils.gs                   <-- Currency-in-words converter & date formatters
│   │   ├── 2_InvoiceParser.gs           <-- Checkbox line-item parser
│   │   ├── 3_PdfAndEmailer.gs           <-- Vector PDF & HTML Web invoice builder
│   │   ├── 4_MenuUI.gs                  <-- Google Sheets top menu bar
│   │   ├── 5_DiscordNotifier.gs         <-- Discord rich embed card sender
│   │   ├── DesignSystem.gs              <-- Lexend typography & color contrast spec
│   │   ├── HTMLTemplate.html            <-- Invoice vector Lexend HTML print layout
│   │   └── README.md                    <-- Beginner guide for artists
│   ├── documentation/
│   │   ├── users.yaml                   <-- Master Organization Directory (YAML)
│   │   ├── cineloom-comptroller.md      <-- [LOCKED & READONLY] Version 1.0 Original Spec
│   │   ├── cineloom-comptroller-v2.md   <-- Version 2.0 Active Architecture Spec
│   │   ├── bigquery_schema.sql          <-- Production BigQuery DDL Schema
│   │   └── README.md                    <-- Documentation index
│   ├── sample_docs/                     <-- Sample PDF invoices & source layouts
│   └── dry_run_bigquery.py              <-- BigQuery data flow dry run script
├── .gitignore                           <-- Strict security filter
└── README.md                            <-- Root documentation
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

- **v0.3 (`aesthetic`)**: Created `DesignSystem.gs` (Lexend font, 90%/20% gray contrast rules), added Google Drive live HTML web invoice creation with domain permissions, and locked v1 spec.
- **v0.2 (`inclusion`)**: Provisioned full Google Workspace User Directory (`users.yaml` & `users.json`), IST `Asia/Kolkata` timezone standards, `YYYYMMDD` date formatting, and GSTIN/PAN regex validators.
- **v0.1 (`genesis`)**: Decoupled Sheets Doorway from BigQuery Data Warehouse (`st_fin_com_prog`), added Looker Studio visual dashboard architecture & modular Apps Script vector PDF generator.

*(Full categorized breakdown in [`CHANGELOG.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/CHANGELOG.md))*
