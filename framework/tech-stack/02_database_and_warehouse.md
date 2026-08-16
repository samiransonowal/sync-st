# 02 — Database & Warehouse Technical Choice

## Overview

We chose **Google BigQuery** as our primary relational data warehouse and modeling engine.

- **GCP Project:** `st-in-gen` (`972643538415`)
- **Dataset ID:** `st_fin_com_prog`
- **Location:** `asia-south1` (Mumbai, India)

---

## Schema Architecture (Star Schema)

### 1. Dimension Tables
- **`dim_clients`**: Canonical client registry (`client_id`, `canonical_name`, `gstin`, `state_code`, `pan`).
- **`dim_invoices`**: Invoice master table (`invoice_id`, `invoice_number`, `invoice_date`, `subtotal`, `tax_amount`, `grand_total`, `pdf_drive_url`).

### 2. Fact & Ledger Tables
- **`fact_bank_transactions`**: Raw HDFC bank statement credits (`txn_id`, `narration`, `credit_amount`, `classification`).
- **`fact_payments`**: Payment ledger matching credits to open invoices FIFO style (`payment_id`, `amount_received`, `tds_deducted`, `pending_balance`).

---

## Cost & Capacity Planning (GCP India Free Tier)
- **Active Storage:** 10 GB free per month in `asia-south1`.
- **Query Processing:** 1 TB scanned free per month.
- **Estimated Monthly Cost:** ₹0 (Fully within free tier limits).
