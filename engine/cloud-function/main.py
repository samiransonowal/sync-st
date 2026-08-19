import functions_framework
from google.cloud import bigquery
from googleapiclient.discovery import build
from google.oauth2 import service_account
import os
import datetime

# Ingestion configuration & dynamic dataset routing (Dev, Test, PML)
PROJECT_TRACKER_ID = os.environ.get('PROJECT_TRACKER_ID', '1zwcCthO3ysTa3dQAftmchZ-dFjZsWLp76isbWUBYUHY')
ACCOUNTS_SHEET_ID = os.environ.get('ACCOUNTS_SHEET_ID', '1tp2YOK2Z3QSf_8Q9ngioF1t3bHZVI5eGXEUu5WZ7yms')
DATASET_ID = os.environ.get('BIGQUERY_DATASET_ID', 'st_fin_com_prog_dev')

@functions_framework.http
def sync_pipeline_http(request):
    """
    Cloud Function HTTP handler for BigQuery Sync Pipeline.
    Runs daily via GCP Cloud Scheduler.
    """
    try:
        # Use Application Default Credentials inside GCP
        bq_client = bigquery.Client()
        
        # Drive/Sheets API scopes
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        
        # If running inside GCP Cloud Function with Service Account attached
        creds, project = google.auth.default(scopes=scopes)
        sheets_service = build('sheets', 'v4', credentials=creds)

        # 1. Fetch raw Project Tracker data
        pt_result = sheets_service.spreadsheets().values().get(
            spreadsheetId=PROJECT_TRACKER_ID,
            range="'Daily Bookings Log'!A2:U"
        ).execute()
        pt_rows = pt_result.get('values', [])

        if not pt_rows:
            return "No rows found in Project Tracker.", 200

        # 2. Ingest into BigQuery `raw_project_tracker`
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        bq_rows_to_insert = []
        for r in pt_rows:
            if not r or not any(r):
                continue
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

        table_id = f"{bq_client.project}.{DATASET_ID}.raw_project_tracker"
        job_config = bigquery.LoadJobConfig(write_disposition="WRITE_TRUNCATE")
        load_job = bq_client.load_table_from_json(bq_rows_to_insert, table_id, job_config=job_config)
        load_job.result()

        # 3. Read existing Accounts Sheet records
        acct_result = sheets_service.spreadsheets().values().get(
            spreadsheetId=ACCOUNTS_SHEET_ID,
            range="'Invoices & Dispatch'!A2:AA"
        ).execute()
        existing_acct_rows = acct_result.get('values', [])
        
        existing_keys = set()
        for row in existing_acct_rows:
            if len(row) > 9:
                proj = row[3].strip().lower() if len(row) > 3 else ""
                comp = row[4].strip().lower() if len(row) > 4 else ""
                amt = row[9].strip().lower() if len(row) > 9 else ""
                existing_keys.add(f"{proj}|{comp}|{amt}")

        # 4. Transform and Sync
        new_invoice_rows = []
        dim_invoices_to_insert = []
        inv_counter = len(existing_acct_rows) + 1

        for r in pt_rows:
            if not r or not any(r):
                continue
            r_padded = r + [''] * (21 - len(r))
            
            proj_name = r_padded[3]
            prod_house = r_padded[4]
            colorist = r_padded[7]
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
                
                acct_row = [
                    "", inv_no, r_padded[1], proj_name, prod_house, colorist,
                    tot_hrs, rate, discount, tot_amt, gst_amt, poc, email, phone,
                    gst, pan, address, notes, "", "Draft" if amt_val > 0 else "Pending Details",
                    "Unpaid", "", "", "", "", "", tot_amt
                ]
                new_invoice_rows.append(acct_row)
                existing_keys.add(key)
                
                dim_invoices_to_insert.append({
                    "invoice_id": f"INV-{inv_counter}",
                    "invoice_number": inv_no,
                    "invoice_date": str(r_padded[1]),
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
            sheets_service.spreadsheets().values().append(
                spreadsheetId=ACCOUNTS_SHEET_ID,
                range="'Invoices & Dispatch'!A2",
                valueInputOption="USER_ENTERED",
                body={"values": new_invoice_rows}
            ).execute()

        if dim_invoices_to_insert:
            dim_table_id = f"{bq_client.project}.{DATASET_ID}.dim_invoices"
            load_job = bq_client.load_table_from_json(dim_invoices_to_insert, dim_table_id)
            load_job.result()

        return f"Successfully processed {len(pt_rows)} rows. Inserted {len(new_invoice_rows)} new invoices.", 200

    except Exception as e:
        return f"Error executing sync pipeline: {str(e)}", 500
