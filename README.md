# Studio Tunnel Invoice Generator (IN-gen)

Automated Invoice Generation and Books Management System built for **Studio Tunnel** under **Cineloom Postworks Pvt. Ltd.** in Google Workspace and GCP ecosystem.

---\

## 📌 System Overview

- **Target Brand:** Studio Tunnel (Cineloom Postworks Pvt. Ltd.)
- **GCP Project:** \st-in-gen\ (Project No: \972643538415\)\
- **Primary Account:** \lab@studiotunnel.com\ / \jay@studiotunnel.com\\
- **Source Documents:**\
  - **ACCOUNTS Sheet:** [\1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A\](https://docs.google.com/spreadsheets/d/1NgJFSEz1C7F2AG2TRijwLDkFwGeK45iUd_S3PJkwg-A/edit?gid=0#gid=0)\
  - **PROJECT TRACKER Sheet:** [\1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0\](https://docs.google.com/spreadsheets/d/1NkRayJ7mBHkBIT_bIXQyOaTPy2zK1QCpTfT_tInL-H0/edit?pli=1&gid=0#gid=0)\

---\

## 📁 Repository Structure

\\\	ext\
INVOICE_APP/\
├── README.md                                  <-- Project Overview & Documentation\
├── .gitignore                                 <-- Git security rules excluding private secrets\
├── credentials/\
│   ├── public/                                <-- Safe specifications & public entity info\
│   │   ├── company_public_info.json           <-- Legal Entity, GSTIN, PAN, TAN, Address\
│   │   ├── source_documents.json              <-- Google Sheets links & IDs\
│   │   └── credentials.env.example            <-- Environment variable template\
│   └── private/                               <-- (GIT IGNORED) Secrets, OAuth JSON & env keys\
└── framework/\
    ├── sample_docs/\
    │   └── 91_ZOMATO_RYZE STUDIO_REVISED...pdf  <-- Sample Client Invoice PDF\
    └── documentation/\
        ├── cineloom-comptroller.md            <-- Cineloom Comptroller specification & rules\
        └── README.md                          <-- Index of source documents & sheet links\
\\\\

---\

## ⚙️ Features & Architecture

1. **Google Apps Script & Drive Integration:**\
   - Automatic calculation of Subtotals, GST (9% CGST + 9% SGST vs 18% IGST), and Balance Due.\
   - Indian Rupee Currency-in-Words generator (\Ninety Thousand Eight Hundred Sixty Rupees only\).\
   - Vector PDF generation using brand green theme (\#008738\).\
   - Automatic email drafting & sending via Gmail API.\
\
2. **Dynamic Line Item Filtering:**\
   - Row-level Checkboxes (\☑ TRUE\ / \☐ FALSE\) allowing line item selection prior to PDF build.\
\
3. **Google Cloud Platform & OAuth 2.0 Auth:**\
   - Configured OAuth 2.0 Client credentials under GCP project \st-in-gen\.\
   - Whitelisted callback URIs for Apps Script and OAuth Playground.\

---\

## 🔒 Security Policy

Private keys, OAuth secrets, and environment parameters are housed exclusively in \credentials/private/\ and are strictly ignored by Git (\.gitignore\).

