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
    .addItem('📄 Generate PDF Invoice', 'generateInvoicePdf')
    .addItem('📧 Generate & Email Invoice', 'generateAndEmailInvoice')
    .addToUi();
}

