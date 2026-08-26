# 02 — Database & Warehouse Technical Architecture (Hybrid OLTP/OLAP)

## Overview

`st-comptroller` uses a **Hybrid OLTP/OLAP Data Architecture**:
- **Firebase Firestore** serves as the **Operational Database (OLTP)** for real-time reads/writes, web portal interactions, and status triggers.
- **Google BigQuery** serves as the **Analytical Data Warehouse (OLAP)** for tax compliance (GST/TDS), statutory auditing, and historical reporting.

- **GCP Project:** `st-in-gen` (`972643538415`) — *Single GCP Project*
- **Location:** `asia-south1` (Mumbai, India)

---

## 2.1 Operational Database (Firebase Firestore — Real-Time OLTP)

Firestore provides sub-second document access and real-time bi-directional synchronization with the Firebase Web App.

### Core Collections & Document Schemas
- **`/projects/{UUID}`**: Operational bookings synced from Google Sheets Project Tracker (`project_id`, `client_name`, `booking_hours`, `hourly_rate`, `status`).
- **`/invoices/{UUID}`**: Master invoice registry (`invoice_number`, `invoice_date`, `subtotal`, `tax_amount`, `grand_total`, `pdf_drive_url`, `status`).
- **`/expenses/{UUID}`**: Operational and capital expenditure ledger (`expense_date`, `category`, `amount`, `vendor`, `project_code`).
- **`/clients/{client_id}`**: Canonical client registry (`canonical_name`, `gstin`, `pan`, `billing_address`).

---

## 2.2 Data Warehouse (Google BigQuery — Analytical OLAP)

Replicated in real-time from Firestore via the official **Firebase Extension: Stream Firestore to BigQuery**.

### 3-Tier Isolated Dataset Architecture
| Tier | Git Branch | Dataset ID | Role / Purpose |
|---|---|---|---|
| **Dev** | `dev` | `st_comptroller_dev` | Rapid feature development & isolated script testing |
| **Test** | `test` | `st_comptroller_test` | Automated integration test sandbox |
| **PML** *(Production Main Live)* | `pml` | `st_comptroller_pml` | Live operational tax ledger & official reports |

---

## Schema Architecture (Star Schema & Raw Staging)

### 1. Streaming Firestore Replicas
- **`projects_raw_changelog`**: Real-time event log streamed from `/projects`.
- **`invoices_raw_changelog`**: Real-time event log streamed from `/invoices`.

### 2. Dimension Tables
- **`dim_clients`**: Unified canonical client registry (`client_id`, `canonical_name`, `gstin`, `state_code`, `pan`, `data_source`).
- **`dim_invoices`**: Invoice master table (`invoice_id`, `invoice_number`, `invoice_date`, `subtotal`, `tax_amount`, `grand_total`, `pdf_drive_url`).

### 3. Fact & Ledger Tables
- **`fact_bank_transactions`**: Raw HDFC bank statement credits (`txn_id`, `narration`, `credit_amount`, `classification`).
- **`fact_payments`**: Payment ledger matching credits to open invoices FIFO style (`payment_id`, `amount_received`, `tds_deducted`, `pending_balance`).

---

## Cost & Capacity Planning (GCP India Free Tier)
- **Firestore Free Ceilings:** 50,000 reads/day, 20,000 writes/day, 1 GB storage (fully covers daily operational loads).
- **BigQuery Active Storage:** 10 GB free per month in `asia-south1`.
- **BigQuery Query Processing:** 1 TB scanned free per month.
- **Estimated Monthly Cost:** ₹0 (Fully within GCP free tier limits).

