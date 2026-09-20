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
        result = updatePaymentStatus(data.projectCode, data.newPaymentStatus, data.amountPending, data.tdsAmount, {
          narration: data.narration, refNo: data.refNo, creditAmount: data.creditAmount, source: data.source
        });
        break;

      case 'flagDisputedProject':
        result = flagDisputedProject(data.projectCode, data.reason);
        break;

      case 'getReconciliationLog':
        result = { success: true, data: getReconciliationLog() };
        break;

      case 'importVyaparRows':
        result = importVyaparRows(data.rows || [], data.importedBy || '');
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

    // GST State Code Directory
    const GST_STATE_CODES = {
      '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
      '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
      '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
      '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
      '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
      '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka',
      '30': 'Goa', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '36': 'Telangana', '37': 'Andhra Pradesh'
    };

    // Determine State & Inter vs Intra-state
    const gstin = (project.gstin || '').toString().trim().toUpperCase();
    let clientStateCode = '27';
    let clientStateName = 'Maharashtra';

    if (gstin && gstin.length >= 2) {
      const code = gstin.substring(0, 2);
      if (GST_STATE_CODES[code]) {
        clientStateCode = code;
        clientStateName = GST_STATE_CODES[code];
      }
    } else if (project.billingAddress) {
      const addrLower = project.billingAddress.toLowerCase();
      for (const code in GST_STATE_CODES) {
        if (code !== '27' && addrLower.includes(GST_STATE_CODES[code].toLowerCase())) {
          clientStateCode = code;
          clientStateName = GST_STATE_CODES[code];
          break;
        }
      }
    }

    const isIntraState = (clientStateCode === '27');
    const placeOfSupply = `${clientStateCode}-${clientStateName}`;

    // Subtotal and Reconciled Tax Calculations
    const subtotal = Math.round(Number(project.subtotalAmount || (project.totalHrs * project.rate) - (project.discount || 0)));
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    let gstTotal = 0;

    if (isIntraState) {
      // Intra-state (Maharashtra -> Maharashtra): 9% CGST + 9% SGST
      cgstPercent = 9;
      sgstPercent = 9;
      cgst = Math.round(subtotal * 0.09);
      sgst = cgst; // Ensure exact equality between CGST and SGST
      igst = 0;
      igstPercent = 0;
      gstTotal = subtotal + cgst + sgst; // Reconciled exact sum
    } else {
      // Inter-state (Maharashtra -> Other State): 18% IGST
      cgst = 0;
      sgst = 0;
      cgstPercent = 0;
      sgstPercent = 0;
      igstPercent = 18;
      igst = Math.round(subtotal * 0.18);
      gstTotal = subtotal + igst; // Reconciled exact sum
    }

    const lineItems = [
      {
        description: `Color Grading & Post Production Services — Project: "${project.projectName}"\nColorist: ${project.colorist || 'Studio Staff'} | Booking: ${project.totalHrs || 1} Hrs @ ₹${(project.rate || subtotal).toLocaleString('en-IN')}/hr`,
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
      place_of_supply: placeOfSupply,
      payment_terms: "30 Days (Due " + dueDateStr + ")",
      due_date: dueDateStr,
      line_items: lineItems,
      subtotal: subtotal,
      cgst: cgst,
      cgst_percent: cgstPercent,
      sgst: sgst,
      sgst_percent: sgstPercent,
      igst: igst,
      igst_percent: igstPercent,
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
          ledgerSheet.getRange(i + 1, 18).setValue(gstTotal);            // Col R: GST Amount [BIL-18]
          ledgerSheet.getRange(i + 1, 27).setValue('Invoiced');          // Col AA: Bill Status [BIL-27]
          ledgerSheet.getRange(i + 1, 29).setValue(gstTotal);            // Col AC: Amount Pending [BIL-29]
          ledgerSheet.getRange(i + 1, 30).setValue(dueDateStr);          // Col AD: Due Date [BIL-30]
          ledgerSheet.getRange(i + 1, 32).setValue(new Date());          // Col AF: Last Activity [BIL-32]
          break;
        }
      }
    }

    // 3. STRICT INTERNAL-ONLY EMAIL DISPATCH
    // MANDATORY SAFETY RULE: NEVER send emails directly to external clients under any circumstances.
    const SAFE_INTERNAL_RECIPIENTS = 'finance@studiotunnel.com, samiran@studiotunnel.com, contact@studiotunnel.com, tamash@studiotunnel.com';
    let targetEmail = SAFE_INTERNAL_RECIPIENTS;
    if (overrideRecipients && typeof overrideRecipients === 'string' && overrideRecipients.includes('@studiotunnel.com')) {
      targetEmail = overrideRecipients;
    }

    try {
      const subject = `[INTERNAL INVOICE DRAFT] Tax Invoice ${formattedInvNo} — Studio Tunnel (${project.projectName})`;
      const emailBody = `[INTERNAL BILLING DISPATCH — NEVER SENT TO CLIENT DIRECTLY]\n` +
        `Client / Production: ${project.company} (${project.pocName || 'No POC'})\n` +
        `Client Contact Email: ${project.clientEmail || 'N/A'}\n\n` +
        `Official Tax Invoice PDF ${formattedInvNo} has been generated for project "${project.projectName}".\n\n` +
        `Invoice Breakdown:\n` +
        `• Invoice No: ${formattedInvNo}\n` +
        `• Place of Supply: ${placeOfSupply}\n` +
        `• Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n` +
        (isIntraState ? `• CGST (9%): ₹${cgst.toLocaleString('en-IN')}\n• SGST (9%): ₹${sgst.toLocaleString('en-IN')}\n` : `• IGST (18%): ₹${igst.toLocaleString('en-IN')}\n`) +
        `• Reconciled Grand Total: ₹${gstTotal.toLocaleString('en-IN')}\n` +
        `• Due Date: ${dueDateStr}\n\n` +
        `📄 Google Drive PDF Link:\n${pdfResult.url}\n\n` +
        `Studio Tunnel Billing & Accounting System`;

      MailApp.sendEmail({
        to: targetEmail,
        subject: subject,
        body: emailBody,
        attachments: [pdfResult.blob]
      });

      Logger.log(`Invoice email with PDF attachment dispatched internally to ${targetEmail}`);
    } catch(emailErr) {
      Logger.log(`Email error: ${emailErr.message}`);
    }

    return {
      success: true,
      projectCode: projectCode,
      invoiceNumber: formattedInvNo,
      pdfUrl: pdfResult.url,
      grandTotal: gstTotal,
      message: `Invoice ${formattedInvNo} generated, saved to Drive, and dispatched to internal billing team!`
    };


  } catch(err) {
    Logger.log('Invoice generation error: ' + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Updates payment status and pending amount for a project in Project_Billing_Ledger.
 * `logContext` (optional) carries bank-statement details so the settlement is also
 * written to the Bank_Reconciliation_Log audit trail (used by the Party Ledger view).
 */
function updatePaymentStatus(projectCode, newPaymentStatus, amountPending, tdsAmount, logContext) {
  try {
    const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Project_Billing_Ledger');
    if (!sheet) throw new Error('Project_Billing_Ledger sheet not found.');

    const data = sheet.getDataRange().getValues();
    let updated = false;
    let matchedRow = null;

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
        matchedRow = data[i];
        updated = true;
        break;
      }
    }

    if (!updated) throw new Error(`Project ${projectCode} not found.`);

    // Best-effort audit trail write. Never fail the payment update because logging failed.
    try {
      const invoiceNumber = matchedRow[1] || projectCode;
      const clientName = matchedRow[4] || '';
      const invoiceAmount = Number(matchedRow[17] || 0);
      const creditAmount = (logContext && logContext.creditAmount !== undefined && logContext.creditAmount !== null)
        ? Number(logContext.creditAmount)
        : Math.max(0, invoiceAmount - Number(amountPending || 0));

      appendReconciliationLogEntry_({
        bankTxnDate: (logContext && logContext.narration) ? '' : Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy'),
        narration: (logContext && logContext.narration) || `Manual payment update — ${newPaymentStatus}`,
        refNo: (logContext && logContext.refNo) || '',
        creditAmount: creditAmount,
        projectCode: projectCode,
        invoiceNumber: invoiceNumber,
        clientName: clientName,
        tdsDeducted: Number(tdsAmount || 0),
        status: newPaymentStatus,
        source: (logContext && logContext.source) || 'Manual'
      });
    } catch (logErr) {
      Logger.log('Reconciliation log write skipped: ' + logErr.toString());
    }

    return { success: true, message: `Payment status for ${projectCode} updated to ${newPaymentStatus}.` };
  } catch(err) {
    Logger.log('Error updating payment status: ' + err.toString());
    return { success: false, message: err.message };
  }
}

/**
 * Bank_Reconciliation_Log sheet: append-only audit ledger of every credit that has
 * been matched/settled against an invoice. Powers the per-client Party Ledger statement.
 */
const RECON_LOG_SHEET_NAME = 'Bank_Reconciliation_Log';
const RECON_LOG_HEADERS = [
  'UUID', 'Reconciled At', 'Bank Txn Date', 'Narration / UTR Ref', 'Credit Amount (INR)',
  'Project Code', 'Invoice Number', 'Client Name', 'TDS Deducted (INR)', 'Status', 'Source'
];

function getOrCreateReconLogSheet_() {
  const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
  let sheet = ss.getSheetByName(RECON_LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(RECON_LOG_SHEET_NAME);
    sheet.getRange(1, 1, 1, RECON_LOG_HEADERS.length).setValues([RECON_LOG_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendReconciliationLogEntry_(entry) {
  const sheet = getOrCreateReconLogSheet_();
  const uuid = Utilities.getUuid();
  sheet.appendRow([
    uuid,
    new Date(),
    entry.bankTxnDate || '',
    entry.narration || '',
    Number(entry.creditAmount || 0),
    entry.projectCode || '',
    entry.invoiceNumber || '',
    entry.clientName || '',
    Number(entry.tdsDeducted || 0),
    entry.status || '',
    entry.source || 'Manual'
  ]);
  return uuid;
}

/**
 * Returns the full Bank_Reconciliation_Log audit trail, newest first.
 * Used to build the party-wise (client-wise) financial ledger in the frontend.
 */
function getReconciliationLog() {
  try {
    const sheet = getOrCreateReconLogSheet_();
    const rows = sheet.getDataRange().getValues();
    const log = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0]) continue;
      log.push({
        uuid: r[0],
        reconciledAt: r[1],
        bankTxnDate: r[2],
        narration: r[3],
        creditAmount: Number(r[4] || 0),
        projectCode: r[5],
        invoiceNumber: r[6],
        clientName: r[7],
        tdsDeducted: Number(r[8] || 0),
        status: r[9],
        source: r[10]
      });
    }
    log.reverse();
    return log;
  } catch (err) {
    Logger.log('Error reading reconciliation log: ' + err.toString());
    return [];
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

/* ============================================================= */
/* VYAPAR SALES REPORT IMPORT (recurring, idempotent upsert)     */
/* ============================================================= */

const VYAPAR_COLORIST_CODES = {
  'yash soni': 'YS',
  'sujith vijayan': 'SV',
  'samiran sonowal': 'SS',
  'manoj sahu': 'MS'
};

/**
 * Bulk-upserts rows parsed from a Vyapar "Sale Report" export into Project_Billing_Ledger.
 * Matching is done on Invoice Number (Col B), so re-importing the same/updated Vyapar
 * export on a later date never creates duplicate rows — existing invoices are refreshed
 * in place and only genuinely new invoices are appended.
 * `rows`: [{ invoiceNumber, invoiceDate, clientName, phone, colorist, totalAmount,
 *            paymentStatus, description, projectName }]
 */
function importVyaparRows(rows, importedBy) {
  try {
    if (!rows || !rows.length) return { success: true, created: 0, updated: 0, skipped: 0, message: 'No rows to import.' };

    const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Project_Billing_Ledger');
    if (!sheet) throw new Error('Project_Billing_Ledger sheet not found.');

    const data = sheet.getDataRange().getValues();

    // Index existing rows by Invoice Number (Col B, index 1) for O(1) lookup.
    const invoiceIndex = {};
    let maxSeq = 0;
    for (let i = 1; i < data.length; i++) {
      const invNo = (data[i][1] || '').toString().trim().toLowerCase();
      if (invNo) invoiceIndex[invNo] = i; // 0-based data row index
      const codeMatch = (data[i][0] || '').toString().match(/^(\d+)_/);
      if (codeMatch) maxSeq = Math.max(maxSeq, parseInt(codeMatch[1], 10));
    }

    let created = 0, updated = 0, skipped = 0;
    const now = new Date();
    const newRows = [];

    rows.forEach(row => {
      const invNo = (row.invoiceNumber || '').toString().trim();
      if (!invNo) { skipped++; return; }
      const key = invNo.toLowerCase();
      const totalAmt = Number(row.totalAmount || 0);
      const payStatus = (row.paymentStatus || 'Unpaid').toString().trim() || 'Unpaid';
      const pendingAmt = payStatus.toLowerCase() === 'paid' ? 0 : totalAmt;
      const coloristCode = VYAPAR_COLORIST_CODES[(row.colorist || '').toString().trim().toLowerCase()] || 'OT';

      if (invoiceIndex.hasOwnProperty(key)) {
        // Existing invoice: refresh live billing fields, never clobber manually-enriched
        // fields (email, GSTIN, PAN, billing address, POC) that Vyapar exports don't carry.
        const rowIdx = invoiceIndex[key]; // 0-based
        const sheetRow = rowIdx + 1;
        sheet.getRange(sheetRow, 3).setValue(row.invoiceDate || data[rowIdx][2]);    // Col C: Invoice Date
        if (totalAmt > 0) sheet.getRange(sheetRow, 18).setValue(totalAmt);            // Col R: GST Bill Amount
        sheet.getRange(sheetRow, 28).setValue(payStatus);                             // Col AB: Payment Status
        sheet.getRange(sheetRow, 29).setValue(pendingAmt);                            // Col AC: Amount Pending
        sheet.getRange(sheetRow, 32).setValue(now);                                   // Col AF: Last Activity
        updated++;
      } else {
        maxSeq += 1;
        const projectCode = `${maxSeq.toString().padStart(4, '0')}_MIS_${coloristCode}`;
        const subtotal = totalAmt > 0 ? Math.round((totalAmt / 1.18) * 100) / 100 : 0;
        newRows.push([
          projectCode,                       // A: Project Code ID
          invNo,                             // B: Invoice Number
          row.invoiceDate || '',              // C: Invoice Date
          row.projectName || '',              // D: Project Name
          row.clientName || '',               // E: Company / Client
          '',                                 // F: Director
          row.colorist || '',                 // G: Colorist
          'Vyapar Import',                    // H: Type
          '', '', '', '', '', '',             // I-N: Hrs fields (n/a for Vyapar rows)
          '',                                 // O: Rate
          '',                                 // P: Discount
          subtotal,                           // Q: Subtotal Amount
          totalAmt,                           // R: GST Bill Amount
          '',                                 // S: POC Name
          '',                                 // T: Client Email
          row.phone || '',                    // U: Phone
          '', '',                             // V-W: GSTIN, PAN
          '',                                 // X: Billing Address
          row.description || '',              // Y: Notes / Scope
          '',                                 // Z: PO No.
          'Invoiced',                         // AA: Bill Status
          payStatus,                          // AB: Payment Status
          pendingAmt,                         // AC: Amount Pending
          '',                                 // AD: Due Date
          '',                                 // AE: TDS Amount
          now                                 // AF: Last Activity
        ]);
        created++;
      }
    });

    if (newRows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    try {
      appendReconciliationLogEntry_({
        narration: `Vyapar Sales Report import (${created} new, ${updated} updated, ${skipped} skipped)`,
        status: 'Import',
        source: `Vyapar Import${importedBy ? ' — ' + importedBy : ''}`
      });
    } catch (logErr) {
      Logger.log('Vyapar import log write skipped: ' + logErr.toString());
    }

    return {
      success: true,
      created: created,
      updated: updated,
      skipped: skipped,
      message: `Vyapar import complete: ${created} new invoice(s) added, ${updated} existing invoice(s) refreshed, ${skipped} row(s) skipped (missing invoice number).`
    };
  } catch (err) {
    Logger.log('Error importing Vyapar rows: ' + err.toString());
    return { success: false, message: err.message };
  }
}
