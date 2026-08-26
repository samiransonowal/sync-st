# Implementation Plan: Data Architecture Overhaul (Firestore/BigQuery Hybrid)

## Goal

To refactor the system architecture across all documentation and planned modules in `st-comptroller` to adopt the new **Hybrid OLTP/OLAP Data Architecture**: 
`Google Sheets -> Firebase Firestore <-> Firebase Web App -> Google BigQuery`.

This plan ensures that all modules (Invoicing, Reminders, Analytics, Bank Reconciliation) are built on top of this high-speed, real-time sync architecture, replacing legacy concepts like `IMPORTRANGE` and Looker Studio.

---

## 1. Architectural Changes to Master Specifications

The following updates will be made to `cineloom-comtroller-workflow.md` and related architecture documents.

### A. The Core Data Flow (To be updated in Section 1)

```mermaid
flowchart TD
    subgraph Data Ingestion Layer
        Producer[Line Producer] -->|Data Entry| Sheets[Google Sheets: Project Tracker]
        Admin[Admin] -->|Data Entry| AccSheets[Google Sheets: Accounts Master]
    end

    subgraph Operational Database (Real-time)
        Sheets -- "Apps Script onEdit Trigger" --> Firestore[(Firebase Firestore)]
        AccSheets -- "Apps Script onEdit Trigger" --> Firestore
    end

    subgraph User Interface
        Firestore <-->|Bi-directional Sync| WebApp[Firebase Web App Dashboard]
    end

    subgraph Cloud Functions (Automated Modules)
        Firestore -- "Triggers on Status Change" --> PDFGen[Invoice PDF Generator]
        Firestore -- "Scheduled Query" --> Reminders[21-Day Reminder Engine]
        BankCSV[Bank Statements] --> Recon[Reconciliation Engine] --> Firestore
    end

    subgraph Analytics & Archiving
        Firestore -- "Firebase Extension (Stream)" --> BigQuery[(Google BigQuery)]
    end
```

### B. Module Integration Plan (Section 4 & 5 Updates)

We will update the specifications for all core modules to utilize this architecture:

1. **Invoice Generation (4.1)**:
   - *Old Flow*: Sheets -> BigQuery -> PDF Engine.
   - *New Flow*: When a row is marked "Ready to Bill" in the Web App or Sheet, **Firestore triggers a Cloud Function** that generates the vector PDF and saves it to Google Drive, instantly updating the Firestore record with the Drive URL.

2. **Payment Reminders & Aging (4.2 & 4.3)**:
   - *Old Flow*: BigQuery view `view_chase_list` polled by cron.
   - *New Flow*: **Cloud Scheduler** triggers a Cloud Function daily. It queries **Firestore** for all invoices where `status == 'UNPAID'` and `age_days >= 21`, dispatching emails and updating the `last_reminded` timestamp in Firestore.

3. **Financial Health & Dashboards (4.5)**:
   - *Old Flow*: BigQuery -> Google Looker Studio (Read-only).
   - *New Flow*: **Firebase Web App** reads directly from Firestore to display real-time charts (Recharts/Tremor) for cash flow, burn rate, and overdue buckets. Users can click any chart segment to open and **edit** the underlying invoice.

4. **Bank Reconciliation (4.9)**:
   - *Old Flow*: Match against BigQuery tables.
   - *New Flow*: A Cloud Function parses the uploaded HDFC CSV, queries **Firestore** for matching outstanding invoices, and updates the invoice status to 'PAID' in Firestore.

5. **Data Warehousing (Section 6 - Synchronization)**:
   - *Old Flow*: Apps Script syncing Sheets directly to BigQuery.
   - *New Flow*: Implement the **Firebase Extension: Stream Firestore to BigQuery**. This requires zero custom code and ensures every write to Firestore is instantly replicated to BigQuery for heavy tax/audit reporting.

6. **Mandatory Unique Identifiers (UUID / Primary Key)**:
   - Every row across all Google Sheets tabs (Project Tracker, Invoices, Expenses, Recon, Loans) MUST feature a `UUID` as Column A (e.g., `PRJ-8F92A1` or standard UUIDv4).
   - An Apps Script trigger automatically populates Column A with a new UUID when a new row is entered.
   - This `UUID` serves as the document key in Firestore (`/projects/{UUID}`, `/invoices/{UUID}`) and the `PRIMARY KEY` in BigQuery, guaranteeing bulletproof 3-way synchronization without collision risks.

---

## 2. File Modification Execution Plan

Once you approve this plan, I will execute the following file updates:

### Phase 1: Update Master Specifications
- **[MODIFY]** `documentation/master-specs/cineloom-comtroller-workflow.md`
  - Replace Section 1 flowchart.
  - Rewrite Section 2 to define the Sheets -> Firestore bridge.
  - Update Section 4 modules (Invoicing, Reminders, Dashboards) to reference Firestore triggers.
  - Update Section 5 Mapping Matrix.
  - Update Section 6 Implementation Tasks to include Firestore Setup.

### Phase 2: Update Technology Stack Docs
- **[MODIFY]** `documentation/tech-stack/01_core_architecture.md`
  - Fully define the Hybrid OLTP/OLAP architecture.
- **[MODIFY]** `documentation/tech-stack/02_database_and_warehouse.md`
  - Split the document into **2.1 Operational Database (Firestore)** and **2.2 Data Warehouse (BigQuery)**.
- **[MODIFY]** `documentation/organization/cross_architecture_3tier_mandate.md`
  - Update the 3-Tier environment definitions to include `Firestore (Dev, Test, Prod)` isolated collections/databases.
