/**
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * Google Apps Script - Invoice Automation System
 */

// Custom Menu on Sheet Open
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Studio Tunnel')
    .addItem('📄 Generate PDF Invoice', 'generateInvoicePdf')
    .addItem('📧 Generate & Email Invoice', 'generateAndEmailInvoice')
    .addSeparator()
    .addItem('🔄 Refresh Selected Client Details', 'populateClientDetails')
    .addItem('🧹 Reset Invoice Form', 'resetInvoiceForm')
    .addToUi();
}

/**
 * Converts numbers to Indian Currency Words (Rupees & Paise)
 */
function numberToIndianWords(num) {
  if (num === null || num === undefined || isNaN(num) || num === 0) return 'Zero Rupees only';
  
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
             'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  }

  const rounded = Math.round(num * 100) / 100;
  let rupees = Math.floor(rounded);
  let paise = Math.round((rounded - rupees) * 100);

  let result = '';

  if (rupees >= 10000000) { // Crores
    const cr = Math.floor(rupees / 10000000);
    result += convertGroup(cr) + ' Crore ';
    rupees %= 10000000;
  }
  if (rupees >= 100000) { // Lakhs
    const lakh = Math.floor(rupees / 100000);
    result += convertGroup(lakh) + ' Lakh ';
    rupees %= 100000;
  }
  if (rupees >= 1000) { // Thousands
    const th = Math.floor(rupees / 1000);
    result += convertGroup(th) + ' Thousand ';
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertGroup(rupees);
  }

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertGroup(paise) + ' Paise';
  }

  return result + ' only';
}

/**
 * Reads form data from sheet and builds HTML Invoice template
 */
function getInvoiceData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName('Invoice_Generator');
  const compSheet = ss.getSheetByName('Company_Settings');
  
  if (!formSheet) throw new Error('Sheet "Invoice_Generator" not found.');

  // Company Settings
  const companyData = {
    name: compSheet ? compSheet.getRange('B2').getValue() : 'CINELOOM POSTWORKS PRIVATE LIMITED',
    brand: compSheet ? compSheet.getRange('B3').getValue() : 'Studio Tunnel',
    address: compSheet ? compSheet.getRange('B4').getValue() : '311, Kamla Spaces, SV Road, Santacruz (West), Mumbai - 400 054',
    hsn: compSheet ? compSheet.getRange('B5').getValue() : '999612',
    phone: compSheet ? compSheet.getRange('B6').getValue() : '8928249081',
    email: compSheet ? compSheet.getRange('B7').getValue() : 'contact@studiotunnel.com',
    gstin: compSheet ? compSheet.getRange('B8').getValue() : '27AAMCC8604R1ZV',
    state: compSheet ? compSheet.getRange('B9').getValue() : '27-Maharashtra',
    pan: compSheet ? compSheet.getRange('B10').getValue() : 'AAMCC8604R',
    tan: compSheet ? compSheet.getRange('B11').getValue() : 'PNEC20959B'
  };

  // Invoice Details
  const invDetails = {
    no: formSheet.getRange('C4').getValue(),
    date: Utilities.formatDate(new Date(formSheet.getRange('C5').getValue()), Session.getScriptTimeZone(), 'dd-MM-yyyy'),
    placeOfSupply: formSheet.getRange('C6').getValue() || '27-Maharashtra'
  };

  // Client Details
  const client = {
    name: formSheet.getRange('C9').getValue(),
    address: formSheet.getRange('C10').getValue(),
    contact: formSheet.getRange('C11').getValue(),
    email: formSheet.getRange('C12').getValue(),
    gstin: formSheet.getRange('C13').getValue(),
    state: formSheet.getRange('C14').getValue(),
    pan: formSheet.getRange('C15').getValue()
  };

  // Bank Details
  const bank = {
    name: formSheet.getRange('G4').getValue(),
    accountNo: formSheet.getRange('G5').getValue(),
    ifsc: formSheet.getRange('G6').getValue(),
    holder: formSheet.getRange('G7').getValue(),
    qrUrl: formSheet.getRange('G8').getValue()
  };

  // Line Items (Rows 19 to 28)
  const items = [];
  const itemRows = formSheet.getRange('A19:J28').getValues();
  
  let lineCounter = 1;
  for (let i = 0; i < itemRows.length; i++) {
    const row = itemRows[i];
    const isIncluded = row[0]; // Col A: Checkbox (TRUE / FALSE)
    const itemName = row[3];   // Col D: Description / Item Name
    
    // Only include line item if Checkbox is Checked (TRUE) AND item name is not empty
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

  // Financial Calculations
  const subTotal = Number(formSheet.getRange('I29').getValue() || 0);
  const totalGst = Number(formSheet.getRange('I30').getValue() || 0);
  const grandTotal = Number(formSheet.getRange('I31').getValue() || 0);
  const received = Number(formSheet.getRange('I32').getValue() || 0);
  const balance = Number(formSheet.getRange('I33').getValue() || 0);

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

/**
 * Generate PDF Invoice File in Google Drive
 */
function generateInvoicePdf() {
  const data = getInvoiceData();
  const htmlTemplate = HtmlService.createTemplateFromFile('HTMLTemplate');
  htmlTemplate.d = data;
  
  const htmlOutput = htmlTemplate.evaluate().getContent();
  const blob = Utilities.newBlob(htmlOutput, 'text/html', 'invoice.html').getAs('application/pdf');
  
  const fileName = `${data.inv.no}_${data.client.name}_TAX_INVOICE.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  blob.setName(fileName);

  // Save to Drive
  const folder = DriveApp.getRootFolder();
  const pdfFile = folder.createFile(blob);

  // Log in Invoice_Log Sheet
  logInvoice(data, pdfFile.getUrl());

  SpreadsheetApp.getUi().alert(`✅ PDF Invoice Generated Successfully!\n\nSaved to Drive: ${fileName}\n\nURL: ${pdfFile.getUrl()}`);
  return pdfFile;
}

/**
 * Generate PDF & Send Email to Client
 */
function generateAndEmailInvoice() {
  const pdfFile = generateInvoicePdf();
  const data = getInvoiceData();

  if (!data.client.email) {
    SpreadsheetApp.getUi().alert('⚠️ Client email is missing in the Invoice Generator sheet.');
    return;
  }

  const subject = `Tax Invoice #${data.inv.no} from ${data.company.brand} (${data.company.name})`;
  const body = `Dear ${data.client.name},\n\nPlease find attached Tax Invoice #${data.inv.no} dated ${data.inv.date} for ₹${data.financials.grandTotal.toLocaleString('en-IN')}.\n\nBank Payment Details:\nBank: ${data.bank.name}\nAccount No: ${data.bank.accountNo}\nIFSC: ${data.bank.ifsc}\nAccount Holder: ${data.bank.holder}\n\nThank you for doing business with us!\n\nBest regards,\n${data.company.brand}\n${data.company.name}\nPhone: ${data.company.phone}`;

  GmailApp.sendEmail(data.client.email, subject, body, {
    attachments: [pdfFile.getAs(MimeType.PDF)],
    name: data.company.brand
  });

  SpreadsheetApp.getUi().alert(`📧 Email sent successfully to ${data.client.email} with attached invoice!`);
}

/**
 * Logs historical transaction into Invoice_Log sheet
 */
function logInvoice(data, pdfUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('Invoice_Log');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('Invoice_Log');
    logSheet.appendRow(['Invoice No', 'Date', 'Client Name', 'Subtotal', 'Tax Amount', 'Grand Total', 'PDF Link', 'Timestamp']);
  }

  logSheet.appendRow([
    data.inv.no,
    data.inv.date,
    data.client.name,
    data.financials.subTotal,
    data.financials.totalGst,
    data.financials.grandTotal,
    pdfUrl,
    new Date()
  ]);
}
