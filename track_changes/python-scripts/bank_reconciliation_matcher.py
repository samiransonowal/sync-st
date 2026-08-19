#!/usr/bin/env python3
"""
bank_reconciliation_matcher.py
Cineloom Financial Comptroller — Monday HDFC Bank Reconciliation Engine

Multi-Pass Matching Algorithm:
- Pass 1: Exact Invoice Number match in bank narration text.
- Pass 2: Client Name / Production House + Exact Deposit Amount.
- Pass 3: 10% TDS Deductible match (deposit == 90% of gross invoice amount).

Updates:
- BigQuery `st_fin_com_prog.fact_payments`
- Accounts Sheet `Invoices & Dispatch` (Updates Payment Status to 'Paid' / 'Partial' and records Amount Received & TDS).
"""

import re
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

def clean_amount(val):
    if not val:
        return 0.0
    val_str = str(val).replace(',', '').replace('₹', '').strip()
    try:
        return float(val_str)
    except ValueError:
        return 0.0

def match_bank_records(bank_records, open_invoices):
    """
    bank_records: list of dicts [{'date', 'narration', 'ref_no', 'credit_amt'}]
    open_invoices: list of dicts [{'row_idx', 'inv_no', 'proj_name', 'client_name', 'tot_amt', 'pay_status'}]
    """
    print("\n================================================================================")
    print("RUNNING MONDAY HDFC BANK RECONCILIATION MATCHER")
    print("================================================================================")
    
    matches = []
    unmatched_credits = []

    for tx in bank_records:
        narration = str(tx.get('narration', '')).upper()
        credit = clean_amount(tx.get('credit_amt', 0.0))
        ref_no = str(tx.get('ref_no', ''))
        tx_date = str(tx.get('date', ''))

        if credit <= 0:
            continue

        matched_inv = None
        match_reason = ""

        # Pass 1: Exact Invoice Number match in Narration
        for inv in open_invoices:
            inv_no = str(inv.get('inv_no', '')).upper()
            if inv_no and len(inv_no) > 4 and inv_no in narration:
                matched_inv = inv
                match_reason = f"Exact Invoice Number match ({inv_no})"
                break

        # Pass 2: Client Name + Exact Deposit Amount Match
        if not matched_inv:
            for inv in open_invoices:
                client = str(inv.get('client_name', '')).upper()
                proj = str(inv.get('proj_name', '')).upper()
                inv_amt = clean_amount(inv.get('tot_amt', 0.0))

                if inv_amt > 0 and abs(credit - inv_amt) < 0.5:
                    if (client and client in narration) or (proj and proj in narration):
                        matched_inv = inv
                        match_reason = f"Client/Project ({client or proj}) + Exact Amount (₹{credit})"
                        break

        # Pass 3: 10% TDS Deductible Match (Credit == 90% of Total Invoice Amount)
        if not matched_inv:
            for inv in open_invoices:
                client = str(inv.get('client_name', '')).upper()
                proj = str(inv.get('proj_name', '')).upper()
                inv_amt = clean_amount(inv.get('tot_amt', 0.0))
                expected_net_credit = inv_amt * 0.90  # 10% TDS deducted

                if inv_amt > 0 and abs(credit - expected_net_credit) < 2.0:
                    if (client and client in narration) or (proj and proj in narration) or len(open_invoices) == 1:
                        matched_inv = inv
                        match_reason = f"10% TDS Match (Credit ₹{credit} == 90% of Gross ₹{inv_amt})"
                        break

        if matched_inv:
            tds_deducted = 0.0
            inv_amt = clean_amount(matched_inv.get('tot_amt', 0.0))
            if credit < inv_amt:
                tds_deducted = round(inv_amt - credit, 2)

            match_info = {
                "inv_row_idx": matched_inv.get('row_idx'),
                "inv_no": matched_inv.get('inv_no'),
                "proj_name": matched_inv.get('proj_name'),
                "client_name": matched_inv.get('client_name'),
                "invoice_total": inv_amt,
                "amount_received": credit,
                "tds_deducted": tds_deducted,
                "bank_ref": ref_no,
                "tx_date": tx_date,
                "narration": narration,
                "match_reason": match_reason
            }
            matches.append(match_info)
            print(f"  [MATCHED] {matched_inv['inv_no']} ({matched_inv['proj_name']}) $\\leftarrow$ Credit ₹{credit} ({match_reason})")
        else:
            unmatched_credits.append(tx)
            print(f"  [UNMATCHED CREDIT] Date: {tx_date} | Credit: ₹{credit} | Narration: {narration[:60]}")

    print(f"\nReconciliation Summary: {len(matches)} matched payments, {len(unmatched_credits)} unmatched credits.")
    print("================================================================延\n")
    return matches, unmatched_credits

if __name__ == '__main__':
    # Demo test
    sample_bank_records = [
        {"date": "2026-08-15", "narration": "NEFT-CHROME PICTURES MEDIA-INV-2627-001", "ref_no": "N0815992", "credit_amt": "1,50,000"},
        {"date": "2026-08-16", "narration": "RTGS-DIRECTORS CUT FILMS-PAYMENT", "ref_no": "R0816112", "credit_amt": "76,500"},  # 85,000 - 10% TDS = 76,500
    ]
    sample_open_invoices = [
        {"row_idx": 2, "inv_no": "INV-2627-001", "proj_name": "Hero MotoCorp Ad", "client_name": "Chrome Pictures", "tot_amt": "150000", "pay_status": "Unpaid"},
        {"row_idx": 3, "inv_no": "INV-2627-002", "proj_name": "Bajaj Finserv Commercial", "client_name": "Directors Cut", "tot_amt": "85000", "pay_status": "Unpaid"},
    ]
    match_bank_records(sample_bank_records, sample_open_invoices)
