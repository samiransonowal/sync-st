# Project Tracker & Billing Schemas

This document defines the BigQuery schemas used for the Dual Web App pipeline (Studio Operations & Finance).

## 1. `st_projects` (Project Metadata)
Stores the master list of confirmed bookings and budget structures.

```sql
CREATE TABLE st_comptroller_pml.st_projects (
  project_code STRING NOT NULL,         -- e.g., PJ-2026-001
  client_id STRING,                     -- Foreign key to st_clients
  project_name STRING,
  billing_type STRING,                  -- 'Hourly' or 'Fixed'
  fixed_amount FLOAT64,                 -- Populated if billing_type = 'Fixed'
  status STRING,                        -- 'Active', 'Completed', 'Invoiced'
  created_at TIMESTAMP
);
```

## 2. `st_project_tasks` (Operations Atomic Logs)
Stores the raw, atomic tasks logged by the Line Producer from the Studio Operations Web App.

```sql
CREATE TABLE st_comptroller_pml.st_project_tasks (
  task_id STRING NOT NULL,              -- UUID
  project_code STRING NOT NULL,         -- Foreign key to st_projects
  task_type STRING,                     -- 'Booking', 'Conform', 'Assist', 'Rendering'
  assigned_artist STRING,               
  date DATE,
  scheduled_hrs FLOAT64,
  actual_hrs FLOAT64,
  dispute_status STRING,                -- 'None', 'Disputed', 'Resolved'
  notes STRING,
  created_at TIMESTAMP
);
```

## 3. `st_clients` (Client Registry)
Managed by the Line Producer in the Ops App.

```sql
CREATE TABLE st_comptroller_pml.st_clients (
  client_id STRING NOT NULL,            -- UUID
  company_name STRING,
  billing_address STRING,
  gst_number STRING,
  contact_email STRING,
  updated_at TIMESTAMP
);
```

## 4. `st_invoices` (Accounts Receivable)
Managed by the Finance App.

```sql
CREATE TABLE st_comptroller_pml.st_invoices (
  invoice_id STRING NOT NULL,           -- e.g., INV-2026-001
  project_code STRING NOT NULL,         -- Foreign key to st_projects
  total_amount FLOAT64,
  issue_date DATE,
  due_date DATE,
  status STRING,                        -- 'Draft', 'Sent', 'Disputed', 'Paid'
  payment_reminder_count INT64          -- Used for automated follow-ups
);
```

## 5. `st_invoice_ready_data` (Aggregated View)
The primary view queried by the Finance Web App. It contains the business logic.

```sql
CREATE OR REPLACE VIEW st_comptroller_pml.st_invoice_ready_data AS
SELECT 
  p.project_code,
  p.client_id,
  c.company_name,
  p.billing_type,
  CASE 
    WHEN p.billing_type = 'Fixed' THEN p.fixed_amount
    ELSE (
      SELECT SUM(t.actual_hrs * r.hourly_rate) 
      FROM st_comptroller_pml.st_project_tasks t
      JOIN st_comptroller_pml.st_billing_rates r ON t.task_type = r.task_type
      WHERE t.project_code = p.project_code 
      -- Add window function logic here for Free vs Paid Rendering
    )
  END as final_billable_amount
FROM st_comptroller_pml.st_projects p
JOIN st_comptroller_pml.st_clients c ON p.client_id = c.client_id
WHERE p.status = 'Completed';
```
