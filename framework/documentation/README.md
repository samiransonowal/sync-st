# Cineloom Comptroller Documentation Index

Index of active architectural specifications and source document references for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.**

---\

## 📜 Specifications & Version History

1. **[\cineloom-comptroller.md\](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/documentation/cineloom-comptroller.md)** 🔒 [LOCKED - DO NOT EDIT]:
   - **Version 1.0 Original Specification.**
   - Primary Google Sheets architecture, Single Writer Rules, and historical reconciliation engine spec.

2. **[\cineloom-comptroller-v2.md\](file:///d:/Studio%20Tunnel/INVOICE_APP/framework/documentation/cineloom-comptroller-v2.md)** ✨ [ACTIVE ARCHITECTURE]:
   - **Version 2.0 Hybrid Architecture.**
   - Decouples Google Sheets (Human Data Input Doorway) from Google BigQuery (Relational Data Warehouse & Modeling Engine).
   - Defines BigQuery Star Schema (\dim_clients\, \dim_invoices\, \act_bank_transactions\, \act_payments\), bidirectional Apps Script sync, event-driven PDF builds, and Discord notification integration.

---\

## 📊 Linked Source Google Sheets

- **ACCOUNTS Sheet:** [\1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A\](https://docs.google.com/spreadsheets/d/1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A/edit?gid=0#gid=0)
- **PROJECT TRACKER Sheet:** [\1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0\](https://docs.google.com/spreadsheets/d/1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0/edit?pli=1&gid=0#gid=0)

