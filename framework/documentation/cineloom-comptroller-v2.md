---
name: "cineloom-comptroller-v2"
description: "Cineloom Comptroller v2 Specification — Hybrid Google Sheets (Doorway) + BigQuery (Data Warehouse & Modeling Engine) Architecture. Defines data ingestion, relational schema modeling, back-sync writeback, automated PDF invoice generation, and Discord operational management for Studio Tunnel / Cineloom Postworks Pvt Ltd."
---

# Cineloom Comptroller v2 — BigQuery Data Warehouse & Invoicing Architecture

## 1. Executive Summary & Architectural Shift

In **Cineloom Comptroller v1**, Google Sheets (\PROJECT TRACKER\ and \ACCOUNTS\) served as both the data entry point and the sole relational database. 

In **Cineloom Comptroller v2**, we decouple the **Data Entry Interface (Doorway)** from the **Data Warehouse & Data Modeling Engine (BigQuery)**:

1. **Google Sheets (\PROJECT TRACKER\ & \ACCOUNTS\)** $\rightarrow$ Act exclusively as the human-friendly **Data Input & Editing Doorway**.
2. **BigQuery (\st-in-gen.cineloom_books\)** $\rightarrow$ Acts as the **Master Relational Data Warehouse, Data Modeling Engine, and Historical Ledger**.
3. **Apps Script & GCP Cloud Functions** $\rightarrow$ Orchestrate bidirectional sync, event-driven PDF generation, and Discord operational alerts.

---

## 2. Updated Data Ownership & Single Writer Rules

To maintain strict data integrity across Google Sheets and BigQuery, the **Single Writer Rule** is preserved and mapped to the BigQuery architecture:

| Data Segment | Ingestion Doorway | BigQuery Storage Table | Sole Writer / Master | Read-Only Viewers |
| :--- | :--- | :--- | :--- | :--- |
| Job Entries, Invoice Metadata (No, Client, Amount, Colorist, Date, Line Producer) | \PROJECT TRACKER\ Sheet | \cineloom_books.raw_project_tracker\ & \cineloom_books.dim_invoices\ | **Samiran / Line Producer** via Sheet $\rightarrow$ BigQuery Ingestion | Bot & Apps Script |
| Bank Transactions & Statement Credits | HDFC CSV / Statement Ingest | \cineloom_books.fact_bank_transactions\ | **HDFC Bank Statement** (Ingested via Bot) | All |
| Reconciliation & Payment Status (Status, Received, TDS, Balance, Remarks) | BigQuery SQL Engine | \cineloom_books.fact_payments\ & \cineloom_books.view_chase_list\ | **Reconciliation Engine (Python / BigQuery SQL)** | Sheet & Dashboard |
| Invoice Generated Flag, Drive PDF URL, Gmail Draft Status | PDF Engine | \cineloom_books.dim_invoices\ | **Automation Engine** | Sheet & Discord |
| Client Canonical Mapping & Write-offs | Sheet / Override CSV | \cineloom_books.dim_clients\ & \cineloom_books.fact_overrides\ | **Samiran** via Control Table | Engine applies |

---

## 3. BigQuery Relational Schema Design (\dataset: cineloom_books\)

Data ingested from Google Sheets is modeled into a normalized Star Schema inside BigQuery Project \st-in-gen\:

### **A. Dimension Tables**
1. **\dim_clients\**:
   - \client_id\ (STRING, PK)
   - \canonical_name\ (STRING)
   - \aw_variants\ (ARRAY<STRING>)
   - \gstin\ (STRING)
   - \illing_address\ (STRING)
   - \state_code\ (STRING)
   - \pan\ (STRING)
   - \contact_phone\ (STRING)
   - \contact_email\ (STRING)

2. **\dim_invoices\**:
   - \invoice_id\ (STRING, PK - e.g. \INV-91\)\
   - \invoice_number\ (STRING)
   - \invoice_date\ (DATE)
   - \client_id\ (STRING, FK)
   - \project_name\ (STRING)
   - \colorist_name\ (STRING)
   - \line_producer\ (STRING)
   - \line_producer_email\ (STRING)
   - \place_of_supply\ (STRING)
   - \subtotal\ (NUMERIC)
   - \	ax_rate\ (NUMERIC - 0.18)
   - \	ax_amount\ (NUMERIC)
   - \grand_total\ (NUMERIC)
   - \pdf_drive_url\ (STRING)
   - \is_generated\ (BOOLEAN)
   - \created_at\ (TIMESTAMP)

### **B. Fact & Ledger Tables**
1. **\act_bank_transactions\**:
   - \	xn_id\ (STRING, PK)
   - \	xn_date\ (DATE)
   - \
arration\ (STRING)
   - \credit_amount\ (NUMERIC)
   - \debit_amount\ (NUMERIC)
   - \classification\ (STRING - \CLIENT\, \LOAN\, \INTERNAL\, \GATEWAY\)
   - \matched_client_id\ (STRING, FK)

2. **\act_payments\**:
   - \payment_id\ (STRING, PK)
   - \invoice_id\ (STRING, FK)
   - \	xn_id\ (STRING, FK)
   - \mount_received\ (NUMERIC)
   - \	ds_deducted\ (NUMERIC - Default 10% on base)
   - \pending_balance\ (NUMERIC)
   - \payment_status\ (STRING - \PAID\, \PARTIAL\, \UNPAID\)
   - \last_updated\ (TIMESTAMP)

---

## 4. End-to-End Workflow Architecture

\\\	ext
[Step 1: Doorway Input]
   Samiran / Line Producer enters job in PROJECT TRACKER / ACCOUNTS Sheet
            │
            ▼
[Step 2: Ingestion & BigQuery Modeling]
   Apps Script / BigQuery Scheduled Query pulls Sheet data into \st-in-gen.cineloom_books\`n   BigQuery runs SQL Data Modeling: normalizes clients, calculates tax split & TDS
            │
            ▼
[Step 3: Event-Driven Invoice Generation]
   Engine detects un-generated invoices (\is_generated = FALSE\)
   Calls PDF Generator (\HTMLTemplate.html\), saves vector PDF to Google Drive
   Updates \dim_invoices\ with \pdf_drive_url\ & \is_generated = TRUE\`n            │
            ▼
[Step 4: Doorway Writeback & Discord Alert]
   Apps Script Bridge writes back Status & PDF Link to \ACCOUNTS\ Sheet (Cols S–V)
   Fires rich Embed Notification Card to Discord (#invoices-log)
            │
            ▼
[Step 5: Reconciliation & Chase List]
   Bank statements ingested to \act_bank_transactions\`n   SQL Reconciliation engine updates \act_payments\ (FIFO oldest invoice first)
   Looker Studio Dashboard & Weekly Chase Report refreshed automatically
\\\`n
---

## 5. Summary of Key Upgrades in v2

1. **BigQuery as Master Warehouse**: Eliminates Google Sheets cell formula dependency and file row caps.
2. **Automated Auditability**: Every invoice calculation, tax split, and bank credit allocation is stored in BigQuery tables for instant historical querying.
3. **Bi-directional Doorway Sync**: Sheet $\rightarrow$ BigQuery $\rightarrow$ Sheet sync ensures human readability while preserving enterprise data modeling.
4. **Looker Studio Dashboard Ready**: Direct 1-click SQL link from BigQuery to Looker Studio for real-time revenue and colorist performance visualization.

