#!/usr/bin/env python3
"""
setup_bigquery_tables.py
3-Tier BigQuery Architecture Table Initializer:
- Dev: st_fin_com_prog_dev (Default development dataset)
- Test: st_fin_com_prog_test (Automated CI testing dataset)
- PML: st_fin_com_prog_pml (Production Main Live dataset — requires --confirm-pml)
"""

import os
import sys
import argparse
from google.cloud import bigquery
from google.oauth2 import service_account

SERVICE_ACCOUNT_FILE = 'credentials/private/service_account.json'
REGION = 'asia-south1'

DATASET_TIERS = {
    'dev': 'st_fin_com_prog_dev',
    'test': 'st_fin_com_prog_test',
    'pml': 'st_fin_com_prog_pml'
}

def get_schemas():
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

    return {
        "raw_project_tracker": raw_pt_schema,
        "dim_invoices": invoices_schema
    }

def setup_tier(client, tier_name, dataset_id):
    print(f"\n--- Initializing Tier: [{tier_name.upper()}] Dataset: `{client.project}.{dataset_id}` (Region: {REGION}) ---")
    dataset_ref = bigquery.DatasetReference(client.project, dataset_id)
    dataset = bigquery.Dataset(dataset_ref)
    dataset.location = REGION
    dataset = client.create_dataset(dataset, exists_ok=True)
    print(f"  ✓ Dataset `{dataset_id}` verified/created.")

    tables = get_schemas()
    for table_name, schema in tables.items():
        table_ref = dataset_ref.table(table_name)
        table = bigquery.Table(table_ref, schema=schema)
        table = client.create_table(table, exists_ok=True)
        print(f"  ✓ Table `{dataset_id}.{table_name}` verified/created.")

def main():
    parser = argparse.ArgumentParser(description="3-Tier BigQuery Schema Initializer")
    parser.add_argument('--env', choices=['dev', 'test', 'pml', 'all'], default='dev',
                        help="Target environment tier (Default: dev)")
    parser.add_argument('--confirm-pml', action='store_true',
                        help="Mandatory 2-Party confirmation flag to initialize or modify PML (Production Main Live)")
    args = parser.parse_args()

    # Governance check for PML
    if args.env in ['pml', 'all'] and not args.confirm_pml:
        print("\n🛑 MANDATORY 2-PARTY CONFIRMATION REQUIRED FOR PML:")
        print("To initialize or modify PML (Production Main Live) BigQuery tables, you must pass `--confirm-pml`.")
        sys.exit(1)

    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"Error: {SERVICE_ACCOUNT_FILE} not found.")
        sys.exit(1)

    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
    client = bigquery.Client(credentials=credentials, project=credentials.project_id)
    print(f"Connected to BigQuery Project: {client.project}")

    target_tiers = [args.env] if args.env != 'all' else ['dev', 'test', 'pml']

    for t in target_tiers:
        setup_tier(client, t, DATASET_TIERS[t])

    print("\n✅ BigQuery 3-tier initialization completed successfully!")

if __name__ == '__main__':
    main()
