import sqlite3
import json
import csv
import os
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SPREADSHEET_ID = '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg'
CRM_CSV = 'sample-documents/vyapar/crm_database.csv'
LEDGER_FY25_26_CSV = 'sample-documents/vyapar/vyapar_migrated_ledger_FY25_26.csv'
LEDGER_FY26_27_CSV = 'sample-documents/vyapar/vyapar_migrated_ledger_FY26_27.csv'

def get_service_account_credentials():
    conn = sqlite3.connect('/Users/samiransonowal/.config/gcloud/credentials.db')
    c = conn.cursor()
    c.execute('SELECT value FROM credentials WHERE account_id LIKE "%serviceaccount%"')
    row = c.fetchone()
    if not row:
        raise Exception("Service account credentials not found in gcloud db.")
    sa_info = json.loads(row[0])
    creds = service_account.Credentials.from_service_account_info(
        sa_info,
        scopes=['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    )
    creds.refresh(Request())
    return creds

def get_sheet_metadata(token):
    url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}'
    headers = {'Authorization': f'Bearer {token}'}
    res = requests.get(url, headers=headers)
    res.raise_for_status()
    return res.json()

def create_sheet_if_missing(token, sheet_title):
    meta = get_sheet_metadata(token)
    existing_sheets = [s['properties']['title'] for s in meta.get('sheets', [])]
    if sheet_title not in existing_sheets:
        print(f"Creating missing sheet tab: {sheet_title}")
        url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}:batchUpdate'
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        body = {
            "requests": [
                {
                    "addSheet": {
                        "properties": {
                            "title": sheet_title
                        }
                    }
                }
            ]
        }
        res = requests.post(url, headers=headers, json=body)
        res.raise_for_status()

def upload_csv_to_sheet(token, csv_filepath, range_name):
    print(f"Uploading {csv_filepath} to range {range_name}...")
    rows = []
    with open(csv_filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for r in reader:
            rows.append(r)
            
    if not rows:
        print(f"No rows found in {csv_filepath}")
        return

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    clear_url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{range_name}:clear'
    requests.post(clear_url, headers=headers)

    update_url = f'https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{range_name}!A1?valueInputOption=USER_ENTERED'
    body = {
        "values": rows
    }
    res = requests.put(update_url, headers=headers, json=body)
    res.raise_for_status()
    print(f"Successfully uploaded {len(rows)} rows to {range_name}!")

def main():
    print("🚀 Starting Direct Automated Upload to Google Sheet (Separated Financial Years)...")
    creds = get_service_account_credentials()
    token = creds.token
    
    # 1. Ensure Tabs Exist
    create_sheet_if_missing(token, 'Client_CRM')
    create_sheet_if_missing(token, 'Project_Billing_Ledger')
    create_sheet_if_missing(token, 'Project_Billing_Ledger_FY25_26')

    # 2. Upload Client CRM
    if os.path.exists(CRM_CSV):
        upload_csv_to_sheet(token, CRM_CSV, 'Client_CRM')

    # 3. Upload FY 2026-27 to active Project_Billing_Ledger
    if os.path.exists(LEDGER_FY26_27_CSV):
        upload_csv_to_sheet(token, LEDGER_FY26_27_CSV, 'Project_Billing_Ledger')

    # 4. Upload FY 2025-26 to archive Project_Billing_Ledger_FY25_26
    if os.path.exists(LEDGER_FY25_26_CSV):
        upload_csv_to_sheet(token, LEDGER_FY25_26_CSV, 'Project_Billing_Ledger_FY25_26')

    print("\n🎉 ALL FINANCIAL YEARS SEPARATED & DIRECTLY UPLOADED TO GOOGLE SHEET!")
    print(f"View live Google Sheet: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")

if __name__ == '__main__':
    main()
