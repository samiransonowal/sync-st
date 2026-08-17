#!/usr/bin/env python3
"""
setup_bigquery_tables.py
Initializes BigQuery dataset `st_fin_com_prog` and creates standard star schema tables.
"""

import os
from google.cloud import bigquery
from google.oauth2 import service_account

SERVICE_ACCOUNT_FILE = 'credentials/private/service_account.json'
DATASET_ID = 'st_fin_com_prog'

def main():
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"Error: {SERVICE_ACCOUNT_FILE} not found.")
        return

    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)
    
    print(f"Connected to BigQuery Project: {client.project}")

    # 1. Create Dataset if not exists
    dataset_ref = bigquery.DatasetReference(client.project, DATASET_ID)
    dataset = bigquery.Dataset(dataset_ref)
    dataset.location = "US"  # Default location
    dataset = client.create_dataset(dataset, exists_ok=True)
    print(f"Dataset {DATASET_ID} verified/created.")

    # 2. Define Table Schemas
    
    # Raw Project Tracker Ingestion Table
    raw_pt_schema = [
        bigquery.SchemaField("sr", "STRING"),
        bigquery.SchemaField("date", "STRING"),
        bigquery.SchemaField("project_code", "STRING"),
        bigquery.SchemaField("project_name", "STRING"),
        bigquery.SchemaField("production_house", "STRING"),
        bigquery.SchemaField("director", "STRING"),
        bigquery.SchemaField("dop", "STRING"),
        bigquery.SchemaField("colorist", "STRING"),
        bigquery.SchemaField("booking_hrs", "STRING"),
        bigquery.SchemaField("assist_hrs", "STRING"),
        bigquery.SchemaField("total_hrs", "STRING"),
        bigquery.SchemaField("rate", "STRING"),
        bigquery.SchemaField("discount", "STRING"),
        bigquery.SchemaField("total_amount", "STRING"),
        bigquery.SchemaField("poc_name", "STRING"),
        bigquery.SchemaField("email_id", "STRING"),
        bigquery.SchemaField("phone_no", "STRING"),
        bigquery.SchemaField("gst_no", "STRING"),
        bigquery.SchemaField("pan_no", "STRING"),
        bigquery.SchemaField("billing_address", "STRING"),
        bigquery.SchemaField("notes", "STRING"),
        bigquery.SchemaField("ingested_at", "TIMESTAMP"),
    ]
    
    # Invoices Dimension Table
    invoices_schema = [
        bigquery.SchemaField("invoice_id", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("invoice_number", "STRING"),
        bigquery.SchemaField("invoice_date", "STRING"),
        bigquery.SchemaField("client_name", "STRING"),
        bigquery.SchemaField("project_name", "STRING"),
        bigquery.SchemaField("colorist_name", "STRING"),
        bigquery.SchemaField("total_hrs", "FLOAT64"),
        bigquery.SchemaField("rate", "FLOAT64"),
        bigquery.SchemaField("discount", "FLOAT64"),
        bigquery.SchemaField("subtotal", "FLOAT64"),
        bigquery.SchemaField("gst_amount", "FLOAT64"),
        bigquery.SchemaField("grand_total", "FLOAT64"),
        bigquery.SchemaField("poc_name", "STRING"),
        bigquery.SchemaField("email_id", "STRING"),
        bigquery.SchemaField("phone_no", "STRING"),
        bigquery.SchemaField("gst_no", "STRING"),
        bigquery.SchemaField("pan_no", "STRING"),
        bigquery.SchemaField("billing_address", "STRING"),
        bigquery.SchemaField("bill_status", "STRING"),
        bigquery.SchemaField("payment_status", "STRING"),
        bigquery.SchemaField("created_at", "TIMESTAMP"),
    ]

    tables = {
        "raw_project_tracker": raw_pt_schema,
        "dim_invoices": invoices_schema
    }

    for table_name, schema in tables.items():
        table_ref = dataset_ref.table(table_name)
        table = bigquery.Table(table_ref, schema=schema)
        table = client.create_table(table, exists_ok=True)
        print(f"Table `{DATASET_ID}.{table_name}` verified/created.")

    print("\nBigQuery Dataset & Tables initialized successfully!")

if __name__ == '__main__':
    main()
