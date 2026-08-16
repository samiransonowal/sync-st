# ST-fin-com-prog — Studio Tunnel Financial Comptroller Program

**Release Version:** 0.1 (*genesis*)  
**Organization:** Cineloom Postworks Pvt. Ltd. / Studio Tunnel  
**Lead Developer:** Jay (jay@studiotunnel.com / GitHub: jd-tunnel)  
**Studio Owner & Lead Collaborator:** Samiran Sonowal (samiran@studiotunnel.com / GitHub: samiransonowal)  
**GCP Administration Account:** lab@studiotunnel.com  
**GitHub Repository:** [github.com/jd-tunnel/IN-gen](https://github.com/jd-tunnel/IN-gen)

---

## 🚀 Overview

ST-fin-com-prog is the automated financial comptroller and vector PDF invoice generation system for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

It features a **Hybrid Architecture**:
1. **Google Sheets (PROJECT TRACKER & ACCOUNTS)**: Human-friendly data input doorway for Samiran and Line Producers.
2. **Google BigQuery (st-in-gen.st_fin_com_prog)**: Master relational data warehouse, tax modeling engine, and historical audit ledger.
3. **Google Looker Studio**: Executive financial reporting portal & real-time overdue chase list dashboards.
4. **Google Apps Script & Discord Engine**: Event-driven vector PDF invoice generation, Drive archiving, Gmail routing, and Discord #invoices-log alerts.

---

## 📁 Repository Structure

`	ext
INVOICE_APP/
├── credentials/
│   ├── private/secrets.env              <-- Private secrets & API keys (Git Ignored)
│   └── public/credentials.env.example   <-- Public template for co-developers
├── framework/
│   ├── GAS-all/                         <-- Modular Apps Script Source Engine
│   │   ├── 0_Config.gs                  <-- Cell mappings & constants
│   │   ├── 1_Utils.gs                   <-- Currency-in-words converter
│   │   ├── 2_InvoiceParser.gs           <-- Checkbox line-item parser
│   │   ├── 3_PdfAndEmailer.gs           <-- Vector PDF builder & Gmail router
│   │   ├── 4_MenuUI.gs                  <-- Google Sheets top menu bar
│   │   ├── 5_DiscordNotifier.gs         <-- Discord rich embed card sender
│   │   ├── HTMLTemplate.html            <-- Invoice vector print layout
│   │   └── README.md                    <-- Beginner guide for artists
│   ├── documentation/
│   │   ├── cineloom-comptroller.md      <-- [LOCKED] Version 1.0 Original Spec
│   │   ├── cineloom-comptroller-v2.md   <-- Version 2.0 Active Architecture Spec
│   │   ├── bigquery_schema.sql          <-- Production BigQuery DDL DDL Schema
│   │   └── README.md                    <-- Documentation index
│   ├── sample_docs/                     <-- Sample PDF invoices & source layouts
│   └── dry_run_bigquery.py              <-- BigQuery data flow dry run script
├── .gitignore                           <-- Strict security filter
└── README.md                            <-- Root documentation
`

---

## 👥 Key Collaborators & Contact Matrix

| Identity | Role | System Privilege | Contact |
| :--- | :--- | :--- | :--- |
| **Samiran Sonowal** | Studio Owner | Primary Escalation Target, Data Owner | samiran@studiotunnel.com |
| **Jay** | Lead Developer | Git & Repository Commit Author | jay@studiotunnel.com |
| **Lab Account** | GCP Admin | GCP Owner (st-in-gen), OAuth Client ID | lab@studiotunnel.com |
| **Yash** | Colorist / Executive | Weekly Accounts Report Recipient | yash@studiotunnel.com |

---

## 🏷️ Release History

- **v0.1 (genesis)**: 
  - Decoupled Sheets Doorway from BigQuery Data Warehouse (st_fin_com_prog).
  - Added Looker Studio visual dashboard architecture.
  - Implemented row-level checkbox line-item filtering in Google Sheets.
  - Added modular Apps Script vector PDF generator & Discord notifications.
  - Established locked status for original v1 specification (cineloom-comptroller.md).

