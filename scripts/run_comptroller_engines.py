#!/usr/bin/env python3
"""
run_comptroller_engines.py
Cineloom Financial Comptroller — Master Engine Runner

Executes the complete operational workflow:
1. Backend Synchronization Pipeline (Project Tracker -> BigQuery & Accounts Sheet)
2. Payment Aging & Reminder Dispatch (15, 21, 24, 26, 28, 30, 31+ day triggers)
3. Monday Bank Reconciliation (HDFC Bank Credits -> Open Invoices)
"""

import sys
import os
from pathlib import Path

# Add project paths
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "engine" / "python-scripts"))

from scripts.bigquery_sync_pipeline import sync as run_sync_pipeline
from payment_aging_engine import process_aging_and_reminders
from bank_reconciliation_matcher import match_bank_records, clean_amount

def run_all():
    print("================================================================================")
    print("🚀 CINELOOM FINANCIAL COMPTROLLER MASTER ENGINE RUNNER")
    print("================================================================================\n")

    # Step 1: Run Sync Pipeline
    print(">>> [STAGE 1] Running Backend Synchronization Pipeline...")
    try:
        run_sync_pipeline()
    except Exception as e:
        print(f"❌ Error during sync pipeline: {e}")

    # Step 2: Fetch Active Invoices & Run Aging Engine
    print("\n>>> [STAGE 2] Running Payment Aging & Reminder Dispatch Engine...")
    try:
        # Import sheets service helper
        from scripts.bigquery_sync_pipeline import get_sheets_service, ACCOUNTS_SHEET_ID
        sheets_service = get_sheets_service()

        res = sheets_service.spreadsheets().values().get(
            spreadsheetId=ACCOUNTS_SHEET_ID,
            range="'Invoices & Dispatch'!A2:AA"
        ).execute()
        acct_rows = res.get('values', [])

        parsed_invoices = []
        for idx, r in enumerate(acct_rows, start=2):
            if len(r) > 9:
                parsed_invoices.append({
                    "row_idx": idx,
                    "inv_no": r[1] if len(r) > 1 else "",
                    "inv_date": r[2] if len(r) > 2 else "",
                    "proj_name": r[3] if len(r) > 3 else "",
                    "client_name": r[4] if len(r) > 4 else "",
                    "tot_amt": r[9] if len(r) > 9 else "0",
                    "amount": r[9] if len(r) > 9 else "0",
                    "email": r[12] if len(r) > 12 else "",
                    "payment_status": r[20] if len(r) > 20 else "Unpaid",
                    "notes": r[17] if len(r) > 17 else "",
                    "remark": r[21] if len(r) > 21 else ""
                })

        process_aging_and_reminders(parsed_invoices, dry_run=False)

    except Exception as e:
        print(f"❌ Error during payment aging engine: {e}")

    # Step 3: Monday Bank Reconciliation Matcher
    print("\n>>> [STAGE 3] Checking Monday Bank Reconciliation Doorway...")
    try:
        recon_res = sheets_service.spreadsheets().values().get(
            spreadsheetId=ACCOUNTS_SHEET_ID,
            range="'Monday Reconciliation Doorway'!A2:G"
        ).execute()
        recon_rows = recon_res.get('values', [])

        bank_records = []
        for r in recon_rows:
            if len(r) >= 6:
                bank_records.append({
                    "date": r[0],
                    "narration": r[1],
                    "ref_no": r[2],
                    "credit_amt": r[5]
                })

        if bank_records:
            matches, unmatched = match_bank_records(bank_records, parsed_invoices)
            
            # Apply matches to Accounts Sheet
            for m in matches:
                row_idx = m["inv_row_idx"]
                amt_rec = m["amount_received"]
                tds = m["tds_deducted"]
                inv_total = m["invoice_total"]
                pending = max(0.0, inv_total - (amt_rec + tds))
                status = "Paid" if pending <= 1.0 else "Partial"

                # Update row in Accounts Sheet
                sheets_service.spreadsheets().values().update(
                    spreadsheetId=ACCOUNTS_SHEET_ID,
                    range=f"'Invoices & Dispatch'!U{row_idx}:AA{row_idx}",
                    valueInputOption="USER_ENTERED",
                    body={"values": [[
                        status, # U: PAYMENT STATUS
                        f"Matched via Bank Credit ({m['tx_date']})", # V: Remark
                        m['tx_date'], # W: Due of payment / Ref
                        f"₹{tds:.2f}" if tds else "", # X: TDS
                        m['tx_date'], # Y: Payment Receival Date
                        f"₹{amt_rec:.2f}", # Z: AMOUNT RECEIVED
                        f"₹{pending:.2f}" # AA: PENDING
                    ]]}
                ).execute()
                print(f"  └─ Updated Accounts Sheet Row {row_idx} ({m['inv_no']}) $\\rightarrow$ Status: {status}")
        else:
            print("No new bank statements posted in 'Monday Reconciliation Doorway'.")

    except Exception as e:
        print(f"❌ Error during bank reconciliation stage: {e}")

    print("\n================================================================================")
    print("✨ COMPTROLLER MASTER ENGINE RUN COMPLETED!")
    print("================================================================================")

if __name__ == '__main__':
    run_all()
