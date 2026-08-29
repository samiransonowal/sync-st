# 03 — Automation & Webhooks Technical Choice

## Overview

The automation engine is built on **Google Apps Script (GAS)** and **Clasp CI/CD**:

- **Source Code Directory:** `engine/google-apps-script/`
- **GCP Project ID:** `sync-st` (Project Number: `972643538415`)
- **Execution Account:** `lab@studiotunnel.com`
- **CI/CD Pipeline:** Automated GitHub Actions (`.github/workflows/gas-ci.yml`)

---

## Environment Architecture (3-Tier Dev, Test, PML Setup)

| Tier | Branch | Apps Script Title | BigQuery Dataset ID | Mode |
|---|---|---|---|---|
| **Dev** | `dev` | `sync-st-dev` | `st_comptroller_dev` | `DRY_RUN_MODE = true` (Iterative coding, isolated Drive writes) |
| **Test** | `test` | `sync-st-test` | `st_comptroller_test` | `DRY_RUN_MODE = true` (Full sandbox integration) |
| **PML** *(Production Main Live)* | `pml` | `sync-st-pml` | `st_comptroller_pml` | `DRY_RUN_MODE = false` (Live PDF invoice generation, real emails) |

---

## Component Breakdown

1. **`0_Config.gs`**:
   - Master cell mapping (`CELL_MAP`), timezone (`Asia/Kolkata`), date format standards (`DATE_FORMATS`), collaborator emails (`ROLES`), and `DRY_RUN_MODE` guard.

2. **`constants.gs`**:
   - Centralized external master spreadsheet mappings (`EXTERNAL_SHEETS`), including the STEM User Registry (`1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA`).

3. **`1_Utils.gs`**:
   - Indian Rupee Currency-in-Words converter (`numberToIndianWords`), `formatDateYYYYMMDD`, `formatDateDisplay`, and structural regex validators for GSTIN & PAN.

4. **`2_InvoiceParser.gs`**:
   - Parses active invoice sheet, checks Column A checkboxes (`☑ TRUE` / `☐ FALSE`), omits unchecked lines, and computes GST splits.

5. **`3_PdfAndEmailer.gs`**:
   - Generates live HTML web documents and vector PDF files, saves to Google Drive (`INVOICES_GENERATED`), sets domain-level viewer permissions, and dispatches email via Gmail API.

6. **`4_MenuUI.gs`**:
   - Adds custom `🚀 Studio Tunnel` top menu bar in Google Sheets with one-click PDF generation, internal review email dispatch, and cloud self-test suite.

7. **`5_ScheduledBotsAndReminders.gs`**:
   - **Saturday 10:00 PM IST Cron**: Dispatches weekly executive sales, per-colorist booking breakdown, and operational concern digest to `samiran@studiotunnel.com` and `yash@studiotunnel.com`.
   - **Monday 9:00 AM IST Cron**: Sends bank statement reconciliation prompts, overdue invoice lists (>30 days), and owner personal follow-up targets to `samiran@studiotunnel.com`.
   - **Staggered Payment Reminder Engine**: Evaluates active invoices daily and triggers staged payment reminders on Days **21**, **23**, **25**, **28**, and **30**.

8. **`6_SelfTest.gs`**:
   - Automated 7-point in-script diagnostic suite validating DRY_RUN guard, company regex, sheet tabs, Drive folder reachability, and STEM user registry access.

---

## 🛑 Outbound Email Safety Enforcement Policy

> **CRITICAL OPERATIONAL CONSTRAINT:**  
> **Until explicitly notified otherwise, this automation will NEVER send any emails directly to external clients under any circumstances.**  
> 
> All invoice generation and email automation dispatches are hard-locked to route exclusively to authorized internal Studio Tunnel addresses:
> - `finance@studiotunnel.com`
> - `samiran@studiotunnel.com`
> - `contact@studiotunnel.com`
> - `tamash@studiotunnel.com`
