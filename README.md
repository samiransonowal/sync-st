# Studio Tunnel Invoice Generator (IN-gen)

Automated Invoice Generation and Books Management System built for **Studio Tunnel** under **Cineloom Postworks Pvt. Ltd.** in Google Workspace and GCP ecosystem.

---\

## 📌 System Overview

- **Target Brand:** Studio Tunnel (Cineloom Postworks Pvt. Ltd.)
- **GCP Project:** \st-in-gen\ (Project No: \972643538415\)\
- **Collaborators:**\
  - **Samiran Sonowal** (\samiransonowal\ / \samiran@studiotunnel.com\) — Owner & Lead Collaborator\
  - **Jay Dantara** (\jd-tunnel\ / \jay@studiotunnel.com\) — Lead Developer\
- **Primary Account:** \lab@studiotunnel.com\ / \jay@studiotunnel.com\\

---\

## 📁 Repository Structure

\\\	ext\
INVOICE_APP/\
├── README.md                                  <-- Project Overview & Documentation\
├── .gitignore                                 <-- Git security rules excluding private secrets\
├── credentials/\
│   ├── public/                                <-- Safe specifications & public entity info\
│   │   ├── company_public_info.json           <-- Legal Entity, GSTIN, PAN, TAN, Address, Collaborators\
│   │   └── credentials.env.example            <-- Environment variable template\
│   └── private/                               <-- (GIT IGNORED) Secrets, OAuth JSON, Source Sheets & env keys\
│       ├── source_documents.json              <-- Private Spreadsheet links & IDs\
│       └── secrets.env                        <-- Private environment variables\
└── framework/\
    ├── GAS-all/                               <-- Version-controlled Google Apps Script code\
    │   ├── 0_Config.gs                        <-- Cell mappings & constants\
    │   ├── 1_Utils.gs                         <-- Currency words converter\
    │   ├── 2_InvoiceParser.gs                 <-- Sheet reader & checkbox validator\
    │   ├── 3_PdfAndEmailer.gs                 <-- Vector PDF engine & emailer\
    │   ├── 4_MenuUI.gs                        <-- Spreadsheet menu\
    │   ├── 5_DiscordNotifier.gs               <-- Discord embed cards\
    │   └── HTMLTemplate.html                  <-- Vector HTML Invoice print layout\
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
\
4. **Discord Ecosystem Notifications:**\
   - Automatic posting of rich embed cards to Discord upon invoice creation.\

---\

## 🔒 Security Policy

Private keys, OAuth secrets, source document links, and environment parameters are housed exclusively in \credentials/private/\ and are strictly ignored by Git (\.gitignore\).

