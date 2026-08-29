---
name: "cineloom-comptroller-workflow"
description: "Target Outcomes, Current Accounts Workflow, Spreadsheet Overhaul Plan, and Functional Architecture for sync-st (Studio Tunnel / Cineloom Postworks Financial Comptroller Agent)."
---

# sync-st — Agent Core Target Outcomes & Operational Workflows

This specification outlines the strategic financial outcomes, current accounts operational workflow, spreadsheet overhaul schedule, and target capabilities for the **sync-st Agent** operating across Studio Tunnel / Cineloom Postworks Pvt Ltd.

---

## 1. Executive Overview & Architecture

The Comptroller Agent acts as an autonomous financial co-pilot and automated ledger manager. It bridges operational spreadsheets (**Project Tracker** & **Accounts Sheet**), bank statements, automated client communications, expense management, statutory tax tracking, and natural language email commands into a **Hybrid OLTP/OLAP Data Architecture** (`Google Sheets -> Firebase Firestore <-> Firebase Web App -> Google BigQuery`).

```mermaid
flowchart TD
    subgraph Data Ingestion Layer
        Producer[Line Producer] -->|Data Entry with UUID| Sheets[Google Sheets: Project Tracker]
        Admin[Admin] -->|Data Entry with UUID| AccSheets[Google Sheets: Accounts Master]
    end

    subgraph Operational Database (Real-time OLTP)
        Sheets -- "Apps Script onEdit Trigger" --> Firestore[(Firebase Firestore)]
        AccSheets -- "Apps Script onEdit Trigger" --> Firestore
    end

    subgraph User Interface & Real-time Web App
        Firestore <-->|Bi-directional Sync| WebApp[Firebase Web App Dashboard]
    end

    subgraph Serverless Cloud Functions (Automated Modules)
        Firestore -- "Status == Ready to Bill" --> PDFGen[Invoice PDF Generator]
        Firestore -- "Daily Scheduled Query" --> Reminders[21-Day Reminder Engine]
        BankCSV[HDFC Bank Statements] --> Recon[Reconciliation Engine] --> Firestore
    end

    subgraph Data Warehouse & Analytics (OLAP)
        Firestore -- "Firebase Extension (Stream)" --> BigQuery[(Google BigQuery DW)]
    end
```

---

## 2. Current Accounts Operational Workflow & Inventory

### 2.1 Current Workflow Analysis
1. **Line Producer Project Tracker**:
   - Managed directly by the Line Producer.
   - Captures billable hours, project scope, colorist assignments, and client company details for billing.
2. **Real-time Firestore Bridge (Replacing `IMPORTRANGE`)**:
   - Google Sheets `onEdit` Apps Script triggers push row updates in real-time to **Firebase Firestore** collections (`/projects`, `/invoices`).
   - Replaces fragile `=IMPORTRANGE(...)` formulas, keeping Google Sheets, Firebase Web App, and BigQuery seamlessly synced.
3. **Mandatory Column A UUID Primary Key**:
   - Every row across all Google Sheets tabs MUST feature a `UUID` as Column A (e.g. `PRJ-8F92A1` or standard UUIDv4).
   - An Apps Script trigger automatically populates Column A with a new UUID when a new row is entered, serving as the document key in Firestore and `PRIMARY KEY` in BigQuery.
4. **Invoice Date Anchor**:
   - The `Invoice Date` is used as the primary baseline timestamp to track payment cycles and monitor receivables.
5. **Monday Bank Statement Reconciliation**:
   - Conducted every Monday to compare bank statement credits (HDFC) against open accounts receivable in Firestore to verify cleared payments, deducted TDS, and outstanding client balances.

### 2.2 Target Spreadsheet Infrastructure (Fresh Initialization)
Configured via [`credentials.env.example`](file:///Users/samiransonowal/Documents/GitHub/IN-gen-reimagined_v1/credentials/public/credentials.env.example):

| Spreadsheet Role | Spreadsheet Title | Status |
| :--- | :--- | :--- |
| **Master Accounts Sheet** | `ACCOUNTS_CINELOOM_POSTWORKS_MASTER` | Fresh Template Pending Creation |
| **Upstream Project Tracker** | `PROJECT_TRACKER_CINELOOM_POSTWORKS_MASTER` | Fresh Template Pending Creation |

---

## 3. Spreadsheet Overhaul & Replication Plan

To resolve formula fragility and broken `=IMPORTRANGE(...)` dependencies while preserving complete per-column queryability for reporting and analytics, we have re-established explicit, uncombined column structures across both spreadsheets:

### 3.1 Project Tracker (Daily Bookings Log Schema)
Every field is strictly assigned a programmatic **Column ID (Field Key)** to ensure column order independence and precise data mapping across Google Sheets, Firestore, and BigQuery:

| Column | Sheet Header Title | Programmatic Column ID | Data Type | Key / Constraint | Description |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **A** | `UUID` | `project_id` | `STRING (UUID)` | **PRIMARY KEY** | System Unique ID (Auto-generated: e.g. `PRJ-8F92A1`) |
| **B** | `SR.` | `sr_num` | `INTEGER` | Required | Line item sequence number |
| **C** | `DATE / INVOICE DATE` | `entry_date` | `DATE (YYYY-MM-DD)` | Required | Booking / entry date baseline |
| **D** | `PROJECT NAME` | `project_name` | `STRING` | Required | Unique project / commercial title |
| **E** | `PRODUCTION HOUSE / CLIENT` | `client_name` | `STRING` | Required | Client corporate entity / Production house |
| **F** | `DIRECTOR` | `director_name` | `STRING` | Optional | Director name |
| **G** | `DOP` | `dop_name` | `STRING` | Optional | Director of Photography name |
| **H** | `COLORIST` | `colorist_name` | `STRING` | Required | Assigned colorist / artist |
| **I** | `BOOKING HRS` | `booking_hours` | `NUMERIC(5,2)` | Required | Scheduled billable grading hours |
| **J** | `ASSIST HRS` | `assist_hours` | `NUMERIC(5,2)` | Optional | Assistant billable hours |
| **K** | `TOTAL HRS` | `total_hours` | `NUMERIC(5,2)` | Calculated | Total billable hours (`BOOKING + ASSIST`) |
| **L** | `RATE` | `hourly_rate` | `CURRENCY (INR)` | Required | Hourly rate in INR |
| **M** | `DISCOUNT` | `discount_amount` | `CURRENCY (INR)` | Optional | Discount deduction amount |
| **N** | `TOTAL AMOUNT` | `total_amount` | `CURRENCY (INR)` | Calculated | Net total before GST (`(TOTAL HRS * RATE) - DISCOUNT`) |
| **O** | `POC NAME` | `poc_name` | `STRING` | Required | Client Point of Contact name |
| **P** | `EMAIL ID` | `poc_email` | `STRING (EMAIL)` | Required | Client billing email address |
| **Q** | `PHONE NO.` | `poc_phone` | `STRING` | Optional | Client contact phone number |
| **R** | `GST NO.` | `client_gstin` | `STRING (GSTIN)` | Required | Client 15-digit GSTIN |
| **S** | `PAN NO.` | `client_pan` | `STRING (PAN)` | Optional | Client 10-character PAN |
| **T** | `BILLING ADDRESS` | `billing_address` | `TEXT` | Required | Full corporate registered billing address |
| **U** | `Notes / Scope` | `notes_scope` | `TEXT` | Optional | Milestone scope notes & deliverable specifications |

### 3.2 Accounts Sheet (Doorway Tabs Schema)

Every tab strictly maintains an immutable `UUID` as its primary key:

#### **Tab 1: `Invoices & Dispatch`**
- `UUID` / `INVOICE_ID` | `SR.` | `INV NO.` | `INVOICE DATE` | `PROJECT NAME` | `COMPANY / CLIENT` | `COLORIST` | `HRS` | `PER HR RATE` | `DISCOUNT` | `TOTAL AMOUNT` | `GST BILL AMOUNT` | `POC NAME` | `EMAIL ID` | `PHONE NO.` | `GST NO.` | `PAN NO.` | `BILLING ADDRESS` | `Notes` | `PO No.` | `BILL STATUS` | `PAYMENT STATUS` | `Remark` | `Due of payment` | `TDS @10%` | `Payment Receival Date` | `AMOUNT RECEIVED` | `PENDING`

#### **Tab 2: `Expenses & Payables`**
- `UUID` / `EXPENSE_ID` | `Date` | `Expense Category` | `Description / Item` | `Project Code` | `Amount (₹)` | `Paid To / Vendor` | `Payment Mode` | `GST Component` | `Tax Invoice / Bill No.` | `Approval Status` | `Notes / Drive Receipt`

#### **Tab 3: `Monday Reconciliation Doorway`**
- `UUID` / `RECON_ID` | `Bank Txn Date` | `HDFC Narration / Reference` | `Credit Amount (₹)` | `Debit Amount (₹)` | `Matched Invoice No.` | `Matched Client Name` | `Expected Net Receipt` | `TDS Deducted` | `Reconciliation Status` | `Notes`

#### **Tab 4: `Loans & Subscriptions`**
- `UUID` / `OBLIGATION_ID` | `Obligation Type` | `Name / Lender / SaaS Tool` | `Account / Policy Reference` | `Monthly EMI / Amount (₹)` | `Due Day of Month` | `Next Due Date` | `Auto-Debit Account` | `Payment Status` | `Notes`

---

## 4. Core Functional Target Outcomes

### 4.1 Invoice Generation & Lifecycle Management
- **Automated Document Creation**: Generate professional, vectorized PDF invoices dynamically from job records using standard HTML/CSS templates.
- **Metadata & Asset Storage**: Automatically deposit generated invoice PDFs to dedicated Google Drive repositories and update master reference ledgers (`dim_invoices`).
- **Unique Identification**: Enforce canonical numbering, line item breakdown (Colorist, Line Producer, Project Name, Scope), tax splits, and terms.

### 4.2 Payment Cycle & Aging Tracking (30-Day Payment Cycle)
- **30-Day Credit Cycle Enforcer**: Monitor outstanding invoices against standard 30-day payment terms from invoice issue date (`invoice_date + 30 days`).
- **Real-Time Aging Bucket Categorization**:
  - `Current` (0 – 20 Days)
  - `Upcoming Due` (21 – 30 Days)
  - `Overdue Phase 1` (31 – 45 Days)
  - `Critical Overdue` (> 45 Days)
- **Status Dashboarding**: Maintain real-time payment state (`UNPAID`, `PARTIAL`, `PAID`) linked directly to BigQuery audit tables.

### 4.3 Automated 21st-Day Payment Reminders
- **Day 21 Proactive Escalation**: Automatically identify open invoices reaching their 21st day post-issuance.
- **Smart Reminder Dispatch**: Prepare and send polite, branded payment reminder emails/notifications to client accounts and line producers before the 30-day deadline.
- **Escalation Tracking**: Log reminder timestamps and status updates to prevent duplicate reminders while maintaining audit trail.

### 4.4 Comprehensive Expense Tracking
- **Multi-Category Expense Ledger**: Capture and classify operational and capital expenditures:
  - **Fixed Overheads**: Office Rent, Facility Maintenance, Utilities.
  - **Payroll & Staffing**: Salaries, Freelance/Artist payouts, Retainers.
  - **Capital Expenditures**: New Hardware, Cameras, Grading Monitors, Workstation upgrades.
  - **Logistics & Production**: Travel tickets, Lodging, Local transport, On-set food & catering.
  - **Daily Operations**: Petty cash, Office supplies, Software/SaaS tools.
- **Cost Allocation**: Attribute expenses to specific project codes, departments, or colorists for true net margin calculations.

### 4.5 Financial Health & Cashflow Reporting
- **Cashflow Forecasting**: Produce real-time visibility into net cash inflow vs. expected short-term outflows (due bills, salaries, rent, vendor payments).
- **Executive Summaries**: Generate automated weekly/monthly financial health reports (PDF / Email digest / Firebase Web App Dashboard) highlighting:
  - Gross Revenue vs. Net Receipts
  - Burn Rate & Runway Analysis
  - Outstanding Receivables vs. Payables Ratio
  - Colorist Revenue Contribution Breakdown

### 4.6 Estimates & Quotation Management
- **Pre-Billing Workflow**: Draft and issue formal Quotations and Estimates (`dim_estimates`) for client approval prior to project commencement.
- **Seamless Conversion**: Automatically convert approved client estimates into official Invoices with a single agent instruction or status toggle, ensuring zero duplicate data entry.

### 4.7 Intelligent Email-Based Task Agent Interface
- **Natural Language Email Command Processing**: Ingest incoming operational requests from authorized team emails (e.g., Samiran, Line Producers).
- **Supported Email Tasks**:
  - *"Generate quote for Project X for Client Y for ₹1,50,000"*
  - *"Log expense: ₹12,500 for flight ticket to Mumbai under Project Zenith"*
  - *"Check status of Invoice #ST-2026-089"*
  - *"Send payment reminder for all 21+ day open invoices"*
- **Audit & Email Confirmation**: Respond with structured confirmation emails containing attached PDFs, status summaries, or action confirmation receipts.

### 4.8 Statutory Compliance: GST Payable & TDS Deductibles
- **GST Liability Tracking**:
  - Compute Output GST (CGST/SGST/IGST) collected on outgoing invoices.
  - Track Input Tax Credit (ITC) from vendor bills and business expenses.
  - Calculate net GST payable for monthly/quarterly return filings.
- **TDS Deduction Accounting**:
  - Log client TDS withheld (e.g., Section 194C / 194J) on incoming payments.
  - Track Form 26AS matching and maintain a dedicated TDS Receivable ledger to streamline tax refund filings and credit verification.

### 4.9 Client-Specific Bank Statement Matching & Reconciliation Logics
- **Smart Statement Parsing**: Ingest raw HDFC bank statements (CSV / API feed) to parse credits and debits.
- **Custom Client Pattern Recognition**: Handle diverse payment behavior quirks:
  - **Netting TDS**: Auto-calculate expected net receipt (`Invoice Amount - 10% or 2% TDS`).
  - **Combined / Bulk Payments**: Match single credit transactions covering multiple invoice numbers.
  - **Partial Payments**: Track remaining balance without closing open invoice status.
  - **Client Name Variations**: Map bank narration aliases (e.g., *"RELIANCE MEDIA WORKS"* vs *"RMW PVT LTD"*) to canonical client IDs.
  - **Payment Gateway / UPR Fee Deduction**: Account for net gateway settlement fees and bank charges automatically.

### 4.10 Liabilities, Loans & Subscriptions Ledger
- **Loan & EMI Tracking**: Maintain active schedule for company loans, principal balances, interest breakdowns, and monthly EMI due dates.
- **SaaS & Recurring Subscriptions**: Track ongoing subscriptions (Adobe CC, DaVinci Resolve Studio keys, Frame.io, Google Workspace, AWS/GCP infrastructure) with renewal dates and auto-debit alerts.
- **Payables Aging**: Track vendor payables to ensure timely settlement without missing credit windows.

---

## 5. Outcome & Capability Mapping Matrix

| Capability / Outcome | Input Source | Primary Processing Unit | Key Output / Artifact |
| :--- | :--- | :--- | :--- |
| **Invoice Generation** | Project Tracker / Web App | Firestore Trigger -> PDF Cloud Function | Vector PDF Invoices & Drive URL |
| **30-Day Payment Cycle** | Firestore `/invoices` | Aging Cloud Function | Overdue Status & Aging Metrics |
| **21st Day Reminders** | Firestore `/invoices` | Cloud Scheduler -> Dispatcher Function | Automated Client Reminder Notice |
| **Expense Tracking** | Ingestion Sheet / Email Agent | Expense Cloud Function -> Firestore `/expenses` | Categorized Expense Reports & Margin Analysis |
| **Financial Health Reports**| Firestore & BigQuery DW | Firebase Web App / Email Digest | Interactive Real-Time Cashflow & Burn Dashboard |
| **Estimates & Quotations** | Email Agent / Sheet | Quote Generator (`dim_estimates`) | PDF Quotation & One-Click Invoice Sync |
| **Email Intelligent Agent**| Incoming Email Inbox | NLP Parser & Command Executor | Execution Log & Response Email |
| **GST & TDS Accounting** | BigQuery Stream (`st_comptroller`) | Statutory Tax Engine | Net GST Payable & TDS Receivable Ledger |
| **Bank Reconciliation** | HDFC Bank Statements | Cloud Function Reconciliation Engine | Automated Transaction-Invoice Match in Firestore |
| **Loans & Subscriptions** | Recurring Schedule Ledger | Liabilities Ledger (`dim_liabilities`)| Due Alerts & Cash Outflow Schedule |

---

## 6. Scheduled Implementation Plan & Next Steps

1. **Task 1: Spreadsheet Template Creation (Fresh Start)**:
   - Generate clean Google Spreadsheet templates for **Project Tracker** (daily time log format) and **Accounts Sheet** with Column A `UUID` primary key auto-generation.
   - Zero legacy formula/importrange dependencies.
2. **Task 2: Real-time Firestore Sync & BigQuery Streaming Pipeline**:
   - Implement Apps Script `onEdit` trigger pushing row updates to Firestore.
   - Deploy official **Stream Firestore to BigQuery** Firebase Extension for zero-code real-time warehouse replication.
3. **Task 3: Cloud Functions & Core Logic Implementation**:
   - Implement 21st-day payment reminder trigger, 30-day aging engine, and Monday HDFC bank reconciliation Cloud Functions over Firestore.
4. **Task 4: Firebase Web App Dashboard (`cineloom-comptroller`)**:
   - Build interactive bi-directional dashboard for cash flow charts, invoice status updates, and action triggers.
5. **Task 5: Email Intelligent Agent Integration**:
   - Configure Gmail API listener to process natural language email commands for quotes, invoicing, and expense logging.
