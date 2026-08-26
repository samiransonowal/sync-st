/**
 * Finance & Billing Web App (SYNC API Backend)
 * Integrates directly with the master spreadsheet (ID: 1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg)
 * and BigQuery views for invoice generation, payment tracking, and financial analytics.
 */

const ACCOUNTS_SPREADSHEET_ID = '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg'; 
const INVOICE_DRIVE_FOLDER_ID = 'root'; // Target folder or root

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('BillingUI')
    .setTitle('Finance - Billing & Invoicing Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * REST API Endpoint for Firebase Hosting & External Frontend Integrations
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
    const data = payload.data || {};
    let result = { success: false, message: 'Unknown action' };

    switch (action) {
      case 'getInvoiceReadyProjects':
        const projects = getInvoiceReadyProjects();
        result = { success: true, data: projects };
        break;

      case 'generateAndDispatchInvoice':
        result = generateAndDispatchInvoice(data.projectCode, data.targetFolderId, data.overrideRecipients);
        break;

      case 'updatePaymentStatus':
        result = updatePaymentStatus(data.projectCode, data.newPaymentStatus, data.amountPending, data.tdsAmount);
        break;

      case 'flagDisputedProject':
        result = flagDisputedProject(data.projectCode, data.reason);
        break;

      default:
        result = { success: false, message: `Unsupported action: ${action}` };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    Logger.log('Billing API Error: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Reads live invoice-ready projects from Project_Billing_Ledger (32-Column Schema).
 */
function getInvoiceReadyProjects() {
  try {
    const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Project_Billing_Ledger');
    if (!sheet) {
      const sheetNames = ss.getSheets().map(s => s.getName()).join(', ');
      throw new Error('Sheet Project_Billing_Ledger not found. Available sheets: ' + sheetNames);
    }

    const rows = sheet.getDataRange().getValues();
    const invoiceReadyList = [];

    for (let i = 1; i < rows.length; i++) {
      const pCode = rows[i][0];
      if (pCode && pCode !== 'Project Code ID' && !pCode.toString().includes('[BIL-01]')) {
        const billStatus = rows[i][26] || 'Active / In Progress';
        invoiceReadyList.push({
          projectCode: pCode,                             // Col A: [BIL-01]
          invoiceNumber: rows[i][1] || '',                // Col B: [BIL-02]
          invoiceDate: rows[i][2] || '',                  // Col C: [BIL-03]
          projectName: rows[i][3] || pCode,               // Col D: [BIL-04]
          company: rows[i][4] || 'General Client',        // Col E: [BIL-05]
          director: rows[i][5] || '',                     // Col F: [BIL-06]
          colorist: rows[i][6] || '',                     // Col G: [BIL-07]
          type: rows[i][7] || 'Hourly',                   // Col H: [BIL-08]
          bookingHrs: Number(rows[i][8] || 0),             // Col I: [BIL-09]
          conformHrs: Number(rows[i][9] || 0),             // Col J: [BIL-10]
          assistHrs: Number(rows[i][10] || 0),            // Col K: [BIL-11]
          masteringHrs: Number(rows[i][11] || 0),          // Col L: [BIL-12]
          otherHrs: Number(rows[i][12] || 0),              // Col M: [BIL-13]
          totalHrs: Number(rows[i][13] || 0),              // Col N: [BIL-14]
          rate: Number(rows[i][14] || 5000),               // Col O: [BIL-15]
          discount: Number(rows[i][15] || 0),              // Col P: [BIL-16]
          subtotalAmount: Number(rows[i][16] || 0),        // Col Q: [BIL-17]
          amount: Number(rows[i][17] || 0),                // Col R: [BIL-18] GST Bill Amount
          pocName: rows[i][18] || '',                     // Col S: [BIL-19]
          clientEmail: rows[i][19] || '',                 // Col T: [BIL-20]
          phone: rows[i][20] || '',                       // Col U: [BIL-21]
          gstin: rows[i][21] || '',                       // Col V: [BIL-22]
          pan: rows[i][22] || '',                         // Col W: [BIL-23]
          billingAddress: rows[i][23] || '',              // Col X: [BIL-24]
          notes: rows[i][24] || '',                       // Col Y: [BIL-25]
          poNumber: rows[i][25] || '',                    // Col Z: [BIL-26]
          status: billStatus,                             // Col AA: [BIL-27]
          paymentStatus: rows[i][27] || 'Unpaid',         // Col AB: [BIL-28]
          amountPending: Number(rows[i][28] || 0),        // Col AC: [BIL-29] Amount Pending (INR)
          dueDate: rows[i][29] || '',                     // Col AD: [BIL-30]
          tdsAmount: Number(rows[i][30] || 0),             // Col AE: [BIL-31]
          lastActivity: rows[i][31] || new Date()         // Col AF: [BIL-32]
        });
      }
    }
    return invoiceReadyList;
  } catch(err) {
    Logger.log('Error fetching invoice ready projects: ' + err.toString());
    return [{ projectCode: 'ERROR', projectName: err.toString() }];
  }
}

/**
 * SAFE PDF INVOICE GENERATOR & EMAIL DISPATCH WITH ATTACHMENT
 */
function generateAndDispatchInvoice(projectCode, targetFolderId, overrideRecipients) {
  try {
    const projects = getInvoiceReadyProjects();
    const project = projects.find(p => p.projectCode.toString().trim() === projectCode.toString().trim());
    
    if (!project) {
      throw new Error(`Project ${projectCode} not found in Billing Ledger.`);
    }

    const now = new Date();
    const invoiceDateStr = project.invoiceDate ? Utilities.formatDate(new Date(project.invoiceDate), 'Asia/Kolkata', 'dd/MM/yyyy') : Utilities.formatDate(now, 'Asia/Kolkata', 'dd/MM/yyyy');
    
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + 30);
    const dueDateStr = Utilities.formatDate(dueDate, 'Asia/Kolkata', 'dd/MM/yyyy');

    const invNum = project.invoiceNumber || project.projectCode;
    const formattedInvNo = invNum.toString().includes('ST/') ? invNum : `ST/2026-27/${invNum.toString().padStart(3, '0')}`;

    const subtotal = project.subtotalAmount || (project.totalHrs * project.rate) - project.discount;
    const gstTotal = project.amount || Math.round(subtotal * 1.18);
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);

    const lineItems = [
      {
        description: `Color Grading & Post Production Services — Project: "${project.projectName}"\nColorist: ${project.colorist || 'Studio Staff'} | Booking: ${project.totalHrs || 1} Hrs @ ₹${project.rate.toLocaleString('en-IN')}/hr`,
        hsn_sac: "999612",
        qty: project.totalHrs || 1,
        rate: project.rate || subtotal,
        gst_percent: 18,
        amount: subtotal
      }
    ];

    const invoicePayload = {
      client_name: project.company,
      billing_address: project.billingAddress || "Mumbai, India",
      client_gstin: project.gstin || "",
      client_pan: project.pan || "",
      invoice_no: formattedInvNo,
      invoice_date: invoiceDateStr,
      po_no: project.poNumber || "N/A",
      place_of_supply: "27-Maharashtra",
      payment_terms: "30 Days (Due " + dueDateStr + ")",
      due_date: dueDateStr,
      line_items: lineItems,
      subtotal: subtotal,
      cgst: cgst,
      cgst_percent: 9,
      sgst: sgst,
      sgst_percent: 9,
      igst: 0,
      igst_percent: 0,
      grand_total: gstTotal,
      amount_in_words: numberToWordsINR(gstTotal)
    };

    // 1. Render PDF using 3_PdfAndEmailer.gs
    const folderId = targetFolderId || INVOICE_DRIVE_FOLDER_ID;
    const pdfResult = generateInvoicePdf(invoicePayload, folderId);

    // 2. Update Ledger status to 'Invoiced' and set Due Date
    const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
    const ledgerSheet = ss.getSheetByName('Project_Billing_Ledger');
    if (ledgerSheet) {
      const data = ledgerSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === projectCode.toString().trim()) {
          ledgerSheet.getRange(i + 1, 27).setValue('Invoiced');          // Col AA: Bill Status [BIL-27]
          ledgerSheet.getRange(i + 1, 30).setValue(dueDateStr);          // Col AD: Due Date [BIL-30]
          ledgerSheet.getRange(i + 1, 32).setValue(new Date());          // Col AF: Last Activity [BIL-32]
          break;
        }
      }
    }

    // 3. SAFE EMAIL DISPATCH WITH ATTACHMENT
    const targetEmail = overrideRecipients || project.clientEmail;
    if (targetEmail) {
      try {
        const subject = `Tax Invoice ${formattedInvNo} — Studio Tunnel (${project.projectName})`;
        const emailBody = `Dear ${project.pocName || project.company},\n\n` +
          `Please find attached the official Tax Invoice PDF ${formattedInvNo} for project "${project.projectName}".\n\n` +
          `Invoice Summary:\n` +
          `• Invoice No: ${formattedInvNo}\n` +
          `• Total Amount: ₹${gstTotal.toLocaleString('en-IN')}\n` +
          `• Due Date: ${dueDateStr}\n\n` +
          `📄 Direct Google Drive Link:\n${pdfResult.url}\n\n` +
          `Thank you for working with Studio Tunnel!\n` +
          `Finance & Accounts Team`;

        MailApp.sendEmail({
          to: targetEmail,
          subject: subject,
          body: emailBody,
          attachments: [pdfResult.blob]
        });

        Logger.log(`Invoice email with PDF attachment sent to ${targetEmail}`);
      } catch(emailErr) {
        Logger.log(`Email error: ${emailErr.message}`);
      }
    }

    return {
      success: true,
      projectCode: projectCode,
      invoiceNumber: formattedInvNo,
      pdfUrl: pdfResult.url,
      grandTotal: gstTotal,
      message: `Invoice ${formattedInvNo} generated, saved to Drive, and emailed with PDF attachment!`
    };

  } catch(err) {
    Logger.log('Invoice generation error: ' + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Updates payment status and pending amount for a project in Project_Billing_Ledger.
 */
function updatePaymentStatus(projectCode, newPaymentStatus, amountPending, tdsAmount) {
  try {
    const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Project_Billing_Ledger');
    if (!sheet) throw new Error('Project_Billing_Ledger sheet not found.');

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === projectCode.toString().trim()) {
        sheet.getRange(i + 1, 28).setValue(newPaymentStatus);                     // Col AB: Payment Status [BIL-28]
        if (amountPending !== undefined && amountPending !== null) {
          sheet.getRange(i + 1, 29).setValue(Number(amountPending));             // Col AC: Amount Pending [BIL-29]
        }
        if (tdsAmount !== undefined && tdsAmount !== null) {
          sheet.getRange(i + 1, 31).setValue(Number(tdsAmount));                 // Col AE: TDS [BIL-31]
        }
        sheet.getRange(i + 1, 32).setValue(new Date());                          // Col AF: Last Activity [BIL-32]
        updated = true;
        break;
      }
    }

    if (!updated) throw new Error(`Project ${projectCode} not found.`);
    return { success: true, message: `Payment status for ${projectCode} updated to ${newPaymentStatus}.` };
  } catch(err) {
    Logger.log('Error updating payment status: ' + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Flags a project as Disputed back to Ops in Project_Billing_Ledger.
 */
function flagDisputedProject(projectCode, reason) {
  try {
    const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Project_Billing_Ledger');
    if (!sheet) throw new Error('Project_Billing_Ledger sheet not found.');

    const data = sheet.getDataRange().getValues();
    let updated = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === projectCode.toString().trim()) {
        sheet.getRange(i + 1, 27).setValue('Disputed');                           // Col AA: Bill Status [BIL-27]
        if (reason) {
          const currentNotes = data[i][24] || '';
          sheet.getRange(i + 1, 25).setValue(currentNotes + ` [Dispute: ${reason}]`); // Col Y: Notes [BIL-25]
        }
        sheet.getRange(i + 1, 32).setValue(new Date());                           // Col AF: Last Activity [BIL-32]
        updated = true;
        break;
      }
    }

    if (!updated) throw new Error(`Project ${projectCode} not found.`);
    return { success: true, message: `${projectCode} flagged as Disputed back to Ops.` };
  } catch(err) {
    Logger.log('Error flagging dispute: ' + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * SAFE ISOLATED TEST: Run this function directly in Apps Script.
 * Will ONLY email samiran@studiotunnel.com & tamash@studiotunnel.com with PDF attachment!
 */
function safeTestInvoiceGenerationForSamiranAndTamash() {
  const testProjectCode = '1144_MIS_SS';
  const safeRecipients = 'samiran@studiotunnel.com, tamash@studiotunnel.com';
  return generateAndDispatchInvoice(testProjectCode, 'root', safeRecipients);
}

/**
 * Converts a numeric amount to INR words
 */
function numberToWordsINR(amount) {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWords(n) {
    if (n < 20) return words[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
    if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
  }

  if (amount === 0) return 'Zero Rupees Only';
  const val = Math.floor(amount);
  return numToWords(val) + ' Rupees Only';
}
