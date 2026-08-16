# 03 — Automation & Webhooks Technical Choice

## Overview

The automation engine is built on **Google Apps Script (GAS)** and **Discord Webhooks**:

- **Source Code Directory:** `framework/GAS-all/`
- **Execution Account:** `lab@studiotunnel.com`

---

## Component Breakdown

1. **`0_Config.gs`**:
   - Master cell mapping (`CELL_MAP`), timezone (`Asia/Kolkata`), date format standards (`DATE_FORMATS`), and collaborator emails (`ROLES`).

2. **`1_Utils.gs`**:
   - Indian Rupee Currency-in-Words converter (`numberToIndianWords`), `formatDateYYYYMMDD`, `formatDateDisplay`, and structural regex validators for GSTIN & PAN.

3. **`2_InvoiceParser.gs`**:
   - Parses active invoice sheet, checks Column A checkboxes (`☑ TRUE` / `☐ FALSE`), omits unchecked lines, and computes GST splits.

4. **`3_PdfAndEmailer.gs`**:
   - Generates live HTML web documents and vector PDF files, saves to Google Drive (`INVOICES_GENERATED`), sets domain-level viewer permissions, and dispatches email via Gmail API.

5. **`4_MenuUI.gs`**:
   - Adds custom `🚀 Studio Tunnel` top menu bar in Google Sheets.

6. **`5_DiscordNotifier.gs`**:
   - Posts rich embed notification cards to Discord channel `#invoices-log` in Studio Tunnel green.
