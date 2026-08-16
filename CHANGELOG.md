# ST-fin-com-prog — Version History & Changelog
# Program: Studio Tunnel Financial Comptroller Program
# Repository: jd-tunnel/IN-gen

This document tracks all release versions of **`ST-fin-com-prog`**, categorized by **Data Logic**, **Data Flow**, and **UI / UX**.

---

## 🏷️ Version History

### 📦 Release Version `v0.5` — *"user-details"*
**Date:** 2026-08-17  
**Git Tag:** `v0.5`  

#### 🧠 Data Logic
- Verified and imported exact Google Workspace Admin Directory data (`customer_id: C00yqau03`) into [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml).
- Created formatted raw export log [`documentation/organization/user_log.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/user_log.json) containing full Google Workspace user profiles, phone numbers, recovery emails, and alias mappings.
- Expanded directory profiles to include Accounts, Colorists, Operations/Line Producers, Public Contact, and Infrastructure Admin accounts.

#### 🔄 Data Flow
- Integrated `user_log.json` into the automated sync pipeline (`sync_users.py`), auto-generating [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json).
- Updated private `secrets.env` and public `credentials.env.example` to track `USER_LOG_FILE`.

#### 🎨 UI / UX
- Enhanced Organization Directory table in root [`README.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/README.md) and [`documentation/documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md) displaying primary emails, full names, secondary aliases, and contact numbers.

---

### 📦 Release Version `v0.4` — *"additional structure"*
**Date:** 2026-08-17  
**Git Tag:** `v0.4`  

#### 🧠 Data Logic
- Reorganized codebase into human-friendly directories: `engine/`, `documentation/`, `credentials/`, and `sample-documents/`.
- Renamed nested README files to specific names (`documentation_index.md`, `tech_stack_index.md`, `apps_script_guide.md`).

---

### 📦 Release Version `v0.3` — *"aesthetic"*
**Date:** 2026-08-17  
**Git Tag:** `v0.3`  

#### 🧠 Data Logic
- Created GAS-compatible Design System specification ([`DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)) defining Lexend typography and contrast bounds (`#1A1A1A` 90% gray text, `#CCCCCC` 20% gray light text).
- Generated live viewable `.html` web invoice documents in Google Drive alongside `.pdf` vector files.

---

### 📦 Release Version `v0.2` — *"inclusion"*
**Date:** 2026-08-17  
**Git Tag:** `v0.2`  

#### 🧠 Data Logic
- Established IST `Asia/Kolkata` timezone standard across all scripts, Apps Script functions, and BigQuery SQL queries.
- Defined `YYYYMMDD` serial date string standard (`formatDateYYYYMMDD`) and regulatory GSTIN/PAN regex validators.

---

### 📦 Release Version `v0.1` — *"genesis"*
**Date:** 2026-08-17  
**Git Tag:** `v0.1`  

#### 🧠 Data Logic
- Reverse-engineered sample PDF invoice into structured Google Sheets & BigQuery Star Schema (`st_fin_com_prog`).
