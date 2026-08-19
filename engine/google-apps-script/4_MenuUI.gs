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
 * Adds the custom top menu bar with active environment badge.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const activeTier = (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.ACTIVE_ENV) ? ENV_CONFIG.ACTIVE_ENV : 'DEV';
  const menuTitle = '🚀 Studio Tunnel [' + activeTier + ']';

  ui.createMenu(menuTitle)
    .addItem('📄 Generate PDF & HTML Invoice', 'generateInvoiceDocuments')
    .addItem('📧 Generate & Email Invoice to Client', 'generateAndEmailInvoice')
    .addSeparator()
    .addItem('📊 Sync Data with BigQuery Ledger', 'syncWithBigQuery')
    .addItem('🧪 Run Cloud Self-Test Suite', 'runSelfTest')
    .addSeparator()
    .addItem('🛡️ Environment & Governance Status', 'showEnvironmentStatus')
    .addToUi();
}

/**
 * Displays an interactive dialog showing current environment tier, dataset, and promotion mandate.
 */
function showEnvironmentStatus() {
  const ui = SpreadsheetApp.getUi();
  const activeTier = (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.ACTIVE_ENV) ? ENV_CONFIG.ACTIVE_ENV : 'DEV';
  const datasetId = (typeof BIGQUERY_DATASET_ID !== 'undefined') ? BIGQUERY_DATASET_ID : 'st_fin_com_prog_dev';
  const isDryRun = (typeof DRY_RUN_MODE !== 'undefined') ? DRY_RUN_MODE : true;
  
  var mandateInfo = '';
  if (activeTier === 'DEV') {
    mandateInfo = '⭐️ PERMANENT DEFAULT BRANCH: Unrestricted development and iterative sandbox.';
  } else if (activeTier === 'TEST') {
    mandateInfo = '⚠️ RESTRICTED SANDBOX: Accessible ONLY after human review and formal escalation.';
  } else {
    mandateInfo = '🔒 PRODUCTION MAIN LIVE: Updates & live dispatches require MANDATORY 2-PARTY CONFIRMATION.';
  }

  ui.alert(
    '🛡️ Studio Tunnel Architecture & Governance Status\n\n' +
    '• Active Tier: ' + activeTier + '\n' +
    '• BigQuery Dataset: st-in-gen.' + datasetId + '\n' +
    '• Dry Run Mode: ' + (isDryRun ? 'ENABLED (Safe Mode)' : 'DISABLED (Live Mode)') + '\n' +
    '• Outbound Safety: ' + (STRICT_INTERNAL_ONLY_EMAIL_MODE ? 'INTERNAL ONLY' : 'CLIENT ACTIVE') + '\n\n' +
    'Mandate:\n' + mandateInfo
  );
}


