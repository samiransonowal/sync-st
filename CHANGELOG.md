# ST-fin-com-prog — Version History & Changelog
# Program: Studio Tunnel Financial Comptroller Program
# Repository: jd-tunnel/IN-gen

This document tracks all release versions of **`ST-fin-com-prog`**, categorized by **Data Logic**, **Data Flow**, and **UI / UX**.

---

## 🏷️ Version History

### 📦 Release Version `v0.3` — *"aesthetic"*
**Date:** 2026-08-17  
**Git Tag:** `v0.3`  

#### 🧠 Data Logic
- Created GAS-compatible Design System specification ([`DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/GAS-all/DesignSystem.gs)) defining Lexend typography and contrast bounds.
- Set strict text color rules: **Darkest Black = 90% Gray (`#1A1A1A`)** and **Lightest White = 20% Gray (`#CCCCCC`)** for text on dark elements (no pure `#000000` or `#FFFFFF` permitted for text).
- Permitted 100% Pure White (`#FFFFFF`) exclusively for invoice paper backgrounds.
- Set brand green color properties (`primaryGreen`, `darkGreen`, `lightGreenTint`) as blank placeholders (`""`) to be defined later.
- Implemented file lock (`IsReadOnly = True`) on Version 1.0 specification (`cineloom-comptroller.md`).

#### 🔄 Data Flow
- Upgraded `3_PdfAndEmailer.gs` (`generateInvoiceDocuments`) to generate **both a viewable `.html` web document AND a `.pdf` vector file** in Google Drive.
- Configured domain-level viewer permissions (`DriveApp.Access.DOMAIN_WITH_LINK`) and explicit viewer access (`ROLES.OWNER_EMAIL`, `ROLES.REPORT_RECIPIENT_EMAIL`).
- Updated `Invoice_Log` logging to record both PDF Drive URL and live HTML Web Invoice URL.

#### 🎨 UI / UX
- Updated [`HTMLTemplate.html`](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/GAS-all/HTMLTemplate.html) to import **Google Font: Lexend** via CDN (`family=Lexend:wght@300;400;500;600;700`).
- Refactored invoice HTML/CSS styling to strictly use `#1A1A1A` (90% Gray) for headings/labels and `#CCCCCC` (20% Gray) for table headers and grand total text.

---

### 📦 Release Version `v0.2` — *"inclusion"*
**Date:** 2026-08-17  
**Git Tag:** `v0.2`  

#### 🧠 Data Logic
- Established IST `Asia/Kolkata` timezone standard across all scripts, Apps Script functions, and BigQuery SQL queries.
- Defined `YYYYMMDD` serial date string standard (`formatDateYYYYMMDD`) for file naming and invoice serial keys.
- Added regulatory regex validation helper functions in Apps Script (`1_Utils.gs`) for Indian GSTIN (`validateGSTIN`) and PAN (`validatePAN`).
- Provisioned Google Workspace User Directory, Primary Emails, and Public Aliases Matrix into system reference configuration (`users.md`).

#### 🔄 Data Flow
- Configured date format constants (`DATE_FORMATS`: `SERIAL: 'yyyyMMdd'`, `DISPLAY: 'dd/MM/yyyy'`, `ISO`, `DB`) in `0_Config.gs`.
- Integrated `users.md` identity matrix as a primary reference layer in `secrets.env` and `credentials.env.example`.
- Verified dry-run execution of BigQuery SQL DDL schema script (`bigquery_schema.sql`) and data flow test script (`dry_run_bigquery.py`).

#### 🎨 UI / UX
- Formatted human-readable date display (`DD/MM/YYYY`) for PDF invoice headers and Google Sheets UI.
- Created clean, human-readable User Directory & Identity Matrix markdown table ([`users.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/users.md)) for team reference.

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
