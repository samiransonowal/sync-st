---
name: "cineloom-comptroller-v2"
description: "Cineloom Comptroller v2 Specification — Hybrid Google Sheets (Doorway) + BigQuery (Data Warehouse & Modeling Engine) + Google Looker Studio (Visual Dashboard) Architecture. Defines data ingestion, relational schema modeling, back-sync writeback, automated PDF invoice generation, Looker Studio reporting, and Discord operational management for Studio Tunnel / Cineloom Postworks Pvt Ltd."
---

# Cineloom Comptroller v2 — BigQuery Data Warehouse, Looker Studio & Invoicing Architecture

## 1. Executive Summary & Architectural Shift

In **Cineloom Comptroller v1**, Google Sheets (\PROJECT TRACKER\ and \ACCOUNTS\) served as both the data entry point and the sole relational database.

In **Cineloom Comptroller v2**, we decouple the **Data Entry Interface (Doorway)** from the **Data Warehouse (BigQuery)** and the **Visual Analytics Engine (Google Looker Studio)**:

1. **Google Sheets (\PROJECT TRACKER\ & \ACCOUNTS\)** $\rightarrow$ Act exclusively as the human-friendly **Data Input & Editing Doorway**.
2. **BigQuery (\st-in-gen.cineloom_books\)** $\rightarrow$ Acts as the **Master Relational Data Warehouse, Data Modeling Engine, and Historical Ledger**.
3. **Google Looker Studio (Dashboard Layer)** $\rightarrow$ Serves as the **Executive Financial Dashboard & Real-Time Reporting Portal** for Samiran & Yash.
4. **Apps Script & GCP Cloud Functions** $\rightarrow$ Orchestrate bidirectional sync, event-driven PDF generation, and Discord operational alerts.

---

## 2. Updated Data Ownership & Single Writer Rules

To maintain strict data integrity across Google Sheets, BigQuery, and Looker Studio, the **Single Writer Rule** is preserved:

| Data Segment | Ingestion Doorway | BigQuery Storage Table | Sole Writer / Master | Read-Only Viewers |
| :--- | :--- | :--- | :--- | :--- |
| Job Entries, Invoice Metadata (No, Client, Amount, Colorist, Date, Line Producer) | \PROJECT TRACKER\ Sheet | \cineloom_books.raw_project_tracker\ & \cineloom_books.dim_invoices\ | **Samiran / Line Producer** via Sheet $\rightarrow$ BigQuery Ingestion | Bot, Looker Studio & Apps Script |
| Bank Transactions & Statement Credits | HDFC CSV / Statement Ingest | \cineloom_books.fact_bank_transactions\ | **HDFC Bank Statement** (Ingested via Bot) | All |
| Reconciliation & Payment Status (Status, Received, TDS, Balance, Remarks) | BigQuery SQL Engine | \cineloom_books.fact_payments\ & \cineloom_books.view_chase_list\ | **Reconciliation Engine (Python / BigQuery SQL)** | Sheet & Looker Dashboard |
| Executive Analytics & Financial Kpis | BigQuery Views | \cineloom_books.view_executive_summary\ | **Looker Studio (Native BigQuery Connector)** | Samiran & Yash |
| Invoice Generated Flag, Drive PDF URL, Gmail Draft Status | PDF Engine | \cineloom_books.dim_invoices\ | **Automation Engine** | Sheet, Discord & Looker Studio |
| Client Canonical Mapping & Write-offs | Sheet / Override CSV | \cineloom_books.dim_clients\ & \cineloom_books.fact_overrides\ | **Samiran** via Control Table | Engine applies |

---

## 3. BigQuery Relational Schema & Reporting Views (\dataset: cineloom_books\)

Data ingested from Google Sheets is modeled into a Star Schema with dedicated analytical views for Looker Studio:

### **A. Dimension & Fact Tables**
1. **\dim_clients\**: \client_id\, \canonical_name\, \aw_variants\, \gstin\, \illing_address\, \state_code\, \pan\, \contact_phone\, \contact_email\`n2. **\dim_invoices\**: \invoice_id\, \invoice_number\, \invoice_date\, \client_id\, \project_name\, \colorist_name\, \line_producer\, \line_producer_email\, \place_of_supply\, \subtotal\, \	ax_rate\, \	ax_amount\, \grand_total\, \pdf_drive_url\, \is_generated\, \created_at\`n3. **\act_bank_transactions\**: \	xn_id\, \	xn_date\, \
arration\, \credit_amount\, \debit_amount\, \classification\ (\CLIENT\, \LOAN\, \INTERNAL\, \GATEWAY\), \matched_client_id\`n4. **\act_payments\**: \payment_id\, \invoice_id\, \	xn_id\, \mount_received\, \	ds_deducted\, \pending_balance\, \payment_status\ (\PAID\, \PARTIAL\, \UNPAID\), \last_updated\`n
### **B. Looker Studio Analytical Views**
1. **\iew_executive_summary\**:
   - Total Billing vs Cash Received vs Total Outstanding Balance
   - Monthly Revenue Growth Trends
2. **\iew_colorist_revenue\**:
   - Revenue Split & Project Volume by Colorist (\SUJITH\, \YASH\, \SAMIRAN\, \OTHERS\)
3. **\iew_chase_list\**:
   - Real-time Aging Report of Overdue Invoices (>30 Days, >60 Days, >90 Days)

---

## 4. Google Looker Studio Integration & Visual Dashboards

Google Looker Studio connects natively to BigQuery via the **BigQuery Connector** for real-time visual reporting:

### **Dashboard 1: Executive Financial Overview (For Samiran & Yash)**
- **Scorecards**: Gross Revenue (₹), Cash Collected (₹), Outstanding Balance (₹), Open Invoices Count.
- **Bar Chart**: Revenue by Colorist per Month.
- **Pie Chart**: Payment Status Distribution (\Paid\ vs \Partial\ vs \Overdue\).

### **Dashboard 2: Overdue Chase List & Client Accounts**
- **Interactive Table**: Top Debtors sorted by Days Overdue, Client Name, and Total Outstanding Amount.
- **Filter Controls**: Dynamic filter by Client Name, Colorist, Date Range, and Status.

---

## 5. End-to-End Workflow Architecture

\\\	ext
[Step 1: Doorway Input]
   Samiran / Line Producer enters job in PROJECT TRACKER / ACCOUNTS Sheet
            │
            ▼
[Step 2: Ingestion & BigQuery Modeling]
   Apps Script / BigQuery Scheduled Query pulls Sheet data into \st-in-gen.cineloom_books\`n   BigQuery runs SQL Data Modeling: normalizes clients, calculates tax split & TDS
            │
            ├─────────────────────────────────────────┐
            ▼                                         ▼
[Step 3: Event-Driven Invoice Generation]    [Step 4: Looker Studio Dashboards]
   Engine detects un-generated invoices          Native BigQuery Connector updates
   Calls PDF Generator (\HTMLTemplate.html\)       Executive & Chase List Dashboards
   Saves vector PDF to Google Drive              for Samiran & Yash
            │
            ▼
[Step 5: Doorway Writeback & Discord Alert]
   Apps Script Bridge writes back Status & PDF Link to \ACCOUNTS\ Sheet (Cols S–V)
   Fires rich Embed Notification Card to Discord (#invoices-log)
\\\`n
---

## 6. Summary of Key Upgrades in v2

1. **BigQuery as Master Warehouse**: Eliminates Google Sheets cell formula dependency and file row caps.
2. **Google Looker Studio Dashboards**: Executive-ready, interactive visual dashboards replacing static spreadsheet views.
3. **Automated Auditability**: Every invoice calculation, tax split, and bank credit allocation is stored in BigQuery tables for instant historical querying.
4. **Bi-directional Doorway Sync**: Sheet $\rightarrow$ BigQuery $\rightarrow$ Sheet sync ensures human readability while preserving enterprise data modeling.

