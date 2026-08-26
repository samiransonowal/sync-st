import sqlite3
import json
import re
import os
import requests
import pandas as pd
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SPREADSHEET_ID = '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg'
BANK_STMT_FY26_27 = 'sample-documents/bank statements/2026-2027_Acct_Statement_XXXXXXXX3204_24082026.xls'
BANK_STMT_FY25_26 = 'sample-documents/bank statements/2025-2026_Acct_Statement_XXXXXXXX3204_17082026.xls'

def get_token():
    conn = sqlite3.connect('/Users/samiransonowal/.config/gcloud/credentials.db')
    c = conn.cursor()
    c.execute('SELECT value FROM credentials WHERE account_id LIKE "%serviceaccount%"')
    row = c.fetchone()
    if not row:
        raise Exception("Service account credentials not found.")
    sa_info = json.loads(row[0])
    creds = service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    )
    creds.refresh(Request())
    return creds.token

def parse_bank_credits(filepath):
    if not os.path.exists(filepath):
        print(f"⚠️ Bank statement file not found: {filepath}")
        return []
    df = pd.read_excel(filepath, header=None)
    credits = []
    for i, row in df.iterrows():
        date_str = str(row[0]).strip()
        credit_val = row[5]
        narration = str(row[1]).strip() if not pd.isna(row[1]) else ''
        ref_no = str(row[2]).strip() if not pd.isna(row[2]) else ''
        if pd.notna(credit_val) and credit_val != 'Credit Amount' and isinstance(credit_val, (int, float)) and credit_val > 0:
            credits.append({'date': date_str, 'narration': narration, 'ref_no': ref_no, 'credit_amt': float(credit_val)})
    return credits

def reconcile_tab(token, sheet_name, bank_file):
    print(f"\n=======================================================")
    print(f"🏦 Starting Enhanced Bank Reconciliation for: {sheet_name}")
    print(f"=======================================================")
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get rows (Range A1:AF for 32 columns)
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{sheet_name}!A1:AF'
    res = requests.get(url, headers=headers)
    all_data = res.json().get('values', [])
    if not all_data:
        print(f"No rows found in {sheet_name}")
        return
        
    header_row = all_data[0]
    ledger_rows = all_data[1:]
    bank_credits = parse_bank_credits(bank_file)
    print(f"Loaded {len(ledger_rows)} ledger entries & {len(bank_credits)} bank credit transactions.")

    matched_count = 0
    matched_invoices = set()
    updated_rows = [header_row]

    for idx, lrow in enumerate(ledger_rows):
        # Pad row to 32 columns
        while len(lrow) < 32:
            lrow.append('')
            
        p_code = lrow[0]
        inv_no = lrow[1]
        client = lrow[4]
        try:
            subtotal = float(str(lrow[16]).replace(',', '').strip()) if lrow[16] else 0.0
        except ValueError:
            subtotal = 0.0
            
        try:
            gross = float(str(lrow[17]).replace(',', '').strip()) if lrow[17] else 0.0
        except ValueError:
            gross = 0.0
            
        notes = lrow[24]
        current_status = lrow[27]
        
        if not client or gross == 0:
            updated_rows.append(lrow)
            continue

        client_words = [w.lower() for w in re.findall(r'[A-Za-z0-9]+', client) if len(w) > 2 and w.lower() not in ['private', 'limited', 'pvt', 'ltd', 'llp', 'films', 'media', 'productions', 'house', 'studio', 'works', 'creative', 'services', 'inc']]
        notes_words = [w.lower() for w in re.findall(r'[A-Za-z0-9]+', notes) if len(w) > 3]

        matched = False
        for c in bank_credits:
            narr = c['narration'].lower()
            amt = c['credit_amt']
            
            tds_subtotal = round(subtotal * 1.08, 2)
            tds_gross = round(gross * 0.90, 2)
            
            amt_match = False
            match_type = ''
            tds_amt = 0.0
            
            if abs(amt - gross) < 2.0:
                amt_match = True
                match_type = 'Exact Gross'
            elif abs(amt - tds_subtotal) < 2.0:
                amt_match = True
                match_type = '10% TDS on Subtotal'
                tds_amt = round(gross - amt, 2)
            elif abs(amt - tds_gross) < 2.0:
                amt_match = True
                match_type = '10% TDS on Gross'
                tds_amt = round(gross - amt, 2)

            name_match = any(w in narr for w in client_words) or any(w in narr for w in notes_words)
            inv_match = (inv_no and inv_no in narr) or (p_code and p_code.lower() in narr)

            if amt_match and (name_match or inv_match):
                matched = True
                matched_count += 1
                matched_invoices.add(p_code)
                
                # Update Payment Status (Col AB / index 27)
                lrow[27] = 'Paid'
                # Update Amount Pending (Col AC / index 28)
                lrow[28] = 0.0
                # Update TDS Amount (Col AE / index 30)
                lrow[30] = tds_amt if tds_amt > 0 else 0
                # Update Last Activity (Col AF / index 31)
                lrow[31] = f"Reconciled ({c['date']})"
                
                print(f"  [MATCH #{matched_count}] Code: {p_code} | Inv: {inv_no} | Client: {client} | Recd: ₹{amt} ({match_type}, TDS: ₹{tds_amt}) | Date: {c['date']}")
                break
                
        if not matched:
            # If unpaid, ensure Amount Pending is set to Gross
            if str(lrow[27]).lower() != 'paid':
                lrow[28] = gross
                
        updated_rows.append(lrow)

    # Upload updated rows back to Google Sheets
    print(f"Uploading reconciled data back to {sheet_name} ({len(updated_rows)} rows)...")
    put_url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{sheet_name}!A1?valueInputOption=USER_ENTERED'
    req_headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    body = {"values": updated_rows}
    res = requests.put(put_url, headers=req_headers, json=body)
    res.raise_for_status()
    print(f"✅ {sheet_name} Reconciled Successfully! {matched_count} payments marked as PAID.")

def main():
    print("🚀 Running Enhanced Bank Reconciliation Engine (With Amount Pending Field)...")
    token = get_token()
    
    # 1. Reconcile FY 2026-27 Active Ledger
    reconcile_tab(token, 'Project_Billing_Ledger', BANK_STMT_FY26_27)
    
    # 2. Reconcile FY 2025-26 Archive Ledger
    reconcile_tab(token, 'Project_Billing_Ledger_FY25_26', BANK_STMT_FY25_26)

    print("\n🎉 ALL BANK RECONCILIATIONS COMPLETE & PAYMENT STATUSES UPDATED LIVE ON GOOGLE SHEETS!")
    print(f"View live Google Sheet: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")

if __name__ == '__main__':
    main()
