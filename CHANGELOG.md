# ST-fin-com-prog — Version History & Changelog
# Program: Studio Tunnel Financial Comptroller Program
# Repository: jd-tunnel/IN-gen

This document tracks all release versions of **`ST-fin-com-prog`**, categorized by **Data Logic**, **Data Flow**, and **UI / UX**.

---

## 🏷️ Version History

### 📦 Release Version `v0.2` — *"inclusion"*
**Date:** 2026-08-17  
**Git Tag:** `v0.2`  

#### 🧠 Data Logic
- Provisioned Google Workspace User Directory, Primary Emails, and Public Aliases Matrix into system reference configuration (`users.md`).
- Linked contact aliases (`contact@studiotunnel.com`, `invoices@studiotunnel.com`) to financial data pipeline metadata.

#### 🔄 Data Flow
- Integrated `users.md` identity matrix as a primary reference layer in `secrets.env` and `credentials.env.example`.
- Verified dry-run execution of BigQuery SQL DDL schema script (`bigquery_schema.sql`) and data flow test script (`dry_run_bigquery.py`).

#### 🎨 UI / UX
- Created clean, human-readable User Directory & Identity Matrix markdown table ([`users.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/users.md)) for team reference.
- Updated root `README.md` with release version badges, contact matrix, and repository structure.

---

### 📦 Release Version `v0.1` — *"genesis"*
**Date:** 2026-08-17  
**Git Tag:** `v0.1`  

#### 🧠 Data Logic
- Reverse-engineered sample PDF invoice (`91_ZOMATO_RYZE STUDIO_REVISED INVOICE`) into structured Google Sheets & BigQuery Star Schema.
- Implemented intra-state (CGST 9% + SGST 9% for Maharashtra state code `27`) vs inter-state (IGST 18%) automatic tax split calculations.
- Implemented Indian Rupee Currency-in-Words converter (`numberToIndianWords`).
- Added 10% TDS deduction calculation logic on base subtotal.

#### 🔄 Data Flow
- Decoupled **Data Ingestion Doorway** (Google Sheets `PROJECT TRACKER` & `ACCOUNTS`) from **Master Data Warehouse** (BigQuery dataset `st_fin_com_prog`).
- Designed Star Schema DDL (`dim_clients`, `dim_invoices`, `fact_bank_transactions`, `fact_payments`) and analytical views for Google Looker Studio.
- Built modular Apps Script engine (`0_Config.gs` to `5_DiscordNotifier.gs`) for event-driven PDF generation and Google Drive saving.
- Integrated Discord Webhook notification cards for `#invoices-log`.

#### 🎨 UI / UX
- Designed row-level selection checkboxes (`☑ TRUE` / `☐ FALSE`) in Column A of `Invoice_Generator` so unchecked line items evaluate to 0 and are omitted from PDF generation.
- Built Google Sheets top menu bar (`🚀 Studio Tunnel -> 📄 Generate PDF Invoice`).
- Created high-resolution HTML/CSS vector print template (`HTMLTemplate.html`) matching Studio Tunnel branding.
- Established locked status for Version 1.0 specification (`cineloom-comptroller.md`).

---

## 📌 Categorization Guidelines for Future Releases

When updating this document for future releases, group all changes under:
1. **Data Logic**: Business rules, tax logic, schema definitions, algorithms, and calculations.
2. **Data Flow**: Pipelines, APIs, Apps Script bridges, BigQuery sync, webhooks, and database integrations.
3. **UI / UX**: Google Sheets menus, HTML templates, Discord embed cards, Looker Studio dashboards, and user documentation.
