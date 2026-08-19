// ============================================================================
// CINELOOM POSTWORKS PVT. LTD. / STUDIO TUNNEL
// MASTER CONFIGURATION & CONSTANTS
// Program: ST-fin-com-prog (v0.5 inclusion)
// ============================================================================

// ----------------------------------------------------------------------------
// 🌐 3-TIER ENVIRONMENT ARCHITECTURE (Dev, Test, PML)
// ----------------------------------------------------------------------------
// 1. Dev  : Development Sandbox (ST-IN-gen-dev -> st_fin_com_prog_dev)
// 2. Test : Automated CI Sandbox (ST-IN-gen-test -> st_fin_com_prog_test)
// 3. PML  : Production Main Live (ST-IN-gen-prod -> st_fin_com_prog_pml)
// ----------------------------------------------------------------------------
var ENV_CONFIG = {
  ACTIVE_ENV: 'PML', // 'DEV' | 'TEST' | 'PML'
  TIERS: {
    DEV: {
      NAME: 'Dev (Development Sandbox)',
      BRANCH: 'dev',
      PROJECT_TITLE: 'ST-IN-gen-dev',
      DRY_RUN: true,
      DATASET_ID: 'st_fin_com_prog_dev'
    },
    TEST: {
      NAME: 'Test (Automated CI Sandbox)',
      BRANCH: 'test',
      PROJECT_TITLE: 'ST-IN-gen-test',
      DRY_RUN: true,
      DATASET_ID: 'st_fin_com_prog_test'
    },
    PML: {
      NAME: 'PML (Production Main Live)',
      BRANCH: 'pml',
      PROJECT_TITLE: 'ST-IN-gen-pml',
      DRY_RUN: false,
      DATASET_ID: 'st_fin_com_prog_pml'
    }
  }
};

// Active environment shortcuts (auto-synced via scripts/setEnv.js during CI/CD)
var DRY_RUN_MODE = false;
var BIGQUERY_DATASET_ID = 'st_fin_com_prog_pml';
var GCP_PROJECT_ID = 'st-in-gen';

// ----------------------------------------------------------------------------
// 🧪 TEST CLIENT — Used by 6_SelfTest.gs for dry run invoice generation
// All fields mirror the real Invoice_Generator structure.
// ----------------------------------------------------------------------------
var TEST_CLIENT = {
  name: 'TEST CLIENT',
  address: '00-Test Street, Test City - 000 000',
  email: '',          // Intentionally blank — no email sent in dry run
  gstin: '27AABCT1332L1ZV',
  state: '27-Maharashtra',
  pan: 'AABCT1332L'
};

// ----------------------------------------------------------------------------
// 🌐 TIMEZONE & DATE FORMATTING STANDARDS
// ----------------------------------------------------------------------------
var TIMEZONE = 'Asia/Kolkata'; // IST Indian Standard Time (UTC+05:30)

var DATE_FORMATS = {
  SERIAL: 'yyyyMMdd', // File names & serial keys (e.g. 20260701)
  DISPLAY: 'dd/MM/yyyy', // User interface & PDF invoice display (e.g. 01/07/2026)
  ISO: "yyyy-MM-dd'T'HH:mm:ssXXX", // Audit logs & webhook timestamps
  DB: 'yyyy-MM-dd' // BigQuery SQL DATE standard
};

// ----------------------------------------------------------------------------
// 🏢 COMPANY & REGULATORY IDENTITIES
// ----------------------------------------------------------------------------
var COMPANY_INFO = {
  LEGAL_NAME: 'CINELOOM POSTWORKS PRIVATE LIMITED',
  BRAND_NAME: 'Studio Tunnel',
  ADDRESS_LINE_1: '311, Kamla Spaces, SV Road',
  ADDRESS_LINE_2: 'Santacruz (West), Mumbai - 400 054',
  PHONE: '8928249081',
  EMAIL: 'contact@studiotunnel.com',
  INVOICE_ALIAS_EMAIL: 'invoices@studiotunnel.com',
  GSTIN: '27AAMCC8604R1ZV',
  STATE_CODE: '27-Maharashtra',
  PAN: 'AAMCC8604R',
  TAN: 'PNEC20959B',
  DEFAULT_HSN_SAC: '999612'
};

// ----------------------------------------------------------------------------
// 🛑 STRICT OUTBOUND EMAIL SAFETY POLICY (MANDATORY OPERATIONAL RULE)
// ----------------------------------------------------------------------------
// CRITICAL: UNTIL EXPLICITLY NOTIFIED OTHERWISE, THIS AUTOMATION MUST NEVER
// SEND EMAILS DIRECTLY TO EXTERNAL CLIENTS UNDER ANY CIRCUMSTANCES.
// All generated invoices, draft previews, and email dispatches are strictly
// routed to internal Studio Tunnel finance & review addresses only.
// ----------------------------------------------------------------------------
var STRICT_INTERNAL_ONLY_EMAIL_MODE = true;

var AUTHORIZED_INTERNAL_EMAIL_RECIPIENTS = [
  'finance@studiotunnel.com',
  'samiran@studiotunnel.com',
  'contact@studiotunnel.com',
  'tamash@studiotunnel.com'
];

// ----------------------------------------------------------------------------
// 👥 COLLABORATOR EMAIL ROLES
// ----------------------------------------------------------------------------
var ROLES = {
  OWNER_EMAIL: 'samiran@studiotunnel.com',
  LEAD_DEV_EMAIL: 'jay@studiotunnel.com',
  GCP_ADMIN_EMAIL: 'lab@studiotunnel.com',
  REPORT_RECIPIENT_EMAIL: 'yash@studiotunnel.com'
};

// ----------------------------------------------------------------------------
// 📊 SPREADSHEET TAB NAMES
// ----------------------------------------------------------------------------
var SHEET_NAMES = {
  GENERATOR: 'Invoice_Generator',
  ACCOUNTS: 'ACCOUNTS',
  LOG: 'Invoice_Log',
  PROJECT_TRACKER: 'PROJECT TRACKER'
};
var EXTERNAL_SHEETS = {
  STEM_USER_REGISTRY: '1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA'
};

// ----------------------------------------------------------------------------
// 📍 CELL MAPPINGS FOR INVOICE_GENERATOR TAB
// ----------------------------------------------------------------------------
var CELL_MAP = {
  INVOICE_NO: 'B3',
  INVOICE_DATE: 'B4',
  DUE_DATE: 'B5',
  CLIENT_NAME: 'B7',
  CLIENT_ADDRESS: 'B8',
  CLIENT_GSTIN: 'B9',
  PLACE_OF_SUPPLY: 'B10',
  COLORIST: 'B11',
  PROJECT_NAME: 'B12',
  LINE_ITEMS_START_ROW: 15,
  CHECKBOX_COL: 1, // Col A
  DESCRIPTION_COL: 2, // Col B
  HSN_SAC_COL: 3, // Col C
  QTY_COL: 4, // Col D
  RATE_COL: 5, // Col E
  AMOUNT_COL: 6, // Col F
  LINE_ITEMS_MAX_ROWS: 10,
  SUBTOTAL: 'F26',
  CGST: 'F27',
  SGST: 'F28',
  IGST: 'F29',
  GRAND_TOTAL: 'F30'
};
