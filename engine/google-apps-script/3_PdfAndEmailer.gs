/**
 * ============================================================================
 * STUDIO TUNNEL / CINELOOM POSTWORKS PVT. LTD.
 * FILE 3: 3_PdfAndEmailer.gs
 * ============================================================================
 * 
 * 💡 NOOB / ARTIST GUIDE:
 * This script builds both vector HTML documents and PDF files using 'HTMLTemplate.html',
 * saves them to the shared Google Drive folder ('INVOICES_GENERATED'), configures
 * domain-level viewer permissions, logs transactions into 'Invoice_Log', emails them,
 * and notifies the team via Discord!
 */

/**
 * Generates HTML & PDF Invoice Documents in Google Drive with Restricted Access Permissions
 * 
 * @returns {Object} { htmlFile, pdfFile, htmlUrl, pdfUrl }
 */
function generateInvoiceDocuments() {
  const data = getInvoiceData();
  const htmlTemplate = HtmlService.createTemplateFromFile('HTMLTemplate');
  htmlTemplate.d = data;
  
  const htmlContent = htmlTemplate.evaluate().getContent();
  
  // Generate YYYYMMDD serial date string for standardized file naming
  var dateSerial = formatDateYYYYMMDD(new Date(data.inv.date || new Date()));
  var baseFileName = (data.inv.no + '_' + data.client.name + '_' + dateSerial).replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
  
  // 1. Create Vector HTML File
  var htmlBlob = Utilities.newBlob(htmlContent, 'text/html', baseFileName + '.html');
  
  // 2. Create Vector PDF File
  var pdfBlob = Utilities.newBlob(htmlContent, 'text/html', baseFileName + '.html').getAs('application/pdf');
  pdfBlob.setName(baseFileName + '.pdf');
  
  // Save to target Google Drive folder (or Root fallback)
  var folder = DriveApp.getRootFolder();
  if (typeof GOOGLE_DRIVE_FOLDER_ID !== 'undefined' && GOOGLE_DRIVE_FOLDER_ID) {
    try {
      folder = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID);
    } catch (e) {
      Logger.log('⚠️ Configured folder ID invalid, falling back to Root folder.');
    }
  }
  
  var htmlFile = folder.createFile(htmlBlob);
  var pdfFile = folder.createFile(pdfBlob);
  
  // 🔒 SET PERMISSIONS: Restrict to Domain / Workspace Authorized Viewers
  try {
    // Set sharing access so anyone with link in workspace or explicitly shared can view
    htmlFile.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    pdfFile.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Explicitly add Samiran & Lead Collaborators as Viewers/Editors
    if (typeof ROLES !== 'undefined' && ROLES.OWNER_EMAIL) {
      htmlFile.addViewer(ROLES.OWNER_EMAIL);
      pdfFile.addViewer(ROLES.OWNER_EMAIL);
    }
    if (typeof ROLES !== 'undefined' && ROLES.REPORT_RECIPIENT_EMAIL) {
      htmlFile.addViewer(ROLES.REPORT_RECIPIENT_EMAIL);
      pdfFile.addViewer(ROLES.REPORT_RECIPIENT_EMAIL);
    }
  } catch (err) {
    Logger.log('⚠️ Permission setting notice: ' + err.message);
  }
  
  var htmlUrl = htmlFile.getUrl();
  var pdfUrl = pdfFile.getUrl();
  
  // Log transaction in Invoice_Log tab (DRY RUN prefixes the invoice number)
  logInvoice(data, pdfUrl, htmlUrl, DRY_RUN_MODE);
  
  // 🔔 Trigger Discord Notification Embed Card (skipped in DRY RUN)
  if (DRY_RUN_MODE) {
    Logger.log('[DRY RUN] Discord notification skipped.');
  } else if (typeof sendDiscordInvoiceNotification === 'function') {
    sendDiscordInvoiceNotification(data, pdfUrl);
  }
  
  var modeLabel = DRY_RUN_MODE ? '🧪 DRY RUN — No email sent. ' : '';
  SpreadsheetApp.getUi().alert(
    modeLabel + '✅ Invoice Documents Generated!\n\n' +
    '📄 HTML Invoice URL:\n' + htmlUrl + '\n\n' +
    '📑 PDF Invoice URL:\n' + pdfUrl
  );
  
  return {
    htmlFile: htmlFile,
    pdfFile: pdfFile,
    htmlUrl: htmlUrl,
    pdfUrl: pdfUrl
  };
}

/**
 * Legacy wrapper for backward compatibility
 */
function generateInvoicePdf() {
  var docs = generateInvoiceDocuments();
  return docs.pdfFile;
}

/**
 * Generates HTML & PDF & Emails documents to the Client via Gmail
 */
function generateAndEmailInvoice() {
  const docs = generateInvoiceDocuments();
  const data = getInvoiceData();

  // -------------------------------------------------------------------------
  // 🧪 DRY RUN GUARD — Email is suppressed when DRY_RUN_MODE = true
  // -------------------------------------------------------------------------
  if (DRY_RUN_MODE) {
    Logger.log('[DRY RUN] Gmail send suppressed. Would have sent to: ' + data.client.email);
    SpreadsheetApp.getUi().alert(
      '🧪 DRY RUN — Email was NOT sent.\n\n' +
      'Would have sent to: ' + (data.client.email || '(no email on sheet)') + '\n\n' +
      'Set DRY_RUN_MODE = false in 0_Config.gs to enable live sends.'
    );
  }

  // -------------------------------------------------------------------------
  // 🔒 PML 2-PARTY CONFIRMATION GUARD
  // -------------------------------------------------------------------------
  var activeTier = (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.ACTIVE_ENV) ? ENV_CONFIG.ACTIVE_ENV : 'DEV';
  if (activeTier === 'PML') {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '🔒 MANDATORY 2-PARTY PRODUCTION CONFIRMATION',
      'You are operating in PML (Production Main Live).\n\n' +
      'Invoice: #' + data.inv.no + ' (' + data.client.name + ')\n' +
      'Amount: ₹' + data.financials.grandTotal + '\n\n' +
      'Do you confirm that you have 2-party authorization to dispatch this live financial transaction?',
      ui.ButtonSet.YES_NO
    );
    if (response !== ui.Button.YES) {
      Logger.log('[PML GUARD] Live dispatch cancelled by user.');
      ui.alert('🛑 Production dispatch cancelled. Transaction not sent.');
      return;
    }
  }

  // -------------------------------------------------------------------------
  // 🛑 STRICT INTERNAL-ONLY EMAIL SAFETY ENFORCEMENT
  // -------------------------------------------------------------------------
  // CRITICAL: All outbound invoice emails are strictly routed to internal
  // Studio Tunnel finance & review addresses. NEVER sent directly to clients.
  // -------------------------------------------------------------------------
  var isInternalRouting = (typeof STRICT_INTERNAL_ONLY_EMAIL_MODE === 'undefined' || STRICT_INTERNAL_ONLY_EMAIL_MODE === true);
  var targetRecipient;
  var subjectPrefix = '';

  if (isInternalRouting) {
    var recipientList = (typeof AUTHORIZED_INTERNAL_EMAIL_RECIPIENTS !== 'undefined' && AUTHORIZED_INTERNAL_EMAIL_RECIPIENTS.length > 0)
      ? AUTHORIZED_INTERNAL_EMAIL_RECIPIENTS
      : ['finance@studiotunnel.com', 'samiran@studiotunnel.com', 'contact@studiotunnel.com', 'tamash@studiotunnel.com'];
    targetRecipient = recipientList.join(',');
    subjectPrefix = '[INTERNAL REVIEW / COPY] ';
    Logger.log('🛑 [SAFETY ENFORCED] Outbound email redirected to internal list: ' + targetRecipient);
  } else {
    targetRecipient = data.client.email;
  }

  if (!targetRecipient) {
    SpreadsheetApp.getUi().alert('⚠️ Recipient email is missing in the Invoice Generator sheet.');
    return;
  }

  const subject = subjectPrefix + 'Tax Invoice #' + data.inv.no + ' from ' + data.company.brand + ' (Client: ' + data.client.name + ')';
  const body = 
    'Dear Team,\n\n' +
    (isInternalRouting ? '⚠️ INTERNAL COPY: This invoice was generated automatically. External client delivery is disabled.\n' +
    'Intended Client: ' + data.client.name + ' (' + (data.client.email || 'No email provided') + ')\n\n' : 'Dear ' + data.client.name + ',\n\n') +
    'Please find attached Tax Invoice #' + data.inv.no + ' dated ' + data.inv.date + ' for ₹' + data.financials.grandTotal + '.\n\n' +
    'Live web invoice link:\n' + docs.htmlUrl + '\n\n' +
    'Bank Payment Details:\n' +
    'Bank: ' + data.company.bank.name + '\n' +
    'Account No: ' + data.company.bank.accNo + '\n' +
    'IFSC: ' + data.company.bank.ifsc + '\n' +
    'Account Holder: ' + data.company.legalName + '\n\n' +
    'Best regards,\n' +
    data.company.brand + '\n' +
    'Phone: ' + data.company.phone;

  GmailApp.sendEmail(targetRecipient, subject, body, {
    attachments: [docs.pdfFile.getAs(MimeType.PDF), docs.htmlFile.getAs(MimeType.HTML)],
    name: data.company.brand
  });

  var alertMsg = isInternalRouting
    ? '📧 Internal invoice copy dispatched to Studio Tunnel Finance & Review team:\n\n' +
      targetRecipient.split(',').join('\n') + '\n\n' +
      '⚠️ Direct external client dispatch is STRICTLY DISABLED per safety policy.'
    : '📧 Email sent to ' + targetRecipient + ' with PDF and HTML invoice!';

  SpreadsheetApp.getUi().alert(alertMsg);
}

/**
 * Logs historical transaction into Invoice_Log sheet tab
 * 
 * @param {Object} data - Invoice Dataset
 * @param {string} pdfUrl - Google Drive PDF Link
 * @param {string} htmlUrl - Google Drive HTML Web Link
 */
/**
 * Logs historical transaction into Invoice_Log sheet tab.
 * 
 * @param {Object} data - Invoice Dataset
 * @param {string} pdfUrl - Google Drive PDF Link
 * @param {string} htmlUrl - Google Drive HTML Web Link
 * @param {boolean} isDryRun - Prefixes Invoice No with [DRY RUN] when true
 */
function logInvoice(data, pdfUrl, htmlUrl, isDryRun) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOG);
  
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOG);
    logSheet.appendRow(['Invoice No', 'Date', 'Client Name', 'Subtotal', 'Tax Amount', 'Grand Total', 'PDF Link', 'HTML Web Link', 'Timestamp']);
  }

  var invoiceLabel = (isDryRun ? '[DRY RUN] ' : '') + data.inv.no;

  logSheet.appendRow([
    invoiceLabel,
    data.inv.date,
    data.client.name,
    data.financials.subTotal,
    data.financials.totalGst,
    data.financials.grandTotal,
    pdfUrl,
    htmlUrl || '',
    new Date()
  ]);
}

