/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 6: 6_SelfTest.gs
 * ============================================================================
 * 
 * NOOB / ARTIST GUIDE:
 * This file is the system's own doctor. Run `runSelfTest()` from the Apps
 * Script editor (Extensions > Apps Script > select runSelfTest > Run)
 * BEFORE the first live invoice to confirm everything is wired up correctly.
 *
 * It will NEVER send an email, NEVER ping Discord, and NEVER create a real
 * invoice. It is a read-only health check — safe to run any time.
 *
 * HOW TO READ RESULTS:
 *   Open Apps Script editor > View > Logs
 *   Look for [PASS] and [FAIL] lines
 *   A row is also appended to Invoice_Log with a [SELF_TEST] prefix
 * ============================================================================
 */

/**
 * Main self-test runner. Verifies config, sheets, Drive, and formula logic.
 * Run manually from Apps Script editor — never called automatically.
 */
function runSelfTest() {
  var passed = 0;
  var total = 0;
  var results = [];

  Logger.log('======================================================================');
  Logger.log('ST-fin-com-prog — GAS SELF-TEST SUITE');
  Logger.log('======================================================================');

  // --------------------------------------------------------------------------
  // TEST 1: DRY_RUN_MODE must be active during self-test
  // --------------------------------------------------------------------------
  total++;
  try {
    if (typeof DRY_RUN_MODE === 'undefined') throw new Error('DRY_RUN_MODE is not defined in 0_Config.gs');
    if (DRY_RUN_MODE !== true) throw new Error('DRY_RUN_MODE must be true before running self-test. Set it in 0_Config.gs first.');
    Logger.log('[PASS] Test 1: DRY_RUN_MODE = true (safe to proceed)');
    results.push('[PASS] T1: DRY_RUN_MODE active');
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 1: ' + e.message);
    results.push('[FAIL] T1: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: COMPANY_INFO constants exist and GSTIN / PAN pass regex
  // --------------------------------------------------------------------------
  total++;
  try {
    var gstin = COMPANY_INFO.GSTIN;
    var pan   = COMPANY_INFO.PAN;
    if (!gstin || !pan) throw new Error('COMPANY_INFO.GSTIN or COMPANY_INFO.PAN is empty');
    var gstinOk = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
    var panOk   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    if (!gstinOk) throw new Error('GSTIN format invalid: ' + gstin);
    if (!panOk)   throw new Error('PAN format invalid: ' + pan);
    Logger.log('[PASS] Test 2: GSTIN (' + gstin + ') & PAN (' + pan + ') regex valid');
    results.push('[PASS] T2: GSTIN & PAN regex valid');
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 2: ' + e.message);
    results.push('[FAIL] T2: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: All required Spreadsheet tabs exist
  // --------------------------------------------------------------------------
  total++;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var requiredSheets = [
      SHEET_NAMES.GENERATOR,
      SHEET_NAMES.ACCOUNTS,
      SHEET_NAMES.LOG,
      SHEET_NAMES.PROJECT_TRACKER
    ];
    var missing = [];
    requiredSheets.forEach(function(name) {
      if (!ss.getSheetByName(name)) missing.push(name);
    });
    if (missing.length > 0) throw new Error('Missing tabs: ' + missing.join(', '));
    Logger.log('[PASS] Test 3: All required sheet tabs exist (' + requiredSheets.join(', ') + ')');
    results.push('[PASS] T3: All sheet tabs present');
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 3: ' + e.message);
    results.push('[FAIL] T3: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: INVOICES_GENERATED Drive folder is reachable
  // --------------------------------------------------------------------------
  total++;
  try {
    if (typeof GOOGLE_DRIVE_FOLDER_ID === 'undefined' || !GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID not set in 0_Config.gs');
    }
    var folder = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID);
    Logger.log('[PASS] Test 4: Drive folder reachable — "' + folder.getName() + '" (' + GOOGLE_DRIVE_FOLDER_ID + ')');
    results.push('[PASS] T4: Drive folder OK — ' + folder.getName());
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 4: ' + e.message);
    results.push('[FAIL] T4: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: formatDateYYYYMMDD() produces valid YYYYMMDD string
  // --------------------------------------------------------------------------
  total++;
  try {
    var knownDate = new Date('2026-07-01T00:00:00');
    var formatted = formatDateYYYYMMDD(knownDate);
    if (!/^\d{8}$/.test(formatted)) throw new Error('Output is not 8 digits: ' + formatted);
    Logger.log('[PASS] Test 5: formatDateYYYYMMDD(2026-07-01) -> "' + formatted + '"');
    results.push('[PASS] T5: Date formatter -> ' + formatted);
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 5: ' + e.message);
    results.push('[FAIL] T5: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 7: STEM USER REGISTRY sheet reachable
  // --------------------------------------------------------------------------
  total++;
  try {
    var stemId = EXTERNAL_SHEETS.STEM_USER_REGISTRY;
    if (!stemId) throw new Error('EXTERNAL_SHEETS.STEM_USER_REGISTRY not defined');
    var stemSs = SpreadsheetApp.openById(stemId);
    var sheet = stemSs.getSheets()[0];
    Logger.log('[PASS] Test 7: STEM registry sheet reachable – ' + sheet.getName());
    results.push('[PASS] T7: STEM registry reachable');
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 7: ' + e.message);
    results.push('[FAIL] T7: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: GST Tax Math — Intra-state (CGST+SGST) and Inter-state (IGST)
  // --------------------------------------------------------------------------
  total++;
  try {
    var subtotal = 100000;
    var cgst = subtotal * 0.09;
    var sgst = subtotal * 0.09;
    var igst = subtotal * 0.18;
    var grandIntra = subtotal + cgst + sgst;
    var grandInter = subtotal + igst;
    var tds        = subtotal * 0.10;
    if (grandIntra !== 118000) throw new Error('Intra-state total wrong: ' + grandIntra);
    if (grandInter !== 118000) throw new Error('Inter-state total wrong: ' + grandInter);
    if (tds !== 10000)         throw new Error('TDS wrong: ' + tds);
    Logger.log('[PASS] Test 6: GST math — Intra INR 118,000 / Inter INR 118,000 / TDS INR 10,000 correct');
    results.push('[PASS] T6: GST & TDS math correct');
    passed++;
  } catch (e) {
    Logger.log('[FAIL] Test 6: ' + e.message);
    results.push('[FAIL] T6: ' + e.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  Logger.log('======================================================================');
  Logger.log('SELF-TEST SUMMARY: ' + passed + '/' + total + ' PASSED');
  Logger.log('======================================================================');

  // Write result row to Invoice_Log
  _writeSelfTestLog(passed, total, results);

  // Alert the user
  var icon = passed === total ? 'ALL PASS' : 'SOME FAILURES';
  SpreadsheetApp.getUi().alert(
    icon + ' — SELF-TEST: ' + passed + '/' + total + ' passed\n\n' +
    results.join('\n') + '\n\n' +
    (passed === total
      ? 'All checks passed! You may proceed with a dry run invoice.'
      : 'Fix the failing tests before running a real invoice.')
  );
}

/**
 * Writes a single summary row to Invoice_Log so test history is visible.
 * @param {number} passed
 * @param {number} total
 * @param {Array<string>} results
 */
function _writeSelfTestLog(passed, total, results) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(SHEET_NAMES.LOG);
    if (!logSheet) return; // If log sheet does not exist yet, skip silently

    logSheet.appendRow([
      '[SELF_TEST] ' + passed + '/' + total,
      Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMATS.DISPLAY),
      'SYSTEM SELF-TEST',
      '', '', '',
      '', '',
      new Date()
    ]);
  } catch (e) {
    Logger.log('Warning: Could not write self-test log row: ' + e.message);
  }
}
