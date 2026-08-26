# Cloud-Native & Zero Local/Python Dependency Mandate

## Primary Operational Rule

1. **100% Native on Google Cloud & Google Workspace Ecosystem**:
   - All backend logic, automation engines, schedulers, databases, and APIs must run natively in the cloud on **Google Cloud Platform (GCP)** and **Google Workspace**.
   - No function, pipeline, cron job, daemon, or service may depend on a locally hosted workstation or local machine runtime.

2. **No Python Dependency**:
   - The production application, automation pipelines, and data sync engines must NOT rely on local Python scripts or Python-specific environment dependencies.
   - Serverless compute runtimes are standardized on:
     - **Google Apps Script (GAS)**: Cloud-native JavaScript (V8 runtime) embedded within Google Workspace.
     - **Google Cloud Functions / Cloud Run**: Node.js / TypeScript serverless microservices where containerized or REST endpoints are needed.
     - **Google BigQuery**: Cloud SQL, scheduled queries, procedural SQL, federated queries, and stored procedures for data warehousing and analytics.
     - **Google Cloud Scheduler & Workflows**: Native cloud-managed orchestration and cron schedules.
     - **Google Looker Studio**: Native serverless BI and reporting dashboards.

3. **Event-Driven & Serverless Execution**:
   - Ingestion: Google Sheets UI + native Google Apps Script installable triggers (`onEdit`, `onChange`, time-driven triggers).
   - Invoicing & PDF Generation: Cloud-native GAS HTML template rendering to Google Drive.
   - Bank Reconciliation & Aging: Native BigQuery SQL routines & Google Cloud Functions / Apps Script.
   - Notifications: Native Google Workspace Gmail API & cloud webhooks.
