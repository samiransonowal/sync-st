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
   - Google Apps Script engine (`0_Config.gs` to `constants.gs`), 3-silo environment branches (`dev`/`test`/`prod`), automated Clasp CI/CD pipeline (`.github/workflows/gas-ci.yml`), and Discord/Gmail dispatchers.

4. **[`04_design_system_and_pdf.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/04_design_system_and_pdf.md)**:
   - Lexend typography, 90% gray text (`#1A1A1A`), 20% gray light text (`#CCCCCC`), pure white paper background rules, and Google Drive live HTML/PDF rendering.

5. **[`05_security_and_credentials.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/05_security_and_credentials.md)**:
   - Strict Git security, `secrets.env` isolation, GitHub Actions encrypted secrets injection, Google OAuth 2.0 Client credentials, and GCP project `st-in-gen` (`972643538415`).

6. **[`06_verification_and_dry_runs.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/06_verification_and_dry_runs.md)**:
   - 5-layer testing pyramid: local Python system integrity suite (`test_system_integrity.py`), GAS self-tests (`6_SelfTest.gs`), STEM Registry reachability, BigQuery metadata verification, and dry-run guardrails.

7. **[`07_developer_environment_and_os_support.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/07_developer_environment_and_os_support.md)**:
   - Cross-platform workstation diagnostic (`scripts/check_dev_environment.py`), OS support matrix (Windows 11, macOS, Debian/Ubuntu, Rocky Linux / VFX Studio standard), and Antigravity/VS Code setup.

8. **[`08_gcp_apis_and_free_tier_limits.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/08_gcp_apis_and_free_tier_limits.md)**:
   - Comprehensive inventory of all enabled Google APIs, Spark & BigQuery free-tier quota limits, skipped paid services, and ₹0/month cost-control guarantees.
