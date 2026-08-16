# Cineloom Comptroller Documentation Index

Index of active architectural specifications and source document references for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

---

## 📜 Specifications & Version History

1. **[`master-specs/cineloom-comptroller.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller.md)** 🔒 `[LOCKED & READONLY]`:
   - **Version 1.0 Original Specification.**
   - Primary Google Sheets architecture, Single Writer Rules, and historical reconciliation engine spec.

2. **[`master-specs/cineloom-comptroller-v2.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/master-specs/cineloom-comptroller-v2.md)** ✨ `[ACTIVE ARCHITECTURE]`:
   - **Version 2.0 Hybrid Architecture.**
   - Decouples Google Sheets (Human Data Input Doorway) from Google BigQuery (Relational Data Warehouse & Modeling Engine).
   - Defines BigQuery Star Schema (`dim_clients`, `dim_invoices`, `fact_bank_transactions`, `fact_payments`), bidirectional Apps Script sync, event-driven PDF builds, and Discord notification integration.

---

## 👥 Organization Directory Reference

- **Master YAML Directory:** [`organization/users.yaml`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/users.yaml)
- **Synced Public JSON Matrix:** [`credentials/public/users.json`](file:///d:/Studio%20Tunnel/INVOICE_APP/credentials/public/users.json)
- **Sync Script:** `python engine/python-scripts/sync_users.py`

---

## 📚 Technical Stack Architecture Modules

- **[`tech-stack/01_core_architecture.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/01_core_architecture.md)**
- **[`tech-stack/02_database_and_warehouse.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/02_database_and_warehouse.md)**
- **[`tech-stack/03_automation_and_webhooks.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/03_automation_and_webhooks.md)**
- **[`tech-stack/04_design_system_and_pdf.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/04_design_system_and_pdf.md)**
- **[`tech-stack/05_security_and_credentials.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/05_security_and_credentials.md)**

---

## 📊 Linked Source Google Sheets

- **ACCOUNTS Sheet:** [`1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A`](https://docs.google.com/spreadsheets/d/1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A/edit?gid=0#gid=0)
- **PROJECT TRACKER Sheet:** [`1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0`](https://docs.google.com/spreadsheets/d/1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0/edit?pli=1&gid=0#gid=0)
