# Firebase Web App Ingestion & Delta Sync Specification

**Source:** Legacy Studio Management Firebase Web App  
**Destination:** BigQuery Dataset `st-in-gen.st_fin_com_prog`  
**Ingestion Script:** `engine/python-scripts/sync_firebase.py` (or `scripts/sync_firebase.py`)  
**Document Status:** 📝 **ACTIVE INGESTION BLUEPRINT**  
**Date:** 17 August 2026  

---

## 1. What Data to Pull from Firebase

The legacy studio management web app contains historical creative, client, and quotation data stored across Firestore collections. Below is the complete collection breakdown to be ingested into BigQuery:

```text
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                FIREBASE / FIRESTORE SOURCE COLLECTIONS                          │
 ├──────────────────────────────┬─────────────────────────────┬────────────────────────────────────┤
 │ 1. `clients` Collection      │ 2. `jobs` / `projects`      │ 3. `estimates` / `quotes`          │
 │  • Client Business Name      │  • Job Number & Film Title  │  • Quote ID & Agreed Line Items    │
 │  • GSTIN, PAN & Billing Addr │  • Colorist Assigned        │  • Quoted Rates & Discounts        │
 │  • Primary Producer Contacts │  • Shoot & Delivery Dates   │  • Quote Status (Approved/Draft)   │
 ├──────────────────────────────┼─────────────────────────────┼────────────────────────────────────┤
 │ 4. `leads` Collection        │ 5. `team` / `colorists`     │ 6. `rate_cards` Collection         │
 │  • Agency / Production House │  • Colorist Names & Emails  │  • Standard Project / Hourly Rates │
 │  • Enquiry Pipeline History  │  • Historical Project Logs  │  • Service Classifications         │
 └──────────────────────────────┴─────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Target Raw BigQuery Staging Schema

All data from Firebase is staged into **Raw Staging Tables** preserving the original document ID and raw JSON payload, avoiding any destructive changes:

### A. `st_fin_com_prog.raw_firebase_clients`
```sql
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.raw_firebase_clients` (
  firebase_doc_id STRING,           -- Original Firestore Document ID
  raw_client_name STRING,           -- Client Name string from Firebase
  gstin STRING,                     -- GSTIN if present in legacy record
  pan STRING,                       -- PAN if present
  contact_email STRING,             -- Primary contact email
  contact_phone STRING,             -- Contact phone
  raw_payload JSON,                 -- Complete raw unstructured document
  created_at TIMESTAMP,             -- Original Firebase creation timestamp
  updated_at TIMESTAMP,             -- Original Firebase update timestamp
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
```

### B. `st_fin_com_prog.raw_firebase_jobs`
```sql
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.raw_firebase_jobs` (
  firebase_doc_id STRING,           -- Original Firestore Document ID
  job_number STRING,                -- Legacy Job / Work Order ID
  project_title STRING,             -- Film / Commercial Title
  client_id_ref STRING,             -- Reference to client doc
  client_name STRING,               -- Client name recorded in job
  colorist_name STRING,             -- Assigned colorist
  quote_amount NUMERIC,             -- Quoted or agreed total
  job_status STRING,                -- Legacy status (e.g. Completed, Invoiced)
  raw_payload JSON,                 -- Complete raw unstructured document
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
```

---

## 3. Ingestion Cadence & Delta Update Lifecycle

To keep BigQuery up to date without redundant read operations (staying strictly in the **Spark Free Tier**):

```text
 [Phase 1: Full Historical Seed (One-Time)]
   • Pulls all historical collections from Firestore up to current date.
   • Records max `updated_at` timestamp in `_sync_state.json`.
   • Populates `dim_clients` with tag `data_source = 'FIREBASE_LEGACY'`.
                        │
                        ▼
 [Phase 2: Incremental / Delta Sync (Recurring)]
   • Runs on scheduled cadence (Daily) or On-Demand via CLI.
   • Query filter: WHERE updated_at > last_synced_timestamp.
   • Reads ONLY newly created or modified documents (<50 reads/day).
   • Appends to raw tables and refreshes BigQuery normalization views.
```

### Ingestion Triggers:
1. **Scheduled Sync:** Daily scheduled cron / BigQuery data transfer.
2. **On-Demand Command:** Developer / Admin runs:
   ```bash
   python engine/python-scripts/sync_firebase.py
   # or: npm run sync-firebase
   ```

---

## 4. BigQuery Data Normalization SQL View

A master SQL view (`view_unified_clients`) merges legacy Firebase clients with active Google Sheet clients:

```sql
CREATE OR REPLACE VIEW `st-in-gen.st_fin_com_prog.view_unified_clients` AS
SELECT 
  client_id,
  canonical_name,
  gstin,
  pan,
  billing_address,
  state_code,
  contact_email,
  contact_phone,
  data_source
FROM `st-in-gen.st_fin_com_prog.dim_clients`;
```

---

## 5. Next Steps for Implementation
1. Ensure Firebase / Firestore APIs are enabled in GCP.
2. Build Python sync module `engine/python-scripts/sync_firebase.py` using `google-cloud-firestore` or Firebase Admin SDK.
3. Perform initial dry-run extraction.
