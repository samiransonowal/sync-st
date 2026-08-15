/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 3: 3_PdfAndEmailer.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * This script builds the vector PDF file using 'HTMLTemplate.html', saves it
 * to Google Drive, logs it into 'Invoice_Log', and emails it via Gmail.
 */

/**
 * Generates PDF Invoice File in Google Drive
 * 
 * @returns {GoogleAppsScript.Drive.File} Generated PDF File
 */
function generateInvoicePdf() {
  const data = getInvoiceData();
  const htmlTemplate = HtmlService.createTemplateFromFile('HTMLTemplate');
  htmlTemplate.d = data;
  
  const htmlOutput = htmlTemplate.evaluate().getContent();
  const blob = Utilities.newBlob(htmlOutput, 'text/html', 'invoice.html').getAs('application/pdf');
  
  const fileName = \\_\_TAX_INVOICE.pdf\.replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
  blob.setName(fileName);

  // Save to Google Drive Root (or specific target folder)
  const folder = DriveApp.getRootFolder();
  const pdfFile = folder.createFile(blob);

  // Log transaction in Invoice_Log tab
  logInvoice(data, pdfFile.getUrl());

  SpreadsheetApp.getUi().alert(\✅ PDF Invoice Generated Successfully!\\n\\nSaved to Drive: \\\n\\nURL: \\);
  return pdfFile;
}

/**
 * Generates PDF & Emails it directly to the Client via Gmail
 */
function generateAndEmailInvoice() {
  const pdfFile = generateInvoicePdf();
  const data = getInvoiceData();

  if (!data.client.email) {
    SpreadsheetApp.getUi().alert('⚠️ Client email is missing in the Invoice Generator sheet.');
    return;
  }

  const subject = \Tax Invoice #\ from \ (\)\;
  const body = \Dear \,\\n\\nPlease find attached Tax Invoice #\ dated \ for ₹\.\\n\\nBank Payment Details:\\nBank: \\\nAccount No: \\\nIFSC: \\\nAccount Holder: \\\n\\nThank you for doing business with us!\\n\\nBest regards,\\n\\\n\\\nPhone: \\;

  GmailApp.sendEmail(data.client.email, subject, body, {
    attachments: [pdfFile.getAs(MimeType.PDF)],
    name: data.company.brand
  });

  SpreadsheetApp.getUi().alert(\📧 Email sent successfully to \ with attached invoice!\);
}

/**
 * Logs historical transaction into Invoice_Log sheet tab
 * 
 * @param {Object} data - Invoice Dataset
 * @param {string} pdfUrl - Google Drive Link
 */
function logInvoice(data, pdfUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOG);
  
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOG);
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

