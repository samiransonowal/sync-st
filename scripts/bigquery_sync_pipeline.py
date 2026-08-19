#!/usr/bin/env python3
"""
bigquery_sync_pipeline.py
Automated Synchronization Pipeline:
1. Pulls Project Tracker data from Google Sheets API.
2. Ingests raw records into BigQuery dataset `st_fin_com_prog.raw_project_tracker`.
3. Transforms and models invoice-ready records.
4. Pushes newly synchronized invoice rows into the Accounts Sheet (`Invoices & Dispatch`).
5. Logs dimensional records in `st_fin_com_prog.dim_invoices`.
"""

import os
import datetime
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from google.cloud import bigquery

import sys
import argparse

# File Paths & Environment Setup
SERVICE_ACCOUNT_FILE = 'credentials/private/service_account.json'
SHEETS_TOKEN_FILE = 'credentials/private/sheets_token.json'

PROJECT_TRACKER_ID = '1zwcCthO3ysTa3dQAftmchZ-dFjZsWLp76isbWUBYUHY'
ACCOUNTS_SHEET_ID = '1tp2YOK2Z3QSf_8Q9ngioF1t3bHZVI5eGXEUu5WZ7yms'

DATASET_TIERS = {
    'dev': 'st_fin_com_prog_dev',
    'test': 'st_fin_com_prog_test',
    'pml': 'st_fin_com_prog_pml'
}

def get_sheets_service():
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    if os.path.exists(SHEETS_TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(SHEETS_TOKEN_FILE, scopes)
    else:
        creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    return build('sheets', 'v4', credentials=creds)

def get_bigquery_client():
    creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
    return bigquery.Client(credentials=creds, project=creds.project_id)

def sync(env='dev', confirm_pml=False):
    dataset_id = DATASET_TIERS.get(env.lower(), 'st_fin_com_prog_dev')
    
    # 🔒 PML 2-Party Confirmation Check
    if env.lower() == 'pml' and not confirm_pml:
        print("\n🛑 MANDATORY 2-PARTY CONFIRMATION REQUIRED FOR PML:")
        print("Live sync against PML (Production Main Live) requires passing `--confirm-pml`.")
        sys.exit(1)

    print("================================================================================")
    print(f"STARTING BACKEND SYNCHRONIZATION PIPELINE [{env.upper()}] -> Dataset: `{dataset_id}`")
    print("================================================================================")

    sheets_service = get_sheets_service()
    bq_client = get_bigquery_client()

    # 1. Fetch raw Project Tracker data
    print("\n[Step 1] Reading Project Tracker sheet data...")
    pt_result = sheets_service.spreadsheets().values().get(
        spreadsheetId=PROJECT_TRACKER_ID,
        range="'Daily Bookings Log'!A2:U"
    ).execute()
    pt_rows = pt_result.get('values', [])
    print(f"Read {len(pt_rows)} rows from Project Tracker.")

    if not pt_rows:
        print("No rows found to sync.")
        return

    # 2. Ingest into BigQuery `raw_project_tracker`
    print("\n[Step 2] Ingesting raw entries into BigQuery `st_fin_com_prog.raw_project_tracker`...")
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    bq_rows_to_insert = []
    
    for r in pt_rows:
        if not r or not any(r):
            continue
        # Pad row to 21 elements
        r_padded = r + [''] * (21 - len(r))
        bq_rows_to_insert.append({
            "sr": str(r_padded[0]),
            "date": str(r_padded[1]),
            "project_code": str(r_padded[2]),
            "project_name": str(r_padded[3]),
            "production_house": str(r_padded[4]),
            "director": str(r_padded[5]),
            "dop": str(r_padded[6]),
            "colorist": str(r_padded[7]),
            "booking_hrs": str(r_padded[8]),
            "assist_hrs": str(r_padded[9]),
            "total_hrs": str(r_padded[10]),
            "rate": str(r_padded[11]),
            "discount": str(r_padded[12]),
            "total_amount": str(r_padded[13]),
            "poc_name": str(r_padded[14]),
            "email_id": str(r_padded[15]),
            "phone_no": str(r_padded[16]),
            "gst_no": str(r_padded[17]),
            "pan_no": str(r_padded[18]),
            "billing_address": str(r_padded[19]),
            "notes": str(r_padded[20]),
            "ingested_at": now_iso
        })

    # Clear and insert into raw_project_tracker table
    table_id = f"{bq_client.project}.{dataset_id}.raw_project_tracker"
    job_config = bigquery.LoadJobConfig(write_disposition="WRITE_TRUNCATE")
    load_job = bq_client.load_table_from_json(bq_rows_to_insert, table_id, job_config=job_config)
    load_job.result()
    print(f"Successfully inserted/updated {len(bq_rows_to_insert)} raw rows in BigQuery `{table_id}`.")

    # 3. Read existing Accounts Sheet records to prevent duplicates
    print("\n[Step 3] Fetching existing Accounts Sheet entries to prevent duplicates...")
    acct_result = sheets_service.spreadsheets().values().get(
        spreadsheetId=ACCOUNTS_SHEET_ID,
        range="'Invoices & Dispatch'!A2:AA"
    ).execute()
    existing_acct_rows = acct_result.get('values', [])
    
    # Track existing projects (Project Name + Client + Total Amount)
    existing_keys = set()
    for row in existing_acct_rows:
        if len(row) > 9:
            proj = row[3].strip().lower() if len(row) > 3 else ""
            comp = row[4].strip().lower() if len(row) > 4 else ""
            amt = row[9].strip().lower() if len(row) > 9 else ""
            existing_keys.add(f"{proj}|{comp}|{amt}")

    # 4. Transform and Sync to Accounts Sheet
    print("\n[Step 4] Transforming billable jobs and syncing to Accounts Sheet...")
    new_invoice_rows = []
    dim_invoices_to_insert = []
    
    inv_counter = len(existing_acct_rows) + 1
    
    for r in pt_rows:
        if not r or not any(r):
            continue
        r_padded = r + [''] * (21 - len(r))
        
        sr = r_padded[0]
        inv_date = r_padded[1]
        proj_code = r_padded[2]
        proj_name = r_padded[3]
        prod_house = r_padded[4]
        director = r_padded[5]
        dop = r_padded[6]
        colorist = r_padded[7]
        book_hrs = r_padded[8]
        assist_hrs = r_padded[9]
        tot_hrs = r_padded[10]
        rate = r_padded[11]
        discount = r_padded[12]
        tot_amt = r_padded[13]
        poc = r_padded[14]
        email = r_padded[15]
        phone = r_padded[16]
        gst = r_padded[17]
        pan = r_padded[18]
        address = r_padded[19]
        notes = r_padded[20]

        # Calculate GST amount if total amount is numerical
        try:
            amt_val = float(tot_amt.replace(',', '')) if tot_amt else 0.0
            gst_amt = f"{amt_val * 0.18:.2f}" if amt_val > 0 else ""
        except ValueError:
            gst_amt = ""
            amt_val = 0.0

        key = f"{proj_name.strip().lower()}|{prod_house.strip().lower()}|{tot_amt.strip().lower()}"
        
        if key not in existing_keys and proj_name:
            inv_no = f"INV-2627-{inv_counter:03d}" if amt_val > 0 else "DRAFT"
            inv_counter += 1
            
            # Construct Accounts Sheet Row Schema
            acct_row = [
                "", # SR
                inv_no,
                inv_date,
                proj_name,
                prod_house,
                colorist,
                tot_hrs,
                rate,
                discount,
                tot_amt,
                gst_amt,
                poc,
                email,
                phone,
                gst,
                pan,
                address,
                notes,
                "", # PO No
                "Draft" if amt_val > 0 else "Pending Details", # Bill Status
                "Unpaid", # Payment Status
                "", # Remark
                "", # Due date
                "", # TDS
                "", # Payment Receival Date
                "", # Amount Received
                tot_amt # Pending Amount
            ]
            new_invoice_rows.append(acct_row)
            existing_keys.add(key)
            
            # BigQuery dim_invoices entry
            dim_invoices_to_insert.append({
                "invoice_id": f"INV-{inv_counter}",
                "invoice_number": inv_no,
                "invoice_date": str(inv_date),
                "client_name": str(prod_house),
                "project_name": str(proj_name),
                "colorist_name": str(colorist),
                "total_hrs": float(tot_hrs) if tot_hrs and tot_hrs.replace('.','',1).isdigit() else 0.0,
                "rate": float(rate) if rate and rate.replace('.','',1).isdigit() else 0.0,
                "discount": float(discount) if discount and discount.replace('.','',1).isdigit() else 0.0,
                "subtotal": amt_val,
                "gst_amount": float(gst_amt) if gst_amt else 0.0,
                "grand_total": amt_val + (float(gst_amt) if gst_amt else 0.0),
                "poc_name": str(poc),
                "email_id": str(email),
                "phone_no": str(phone),
                "gst_no": str(gst),
                "pan_no": str(pan),
                "billing_address": str(address),
                "bill_status": "Draft",
                "payment_status": "Unpaid",
                "created_at": now_iso
            })

    if new_invoice_rows:
        print(f"Pushing {len(new_invoice_rows)} newly synchronized invoice rows into Accounts Sheet...")
        sheets_service.spreadsheets().values().append(
            spreadsheetId=ACCOUNTS_SHEET_ID,
            range="'Invoices & Dispatch'!A2",
            valueInputOption="USER_ENTERED",
            body={"values": new_invoice_rows}
        ).execute()
        print("Successfully written to Accounts Sheet!")
    else:
        print("No new invoice records to push (all records are up to date).")

    # 5. Load dimensional invoices into BigQuery `dim_invoices`
    if dim_invoices_to_insert:
        print(f"\n[Step 5] Inserting dimensional records into BigQuery `{dataset_id}.dim_invoices`...")
        dim_table_id = f"{bq_client.project}.{dataset_id}.dim_invoices"
        load_job = bq_client.load_table_from_json(dim_invoices_to_insert, dim_table_id)
        load_job.result()
        print(f"Successfully inserted {len(dim_invoices_to_insert)} records into BigQuery `{dim_table_id}`.")

    print("\n================================================================================")
    print(f"BACKEND SYNCHRONIZATION PIPELINE [{env.upper()}] COMPLETED SUCCESSFULLY!")
    print("================================================================================")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="BigQuery Sync Pipeline with 3-tier Governance")
    parser.add_argument('--env', choices=['dev', 'test', 'pml'], default='dev',
                        help="Target environment tier (Default: dev)")
    parser.add_argument('--confirm-pml', action='store_true',
                        help="Mandatory 2-Party confirmation flag for PML (Production Main Live)")
    args = parser.parse_args()
    sync(env=args.env, confirm_pml=args.confirm_pml)
