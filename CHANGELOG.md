# ST-fin-com-prog — Version History & Changelog
# Program: Studio Tunnel Financial Comptroller Program
# Repository: jd-tunnel/IN-gen

This document tracks all release versions of **`ST-fin-com-prog`**, categorized by **Data Logic**, **Data Flow**, and **UI / UX**.

---

## 🏷️ Version History

### 📦 Release Version `v0.4` — *"additional structure"*
**Date:** 2026-08-17  
**Git Tag:** `v0.4`  

#### 🧠 Data Logic
- Reorganized codebase into human-friendly directories: `engine/`, `documentation/`, `credentials/`, and `sample-documents/`.
- Moved master user directory to [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml).
- Moved Python dry run and sync scripts to [`engine/python-scripts/`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/python-scripts/).
- Moved Google Apps Script engine files to [`engine/google-apps-script/`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/).

#### 🔄 Data Flow
- Updated `engine/python-scripts/sync_users.py` path references to read from `documentation/organization/users.yaml` and auto-sync to `credentials/public/users.json`.
- Updated documentation index ([`documentation/README.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/README.md)) to reflect subdirectories (`master-specs/`, `schemas/`, `organization/`, `tech-stack/`).

#### 🎨 UI / UX
- Cleaned up root repository directory structure for intuitive human navigation.
- Maintained locked read-only status (`IsReadOnly = True`) on Version 1.0 specification ([`documentation/master-specs/cineloom-comptroller.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller.md)).

---

### 📦 Release Version `v0.3` — *"aesthetic"*
**Date:** 2026-08-17  
**Git Tag:** `v0.3`  

#### 🧠 Data Logic
- Created GAS-compatible Design System specification ([`DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)) defining Lexend typography and contrast bounds.
- Set strict text color rules: **Darkest Black = 90% Gray (`#1A1A1A`)** and **Lightest White = 20% Gray (`#CCCCCC`)** for text on dark elements.

#### 🔄 Data Flow
- Upgraded `3_PdfAndEmailer.gs` (`generateInvoiceDocuments`) to generate **both a viewable `.html` web document AND a `.pdf` vector file** in Google Drive with domain permissions.

#### 🎨 UI / UX
- Updated [`HTMLTemplate.html`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/HTMLTemplate.html) to import **Google Font: Lexend** via CDN.

---

### 📦 Release Version `v0.2` — *"inclusion"*
**Date:** 2026-08-17  
**Git Tag:** `v0.2`  

#### 🧠 Data Logic
- Established IST `Asia/Kolkata` timezone standard across all scripts, Apps Script functions, and BigQuery SQL queries.
- Defined `YYYYMMDD` serial date string standard (`formatDateYYYYMMDD`) for file naming and invoice serial keys.
- Added regulatory regex validation helper functions in Apps Script (`1_Utils.gs`) for Indian GSTIN (`validateGSTIN`) and PAN (`validatePAN`).

---

### 📦 Release Version `v0.1` — *"genesis"*
**Date:** 2026-08-17  
**Git Tag:** `v0.1`  

#### 🧠 Data Logic
- Reverse-engineered sample PDF invoice into structured Google Sheets & BigQuery Star Schema.
- Implemented intra-state vs inter-state tax split calculations and Indian Rupee Currency-in-Words converter.
