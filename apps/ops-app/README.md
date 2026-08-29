# Studio Tunnel — Operations Web App (`ops-app`)

**Web Application:** `sync-st` / `ops-app`  
**Live URL:** [https://sync-st.web.app](https://sync-st.web.app)  
**GCP / BigQuery Project ID:** `sync-st` (Project Number: `972643538415`)  
**BigQuery Datasets:** `st_comptroller_pml` (Prod) | `st_comptroller_test` (Test) | `st_comptroller_dev` (Dev)  
**BigQuery Region:** `asia-south1` (Mumbai)  

---

## 🎯 Overview

The Operations Web App (`ops-app`) is the real-time operational dashboard for **Studio Tunnel** / **Cineloom Postworks Pvt. Ltd.** It provides a reactive interface for managing studio bookings, project tracking, client relationships (CRM), team communication, and automated reporting.

---

## 🏛️ BigQuery & Cloud Data Architecture

- **GCP Project ID:** `sync-st`
- **BigQuery Production Dataset:** `st_comptroller_pml` (also referenced as `log_book_sync`)
- **Data Pipeline:**
  - Real-time client mutations and project status updates sync to **Firebase Firestore** and **Google Sheets** (`Project_Billing_Ledger`).
  - Google BigQuery auto-ingests sheet data via **External Tables** for SQL view generation, financial audits, and **Looker Studio** executive reports.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend Framework:** React 19 (JavaScript / JSX)
- **Bundler & Tooling:** Vite 7
- **Styling:** Tailwind CSS 3.4 + PostCSS
- **Icons:** Lucide React
- **Backend & Database:** Firebase Firestore & Firebase Auth
- **Analytics & Data Warehouse:** Google BigQuery (`sync-st.st_comptroller_pml`)
- **Notifications:** Discord Webhooks & Ntfy Push Alerts
- **Mobile Packaging:** Capacitor 8 (iOS & Android compatible)

---

## 💻 Local Development

```bash
# Navigate to the app directory
cd apps/ops-app

# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Build for production
npm run build
```

---

## 🚀 Deployment

```bash
# From workspace root
npm run deploy:ops
```
