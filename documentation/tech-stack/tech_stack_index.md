# ST-fin-com-prog — Technical Stack Architecture Index
# Program: Studio Tunnel Financial Comptroller Program
# Directory: documentation/tech-stack/

This directory documents the technical choices, frameworks, databases, APIs, and architectural patterns powering **`ST-fin-com-prog`** (*Studio Tunnel Financial Comptroller Program*).

---

## 📚 Tech Stack Documentation Modules

1. **[`01_core_architecture.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/01_core_architecture.md)**:
   - Hybrid Architecture: Google Sheets Ingestion Doorway $\rightarrow$ BigQuery Relational Warehouse $\rightarrow$ Looker Studio Analytics $\rightarrow$ Apps Script Engine.

2. **[`02_database_and_warehouse.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/02_database_and_warehouse.md)**:
   - Google BigQuery dataset `st_fin_com_prog` (`asia-south1` Mumbai region), Star Schema DDL, SQL views, and 10 GB free-tier capacity planning.

3. **[`03_automation_and_webhooks.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/03_automation_and_webhooks.md)**:
   - Google Apps Script engine (`0_Config.gs` to `5_DiscordNotifier.gs`), Web App `doPost` endpoints, Gmail API, and Discord Webhooks.

4. **[`04_design_system_and_pdf.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/04_design_system_and_pdf.md)**:
   - Lexend typography, 90% gray text (`#1A1A1A`), 20% gray light text (`#CCCCCC`), pure white paper background rules, and Google Drive live HTML/PDF rendering.

5. **[`05_security_and_credentials.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/05_security_and_credentials.md)**:
   - Strict Git security, `secrets.env` isolation, public template `.env.example`, Google OAuth 2.0 Client credentials, and workspace domain permissions.

6. **[`06_verification_and_dry_runs.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/06_verification_and_dry_runs.md)**:
   - Automated system integrity test suite (`test_system_integrity.py`), BigQuery data flow dry runs, GSTIN/PAN regex bounds, and 100% test coverage rules.
