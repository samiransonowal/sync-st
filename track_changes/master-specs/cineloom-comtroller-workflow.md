---
name: "cineloom-comptroller-workflow"
description: "Target Outcomes, Current Accounts Workflow, Spreadsheet Overhaul Plan, and Functional Architecture for ST-fin-com-prog (Studio Tunnel Financial Comptroller Agent)."
---

# ST-fin-com-prog — Agent Core Target Outcomes & Operational Workflows

This specification outlines the strategic financial outcomes, current accounts operational workflow, spreadsheet overhaul schedule, and target capabilities for the **Studio Tunnel Financial Comptroller Agent (`ST-fin-com-prog`)** operating across Studio Tunnel / Cineloom Postworks Pvt Ltd.

---

## 1. Executive Overview & Architecture

The Comptroller Agent acts as an autonomous financial co-pilot and automated ledger manager. It bridges operational spreadsheets (**Project Tracker** & **Accounts Sheet**), bank statements, automated client communications, expense management, statutory tax tracking, and natural language email commands into **BigQuery** and **Google Looker Studio**.

```mermaid
flowchart TD
    Producer[Line Producer / Team] -->|Daily Logins & Hours| TrackerSheet[New Project Tracker Sheet]
    TrackerSheet -->|Automated Pipeline / Apps Script| AccountsSheet[New Accounts Master Sheet]
    
    Email[Email Agent Interface] --> AgentCore[Comptroller Agent Engine]
    AccountsSheet --> AgentCore
    Bank[HDFC Bank Statements / Monday Recon] --> Recon[Custom Client Recon Logic Engine]
    
    AgentCore --> Invoicing[Invoice & Estimate Generation]
    AgentCore --> Reminders[21st Day Automated Reminders & 30-Day Cycle Tracking]
    AgentCore --> Expenses[Expense & Liability Ledger]
    AgentCore --> Tax Engine[GST Payable & TDS Tracking]
    Recon --> Cashflow[Cashflow & Financial Health Reports]
    
    AgentCore --> WareHouse[(BigQuery DW: st_fin_com_prog)]
    WareHouse --> Dashboards[Looker Studio & Executive Summaries]
```

---

## 2. Current Accounts Operational Workflow & Inventory

### 2.1 Current Workflow Analysis
1. **Line Producer Project Tracker**:
   - Managed directly by the Line Producer.
   - Captures billable hours, project scope, colorist assignments, and client company details for billing.
2. **Accounts Sheet Bridge (`IMPORTRANGE`)**:
   - Accounts Sheet imports project data via Google Sheets `=IMPORTRANGE(...)` formulas.
   - Assembles required invoice details, shipping addresses, and tax parameters to prepare and dispatch client invoices.
3. **Invoice Date Anchor**:
   - The `Invoice Date` is used as the primary baseline timestamp to track payment cycles and monitor receivables.
4. **Monday Bank Statement Reconciliation**:
   - Conducted every Monday to compare bank statement credits (HDFC) against open accounts receivable to verify cleared payments, deducted TDS, and outstanding client balances.

### 2.2 Current Spreadsheet Infrastructure
Located and referenced in [`credentials.env.example`](file:///Users/samiransonowal/Documents/GitHub/IN-gen/credentials/public/credentials.env.example#L75-L87):

| Spreadsheet Role | Spreadsheet Title | Spreadsheet ID / URL |
| :--- | :--- | :--- |
| **Master Accounts Sheet** | `ACCOUNTS_CINELOOM POSTWORKS_2026_ANTIGRAVITY` | [`1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A`](https://docs.google.com/spreadsheets/d/1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A/edit?gid=0#gid=0) |
| **Upstream Project Tracker** | `PROJECT TRACKER_CINELOOM POSTWORKS_ANTIGRAVITY` | [`1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0`](https://docs.google.com/spreadsheets/d/1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0/edit?pli=1&gid=0#gid=0) |

---

## 3. Spreadsheet Overhaul & Replication Plan

To resolve formula fragility and broken `=IMPORTRANGE(...)` dependencies while preserving complete per-column queryability for reporting and analytics, we have re-established explicit, uncombined column structures across both spreadsheets:

### 3.1 Project Tracker (Daily Bookings Log Schema)
Every field is strictly maintained in its own dedicated column:
- `SR.` (Sequence number)
- `DATE / INVOICE DATE` (Entry timestamp)
- `PROJECT NAME` (Unique project title)
- `PRODUCTION HOUSE / CLIENT` (Client entity)
- `DIRECTOR` (Director name)
- `DOP` (Director of Photography)
- `COLORIST` (Assigned colorist/artist)
- `BOOKING HRS` (Scheduled hours)
- `ASSIST HRS` (Assistant hours)
- `TOTAL HRS` (Total billable hours)
- `RATE` (Hourly billing rate)
- `DISCOUNT` (Applicable discount)
- `TOTAL AMOUNT` (Calculated net total)
- `POC NAME` (Point of contact)
- `EMAIL ID` (Billing email)
- `PHONE NO.` (Contact phone)
- `GST NO.` (Client GSTIN)
- `PAN NO.` (Client PAN)
- `BILLING ADDRESS` (Full corporate address)
- `Notes / Scope` (Deliverable scope and milestone notes)

### 3.2 Accounts Sheet (Doorway Tabs Schema)

#### **Tab 1: `Invoices & Dispatch`**
- `SR.` | `INV NO.` | `INVOICE DATE` | `PROJECT NAME` | `COMPANY / CLIENT` | `COLORIST` | `HRS` | `PER HR RATE` | `DISCOUNT` | `TOTAL AMOUNT` | `GST BILL AMOUNT` | `POC NAME` | `EMAIL ID` | `PHONE NO.` | `GST NO.` | `PAN NO.` | `BILLING ADDRESS` | `Notes` | `PO No.` | `BILL STATUS` | `PAYMENT STATUS` | `Remark` | `Due of payment` | `TDS @10%` | `Payment Receival Date` | `AMOUNT RECEIVED` | `PENDING`

#### **Tab 2: `Expenses & Payables`**
- `Date` | `Expense Category` | `Description / Item` | `Project Code` | `Amount (₹)` | `Paid To / Vendor` | `Payment Mode` | `GST Component` | `Tax Invoice / Bill No.` | `Approval Status` | `Notes / Drive Receipt`

#### **Tab 3: `Monday Reconciliation Doorway`**
- `Bank Txn Date` | `HDFC Narration / Reference` | `Credit Amount (₹)` | `Debit Amount (₹)` | `Matched Invoice No.` | `Matched Client Name` | `Expected Net Receipt` | `TDS Deducted` | `Reconciliation Status` | `Notes`

#### **Tab 4: `Loans & Subscriptions`**
- `Obligation Type` | `Name / Lender / SaaS Tool` | `Account / Policy Reference` | `Monthly EMI / Amount (₹)` | `Due Day of Month` | `Next Due Date` | `Auto-Debit Account` | `Payment Status` | `Notes`

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
- **Executive Summaries**: Generate automated weekly/monthly financial health reports (PDF / Email digest / Looker Studio dashboard) highlighting:
  - Gross Revenue vs. Net Receipts
  - Burn Rate & Runway Analysis
  - Outstanding Receivables vs. Payables Ratio
  - Colorist Revenue Contribution Breakdown

### 4.6 Estimates & Quotation Management
- **Pre-Billing Workflow**: Draft and issue formal Quotations and Estimates (`dim_estimates`) for client approval prior to project commencement.
- **Seamless Conversion**: Automatically convert approved client estimates into official Invoices with a single agent instruction or status toggle, ensuring zero duplicate data entry.

### 4.7 Intelligent Email-Based Task Agent Interface
- **Natural Language Email Command Processing**: Ingest incoming operational requests from authorized team emails (e.g., Accounts, Samiran, Line Producers).
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
| **Invoice Generation** | Project Tracker Sheet / Email | PDF Engine + BigQuery `dim_invoices` | Vector PDF Invoices & Drive URL |
| **30-Day Payment Cycle** | BigQuery `fact_payments` | Aging Engine (`view_chase_list`) | Overdue Status & Aging Metrics |
| **21st Day Reminders** | BigQuery `view_chase_list` | Dispatcher (Email / Discord) | Automated Client Reminder Notice |
| **Expense Tracking** | Ingestion Sheet / Email Agent | Expense Ledger (`fact_expenses`) | Categorized Expense Reports & Margin Analysis |
| **Financial Health Reports**| BigQuery Financial Views | Looker Studio / Email Digest | Executive Cashflow & Burn Dashboard |
| **Estimates & Quotations** | Email Agent / Sheet | Quote Generator (`dim_estimates`) | PDF Quotation & One-Click Invoice Sync |
| **Email Intelligent Agent**| Incoming Email Inbox | NLP Parser & Command Executor | Execution Log & Response Email |
| **GST & TDS Accounting** | Invoices & Payment Receipts | Statutory Tax Engine | Net GST Payable & TDS Receivable Ledger |
| **Bank Reconciliation** | HDFC Bank Statements | Custom Reconciliation Algorithm | Automated Transaction-Invoice Match |
| **Loans & Subscriptions** | Recurring Schedule Ledger | Liabilities Ledger (`dim_liabilities`)| Due Alerts & Cash Outflow Schedule |

---

## 6. Scheduled Implementation Plan & Next Steps

1. **Task 1: Spreadsheet Template Creation & Migration**:
   - Generate new Google Spreadsheet templates for **Project Tracker** (daily time log format) and **Accounts Sheet**.
   - Migrate existing data from old spreadsheet IDs (`1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0` and `1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A`).
2. **Task 2: Backend Synchronization Pipeline**:
   - Replace raw `=IMPORTRANGE(...)` formulas with an Apps Script / BigQuery sync script.
3. **Task 3: Core Logic Engines Implementation**:
   - Implement 21st-day payment reminder trigger, 30-day aging engine, and Monday HDFC bank reconciliation matcher.
4. **Task 4: Email Intelligent Agent Integration**:
   - Configure Gmail API listener to process natural language email commands for quotes, invoicing, and expense logging.
