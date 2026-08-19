-- ============================================================================
-- ST-fin-com-prog (Studio Tunnel Financial Comptroller Program)
-- BIGQUERY SCHEMA & DDL SPECIFICATION
-- GCP Project: st-in-gen (972643538415) — Single GCP Project
-- 3-Tier Datasets:
--   1. Dev  : `st-in-gen.st_fin_com_prog_dev`
--   2. Test : `st-in-gen.st_fin_com_prog_test`
--   3. PML  : `st-in-gen.st_fin_com_prog_pml` (alias: `st_fin_com_prog`)
-- Location: asia-south1 (Mumbai)
-- ============================================================================

-- 1. CREATE DATASET (Execute for dev, test, or pml as needed)
CREATE SCHEMA IF NOT EXISTS `st-in-gen.st_fin_com_prog_dev`
OPTIONS (location = 'asia-south1', description = 'Studio Tunnel Development Sandbox Dataset');

CREATE SCHEMA IF NOT EXISTS `st-in-gen.st_fin_com_prog_test`
OPTIONS (location = 'asia-south1', description = 'Studio Tunnel Automated CI Test Sandbox Dataset');

CREATE SCHEMA IF NOT EXISTS `st-in-gen.st_fin_com_prog_pml`
OPTIONS (location = 'asia-south1', description = 'Studio Tunnel Production Main Live (PML) Financial Ledger Dataset');

-- ----------------------------------------------------------------------------
-- 2. RAW STAGING & FIREBASE INGESTION TABLES
-- ----------------------------------------------------------------------------

-- A. Raw Legacy Firebase Clients Ingestion
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.raw_firebase_clients` (
  firebase_doc_id STRING OPTIONS(description="Original Firestore Document ID"),
  raw_client_name STRING OPTIONS(description="Client name string in legacy app"),
  raw_payload JSON OPTIONS(description="Full unstructured JSON document from Firestore"),
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- B. Raw Legacy Firebase Jobs / Studio Management Ingestion
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.raw_firebase_jobs` (
  firebase_doc_id STRING OPTIONS(description="Original Firestore Document ID"),
  job_number STRING OPTIONS(description="Legacy Job / Work Order Number"),
  client_name STRING OPTIONS(description="Client name recorded in Firebase"),
  project_title STRING OPTIONS(description="Project / Film Title"),
  raw_payload JSON OPTIONS(description="Full unstructured JSON document from Firestore"),
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ----------------------------------------------------------------------------
-- 3. DIMENSION TABLES
-- ----------------------------------------------------------------------------

-- A. Client Master Dimension
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.dim_clients` (
  client_id STRING OPTIONS(description="Canonical client unique identifier"),
  canonical_name STRING OPTIONS(description="Cleaned canonical billing name"),
  raw_variants ARRAY<STRING> OPTIONS(description="Spelling variants from bank narrations"),
  gstin STRING OPTIONS(description="Client GST Identification Number"),
  billing_address STRING OPTIONS(description="Registered billing address"),
  state_code STRING OPTIONS(description="GST State Code e.g. 27-Maharashtra"),
  pan STRING OPTIONS(description="Permanent Account Number"),
  contact_phone STRING OPTIONS(description="Primary billing contact phone"),
  contact_email STRING OPTIONS(description="Primary billing contact email"),
  data_source STRING DEFAULT 'SHEETS' OPTIONS(description="Origin: SHEETS, FIREBASE_LEGACY, or MERGED"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- B. Invoice Master Dimension
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.dim_invoices` (
  invoice_id STRING OPTIONS(description="Unique Invoice ID e.g. INV-91"),
  invoice_number STRING OPTIONS(description="Formatted Serial Invoice Number"),
  invoice_date DATE OPTIONS(description="Invoice Issue Date"),
  client_id STRING OPTIONS(description="FK to dim_clients"),
  client_name STRING OPTIONS(description="Billed Client Name"),
  project_name STRING OPTIONS(description="Film / Ad Project Name"),
  colorist_name STRING OPTIONS(description="Assigned Colorist e.g. SUJITH, YASH, SAMIRAN"),
  line_producer STRING OPTIONS(description="Job Line Producer Addressee"),
  line_producer_email STRING OPTIONS(description="Line Producer Email"),
  place_of_supply STRING OPTIONS(description="Place of Supply State"),
  subtotal NUMERIC OPTIONS(description="Base Amount before GST"),
  tax_rate NUMERIC OPTIONS(description="GST Tax Rate e.g. 0.18"),
  tax_amount NUMERIC OPTIONS(description="Total GST Amount (CGST+SGST or IGST)"),
  grand_total NUMERIC OPTIONS(description="Final Invoice Grand Total"),
  pdf_drive_url STRING OPTIONS(description="Direct Google Drive URL for vector PDF"),
  is_generated BOOLEAN DEFAULT FALSE OPTIONS(description="PDF Build Status Flag"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ----------------------------------------------------------------------------
-- 3. FACT & TRANSACTION TABLES
-- ----------------------------------------------------------------------------

-- A. HDFC Bank Statement Credits Fact
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.fact_bank_transactions` (
  txn_id STRING OPTIONS(description="Unique Bank Transaction Hash / Ref No"),
  txn_date DATE OPTIONS(description="Transaction Value Date"),
  narration STRING OPTIONS(description="Full Raw Bank Statement Narration"),
  credit_amount NUMERIC OPTIONS(description="Credit Amount Received (₹)"),
  debit_amount NUMERIC OPTIONS(description="Debit Amount (₹)"),
  classification STRING OPTIONS(description="CLIENT, LOAN, INTERNAL, GATEWAY, RESOLVED"),
  matched_client_id STRING OPTIONS(description="FK to dim_clients"),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- B. Payment Ledger & Reconciliation Fact
CREATE TABLE IF NOT EXISTS `st-in-gen.st_fin_com_prog.fact_payments` (
  payment_id STRING OPTIONS(description="Unique Payment Ledger Entry ID"),
  invoice_id STRING OPTIONS(description="FK to dim_invoices"),
  txn_id STRING OPTIONS(description="FK to fact_bank_transactions"),
  amount_received NUMERIC OPTIONS(description="Actual Cash Received against invoice"),
  tds_deducted NUMERIC OPTIONS(description="TDS Deducted (Default 10% on base subtotal)"),
  pending_balance NUMERIC OPTIONS(description="Remaining Open Invoice Balance"),
  payment_status STRING OPTIONS(description="PAID, PARTIAL, UNPAID"),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- ----------------------------------------------------------------------------
-- 4. LOOKER STUDIO ANALYTICAL VIEWS
-- ----------------------------------------------------------------------------

-- A. Executive Financial Kpis Summary View
CREATE OR REPLACE VIEW `st-in-gen.st_fin_com_prog.view_executive_summary` AS
SELECT
  COUNT(DISTINCT inv.invoice_id) AS total_invoices_count,
  SUM(inv.grand_total) AS total_gross_billed_inr,
  SUM(COALESCE(pay.amount_received, 0)) AS total_cash_collected_inr,
  SUM(COALESCE(pay.tds_deducted, 0)) AS total_tds_deducted_inr,
  SUM(inv.grand_total - COALESCE(pay.amount_received, 0) - COALESCE(pay.tds_deducted, 0)) AS total_outstanding_balance_inr
FROM `st-in-gen.st_fin_com_prog.dim_invoices` inv
LEFT JOIN `st-in-gen.st_fin_com_prog.fact_payments` pay
  ON inv.invoice_id = pay.invoice_id;

-- B. Overdue Debtor Chase List View
CREATE OR REPLACE VIEW `st-in-gen.st_fin_com_prog.view_chase_list` AS
SELECT
  inv.invoice_number,
  inv.invoice_date,
  inv.client_name,
  inv.project_name,
  inv.colorist_name,
  inv.grand_total AS billed_amount,
  COALESCE(pay.amount_received, 0) AS amount_paid,
  (inv.grand_total - COALESCE(pay.amount_received, 0) - COALESCE(pay.tds_deducted, 0)) AS pending_balance,
  DATE_DIFF(CURRENT_DATE(), inv.invoice_date, DAY) AS days_overdue,
  inv.line_producer,
  inv.line_producer_email
FROM `st-in-gen.st_fin_com_prog.dim_invoices` inv
LEFT JOIN `st-in-gen.st_fin_com_prog.fact_payments` pay
  ON inv.invoice_id = pay.invoice_id
WHERE (inv.grand_total - COALESCE(pay.amount_received, 0) - COALESCE(pay.tds_deducted, 0)) > 0
ORDER BY days_overdue DESC;
