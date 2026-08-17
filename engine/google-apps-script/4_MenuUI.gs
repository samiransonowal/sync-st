/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 4: 4_MenuUI.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * This script creates the top custom menu button '🚀 Studio Tunnel'
 * inside Google Sheets when the spreadsheet is opened.
 */

/**
 * Runs automatically when the Google Sheet is opened.
 * Adds the custom top menu bar for one-click invoice generation.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Studio Tunnel')
    .addItem('📄 Generate PDF & HTML Invoice', 'generateInvoiceDocuments')
    .addItem('📧 Generate & Email Invoice to Client', 'generateAndEmailInvoice')
    .addSeparator()
    .addItem('🧪 Run Cloud Self-Test Suite', 'runSelfTest')
    .addItem('📊 Sync Data with BigQuery Ledger', 'syncWithBigQuery')
    .addToUi();
}


