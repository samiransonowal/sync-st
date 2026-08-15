/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 0: 0_Config.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * Welcome! This file contains all the MASTER CONSTANTS & CELL LOCATIONS.
 * If you ever change the layout of the Google Sheet (e.g. move a cell),
 * you ONLY need to update the cell addresses here!
 */

// ----------------------------------------------------------------------------
// 🏢 COMPANY MASTER CONSTANTS (DEFAULT FALLBACKS)
// ----------------------------------------------------------------------------
const COMPANY_DEFAULTS = {
  NAME: 'CINELOOM POSTWORKS PRIVATE LIMITED',
  BRAND: 'Studio Tunnel',
  ADDRESS: '311, Kamla Spaces, SV Road, Santacruz (West), Mumbai - 400 054',
  DEFAULT_HSN: '999612',
  PHONE: '8928249081',
  EMAIL: 'contact@studiotunnel.com',
  GSTIN: '27AAMCC8604R1ZV',
  STATE: '27-Maharashtra',
  PAN: 'AAMCC8604R',
  TAN: 'PNEC20959B'
};

// ----------------------------------------------------------------------------
// 📊 GOOGLE SHEET TAB NAMES
// ----------------------------------------------------------------------------
const SHEET_NAMES = {
  GENERATOR: 'Invoice_Generator', // The main active invoice generator tab
  COMPANY: 'Company_Settings',   // Studio Tunnel legal constants tab
  CLIENTS: 'Clients_Master',     // Master client database tab
  BANKS: 'Bank_Accounts',       // Master bank accounts tab
  SERVICES: 'Services_Master',   // Master services list tab
  LOG: 'Invoice_Log'             // Generated invoice history tab
};

// ----------------------------------------------------------------------------
// 📍 CELL MAPPINGS FOR 'Invoice_Generator' TAB
// ----------------------------------------------------------------------------
const CELL_MAP = {
  // Header Invoice Details
  INV_NO: 'C4',
  INV_DATE: 'C5',
  PLACE_OF_SUPPLY: 'C6',

  // Client Details
  CLIENT_NAME: 'C9',
  CLIENT_ADDRESS: 'C10',
  CLIENT_CONTACT: 'C11',
  CLIENT_EMAIL: 'C12',
  CLIENT_GSTIN: 'C13',
  CLIENT_STATE: 'C14',
  CLIENT_PAN: 'C15',

  // Bank Details
  BANK_NAME: 'G4',
  BANK_ACC_NO: 'G5',
  BANK_IFSC: 'G6',
  BANK_HOLDER: 'G7',
  BANK_QR_URL: 'G8',

  // Line Items Range (Cols: A=Include Checkbox, D=Description, E=HSN, F=Qty, G=Unit, H=Rate, I=GST%, J=Total)
  ITEMS_RANGE: 'A19:J28',

  // Calculated Financial Totals
  SUB_TOTAL: 'I29',
  TOTAL_GST: 'I30',
  GRAND_TOTAL: 'I31',
  RECEIVED_AMOUNT: 'I32',
  BALANCE_DUE: 'I33'
};

