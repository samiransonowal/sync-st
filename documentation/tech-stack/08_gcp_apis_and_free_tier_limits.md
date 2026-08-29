# 08 — GCP Enabled APIs, Free-Tier Quotas & Zero-Cost Financial Ledger

**Project Name:** `sync-st`  
**GCP Project Number:** `972643538415`  
**Region:** `asia-south1` (Mumbai, India)  
**Target Monthly Cost:** **₹0.00 / month (100% Free Tier Guaranteed)**  
**Document Status:** 🔒 **OFFICIAL COST CONTROL SPECIFICATION**  
**Date:** 17 August 2026  

---

## 1. Overview & Zero-Surprise-Billing Philosophy

To ensure **Cineloom Postworks Pvt. Ltd. / Studio Tunnel** never incurs unexpected cloud expenses, **`sync-st`** operates strictly under the Google Cloud Free Tier and Google Workspace standard allocations.

### 🛡️ Core Cost-Guard Principles:
1. **Zero Persistent Compute:** We do **NOT** run compute instances (Compute Engine VMs, Cloud Run, Kubernetes, or always-on Cloud Functions).
2. **Event-Driven & Client-Side Execution:** Code runs inside Google Apps Script (included with Google Workspace) and local developer workstations.
3. **No Paid Secret Managers:** Skipped Google Secret Manager (which requires a billing account) in favor of **GitHub Encrypted Secrets** (100% free) and local git-ignored private files.
4. **Active Quota Caps:** All enabled APIs operate far below Google's free usage ceilings.

---

## 2. Complete Inventory of Enabled GCP APIs & Quota Limits

Below is the verified ledger of all APIs enabled for GCP project `sync-st` (`972643538415`):

| # | Google API Name | API Identifier | Google Free-Tier Allowance | sync-st Estimated Monthly Usage | Cost Impact |
|---|---|---|---|---|---|
| **1** | **Gmail API** | `gmail.googleapis.com` | Standard Workspace quota: 2,000 emails/day / 1B units/day | ~50–200 invoices & notifications/month | **₹0.00** |
| **2** | **Google Apps Script API** | `script.googleapis.com` | Unlimited standard script executions & Clasp pushes | ~20–50 CI/CD pushes & daily triggers | **₹0.00** |
| **3** | **Google Drive API** | `drive.googleapis.com` | 15 GB free shared drive storage per account / Standard quota | ~50–100 MB of PDF/HTML invoices/year | **₹0.00** |
| **4** | **Google Sheets API** | `sheets.googleapis.com` | 300 read requests/min, 300 write requests/min | ~100–500 read/write operations/month | **₹0.00** |
| **5** | **BigQuery API** | `bigquery.googleapis.com` | **10 GB active storage free/mo**<br>**1 TB query analysis free/mo** | ~50 MB storage<br>~500 MB queries scanned/mo | **₹0.00** |
| **6** | **BigQuery Data Transfer Service** | `bigquerydatatransfer.googleapis.com` | Free for Google-native transfers (Sheets, Drive, Cloud Storage) | 1 scheduled transfer/day | **₹0.00** |
| **7** | **Cloud Firestore API** | `firestore.googleapis.com` | **Spark Plan (Free Tier):**<br>• 1 GiB total storage<br>• 50,000 document reads/day<br>• 20,000 document writes/day | One-time legacy ingest (~5,000 reads)<br>Delta updates (<100 reads/day) | **₹0.00** |
| **8** | **Firebase Management API** | `firebase.googleapis.com` | Free tier configuration API | Management only | **₹0.00** |
| **9** | **Firebase Rules API** | `firebaserules.googleapis.com` | Free tier security management | Security auditing | **₹0.00** |
| **10**| **Google People / Contacts API** | `people.googleapis.com` | Free Workspace quota (contacts management) | Client auto-lookup on invoice creation | **₹0.00** |
| **11**| **Google Calendar API** | `calendar-json.googleapis.com` | Free Workspace quota | Payment due date reminder events | **₹0.00** |
| **12**| **Admin SDK API** | `admin.googleapis.com` | Free Workspace directory queries | Directory discovery for `studiotunnel.com` | **₹0.00** |

---

## 3. Detailed Usage vs. Free Ceiling Analysis

### A. BigQuery Capacity Planning (`st_comptroller`)
* **Storage Limit:** 10 GB free per month in region `asia-south1` (Mumbai).
  * *Actual Footprint:* 1 full year of Studio Tunnel financial records (~1,000 jobs, 500 invoices, 3,000 bank credits) consumes less than **25 Megabytes** (~0.25% of the free ceiling).
* **Query Scan Limit:** 1,000 Gigabytes (1 Terabyte) free per month.
  * *Actual Footprint:* Our SQL queries are columnar and partitioned. Estimated monthly query scanning across Looker Studio dashboards is **< 1 Gigabyte** (~0.1% of the free ceiling).

### B. Cloud Firestore / Firebase Legacy Ingestion
* **Spark Plan Quotas:**
  * Document Reads: 50,000 reads per day.
  * Document Writes: 20,000 writes per day.
  * Stored Data: 1 Gigabyte.
* **Our Ingestion Profile:**
  * Pulling the entire historical studio management database involves reading ~2,500 historical documents once, consuming only **5% of a single day's free read allowance**.
  * Recurring delta updates will consume fewer than **50 reads per day** (< 0.1% of daily allowance).

### C. Google Apps Script Quotas (Google Workspace Account)
* **Email Recipients per day:** 1,500 / day (for Google Workspace accounts).
  * *Studio Tunnel Peak:* ~10–20 client invoice emails per day.
* **Script Runtime:** 6 minutes / single execution.
  * *Our Invoice Engine Runtime:* < 4 seconds per invoice build.

---

## 4. APIs Deliberately Skipped to Prevent Incurring Charges

| Service | Reason Skipped | Zero-Cost Alternative Used |
|---|---|---|
| **Google Secret Manager** | Requires billing account setup. | **GitHub Actions Encrypted Secrets** + Local `credentials/private/secrets.env`. |
| **Google Cloud Functions / Cloud Run** | Potential cold-start & execution compute costs. | **Google Apps Script** (Included free with Google Workspace). |
| **Compute Engine / GKE** | Ongoing server instance billing. | **Serverless Architecture** (No virtual machines). |
| **Cloud SQL** | Fixed instance cost (~₹2,500+/mo). | **BigQuery Serverless Warehouse** (₹0/mo free tier). |

---

## 5. Summary & Verification

With this configuration, the entire Studio Tunnel Financial Comptroller operates completely inside Google Cloud's free permanent tier. No surprise bills or unexpected charges can occur.
