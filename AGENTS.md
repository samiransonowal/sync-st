# sync-st — Core Architecture & Coding Rules

## 🛡️ MANDATORY CODING & EXECUTION RULES

### 1. Cloud-Native on Google Cloud & Google Workspace
- **100% Native on Cloud**: All workflows, cron triggers, event listeners, and business logic run strictly within **Google Cloud Platform (GCP)** and **Google Workspace**.
- **Zero Local Hosting**: No component may rely on a local developer machine, workstation daemon, or local hosting.
- **Zero Python Dependency**: The production runtime and automation workflows must NOT be Python-dependent. 

### 2. Standardized Technology Stack
- **Ingestion & UI**: Google Sheets with bound **Google Apps Script (JavaScript V8)**.
- **Cloud Backend & Microservices**: **Google Cloud Functions / Cloud Run (Node.js / TypeScript)**.
- **Data Warehouse & Business Logic**: **Google BigQuery** (SQL Views, Scheduled Queries, Stored Procedures, External Tables).
- **Automation & Scheduling**: **Google Cloud Scheduler**, **Google Cloud Workflows**, and native **Google Workspace installable triggers**.
- **Asset Storage & Document Generation**: **Google Drive API**, **Google Cloud Storage (GCS)**, and GAS HTML PDF renderers.
- **Reporting & Business Intelligence**: **Google Looker Studio**.

### 3. Multi-Tier Environment Strategy
- **DEV**: Development branch (`dev`), dev Google Sheets, dev BigQuery dataset (`st_comptroller_dev`).
- **TEST**: Automated staging/testing branch (`test`), test Google Sheets, test BigQuery dataset (`st_comptroller_test`).
- **PML (Production Master Live)**: Live production branch (`main`/`pml`), official Google Sheets, live BigQuery dataset (`st_comptroller_pml`).
