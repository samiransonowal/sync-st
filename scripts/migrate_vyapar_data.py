import pandas as pd
import re
import os
import glob
from datetime import datetime

# ==============================================================================
# Configuration & Constants
# ==============================================================================
VYAPAR_EXPORTS_DIR = "sample-documents/vyapar/"
PARTY_REPORT_FILE = os.path.join(VYAPAR_EXPORTS_DIR, "PartyReport.xlsx")
CRM_OUTPUT_CSV = os.path.join(VYAPAR_EXPORTS_DIR, "crm_database.csv")
LEDGER_FY25_26_CSV = os.path.join(VYAPAR_EXPORTS_DIR, "vyapar_migrated_ledger_FY25_26.csv")
LEDGER_FY26_27_CSV = os.path.join(VYAPAR_EXPORTS_DIR, "vyapar_migrated_ledger_FY26_27.csv")

COLORIST_CODES = {
    "Yash Soni": "YS",
    "Sujith Vijayan": "SV",
    "Samiran Sonowal": "SS",
    "Manoj Sahu": "MS"
}

# The 32-column Project_Billing_Ledger schema with Amount Pending next to Payment Status
HEADERS = [
    "Project Code ID",                  # [BIL-01]
    "Invoice Number",                   # [BIL-02]
    "Invoice Date",                     # [BIL-03]
    "Project Name",                     # [BIL-04]
    "Company / Client",                 # [BIL-05]
    "Director",                         # [BIL-06]
    "Colorist",                         # [BIL-07]
    "Type",                             # [BIL-08]
    "Booking Hrs",                      # [BIL-09]
    "Conform Hrs",                      # [BIL-10]
    "Assist Hrs",                       # [BIL-11]
    "Mastering Hrs",                    # [BIL-12]
    "Other Hrs",                        # [BIL-13]
    "Total Hrs",                        # [BIL-14]
    "Rate",                             # [BIL-15]
    "Discount",                         # [BIL-16]
    "Subtotal Amount",                  # [BIL-17]
    "Amount (GST Incl.)",               # [BIL-18]
    "POC Name",                         # [BIL-19]
    "Client Email",                     # [BIL-20]
    "Phone",                            # [BIL-21]
    "GSTIN",                            # [BIL-22]
    "PAN",                              # [BIL-23]
    "Billing Address",                  # [BIL-24]
    "Notes / Scope",                    # [BIL-25]
    "PO No.",                           # [BIL-26]
    "Bill Status",                      # [BIL-27]
    "Payment Status",                   # [BIL-28]
    "Amount Pending (INR)",             # [BIL-29] (NEW: inserted next to Payment Status)
    "Due Date",                         # [BIL-30]
    "TDS Amount (10%)",                 # [BIL-31]
    "Last Activity"                     # [BIL-32]
]

CRM_HEADERS = [
    "Client Name",       # [CRM-01]
    "Corporate Email",   # [CRM-02]
    "Corporate Phone",   # [CRM-03]
    "GSTIN",             # [CRM-04]
    "PAN",               # [CRM-05]
    "Billing Address"    # [CRM-06]
]

def extract_colorist(payment_type_str):
    if pd.isna(payment_type_str):
        return "", "OT"
    match = re.search(r"Colorist:\s*([A-Za-z\s]+)", str(payment_type_str))
    if match:
        name = match.group(1).strip()
        code = COLORIST_CODES.get(name, "OT")
        return name, code
    return "", "OT"

def extract_pan(gstin):
    if pd.isna(gstin) or len(str(gstin).strip()) < 15:
        return ""
    return str(gstin).strip()[2:12]

def clean_item_name(name):
    if not name or pd.isna(name) or str(name).lower() == 'nan':
        return ""
    
    s = str(name).strip()
    # Strip leading prefix if any
    s = re.sub(r'(?i)^Grade\s+fees-Tunnel\s+Studio\s+for\s+', '', s)
    
    # Strip known fee/scope/phase/format/deliverable suffixes (case-insensitive)
    patterns = [
        # Multi-word scope/fee phrases
        r'\s*-\s*DI\s*Fee\s*-\s*Package',
        r'\s*-\s*DI\s*FEE\s*\(PACKAGE\)',
        r'\s*-\s*DI\s*FEE\s*-\s*(FIRST|SECOND|3RD|4TH)\s*TRANCHE',
        r'\s*-\s*FIRST\s*TRANCHE',
        r'\s*-\s*SECOND\s*TRANCHE',
        r'\s*-\s*3rd\s*Tranche',
        r'\s*-\s*4th\s*Tranche',
        r'\s*-\s*Signing\s*Fee',
        r'\s*-\s*Commence\s*of\s*Services',
        r'\s*-\s*20%\s*Commencement.*',
        r'\s*-\s*20%\s*Completion.*',
        r'\s*-\s*EDIT\s*\+\s*GRADE\s*FEE.*',
        r'\s*-\s*EDIT\s*\+\s*GRADE.*',
        r'\s*-\s*EDIT\s*FEE.*',
        r'\s*-\s*EDIT\s*FEES.*',
        r'\s*-\s*Edit\s*Fee.*',
        r'\s*-\s*Grade\s*Fee.*',
        r'\s*-\s*GRADE\s*FEE.*',
        r'\s*-\s*DI\s*FEE.*',
        r'\s*-\s*DI\s*Fee.*',
        r'\s*-\s*ON-SET\s*EDITOR.*',
        r'\s*-\s*Digital\s*Intermediate.*',
        r'\s*-\s*DIGITAL\s*INTERMEDIATE.*',
        r'\s*-\s*DCP',
        r'\s*-\s*Advance',
        r'\s*\(Package\)',
        r'\s*-\s*Package',

        # Deliverable formats & tags requested by user
        r'\s*-?\s*MUSIC\s*VIDEO',
        r'\s*-?\s*\bMV\b',
        r'\s*-?\s*\bDCUT\b',
        r'\s*-?\s*MASTER\s*FILM',
        r'\s*-\s*MASTER',
        r'\s*-\s*CUT\s*DOWN',
        r'\s*-\s*SHORTIES',
        r'\s*-?\s*PROMO',
        r'\s*-\s*DVC',
        r'\s*-\s*Reels?',
        r'\s*-\s*Film\s*\d+',
        r'\s*-\s*\d+\s*Films?',
    ]
    
    for pat in patterns:
        s = re.sub(pat, '', s, flags=re.IGNORECASE)
        
    s = re.sub(r'[\s\-]+$', '', s).strip()
    return s

def parse_sales_report(file_path, fy_offset=0):
    print(f"📄 Processing ledger file (offset={fy_offset}): {file_path}")
    migrated_rows = []
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Extract Item Details mapping (Invoice No. -> Cleaned Project Name list)
    item_map = {}
    try:
        df_items = pd.read_excel(file_path, sheet_name='Item Details', skiprows=2)
        if 'Invoice No./Txn No.' in df_items.columns:
            df_items = df_items.dropna(subset=['Invoice No./Txn No.'])
            for _, irow in df_items.iterrows():
                inv_id = str(irow['Invoice No./Txn No.']).replace(".0", "").strip()
                raw_item_name = str(irow.get('Item Name', '')).strip()
                cleaned_name = clean_item_name(raw_item_name)
                if inv_id and cleaned_name:
                    if inv_id not in item_map:
                        item_map[inv_id] = []
                    if cleaned_name not in item_map[inv_id]:
                        item_map[inv_id].append(cleaned_name)
    except Exception as ie:
        print(f"⚠️ Could not load Item Details sheet from {file_path}: {ie}")

    try:
        df = pd.read_excel(file_path, sheet_name='Sale Report', skiprows=3)
        if 'Invoice No' in df.columns:
            df = df.dropna(subset=['Invoice No'])
        else:
            print(f"⚠️ Missing 'Invoice No' column in {file_path}, skipping.")
            return []
        
        # Reverse dataframe to ensure serial ascending order (e.g. Invoice 1, 2, 3...)
        df = df.iloc[::-1]
        
        for _, row in df.iterrows():
            invoice_num = str(row['Invoice No']).replace(".0", "").strip()
            colorist_name, colorist_code = extract_colorist(row.get('Payment Type', ''))
            client_name = str(row.get('Party Name', '')).strip()
            total_amt = float(row.get('Total Amount', 0)) if not pd.isna(row.get('Total Amount')) else 0.0
            subtotal = round(total_amt / 1.18, 2)
            pay_status = str(row.get('Payment Status', 'Unpaid')).strip()
            
            # Initial Amount Pending calculation
            pending_amt = 0.0 if pay_status.lower() == 'paid' else total_amt
            
            try:
                num_val = int(invoice_num) + fy_offset
                project_code_id = f"{num_val:04d}_MIS_{colorist_code}"
            except ValueError:
                project_code_id = f"{fy_offset}{invoice_num}_MIS_{colorist_code}"

            # Project Name mapped from Item Details page (Item Name column), retaining clean project name
            items_list = item_map.get(invoice_num, [])
            if items_list:
                project_name = " / ".join(items_list)
            else:
                raw_desc = str(row.get('Description', '')).strip() if not pd.isna(row.get('Description')) else ""
                project_name = clean_item_name(raw_desc)

            if not project_name or project_name.lower() == 'nan':
                project_name = ""

            migrated_row = [
                project_code_id,                  # [BIL-01]
                invoice_num,                      # [BIL-02] Invoice Number (Column B)
                row.get('Date', ''),              # [BIL-03]
                project_name,                     # [BIL-04] Project Name (Column D)
                client_name,                      # [BIL-05]
                "",                               # [BIL-06]
                colorist_name,                    # [BIL-07]
                "Vyapar Legacy",                  # [BIL-08]
                "",                               # [BIL-09]
                "",                               # [BIL-10]
                "",                               # [BIL-11]
                "",                               # [BIL-12]
                "",                               # [BIL-13]
                "",                               # [BIL-14]
                "",                               # [BIL-15]
                "",                               # [BIL-16]
                subtotal,                         # [BIL-17]
                total_amt,                        # [BIL-18]
                "",                               # [BIL-19]
                "",                               # [BIL-20]
                row.get('Party Phone No.', ''),   # [BIL-21]
                "",                               # [BIL-22]
                "",                               # [BIL-23]
                "",                               # [BIL-24]
                row.get('Description', ''),       # [BIL-25]
                "",                               # [BIL-26] PO No.
                "Invoiced",                       # [BIL-27]
                pay_status,                       # [BIL-28] Payment Status
                pending_amt,                      # [BIL-29] Amount Pending (INR)
                "",                               # [BIL-30] Due Date
                "",                               # [BIL-31] TDS Amount
                current_time                      # [BIL-32] Last Activity
            ]
            migrated_rows.append(migrated_row)
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        
    return migrated_rows

def main():
    print("🚀 Starting Multi-FY Vyapar Data Migration (With Amount Pending Field)...")
    
    # 1. Process PartyReport.xlsx
    crm_rows = []
    if os.path.exists(PARTY_REPORT_FILE):
        try:
            party_df = pd.read_excel(PARTY_REPORT_FILE, header=None)
            for i, row in party_df.iterrows():
                if str(row[0]).lower().strip() == 'name' or pd.isna(row[0]):
                    continue
                client_name = str(row[0]).strip()
                email = str(row[1]).strip() if not pd.isna(row[1]) else ""
                phone = str(row[2]).strip() if not pd.isna(row[2]) else ""
                address = str(row[3]).strip() if not pd.isna(row[3]) else ""
                gstin = str(row[4]).strip() if not pd.isna(row[4]) else ""
                pan = extract_pan(gstin)
                crm_rows.append([client_name, email, phone, gstin, pan, address])
                
            crm_out_df = pd.DataFrame(crm_rows, columns=CRM_HEADERS)
            crm_out_df.to_csv(CRM_OUTPUT_CSV, index=False)
            print(f"✅ CRM Database created with {len(crm_rows)} clients: {CRM_OUTPUT_CSV}")
        except Exception as e:
            print(f"⚠️ Error processing PartyReport: {e}")

    # 2. Process FY 2025-2026
    fy25_26_file = os.path.join(VYAPAR_EXPORTS_DIR, "2025_2026_SaleReport.xlsx")
    if os.path.exists(fy25_26_file):
        fy25_26_rows = parse_sales_report(fy25_26_file, fy_offset=0)
        if fy25_26_rows:
            df25 = pd.DataFrame(fy25_26_rows, columns=HEADERS)
            df25.to_csv(LEDGER_FY25_26_CSV, index=False)
            print(f"✅ FY 2025-26 Migration successful: {len(fy25_26_rows)} rows written to {LEDGER_FY25_26_CSV}")

    # 3. Process FY 2026-2027
    fy26_27_file = os.path.join(VYAPAR_EXPORTS_DIR, "SaleReport_01_04_26_to_31_03_27.xlsx")
    if os.path.exists(fy26_27_file):
        fy26_27_rows = parse_sales_report(fy26_27_file, fy_offset=1000)
        if fy26_27_rows:
            df26 = pd.DataFrame(fy26_27_rows, columns=HEADERS)
            df26.to_csv(LEDGER_FY26_27_CSV, index=False)
            print(f"✅ FY 2026-27 Migration successful: {len(fy26_27_rows)} rows written to {LEDGER_FY26_27_CSV}")

if __name__ == "__main__":
    main()
