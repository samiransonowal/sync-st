# 06 — Verification & Dry-Run Test Architecture

## Overview & Key Constraint

> **Python is LOCAL DEV ONLY.** Python scripts run on the developer machine before deployment.
> They are NEVER deployed to GCP (no Cloud Functions, no Cloud Run). The live pipeline
> is 100% Google Apps Script + BigQuery — both within the free tier at ₹0/month.

---

## 5-Layer Testing Architecture

```text
 ┌─────────────────────────────────────────────────────────────────────┐
 │ LAYER 1 — STATIC INTEGRITY (Local Python, pre-deployment)           │
 │  • YAML & JSON user directory alignment (users.yaml ↔ users.json)  │
 │  • GSTIN (27AAMCC8604R1ZV) & PAN (AAMCC8604R) regex bounds         │
 │  • IST Timezone & serial YYYYMMDD date formatter bounds             │
 │  • Intra (9%/9%) & Inter (18%) GST + TDS (10%) tax math            │
 └──────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ LAYER 2 — GAS SELF-TESTS (engine/google-apps-script/6_SelfTest.gs) │
 │  • DRY_RUN_MODE is active guard                                     │
 │  • COMPANY_INFO.GSTIN & PAN regex (mirrored from Python Layer 1)   │
 │  • All 4 required sheet tabs exist (GENERATOR, ACCOUNTS, LOG, PT)  │
 │  • INVOICES_GENERATED Drive folder reachable by script              │
 │  • formatDateYYYYMMDD() produces valid 8-digit string               │
 │  • GST intra/inter-state & TDS math (same bounds as Layer 1)       │
 └──────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ LAYER 3 — DRY RUN INVOICE FLOW (GAS, DRY_RUN_MODE = true)          │
 │  • PDF + HTML generated normally in Drive (visual check)           │
 │  • Gmail send SUPPRESSED — logs "[DRY RUN] Email skipped"          │
 │  • Discord ping SUPPRESSED — logs "[DRY RUN] Discord skipped"      │
 │  • Invoice_Log row written with "[DRY RUN]" prefix                 │
 └──────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ LAYER 4 — BIGQUERY SCHEMA VERIFICATION (Local Python)              │
 │  • Authenticate via service-account.json (credentials/private/)    │
 │  • Assert dataset st_fin_com_prog exists in project st-in-gen      │
 │  • Assert dim_invoices, dim_clients, fact_payments tables exist     │
 │  • Metadata API only — zero bytes scanned, zero cost               │
 └──────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │ LAYER 5 — HUMAN SIGN-OFF CHECKLIST (10 items, pre-live-invoice)    │
 │  • PDF visual check (Lexend font, amounts, GSTIN correct)          │
 │  • HTML web invoice visual check in browser                         │
 │  • Invoice_Log verified (correct prefix, all columns populated)    │
 │  • Set DRY_RUN_MODE = false → issue one real invoice               │
 └─────────────────────────────────────────────────────────────────────┘
```

---

## Running the Test Layers

### Layer 1 — Local Python (run before any GAS deployment)
```bash
python engine/python-scripts/test_system_integrity.py
python engine/python-scripts/dry_run_bigquery.py
```
- **Status:** ✅ PASSING (5/5 tests)

### Layer 2 — GAS Self-Test (run inside Apps Script editor)
```
Extensions > Apps Script > runSelfTest > ▶ Run
```
- **Tests:** 6 checks — DRY_RUN_MODE, GSTIN/PAN, sheets, Drive, date, tax math
- **Output:** Logger.log() + Invoice_Log row with `[SELF_TEST]` prefix

### Layer 3 — GAS Dry Run Invoice
1. Confirm `DRY_RUN_MODE = true` in `0_Config.gs`
2. Fill Invoice_Generator tab with test data (client: TEST CLIENT)
3. Run invoice generator from the menu
4. Inspect Drive folder for PDF + HTML output
5. Confirm Invoice_Log row has `[DRY RUN]` prefix
6. Confirm no email sent, no Discord ping

### Layer 4 — BigQuery Schema (pending — verify_bigquery_schema.py)
```bash
python engine/python-scripts/verify_bigquery_schema.py
```
- **Status:** 🔲 TO BUILD (Phase 2)

### Layer 5 — Human Sign-Off
See `implementation_plan.md` for full 10-item checklist.

---

## Cost Profile
| Layer | Runtime | Cost |
|-------|---------|------|
| Layer 1 (Python) | Local dev machine | ₹0 |
| Layer 2 (GAS self-test) | Google Apps Script | ₹0 |
| Layer 3 (Dry run invoice) | Google Apps Script + Drive | ₹0 |
| Layer 4 (BQ schema check) | BigQuery metadata API (0 bytes scanned) | ₹0 |
| Layer 5 (Human checklist) | Manual | ₹0 |

