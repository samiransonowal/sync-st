# Studio Tunnel — Project Handover & Onboarding

**To:** Samiran Sonowal (`samiran@studiotunnel.com`)  
**From:** Jay (`jay@studiotunnel.com`)  
**Subject:** Welcome to sync-st (v0.7) — Invoice Comptroller, CI/CD Pipeline & Workstation Setup  
**Date:** 17 August 2026  

---

Hi Samiran,

We’ve reached a major milestone for **`sync-st`** (*Studio Tunnel Financial Comptroller & Vector Invoice Engine*), now released at **`v0.7`** with full CI/CD automation and multi-OS developer support.

Here is everything you need to get your laptop configured and start collaborating using **Antigravity IDE** or **VS Code**.

---

### 1. 🛠️ 1-Minute Workstation Diagnostic

Before writing code or running scripts, we’ve built an automated diagnostic tool that tests your laptop (whether you are on **Windows 11**, **macOS**, **Debian/Ubuntu**, or **Rocky Linux / RHEL** in the studio):

```bash
# Clone the repository:
git clone https://github.com/samiransonowal/sync-st.git
cd sync-st

# Run the workstation diagnostic:
python scripts/check_dev_environment.py
# (or via npm shortcut: npm run check-env)
```

The script verifies:
- **Python (3.8+)** & `pyyaml`
- **Node.js (18+)** & **npm**
- **Git** configuration (`user.name` & `user.email`)
- **Google Clasp CLI** (`@google/clasp`)
- **Google Cloud SDK** (`gcloud`)
- Local codebase and configuration integrity

If any dependency is missing, the diagnostic prints the exact copy-paste command for your specific operating system.

---

### 2. 📦 Core Project Architecture (3-Silo Environments)

The project now maintains 3 isolated cloud environments mapped to Git branches:

| Environment | Branch | Apps Script Target | Mode & Permissions |
|---|---|---|---|
| **Development** | `dev` | `sync-st-dev` | `DRY_RUN_MODE = true` (Iterative coding & isolated sandbox writes) |
| **Staging / Testing** | `test` | `sync-st-test` | `DRY_RUN_MODE = true` (Pre-production dry-run verification) |
| **Production** | `prod` / `main` | `sync-st-pml` | `DRY_RUN_MODE = false` (Live vector PDFs, Gmail alerts) |

---

### 3. 🧪 Testing & Verification Commands

Whenever you make changes, you can run our bulletproof test suite locally:

```bash
# 1. Run System Integrity Suite (Schemas, GSTIN/PAN regex, IST dates, tax math):
npm test
# (or: python engine/python-scripts/test_system_integrity.py)

# 2. Run BigQuery Data Flow & SQL Dry-Run:
python engine/python-scripts/dry_run_bigquery.py

# 3. Sync Users Directory:
python engine/python-scripts/sync_users.py
```

---

### 4. 📚 Key Documentation Links

All specifications and guides are indexed in the repository:
- **Master Documentation Index:** [`documentation/documentation_index.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/documentation_index.md)
- **CI/CD Pipeline Guide:** [`documentation/ci_setup.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/ci_setup.md)
- **OS Support & Setup Matrix:** [`documentation/tech-stack/07_developer_environment_and_os_support.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/tech-stack/07_developer_environment_and_os_support.md)
- **STEM External User Registry:** [`documentation/organization/stem_user_registry.md`](file:///d:/Studio%20Tunnel/INVOICE_APP/documentation/organization/stem_user_registry.md)

Let me know once you’ve run the diagnostic on your machine!

Best regards,  
**Jay**  
Lead Developer — Studio Tunnel / Cineloom Postworks Pvt. Ltd.  
`jay@studiotunnel.com`
