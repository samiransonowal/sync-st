# ST-fin-com-prog — Version History & Changelog
# Program: Studio Tunnel Financial Comptroller Program
# Repository: jd-tunnel/IN-gen

This document tracks all release versions of **`ST-fin-com-prog`**, categorized by **Data Logic**, **Data Flow**, and **UI / UX**.

---

## 🏷️ Version History

### 📦 Release Version `v0.6` — *"verification"*
**Date:** 2026-08-17  
**Git Tag:** `v0.6`  

#### 🧠 Data Logic
- Created automated System Integrity & Validation Suite ([`engine/python-scripts/test_system_integrity.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/python-scripts/test_system_integrity.py)) testing 5 core subsystems:
  1. Master `users.yaml` directory syntax.
  2. Synced `users.json` matrix alignment.
  3. Regulatory GSTIN (`27AAMCC8604R1ZV`) & PAN (`AAMCC8604R`) regex bounds.
  4. IST Timezone & `YYYYMMDD` date serial formatters.
  5. Intra/Inter-state GST tax math (9%/9%/18%) and TDS (10%) deductions.
- Achieved **100% PASS RATE** across all system integrity checks.

#### 🔄 Data Flow
- Verified BigQuery SQL statement generation and tax calculations via [`engine/python-scripts/dry_run_bigquery.py`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/python-scripts/dry_run_bigquery.py).
- Created Tech Stack Verification Module ([`documentation/tech-stack/06_verification_and_dry_runs.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/06_verification_and_dry_runs.md)).

#### 🎨 UI / UX
- Updated [`README.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/README.md) and [`documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md) with technical verification commands and test suite summaries.

---

### 📦 Release Version `v0.5` — *"user-details"*
**Date:** 2026-08-17  
**Git Tag:** `v0.5`  

#### 🧠 Data Logic
- Verified and imported exact Google Workspace Admin Directory data (`customer_id: C00yqau03`) into [`documentation/organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml).
- Created formatted raw export log [`documentation/organization/user_log.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/user_log.json).

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
- Created GAS-compatible Design System specification ([`DesignSystem.gs`](file:///d:/Studio%20Tunnel/INVOICE_APP/engine/google-apps-script/DesignSystem.gs)) defining Lexend typography and contrast bounds.

---

### 📦 Release Version `v0.2` — *"inclusion"*
**Date:** 2026-08-17  
**Git Tag:** `v0.2`  

#### 🧠 Data Logic
- Established IST `Asia/Kolkata` timezone standard across all scripts, Apps Script functions, and BigQuery SQL queries.

---

### 📦 Release Version `v0.1` — *"genesis"*
**Date:** 2026-08-17  
**Git Tag:** `v0.1`  

#### 🧠 Data Logic
- Reverse-engineered sample PDF invoice into structured Google Sheets & BigQuery Star Schema (`st_fin_com_prog`).
