# 01 — Core System Architecture & Cloud-Native Mandate

## Overview

`st-comptroller` operates on a **100% Google Cloud Native & Serverless Hybrid OLTP/OLAP Architecture**. It combines Google Workspace frontends, Firebase real-time operational databases, interactive web dashboards, and Google Cloud enterprise data warehousing:

```text
 ┌──────────────────────────────────────────────────────────────────┐
 │ 1. INGESTION LAYER (Google Sheets + Apps Script)                 │
 │    • Clean Day-wise Project Tracker & Master Accounts Sheet      │
 │    • Column A UUID Primary Keys auto-generated onEdit            │
 └─────────────────────────────────┬────────────────────────────────┘
                                   │ (Apps Script onEdit Trigger)
                                   ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │ 2. OPERATIONAL DATABASE / REAL-TIME OLTP (Firebase Firestore)   │
 │    • Sub-second reads/writes (/projects, /invoices, /expenses)   │
 │    • Bi-directional sync & status management                     │
 └─────────────────┬────────────────────────────────┬───────────────┘
                   │                                │
                   │ (Bi-directional Sync)          │ (Firebase Extension: Stream)
                   ▼                                ▼
 ┌──────────────────────────────────┐ ┌──────────────────────────────┐
 │ 3. USER INTERFACE / WEB APP      │ │ 4. DATA WAREHOUSE / OLAP     │
 │    • Firebase Web App Dashboard  │ │    (Google BigQuery)         │
 │    • Interactive financial BI    │ │    • Multi-tier Datasets     │
 │    • Bi-directional edits & CTAs │ │    • Star Schema, GST, TDS   │
 └──────────────────────────────────┘ └──────────────────────────────┘
```

---

## Core Operational Rules

1. **Hybrid OLTP / OLAP Data Separation**:
   - **Firestore (OLTP)**: Handles real-time web portal access, operational status updates, document triggers, and rapid UI interactions.
   - **BigQuery (OLAP)**: Receives streaming data from Firestore via the official Firebase Extension for long-term tax audit trails, statutory GST/TDS ledgering, and heavy analytical queries.

2. **Zero Local Machine / Workstation Hosting**:
   - No pipeline, cron trigger, daemon, or listener is permitted to run on a local workstation.
   - All compute is 100% cloud-hosted on Google Cloud Platform and Google Workspace infrastructure.

3. **No Python Runtime Dependency**:
   - The production stack and automations do not depend on Python.
   - All serverless functions and scripts run on **JavaScript/V8 (Google Apps Script)**, **Node.js/TypeScript (Cloud Functions/Cloud Run)**, or **BigQuery SQL**.

4. **Why Google Sheets for Data Ingestion?**:
   - Non-technical team members enter project bookings directly without requiring complex database UIs, with `UUID` primary keys assigned automatically.

5. **Why BigQuery for Data Warehousing?**:
   - Eliminates spreadsheet row limitations and fragile cross-sheet formulas.
   - Guarantees immutable audit records for statutory tax tracking (CGST, SGST, IGST, TDS 194C/194J) and aging cycles.
