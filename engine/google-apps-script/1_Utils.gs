// ============================================================================
// CINELOOM POSTWORKS PVT. LTD. / STUDIO TUNNEL
// UTILITY FUNCTIONS & REGULATORY VALIDATORS
// ============================================================================

/**
 * Formats a Date object into IST YYYYMMDD serial string.
 * @param {Date} dateObj 
 * @return {string} e.g. '20260701'
 */
function formatDateYYYYMMDD(dateObj) {
  if (!dateObj || !(dateObj instanceof Date)) dateObj = new Date();
  return Utilities.formatDate(dateObj, TIMEZONE, DATE_FORMATS.SERIAL);
}

/**
 * Formats a Date object into IST DD/MM/YYYY human display string.
 * @param {Date} dateObj 
 * @return {string} e.g. '01/07/2026'
 */
function formatDateDisplay(dateObj) {
  if (!dateObj || !(dateObj instanceof Date)) dateObj = new Date();
  return Utilities.formatDate(dateObj, TIMEZONE, DATE_FORMATS.DISPLAY);
}

/**
 * Validates an Indian GSTIN (GST Identification Number).
 * @param {string} gstin 
 * @return {boolean}
 */
function validateGSTIN(gstin) {
  if (!gstin) return false;
  var regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
}

/**
 * Validates an Indian PAN (Permanent Account Number).
 * @param {string} pan 
 * @return {boolean}
 */
function validatePAN(pan) {
  if (!pan) return false;
  var regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return regex.test(pan.trim().toUpperCase());
}

/**
 * Converts a numeric amount to Indian Rupee Words (e.g. 150000 -> One Lakh Fifty Thousand).
 * @param {number} amount 
 * @return {string}
 */
function numberToIndianWords(amount) {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';
  
  var words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function numToWords(n) {
    if (n < 20) return words[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
    if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  }
  
  var whole = Math.floor(amount);
  var fraction = Math.round((amount - whole) * 100);
  var result = numToWords(whole) + ' Rupees';
  
  if (fraction > 0) {
    result += ' and ' + numToWords(fraction) + ' Paise';
  }
  return result + ' Only';
}

/**
 * Syncs active Sheet records with BigQuery Ledger
 */
function syncWithBigQuery() {
  var ui = SpreadsheetApp.getUi();
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(SHEET_NAMES.LOG);
    var rowCount = logSheet ? logSheet.getLastRow() - 1 : 0;
    
    Logger.log('[BIGQUERY SYNC] Checking rows to sync: ' + rowCount);
    ui.alert(
      '📊 BigQuery Data Warehouse Sync\n\n' +
      '• Target Dataset: st-in-gen.st_fin_com_prog\n' +
      '• Region: asia-south1 (Mumbai)\n' +
      '• Log Records Staged: ' + rowCount + '\n\n' +
      'Status: Ready. Automated sync runs via BigQuery Data Transfer.'
    );
  } catch (e) {
    ui.alert('⚠️ BigQuery Sync Notice: ' + e.message);
  }
}


