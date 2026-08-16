# 06 — Verification & Dry-Run Test Architecture

## Overview

To ensure 100% reliability, zero data loss, and strict tax compliance, `ST-fin-com-prog` utilizes an automated **Verification & Dry-Run Suite**:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. SYSTEM INTEGRITY SUITE (test_system_integrity.py)        │
 │    • YAML & JSON User Directory Alignment                   │
 │    • GSTIN (27AAMCC8604R1ZV) & PAN (AAMCC8604R) Regex Check   │
 │    • IST Timezone & Serial YYYYMMDD Date Formatter Bounds   │
 │    • Intra (9%/9%) & Inter (18%) GST Tax Math Validation     │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 2. DATA WAREHOUSE DRY RUN (dry_run_bigquery.py)             │
 │    • Ingestion Doorway Payload Parsing                      │
 │    • SQL DDL Insert Statement Dry Run                       │
 │    • 10% TDS Deductions & Currency-in-Words Simulation      │
 └─────────────────────────────────────────────────────────────┘
```

---

## Running Verification Suites

### 1. System Integrity Test Suite
```bash
python engine/python-scripts/test_system_integrity.py
```
- **Coverage:** Checks 5 critical subsystems (YAML/JSON alignment, GSTIN/PAN regex, date serials, tax math).
- **Result:** **`100% PASS RATE`**

### 2. BigQuery Data Flow Dry Run
```bash
python engine/python-scripts/dry_run_bigquery.py
```
- **Coverage:** Simulates receiving an invoice payload, calculating tax splits, and building SQL INSERT DDL for dataset `st-in-gen.st_fin_com_prog`.
- **Result:** **`PASSED`**
