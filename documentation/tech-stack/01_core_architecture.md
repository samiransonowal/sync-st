# 01 — Core System Architecture Choice

## Overview

`ST-fin-com-prog` utilizes a **Decoupled Hybrid Architecture** combining the simplicity of spreadsheet interfaces with enterprise cloud data warehousing:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. INGESTION DOORWAY (Google Sheets)                        │
 │    • PROJECT TRACKER (Jobs & Line Producers entry)          │
 │    • ACCOUNTS Sheet (Invoice table & bot status columns)    │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                │ (Sync Engine / Python / Scheduled Query)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 2. DATA WAREHOUSE & MODELING ENGINE (Google BigQuery)       │
 │    • Project: st-in-gen | Dataset: st_fin_com_prog           │
 │    • Relational Star Schema, GST Tax Split, TDS Ledger     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
 ┌───────────────────────┐             ┌───────────────────────┐
 │ 3. VISUAL ANALYTICS   │             │ 4. AUTOMATION ENGINE  │
 │ • Google Looker Studio│             │ • Apps Script (GAS)   │
 │ • Real-time Dashboards│             │ • HTML Web & PDF      │
 └───────────────────────┘             │ • Gmail & Discord     │
                                       └───────────────────────┘
```

---

## Technical Rationale

1. **Why Google Sheets for Data Ingestion?**
   - Non-technical team members (Samiran and Line Producers) enter project data without needing SQL or custom admin UIs.

2. **Why BigQuery for Data Warehousing?**
   - Eliminates Google Sheets row caps, slow formula recalculations (`IMPORTRANGE`), and broken references.
   - Provides immutable audit logging for tax compliance (CGST/SGST/IGST and TDS deductions).

3. **Why Google Looker Studio for Reporting?**
   - Connects natively to BigQuery views without any data middleware, rendering executive revenue and chase-list dashboards in real time.
