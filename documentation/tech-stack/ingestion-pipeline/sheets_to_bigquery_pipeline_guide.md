# Google Sheets → BigQuery Ingestion Pipeline Guide

**Directory:** `documentation/tech-stack/ingestion-pipeline/`  
**Purpose:** Human-readable instructions, architecture, and operator reference for transferring data from Google Sheets (`PROJECT TRACKER`, `ACCOUNTS`, `STEM Registry`) into BigQuery data warehouse layers.  
**Target Phase:** Phase 2 Implementation & Review  

---

## 1. Overview & Data Ingestion Flow

The ingestion pipeline connects human-facing operational Google Sheets with the BigQuery relational warehouse without manual data copying.

```text
 ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
 │   Google Sheets Doorway   │      │    Ingestion Engine       │      │   BigQuery Staging Layer  │
 ├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
 │ • PROJECT TRACKER         │ ───► │ • Cloud Function (Python) │ ───► │ • raw_project_tracker     │
 │ • ACCOUNTS (Dispatch)     │      │ • BigQuery Data Transfer  │      │ • raw_accounts            │
 │ • STEM User Registry      │      │ • Apps Script Webhook     │      │ • raw_stem_registry       │
 └───────────────────────────┘      └───────────────────────────┘      └─────────────┬─────────────┘
                                                                                     │
                                                                       (SQL Transforms & Canonical Tagging)
                                                                                     │
                                                                                     ▼
                                                                       ┌───────────────────────────┐
                                                                       │ BigQuery Star Schema      │
                                                                       ├───────────────────────────┤
                                                                       │ • dim_clients             │
                                                                       │ • dim_projects_jobs       │
                                                                       │ • dim_invoices            │
                                                                       │ • fact_payments           │
                                                                       └───────────────────────────┘
```

---

## 2. Source Sheets Inventory & Ingestion Schedule

| Source Document | Sheet ID / Key | Ingestion Target (Raw) | Method / Trigger | Frequency |
|---|---|---|---|---|
| **PROJECT TRACKER** (`Daily Bookings Log`) | `PROJECT_TRACKER_SPREADSHEET_ID` | `raw_project_tracker` | Python Cloud Function / BQ Data Transfer | Hourly / Scheduled Batch |
| **ACCOUNTS** (`Invoices & Dispatch`) | `ACCOUNTS_SPREADSHEET_ID` | `raw_accounts` / `dim_invoices` | Apps Script REST / Event-driven push | On row update / invoice generation |
| **STEM User Registry** | `EXTERNAL_SHEETS.STEM_USER_REGISTRY` | `raw_stem_registry` / `dim_team_users` | Python Batch / External Table | Daily sync |

---

## 3. Supported Ingestion Mechanisms

### Option A: Event-Driven Apps Script Bridge (Immediate)
- **How it works:** When an invoice is finalized or marked paid in Google Sheets, an Apps Script trigger fires a lightweight HTTP request pushing only the modified row into BigQuery.
- **Latency:** Near real-time (< 2 seconds).
- **Best for:** Active billing operations, invoice dispatch logging, and cash receipts.

### Option B: Cloud Function / Python Ingestion Engine (Batch Scheduled)
- **How it works:** A Python script deployed to Cloud Functions (`engine/cloud-function/main.py`) triggered periodically by Google Cloud Scheduler.
- **Latency:** Batch (e.g., hourly or daily at midnight IST).
- **Best for:** Bulk data synchronization of the `PROJECT TRACKER` sheet and full ledger consistency checks.

### Option C: BigQuery Native Data Transfer Service
- **How it works:** Native GCP service that schedules automated queries/syncs from Google Drive / Google Sheets into BigQuery tables.
- **Cost:** Free tier covered.

---

## 4. Environment & Branch Routing Rule (To Be Configured in Phase 2)

When running ingestion across different deployment environments:
- **`dev` branch / local test:** Ingests into `st_fin_com_prog_dev` using mock / dev test sheets.
- **`test` branch / staging:** Ingests into `st_fin_com_prog_test` using integration test sandbox sheets.
- **`pml` branch / PML (Production Main Live):** Ingests into `st_fin_com_prog_pml` using live master spreadsheets.

---

## 5. Next Steps for Ingestion Pipeline Review

1. [ ] Confirm spreadsheet column headers and data types across `PROJECT TRACKER` and `ACCOUNTS`.
2. [ ] Parameterize Cloud Function to receive environment dataset targets dynamically.
3. [ ] Finalize DDL for staging tables (`raw_project_tracker`, `raw_accounts`, `raw_stem_registry`).
4. [ ] Configure Cloud Scheduler cron job for daily midnight reconciliation.
