-- ====================================================================
-- BigQuery Dedicated Dataset DDL: LOG BOOK_SYNC (Column B Invoice Number)
-- Target Dataset: log_book_sync (GCP Region: asia-south1 Mumbai)
-- Exclusive Source Sheet: LOG BOOK_SYNC
-- Spreadsheet URL: https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/edit
-- ====================================================================

-- 1. Create Dedicated Dataset
CREATE SCHEMA IF NOT EXISTS `log_book_sync`
OPTIONS(
  location="asia-south1",
  description="Dedicated BigQuery Data Warehouse Dataset syncing LOG BOOK_SYNC Google Spreadsheet"
);

-- --------------------------------------------------------------------
-- 2. EXTERNAL TABLE: ext_atomic_task_logs (Day to Day SYNC Chronological Logs)
-- --------------------------------------------------------------------
CREATE OR REPLACE EXTERNAL TABLE `log_book_sync.ext_atomic_task_logs` (
  task_id STRING OPTIONS(description="[LOG-01] Task ID UUID"),
  timestamp TIMESTAMP OPTIONS(description="[LOG-02] System submission timestamp"),
  project_code_id STRING OPTIONS(description="[LOG-03] Project Code ID"),
  project_name STRING OPTIONS(description="[LOG-04] Commercial Project Name"),
  task_type STRING OPTIONS(description="[LOG-05] Booking, Conform, Assist, Mastering, Rendering"),
  assigned_artist STRING OPTIONS(description="[LOG-06] Assigned Lead Artist or Staff"),
  task_date DATE OPTIONS(description="[LOG-07] Task execution date"),
  actual_hrs FLOAT64 OPTIONS(description="[LOG-08] Actual time taken in hours"),
  task_closure_status STRING OPTIONS(description="[LOG-09] Logged / Closed & Completed"),
  notes_scope STRING OPTIONS(description="[LOG-10] Session notes & scope justification")
)
OPTIONS (
  format = 'GOOGLE_SHEETS',
  uris = ['https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/edit'],
  skip_leading_rows = 1,
  sheet_range = 'Atomic_Task_Logs!A2:J'
);

-- --------------------------------------------------------------------
-- 3. EXTERNAL TABLE: ext_project_billing_ledger (FY 2026-27 Active Ledger)
-- --------------------------------------------------------------------
CREATE OR REPLACE EXTERNAL TABLE `log_book_sync.ext_project_billing_ledger` (
  project_code_id STRING OPTIONS(description="[BIL-01] Primary Key Project Code ID"),
  invoice_number STRING OPTIONS(description="[BIL-02] Raw Invoice Number (Column B)"),
  invoice_date DATE OPTIONS(description="[BIL-03] Invoice issue date baseline"),
  project_name STRING OPTIONS(description="[BIL-04] Commercial project name"),
  client_name STRING OPTIONS(description="[BIL-05] Production house / Corporate client"),
  director_name STRING OPTIONS(description="[BIL-06] Commercial director name"),
  colorist_name STRING OPTIONS(description="[BIL-07] Lead assigned colorist"),
  billing_type STRING OPTIONS(description="[BIL-08] Hourly or Fixed budget type"),
  booking_hrs FLOAT64 OPTIONS(description="[BIL-09] Colorist booking session hours"),
  conform_hrs FLOAT64 OPTIONS(description="[BIL-10] XML conform session hours"),
  assist_hrs FLOAT64 OPTIONS(description="[BIL-11] Assistant prep hours"),
  mastering_hrs FLOAT64 OPTIONS(description="[BIL-12] Mastering and DCP export hours"),
  other_hrs FLOAT64 OPTIONS(description="[BIL-13] Rendering and extra shot hours"),
  total_billable_hrs FLOAT64 OPTIONS(description="[BIL-14] Total accumulated project hours"),
  hourly_rate FLOAT64 OPTIONS(description="[BIL-15] Base hourly rate in INR"),
  discount_amount FLOAT64 OPTIONS(description="[BIL-16] Negotiated discount in INR"),
  total_subtotal FLOAT64 OPTIONS(description="[BIL-17] Total subtotal amount before tax"),
  gst_bill_amount FLOAT64 OPTIONS(description="[BIL-18] Total bill amount including 18% GST"),
  poc_name STRING OPTIONS(description="[BIL-19] Client Point of Contact name"),
  poc_email STRING OPTIONS(description="[BIL-20] Target invoice delivery email"),
  poc_phone STRING OPTIONS(description="[BIL-21] Client contact phone number"),
  client_gstin STRING OPTIONS(description="[BIL-22] Client 15-digit GSTIN"),
  client_pan STRING OPTIONS(description="[BIL-23] Client 10-character PAN"),
  billing_address STRING OPTIONS(description="[BIL-24] Full corporate billing address"),
  notes_scope STRING OPTIONS(description="[BIL-25] Scope notes & deliverables"),
  po_number STRING OPTIONS(description="[BIL-26] Purchase Order number"),
  bill_status STRING OPTIONS(description="[BIL-27] Active / Ready for Invoice / Invoiced"),
  payment_status STRING OPTIONS(description="[BIL-28] Unpaid / Partial / Paid"),
  due_date DATE OPTIONS(description="[BIL-29] Payment due date (Invoice Date + 30 Days)"),
  tds_deduction FLOAT64 OPTIONS(description="[BIL-30] Expected 10% TDS deduction"),
  last_activity TIMESTAMP OPTIONS(description="[BIL-31] Last activity timestamp")
)
OPTIONS (
  format = 'GOOGLE_SHEETS',
  uris = ['https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/edit'],
  skip_leading_rows = 1,
  sheet_range = 'Project_Billing_Ledger!A2:AE'
);

-- --------------------------------------------------------------------
-- 4. EXTERNAL TABLE: ext_project_billing_ledger_fy25_26 (FY 2025-26 Archive Ledger)
-- --------------------------------------------------------------------
CREATE OR REPLACE EXTERNAL TABLE `log_book_sync.ext_project_billing_ledger_fy25_26` (
  project_code_id STRING OPTIONS(description="[BIL-01] Primary Key Project Code ID"),
  invoice_number STRING OPTIONS(description="[BIL-02] Raw Invoice Number (Column B)"),
  invoice_date DATE OPTIONS(description="[BIL-03] Invoice issue date baseline"),
  project_name STRING OPTIONS(description="[BIL-04] Commercial project name"),
  client_name STRING OPTIONS(description="[BIL-05] Production house / Corporate client"),
  director_name STRING OPTIONS(description="[BIL-06] Commercial director name"),
  colorist_name STRING OPTIONS(description="[BIL-07] Lead assigned colorist"),
  billing_type STRING OPTIONS(description="[BIL-08] Hourly or Fixed budget type"),
  booking_hrs FLOAT64 OPTIONS(description="[BIL-09] Colorist booking session hours"),
  conform_hrs FLOAT64 OPTIONS(description="[BIL-10] XML conform session hours"),
  assist_hrs FLOAT64 OPTIONS(description="[BIL-11] Assistant prep hours"),
  mastering_hrs FLOAT64 OPTIONS(description="[BIL-12] Mastering and DCP export hours"),
  other_hrs FLOAT64 OPTIONS(description="[BIL-13] Rendering and extra shot hours"),
  total_billable_hrs FLOAT64 OPTIONS(description="[BIL-14] Total accumulated project hours"),
  hourly_rate FLOAT64 OPTIONS(description="[BIL-15] Base hourly rate in INR"),
  discount_amount FLOAT64 OPTIONS(description="[BIL-16] Negotiated discount in INR"),
  total_subtotal FLOAT64 OPTIONS(description="[BIL-17] Total subtotal amount before tax"),
  gst_bill_amount FLOAT64 OPTIONS(description="[BIL-18] Total bill amount including 18% GST"),
  poc_name STRING OPTIONS(description="[BIL-19] Client Point of Contact name"),
  poc_email STRING OPTIONS(description="[BIL-20] Target invoice delivery email"),
  poc_phone STRING OPTIONS(description="[BIL-21] Client contact phone number"),
  client_gstin STRING OPTIONS(description="[BIL-22] Client 15-digit GSTIN"),
  client_pan STRING OPTIONS(description="[BIL-23] Client 10-character PAN"),
  billing_address STRING OPTIONS(description="[BIL-24] Full corporate billing address"),
  notes_scope STRING OPTIONS(description="[BIL-25] Scope notes & deliverables"),
  po_number STRING OPTIONS(description="[BIL-26] Purchase Order number"),
  bill_status STRING OPTIONS(description="[BIL-27] Active / Ready for Invoice / Invoiced"),
  payment_status STRING OPTIONS(description="[BIL-28] Unpaid / Partial / Paid"),
  due_date DATE OPTIONS(description="[BIL-29] Payment due date (Invoice Date + 30 Days)"),
  tds_deduction FLOAT64 OPTIONS(description="[BIL-30] Expected 10% TDS deduction"),
  last_activity TIMESTAMP OPTIONS(description="[BIL-31] Last activity timestamp")
)
OPTIONS (
  format = 'GOOGLE_SHEETS',
  uris = ['https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/edit'],
  skip_leading_rows = 1,
  sheet_range = 'Project_Billing_Ledger_FY25_26!A2:AE'
);

-- --------------------------------------------------------------------
-- 5. EXTERNAL TABLE: ext_client_crm (Centralized Client Database)
-- --------------------------------------------------------------------
CREATE OR REPLACE EXTERNAL TABLE `log_book_sync.ext_client_crm` (
  client_name STRING OPTIONS(description="[CRM-01] Corporate Client Name"),
  corporate_email STRING OPTIONS(description="[CRM-02] Corporate Email"),
  corporate_phone STRING OPTIONS(description="[CRM-03] Corporate Phone"),
  gstin STRING OPTIONS(description="[CRM-04] 15-digit GSTIN"),
  pan STRING OPTIONS(description="[CRM-05] 10-character PAN"),
  billing_address STRING OPTIONS(description="[CRM-06] Corporate Billing Address")
)
OPTIONS (
  format = 'GOOGLE_SHEETS',
  uris = ['https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/edit'],
  skip_leading_rows = 1,
  sheet_range = 'Client_CRM!A2:F'
);

-- --------------------------------------------------------------------
-- 6. ANALYTICAL VIEW: invoice_ready_projects (Finance App View)
-- --------------------------------------------------------------------
CREATE OR REPLACE VIEW `log_book_sync.invoice_ready_projects` AS
SELECT 
  project_code_id AS projectCode,
  invoice_number AS invoiceNumber,
  invoice_date AS invoiceDate,
  project_name AS projectName,
  client_name AS company,
  director_name AS director,
  colorist_name AS colorist,
  billing_type AS type,
  booking_hrs AS bookingHrs,
  conform_hrs AS conformHrs,
  assist_hrs AS assistHrs,
  mastering_hrs AS masteringHrs,
  other_hrs AS otherHrs,
  total_billable_hrs AS totalHrs,
  hourly_rate AS hourlyRate,
  discount_amount AS discount,
  total_subtotal AS subtotalAmount,
  gst_bill_amount AS grandTotal,
  poc_name AS pocName,
  poc_email AS clientEmail,
  poc_phone AS phone,
  client_gstin AS gstin,
  client_pan AS pan,
  billing_address AS billingAddress,
  po_number AS poNumber,
  bill_status AS status,
  payment_status AS paymentStatus,
  due_date AS dueDate,
  tds_deduction AS tdsAmount,
  last_activity AS lastUpdated
FROM `log_book_sync.ext_project_billing_ledger`
WHERE bill_status IN ('Active / In Progress', 'Ready for Invoice', 'Invoiced');
