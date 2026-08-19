# 02 — Database & Warehouse Technical Choice

## Overview

We chose **Google BigQuery** as our primary relational data warehouse and modeling engine.

- **GCP Project:** `st-in-gen` (`972643538415`) — *Single GCP Project*
- **Location:** `asia-south1` (Mumbai, India)

### 3-Tier Isolated Dataset Architecture
| Tier | Git Branch | Dataset ID | Role / Purpose |
|---|---|---|---|
| **Dev** | `dev` | `st_fin_com_prog_dev` | Rapid feature development & isolated script testing |
| **Test** | `test` | `st_fin_com_prog_test` | Automated integration test sandbox |
| **PML** *(Production Main Live)* | `main` / `pml` | `st_fin_com_prog_pml` *(alias: `st_fin_com_prog`)* | Live operational tax ledger & official reports |

---

## Schema Architecture (Star Schema & Raw Staging)

### 1. Raw Ingestion & Legacy Staging
- **`raw_project_tracker`**: Raw row ingest from active Google Sheets.
- **`raw_firebase_clients`**: Unstructured JSON payloads from legacy Firebase studio app.
- **`raw_firebase_jobs`**: Historical jobs & quotes imported from Firestore.

### 2. Dimension Tables
- **`dim_clients`**: Unified canonical client registry (`client_id`, `canonical_name`, `gstin`, `state_code`, `pan`, `data_source`).
- **`dim_invoices`**: Invoice master table (`invoice_id`, `invoice_number`, `invoice_date`, `subtotal`, `tax_amount`, `grand_total`, `pdf_drive_url`).

### 3. Fact & Ledger Tables
- **`fact_bank_transactions`**: Raw HDFC bank statement credits (`txn_id`, `narration`, `credit_amount`, `classification`).
- **`fact_payments`**: Payment ledger matching credits to open invoices FIFO style (`payment_id`, `amount_received`, `tds_deducted`, `pending_balance`).

---

## Cost & Capacity Planning (GCP India Free Tier)
- **Active Storage:** 10 GB free per month in `asia-south1`.
- **Query Processing:** 1 TB scanned free per month.
- **Secrets Management:** Kept in GitHub Secrets & local git-ignored files to guarantee ₹0 cost without requiring a credit card or billing account.
- **Estimated Monthly Cost:** ₹0 (Fully within free tier limits).

