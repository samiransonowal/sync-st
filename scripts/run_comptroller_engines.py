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

import argparse

from scripts.bigquery_sync_pipeline import sync as run_sync_pipeline
from payment_aging_engine import process_aging_and_reminders
from bank_reconciliation_matcher import match_bank_records, clean_amount

def run_all(env='dev', confirm_pml=False):
    # Governance check for PML
    if env.lower() == 'pml' and not confirm_pml:
        print("\n🛑 MANDATORY 2-PARTY CONFIRMATION REQUIRED FOR PML:")
        print("Running master comptroller against PML (Production Main Live) requires `--confirm-pml`.")
        sys.exit(1)

    print("================================================================================")
    print(f"🚀 CINELOOM FINANCIAL COMPTROLLER MASTER ENGINE RUNNER [{env.upper()}]")
    print("================================================================================\n")

    # Step 1: Run Sync Pipeline
    print(f">>> [STAGE 1] Running Backend Synchronization Pipeline ({env.upper()})...")
    try:
        run_sync_pipeline(env=env, confirm_pml=confirm_pml)
    except Exception as e:
        print(f"❌ Error during sync pipeline: {e}")

    # Step 2: Fetch Active Invoices & Run Aging Engine
    print("\n>>> [STAGE 2] Running Payment Aging & Reminder Dispatch Engine...")
    try:
        # Import sheets service helper
        from scripts.bigquery_sync_pipeline import get_sheets_service, SHEETS_TIERS
        sheets_service = get_sheets_service()
        acct_sheet_id = SHEETS_TIERS.get(env.lower(), SHEETS_TIERS['dev'])['accounts_id']

        res = sheets_service.spreadsheets().values().get(
            spreadsheetId=acct_sheet_id,
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

        # Run in simulation / test mode by default until user approval
        process_aging_and_reminders(parsed_invoices, dry_run=True)

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

    # Step 4: Email Intelligent Agent Listener & Monthly CA Dispatch Trigger
    print("\n>>> [STAGE 4] Running Email Intelligent Agent & Monthly CA Compliance Checker...")
    try:
        from email_agent_listener import process_incoming_email_commands
        from ca_compliance_dispatcher import dispatch_ca_compliance_package
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).date()
        
        # Trigger CA package automatically on 1st of month
        if today.day == 1:
            print("Today is the 1st of the month! Triggering Monthly CA Compliance Dispatcher...")
            dispatch_ca_compliance_package(dry_run=True)
        
        # Listen for unread admin email commands
        process_incoming_email_commands()

    except Exception as e:
        print(f"❌ Error during email agent listener stage: {e}")

    print("\n================================================================================")
    print("✨ COMPTROLLER MASTER ENGINE RUN COMPLETED!")
    print("================================================================================")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Cineloom Financial Comptroller Master Runner")
    parser.add_argument('--env', choices=['dev', 'test', 'pml'], default='dev',
                        help="Target environment tier (Default: dev)")
    parser.add_argument('--confirm-pml', action='store_true',
                        help="Mandatory 2-Party confirmation flag for PML (Production Main Live)")
    args = parser.parse_args()
    run_all(env=args.env, confirm_pml=args.confirm_pml)
