/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 2: 2_InvoiceParser.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * This script reads all values from the active sheet tab 'Invoice_Generator'
 * and prepares clean JSON data for the PDF generator.
 */

/**
 * Reads data from 'Invoice_Generator' sheet using cell coordinates mapped in 0_Config.gs
 * 
 * @returns {Object} Full invoice dataset
 */
function getInvoiceData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName(SHEET_NAMES.GENERATOR);
  const compSheet = ss.getSheetByName(SHEET_NAMES.COMPANY);
  
  if (!formSheet) throw new Error(\Sheet '\' not found.\);

  // 1. Fetch Company Settings (Legal entity constants)
  const companyData = {
    name: compSheet ? compSheet.getRange('B2').getValue() : COMPANY_DEFAULTS.NAME,
    brand: compSheet ? compSheet.getRange('B3').getValue() : COMPANY_DEFAULTS.BRAND,
    address: compSheet ? compSheet.getRange('B4').getValue() : COMPANY_DEFAULTS.ADDRESS,
    hsn: compSheet ? compSheet.getRange('B5').getValue() : COMPANY_DEFAULTS.DEFAULT_HSN,
    phone: compSheet ? compSheet.getRange('B6').getValue() : COMPANY_DEFAULTS.PHONE,
    email: compSheet ? compSheet.getRange('B7').getValue() : COMPANY_DEFAULTS.EMAIL,
    gstin: compSheet ? compSheet.getRange('B8').getValue() : COMPANY_DEFAULTS.GSTIN,
    state: compSheet ? compSheet.getRange('B9').getValue() : COMPANY_DEFAULTS.STATE,
    pan: compSheet ? compSheet.getRange('B10').getValue() : COMPANY_DEFAULTS.PAN,
    tan: compSheet ? compSheet.getRange('B11').getValue() : COMPANY_DEFAULTS.TAN
  };

  // 2. Fetch Invoice Header Details
  const invDetails = {
    no: formSheet.getRange(CELL_MAP.INV_NO).getValue(),
    date: Utilities.formatDate(new Date(formSheet.getRange(CELL_MAP.INV_DATE).getValue()), Session.getScriptTimeZone(), 'dd-MM-yyyy'),
    placeOfSupply: formSheet.getRange(CELL_MAP.PLACE_OF_SUPPLY).getValue() || COMPANY_DEFAULTS.STATE
  };

  // 3. Fetch Client Bill To Details
  const client = {
    name: formSheet.getRange(CELL_MAP.CLIENT_NAME).getValue(),
    address: formSheet.getRange(CELL_MAP.CLIENT_ADDRESS).getValue(),
    contact: formSheet.getRange(CELL_MAP.CLIENT_CONTACT).getValue(),
    email: formSheet.getRange(CELL_MAP.CLIENT_EMAIL).getValue(),
    gstin: formSheet.getRange(CELL_MAP.CLIENT_GSTIN).getValue(),
    state: formSheet.getRange(CELL_MAP.CLIENT_STATE).getValue(),
    pan: formSheet.getRange(CELL_MAP.CLIENT_PAN).getValue()
  };

  // 4. Fetch Bank Payment Details
  const bank = {
    name: formSheet.getRange(CELL_MAP.BANK_NAME).getValue(),
    accountNo: formSheet.getRange(CELL_MAP.BANK_ACC_NO).getValue(),
    ifsc: formSheet.getRange(CELL_MAP.BANK_IFSC).getValue(),
    holder: formSheet.getRange(CELL_MAP.BANK_HOLDER).getValue(),
    qrUrl: formSheet.getRange(CELL_MAP.BANK_QR_URL).getValue()
  };

  // 5. Fetch Line Items with Checkbox Validation (Rows 19 to 28)
  const items = [];
  const itemRows = formSheet.getRange(CELL_MAP.ITEMS_RANGE).getValues();
  
  let lineCounter = 1;
  for (let i = 0; i < itemRows.length; i++) {
    const row = itemRows[i];
    const isIncluded = row[0]; // Col A: Checkbox (TRUE / FALSE)
    const itemName = row[3];   // Col D: Description / Item Name
    
    // 💡 ONLY include line item if Checkbox is Checked (TRUE) AND item name is not empty
    if (isIncluded === true && itemName && itemName.toString().trim() !== '') {
      items.push({
        srNo: lineCounter++,
        name: row[3],
        hsn: row[4] || companyData.hsn,
        qty: row[5],
        unit: row[6],
        rate: Number(row[7]),
        gstRate: Number(row[8]) * 100, // Format 0.18 -> 18
        gstAmount: Number(row[5]) * Number(row[7]) * Number(row[8]),
        amount: Number(row[9])
      });
    }
  }

  // 6. Fetch Financial Calculations & Determine GST Mode (Intra-state CGST/SGST vs Inter-state IGST)
  const subTotal = Number(formSheet.getRange(CELL_MAP.SUB_TOTAL).getValue() || 0);
  const totalGst = Number(formSheet.getRange(CELL_MAP.TOTAL_GST).getValue() || 0);
  const grandTotal = Number(formSheet.getRange(CELL_MAP.GRAND_TOTAL).getValue() || 0);
  const received = Number(formSheet.getRange(CELL_MAP.RECEIVED_AMOUNT).getValue() || 0);
  const balance = Number(formSheet.getRange(CELL_MAP.BALANCE_DUE).getValue() || 0);

  const isIntraState = client.state.toString().toLowerCase().includes('maharashtra') || 
                       invDetails.placeOfSupply.toString().toLowerCase().includes('maharashtra');

  const sgst = isIntraState ? totalGst / 2 : 0;
  const cgst = isIntraState ? totalGst / 2 : 0;
  const igst = !isIntraState ? totalGst : 0;

  const words = numberToIndianWords(grandTotal);

  return {
    company: companyData,
    inv: invDetails,
    client: client,
    bank: bank,
    items: items,
    financials: {
      subTotal: subTotal,
      totalGst: totalGst,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      grandTotal: grandTotal,
      received: received,
      balance: balance,
      words: words,
      isIntraState: isIntraState
    }
  };
}

