# ST-fin-com-prog — Comprehensive Data Flow, Ingestion & BigQuery Relational Architecture

**Program:** Studio Tunnel Financial Comptroller Program  
**Engine Shortcode:** `ST-IN-gen`  
**GCP Project:** `st-in-gen` (`972643538415`)  
**Master Dataset:** `st_fin_com_prog` (Location: `asia-south1` Mumbai)  
**Document Status:** 📝 **OPEN FOR REVIEW & DECISIONS**  
**Date:** 17 August 2026  

---

## 1. Executive Summary & Core Data Strategy

To build an enterprise-grade financial comptroller without recurring infrastructure costs (₹0/month Google Free Tier), we decouple the **Data Sources (Doorways & Legacy Systems)** from the **Data Warehouse (BigQuery)** and the **Operational/Visual Consumers (Looker Studio & Apps Script)**.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   1. DATA SOURCES & INGESTION                                  │
 ├──────────────────────────────┬─────────────────────────────┬───────────────────────────────────┤
 │ 🟢 Source A: Google Sheets   │ 🔵 Source B: Bank Statements│ 🟠 Source C: Legacy Firebase      │
 │  • PROJECT TRACKER (Jobs)    │  • HDFC Bank CSV / NetBank  │  • Firestore `clients` Collection │
 │  • ACCOUNTS (Active Billing) │  • Credit UTR & Narration   │  • Firestore `jobs` Collection    │
 │  • STEM User Registry        │  • Statement Date & Amounts │  • Legacy Quotes & Colorist logs  │
 └──────────────┬───────────────┴──────────────┬──────────────┴─────────────────┬─────────────────┘
                │                              │                                │
                ▼                              ▼                                ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                       2. BIGQUERY RAW INGESTION LAYER (dataset: st_fin_com_prog)               │
 ├──────────────────────────────┬─────────────────────────────┬───────────────────────────────────┤
 │ `raw_project_tracker`        │ `raw_bank_statements`       │ `raw_firebase_clients`            │
 │ `raw_accounts`               │                             │ `raw_firebase_jobs`               │
 │ `raw_stem_registry`          │                             │                                   │
 └──────────────────────────────┴──────────────┬──────────────┴───────────────────────────────────┘
                                               │
                                               ▼ (SQL Normalization & Canonical ID Tagging)
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                      3. BIGQUERY CANONICAL RELATIONAL WAREHOUSE (Star Schema)                  │
 ├────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 🏢 DIMENSION TABLES (Who, What, Where):                                                        │
 │   • `dim_clients`        : Unified Client Master (Canonical name, GSTIN, PAN, state, source)   │
 │   • `dim_projects_jobs`  : Film / Commercial Job Master (Job ID, Project Title, Client, LP)    │
 │   • `dim_invoices`       : Official Tax Invoices (Inv #, Dates, Tax split, Grand Total, PDF)   │
 │   • `dim_team_users`     : Artists, Colorists, Producers (Workspace + STEM + Rate Cards)       │
 ├────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 💰 FACT & LEDGER TABLES (Money, Payments, Adjustments):                                        │
 │   • `fact_bank_transactions` : Verified HDFC credit/debit transaction log                      │
 │   • `fact_payments`          : FIFO Invoice-to-Bank Reconciliation Ledger (Paid/TDS/Balance)   │
 │   • `fact_overrides_audit`   : Manual reconciliation overrides & bad-debt write-offs           │
 └─────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                               │
                                               ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   4. DOWNSTREAM DATA CONSUMERS                                 │
 ├──────────────────────────────┬─────────────────────────────┬───────────────────────────────────┤
 │ 📊 Google Looker Studio      │ ⚡ Apps Script PDF Engine   │ 🔄 Google Sheets Writeback        │
 │  • Executive Summary (Kpis)  │  • Reads `dim_invoices`     │  • Syncs BQ Status & PDF Links    │
 │  • Overdue Chase List        │  • Generates Vector PDF     │    back into `ACCOUNTS` Sheet     │
 │  • Colorist Revenue Split    │  • Fires Discord Webhook    │    (Columns S–V)                  │
 └──────────────────────────────┴─────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Source-to-Warehouse Inventory & Tagging Strategy

### A. Data Sources Inventory

| Source Identifier | Where Data Lives at Source | Format / Schema | Primary Ingestion Method | Refresh Frequency |
|---|---|---|---|---|
| **`SRC_SHEETS_PT`** | `PROJECT TRACKER` Sheet (`1NkRayJ7...`) | Tabular (Rows) | BigQuery Data Transfer / Apps Script REST | Hourly / Event-based |
| **`SRC_SHEETS_ACC`** | `ACCOUNTS` Sheet (`1NgJFSEz...`) | Tabular (Rows) | BigQuery Data Transfer / Apps Script REST | Event-based (On edit) |
| **`SRC_SHEETS_STEM`**| `STEM User Registry` (`1xVpbcCq...`) | Tabular (Rows) | BigQuery External Table / Python Ingest | Daily |
| **`SRC_BANK_HDFC`** | HDFC Bank Statements | CSV / Excel Export | Automated Bot / Python Parser | Weekly / On Statement |
| **`SRC_FIREBASE`** | Legacy Firebase Web App (Firestore) | NoSQL JSON Docs | Firestore-to-BigQuery Export / Python script | One-time + Delta Sync |
| **`SRC_WORKSPACE`** | Google Workspace Admin Directory | Admin API JSON | `sync_users.py` (`users.yaml`) | On team onboarding |

---

### B. Standardized Canonical ID & Tagging Rules

To prevent collisions and establish robust relational keys across fragmented spreadsheets and NoSQL databases:

| Entity | Canonical ID Format | Generation Rule / Example | Purpose |
|---|---|---|---|
| **Client ID** | `CLI_<CANONICAL_SLUG>` | Uppercase alphanumeric slug generated from clean legal name.<br>*Example:* `CLI_ZOMATO_MEDIA` | Relates Invoices, Jobs, and Bank credits to 1 clean entity |
| **Invoice ID** | `INV_<FY>_<NUMBER>` | Fiscal year + 4-digit zero-padded number.<br>*Example:* `INV_2627_0091` or `INV_91` | Primary key for Tax Invoices and Drive PDFs |
| **Job ID** | `JOB_<YEAR>_<SERIAL>` | Fiscal year + auto-incrementing serial.<br>*Example:* `JOB_2026_0142` (maps to PT row) | Tracks creative film/commercial project from pitch to invoice |
| **Bank Txn ID** | `TXN_<DATE>_<UTR/REF>` | Date + Bank UTR/Cheque reference or SHA-256 hash.<br>*Example:* `TXN_20260701_N18320491823` | Prevents duplicate bank statement credit ingestion |
| **Payment ID** | `PAY_<INV_ID>_<TXN_ID>` | Composite hash of Invoice ID and Bank Txn ID.<br>*Example:* `PAY_INV91_TXN01832` | Represents single payment allocation event |
| **User ID** | `USR_<ROLE>_<SLUG>` | Role prefix + name slug.<br>*Example:* `USR_COL_SUJITH`, `USR_OWN_SAMIRAN` | Unifies Google Workspace, STEM, and colorist logs |

---

## 3. Modular BigQuery Table Breakdown (Total: 9 Core Tables)

To keep table maintenance simple, modular, and performant, the BigQuery warehouse is organized into **3 Layers**:

### 📦 Layer 1: Raw Staging Tables (`raw_*`) — 4 Tables
*Ingests source data as-is without destructive transformations.*

1. **`raw_project_tracker`**: Raw row records from `PROJECT TRACKER` Sheet.
2. **`raw_accounts`**: Raw row records from `ACCOUNTS` Sheet.
3. **`raw_bank_statements`**: Raw transaction rows from HDFC bank statements (Date, Narration, Withdrawal, Deposit, Balance).
4. **`raw_firebase_staging`**: Raw JSON documents dumped from Firestore collections (`clients`, `jobs`, `leads`, `quotes`).

---

### 🏛️ Layer 2: Canonical Dimension Tables (`dim_*`) — 3 Tables
*Master entity registries maintaining clean, verified, and deduplicated metadata.*

5. **`dim_clients`**:
   - `client_id` (PK), `canonical_name`, `raw_variants` (ARRAY<STRING>), `gstin`, `billing_address`, `state_code`, `pan`, `contact_name`, `contact_email`, `contact_phone`, `data_source` (`SHEETS`, `FIREBASE_LEGACY`, `MERGED`), `created_at`.
6. **`dim_projects_jobs`**:
   - `job_id` (PK), `project_title`, `client_id` (FK), `colorist_user_id` (FK), `line_producer`, `line_producer_email`, `job_status` (`PITCH`, `IN_PROGRESS`, `COMPLETED`, `INVOICED`), `agreed_amount`, `shoot_date`, `delivery_date`, `created_at`.
7. **`dim_invoices`**:
   - `invoice_id` (PK), `invoice_number`, `invoice_date`, `due_date`, `client_id` (FK), `job_id` (FK), `place_of_supply`, `subtotal`, `cgst_rate`, `cgst_amount`, `sgst_rate`, `sgst_amount`, `igst_rate`, `igst_amount`, `grand_total`, `pdf_drive_url`, `html_web_url`, `is_generated`, `invoice_status` (`DRAFT`, `ISSUED`, `PAID`, `PARTIAL`, `OVERDUE`, `CANCELLED`).

---

### 💳 Layer 3: Fact & Ledger Tables (`fact_*`) — 2 Tables
*Transactional math, bank matching, and audit trails.*

8. **`fact_bank_transactions`**:
   - `txn_id` (PK), `txn_date`, `raw_narration`, `credit_amount`, `debit_amount`, `bank_ref_no`, `classification` (`CLIENT_REVENUE`, `TDS_ADJUSTMENT`, `INTERNAL_TRANSFER`, `DIRECTOR_LOAN`, `EXPENSE`), `matched_client_id` (FK), `ingested_at`.
9. **`fact_payments`**:
   - `payment_id` (PK), `invoice_id` (FK), `txn_id` (FK), `amount_received`, `tds_deducted`, `tds_section` (e.g. `194C` or `194J`), `pending_balance`, `reconciliation_status` (`MATCHED_EXACT`, `MATCHED_PARTIAL`, `MATCHED_MANUAL_OVERRIDE`, `UNMATCHED`), `reconciled_at`.

---

## 4. Analytical Views for Looker Studio & Dashboards (3 Views)

1. **`view_executive_summary`**:
   - Aggregate gross billing, total collections, outstanding receivables, cumulative TDS deductions, and monthly billing velocity.
2. **`view_chase_list`**:
   - Overdue receivables aged into dynamic brackets: `0-15 Days` (Current), `16-30 Days` (Follow-up), `31-60 Days` (Warning), `>60 Days` (Escalation to Samiran).
3. **`view_colorist_revenue`**:
   - Project count, billed amount, and collection efficiency split by Colorist (`SUJITH`, `YASH`, `SAMIRAN`, `FREELANCERS`).

---

## 5. Crucial Decisions & Open Questions for Review

To finalize the automated data pipeline, please review and comment on these core questions:

### ❓ Question 1: Firebase Data Migration Scope
* **Context:** Your legacy studio management project on Firebase contains historical clients, jobs, and quotes.
* **Options:**
  - **Option A (Recommended):** Full historical migration — Ingest all completed jobs & clients from Firestore into `raw_firebase_*`, map legacy clients into `dim_clients` with tag `data_source = 'FIREBASE_LEGACY'`, allowing Looker Studio to display multi-year revenue trends from day one.
  - **Option B:** Client-only migration — Only extract past client contact records & GSTINs into `dim_clients`, ignoring historical un-invoiced quotes.

### ❓ Question 2: Ingestion Automation Method for Google Sheets
* **Context:** Google Sheets (`PROJECT TRACKER` and `ACCOUNTS`) are edited frequently by Samiran and Line Producers.
* **Options:**
  - **Option A (BigQuery Data Transfer Service):** Free, native Google scheduled job that syncs Sheets to BigQuery every 4–24 hours automatically.
  - **Option B (Event-Driven Apps Script Bridge):** When an invoice is generated or marked paid in Google Sheets, Apps Script immediately pushes the row to BigQuery via BigQuery REST API.
  - **Option C (Hybrid - Recommended):** Event-driven push for active invoices + Daily scheduled BigQuery sync for general Project Tracker updates.

### ❓ Question 3: Bank Statement Matching Automation
* **Context:** Bank statement narrations frequently truncate client names (e.g. `NEFT-AXIS-ZOMATO MEDIA-01923`).
* **Strategy:**
  - Use `dim_clients.raw_variants` array (e.g. `['ZOMATO', 'ZOMATO MEDIA', 'ZOMATO PVT LTD', 'ZOMATO HYPERPURE']`) to fuzzy-match bank credits to client invoices.
  - Any unmatched bank line is surfaced in a dedicated `#reconciliation-queue` Discord alert for Samiran to assign in 1 click.

---

## 6. Immediate Next Steps Roadmap

1. **Review & Decisions:** Review the questions above and confirm the table setup.
2. **Deploy BigQuery Staging Schema:** Execute the updated DDL script in `st-in-gen.st_fin_com_prog`.
3. **Firebase Ingestion Connector:** Build Python connector (`engine/python-scripts/ingest_firebase_raw.py`) using `firebase-admin` / Firestore API.
4. **Google Sheets $\rightarrow$ BigQuery Sync Pipeline:** Connect the Apps Script BigQuery streaming bridge.
5. **Looker Studio Dashboard Connection:** Link dataset `st_fin_com_prog` to Looker Studio executive template.
