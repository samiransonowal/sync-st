/**
 * 🏦 Automated Monday Bank Statement Ingestion — Reply-to-Email Pipeline
 *
 * Replaces the old "please check the bank manually" reminder with a closed-loop flow that
 * stays entirely inside Studio Tunnel's own Gmail — no bank API access, no third-party
 * aggregator, nothing shared outside the organization:
 *
 *   1. Every Monday 9:00 AM IST, `sendWeeklyBankStatementRequestEmail()` asks Samiran for the
 *      week's HDFC statement export, cc'ing Natasha (accountant), and tags the thread with the
 *      `bank-statement-request-pending` Gmail label.
 *   2. Samiran replies to that SAME thread with the statement attached (.xlsx / .xls / .csv).
 *   3. `pollForBankStatementReplies()` (hourly trigger) finds the reply, parses the attachment,
 *      and matches credits against open invoices in `Project_Billing_Ledger` using the same
 *      exact / TDS-adjusted matching rules as the Finance App's manual reconciliation engine.
 *   4. Matches are written to `Bank_Reconciliation_Log` with Verification Status =
 *      'Pending Verification' — the ledger's Payment Status is NOT touched yet.
 *   5. A summary email goes to Natasha + Samiran so she can re-verify every match in the
 *      Finance App's "Pending Verification" queue and Approve or Reject each one individually.
 *
 * Nothing here auto-finalizes a payment. `approveVerification` / `rejectVerification`
 * (in BillingWebApp.gs), triggered only by a human click in the app, are what actually change
 * Payment Status in the ledger.
 */

const BSR_OWNER_EMAIL = 'samiran@studiotunnel.com';
const BSR_ACCOUNTANT_EMAIL = 'natasha@studiotunnel.com';
const BSR_LABEL_PENDING = 'bank-statement-request-pending';
const BSR_LABEL_PROCESSED = 'bank-statement-request-processed';
const BSR_SUPPORTED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'tsv'];
const BSR_PROCESSED_MSG_IDS_PROP = 'BSR_PROCESSED_MSG_IDS';
const BSR_FINANCE_APP_URL = 'https://comptroller.studiotunnel.com';

/**
 * Monday Morning Bank Statement Request Bot
 * Executed every Monday at 9:00 AM IST (installed in 5_ScheduledBotsAndReminders.gs)
 */
function sendWeeklyBankStatementRequestEmail() {
  const today = new Date();
  const weekLabel = Utilities.formatDate(today, 'Asia/Kolkata', 'dd MMM yyyy');
  const token = Utilities.formatDate(today, 'Asia/Kolkata', 'yyyyMMdd');
  const subject = `🏦 Weekly Bank Statement Request — Week of ${weekLabel} [BSR-${token}]`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; padding: 24px; border-radius: 8px;">
      <h2 style="color: #3b82f6; margin-top: 0;">🏦 Weekly Bank Statement Request</h2>
      <p>Good morning Samiran,</p>
      <p style="color: #cbd5e1;">Please <strong>reply directly to this email</strong> with this week's HDFC bank statement export attached
      (<code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code>).</p>
      <p style="color: #cbd5e1;">Once you reply, the Comptroller engine will automatically read the statement, match credits against
      open invoices in the Master Ledger, and queue every match for Natasha to re-verify before anything is marked Paid.</p>
      <p style="color: #94a3b8; font-size: 0.9em;">⚠️ Reply within this same thread — the ingestion engine only watches this
      conversation, not your inbox generally.</p>
      <p style="font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #2d3748; padding-top: 12px;">
        Automated Bank Statement Request — Studio Tunnel Comptroller Engine.
      </p>
    </div>
  `;

  GmailApp.sendEmail(BSR_OWNER_EMAIL, subject, '', {
    htmlBody: htmlBody,
    cc: BSR_ACCOUNTANT_EMAIL
  });

  // Locate the thread we just created so we can tag it for the poller to watch.
  const threads = GmailApp.search(`in:sent subject:"[BSR-${token}]"`, 0, 1);
  if (threads.length > 0) {
    threads[0].addLabel(getOrCreateGmailLabel_(BSR_LABEL_PENDING));
    Logger.log(`✅ Weekly bank statement request sent & thread tagged (BSR-${token}).`);
  } else {
    Logger.log(`⚠️ Sent weekly bank statement request but could not locate the thread to tag it (BSR-${token}).`);
  }
}

/**
 * Hourly poller: scans every thread still tagged "pending" for a reply-with-attachment,
 * ingests it, and re-tags the thread "processed" once a match attempt has been made.
 */
function pollForBankStatementReplies() {
  const pendingLabel = getOrCreateGmailLabel_(BSR_LABEL_PENDING);
  const threads = pendingLabel.getThreads();
  if (threads.length === 0) return;

  const processedIds = getProcessedMessageIds_();

  threads.forEach(thread => {
    try {
      const messages = thread.getMessages();
      if (messages.length < 2) return; // no reply yet — original request only

      let replyMessage = null;
      for (let i = 1; i < messages.length; i++) {
        const msg = messages[i];
        if (processedIds.indexOf(msg.getId()) !== -1) continue;
        if (msg.getAttachments().length > 0) { replyMessage = msg; break; }
      }
      if (!replyMessage) return; // reply exists but no new attachment yet, or already attempted

      markMessageProcessed_(replyMessage.getId());
      ingestBankStatementReply_(thread, replyMessage);
    } catch (err) {
      Logger.log(`❌ Error processing bank statement thread "${thread.getFirstMessageSubject()}": ${err.toString()}`);
    }
  });
}

function ingestBankStatementReply_(thread, replyMessage) {
  const weekLabel = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy');

  const attachment = replyMessage.getAttachments().find(a => {
    const ext = (a.getName().split('.').pop() || '').toLowerCase();
    return BSR_SUPPORTED_EXTENSIONS.indexOf(ext) !== -1;
  });

  if (!attachment) {
    sendIngestionErrorEmail_(weekLabel, `The reply had ${replyMessage.getAttachments().length} attachment(s), but none were a supported ` +
      `format (${BSR_SUPPORTED_EXTENSIONS.join(', ')}). Please reply again in the same thread with the statement export attached.`);
    return; // thread stays labeled pending — a corrected reply will be picked up next poll
  }

  let credits;
  try {
    credits = parseStatementAttachment_(attachment);
  } catch (err) {
    Logger.log(`❌ Failed to parse bank statement attachment: ${err.toString()}`);
    sendIngestionErrorEmail_(weekLabel, `Could not parse "${attachment.getName()}": ${err.message}. ` +
      `Please re-export the statement and reply again in the same thread.`);
    return;
  }

  const { matches, unmatched } = matchCreditsAgainstOpenInvoices_(credits);

  matches.forEach(m => {
    appendReconciliationLogEntry_({
      bankTxnDate: m.date,
      narration: m.narration,
      refNo: m.refNo,
      creditAmount: m.creditAmount,
      projectCode: m.projectCode,
      invoiceNumber: m.invoiceNumber,
      clientName: m.clientName,
      tdsDeducted: m.tdsAmount,
      status: 'Paid (Pending Verification)',
      source: 'Automated Monday Ingestion',
      verificationStatus: 'Pending Verification',
      matchConfidence: m.matchType
    });
  });

  sendIngestionSummaryEmail_(weekLabel, matches, unmatched, attachment.getName());

  thread.removeLabel(getOrCreateGmailLabel_(BSR_LABEL_PENDING));
  thread.addLabel(getOrCreateGmailLabel_(BSR_LABEL_PROCESSED));
  Logger.log(`✅ Ingested "${attachment.getName()}": ${matches.length} matched (pending verification), ${unmatched.length} unmatched.`);
}

/* ============================================================= */
/* ATTACHMENT PARSING                                            */
/* ============================================================= */

/**
 * Parses a bank statement attachment into a flat list of credit transactions.
 * Returns [{ date, narration, refNo, creditAmount }].
 */
function parseStatementAttachment_(attachment) {
  const ext = (attachment.getName().split('.').pop() || '').toLowerCase();
  const rows = (ext === 'csv' || ext === 'tsv')
    ? parseDelimitedStatementRows_(attachment, ext === 'tsv' ? '\t' : ',')
    : parseExcelStatementRows_(attachment);
  return extractCreditsFromRows_(rows);
}

function parseDelimitedStatementRows_(attachment, delimiter) {
  return Utilities.parseCsv(attachment.getDataAsString(), delimiter);
}

/**
 * Apps Script has no native XLS/XLSX reader, so we convert the blob to a temporary Google
 * Sheet via the Drive v2 advanced service, read its values, then delete the temp file.
 */
function parseExcelStatementRows_(attachment) {
  const tempFile = Drive.Files.insert(
    { title: `tmp-bank-statement-${Date.now()}`, mimeType: MimeType.GOOGLE_SHEETS },
    attachment.copyBlob()
  );
  try {
    const tempSs = SpreadsheetApp.openById(tempFile.id);
    return tempSs.getSheets()[0].getDataRange().getValues();
  } finally {
    Drive.Files.remove(tempFile.id);
  }
}

/**
 * HDFC netbanking exports place Date / Narration / Chq-Ref-No / ... / Credit Amount in a fixed
 * column layout (Col A, B, C, F respectively) with a variable-height header block above the
 * data. We scan every row and keep only those where the credit-amount column is a positive
 * number — this tolerates the header block without needing to locate it explicitly.
 */
function extractCreditsFromRows_(rows) {
  const credits = [];
  rows.forEach(row => {
    const creditVal = row[5];
    if (creditVal === '' || creditVal === null || creditVal === undefined) return;
    const creditAmount = Number(String(creditVal).replace(/,/g, '').trim());
    if (!isFinite(creditAmount) || creditAmount <= 0) return;

    credits.push({
      date: String(row[0] || '').trim(),
      narration: String(row[1] || '').trim(),
      refNo: String(row[2] || '').trim(),
      creditAmount: creditAmount
    });
  });
  return credits;
}

/* ============================================================= */
/* MATCHING ENGINE                                                */
/* (mirrors the exact / TDS-adjusted / name-or-invoice matching   */
/* rules already used by the Finance App's manual reconciliation) */
/* ============================================================= */

const BSR_CLIENT_STOPWORDS = ['private', 'limited', 'pvt', 'ltd', 'llp', 'films', 'media', 'productions', 'house', 'studio', 'works', 'creative', 'services', 'inc'];

function matchCreditsAgainstOpenInvoices_(credits) {
  const ss = SpreadsheetApp.openById(ACCOUNTS_SPREADSHEET_ID);
  const ledgerSheet = ss.getSheetByName('Project_Billing_Ledger');
  const ledgerRows = ledgerSheet ? ledgerSheet.getDataRange().getValues() : [];

  const openInvoices = [];
  for (let i = 1; i < ledgerRows.length; i++) {
    const row = ledgerRows[i];
    const billStatus = String(row[26] || '').trim();
    const paymentStatus = String(row[27] || '').trim();
    if (billStatus !== 'Invoiced' || paymentStatus === 'Paid') continue;

    const subtotal = parseFloat(String(row[16] || '0').replace(/,/g, '')) || 0;
    const gross = parseFloat(String(row[17] || '0').replace(/,/g, '')) || 0;
    if (!gross) continue;

    openInvoices.push({
      projectCode: row[0], invoiceNumber: row[1], clientName: row[4],
      notes: String(row[24] || ''), subtotal: subtotal, gross: gross
    });
  }

  const matches = [];
  const unmatched = [];
  const consumedInvoiceCodes = {};

  credits.forEach(credit => {
    const narr = credit.narration.toLowerCase();
    let matchedInvoice = null;
    let matchType = '';
    let tdsAmount = 0;

    for (const inv of openInvoices) {
      if (consumedInvoiceCodes[inv.projectCode]) continue;

      const tdsAdjustedSubtotal = Math.round(inv.subtotal * 1.08 * 100) / 100; // 10% TDS on professional fee, full GST passed through
      const tdsAdjustedGross = Math.round(inv.gross * 0.90 * 100) / 100;       // 10% TDS on the GST-inclusive total

      let amtMatch = false;
      if (Math.abs(credit.creditAmount - inv.gross) < 2.0) {
        amtMatch = true; matchType = 'Exact Gross'; tdsAmount = 0;
      } else if (Math.abs(credit.creditAmount - tdsAdjustedSubtotal) < 2.0) {
        amtMatch = true; matchType = '10% TDS on Subtotal'; tdsAmount = Math.round((inv.gross - credit.creditAmount) * 100) / 100;
      } else if (Math.abs(credit.creditAmount - tdsAdjustedGross) < 2.0) {
        amtMatch = true; matchType = '10% TDS on Gross'; tdsAmount = Math.round((inv.gross - credit.creditAmount) * 100) / 100;
      }
      if (!amtMatch) continue;

      const clientWords = extractSignificantWords_(inv.clientName, 2, BSR_CLIENT_STOPWORDS);
      const notesWords = extractSignificantWords_(inv.notes, 3, []);
      const nameMatch = clientWords.some(w => narr.indexOf(w) !== -1) || notesWords.some(w => narr.indexOf(w) !== -1);
      const invMatch = (inv.invoiceNumber && narr.indexOf(String(inv.invoiceNumber).toLowerCase()) !== -1) ||
        (inv.projectCode && narr.indexOf(String(inv.projectCode).toLowerCase()) !== -1);

      if (nameMatch || invMatch) { matchedInvoice = inv; break; }
    }

    if (matchedInvoice) {
      consumedInvoiceCodes[matchedInvoice.projectCode] = true;
      matches.push({
        date: credit.date, narration: credit.narration, refNo: credit.refNo, creditAmount: credit.creditAmount,
        projectCode: matchedInvoice.projectCode, invoiceNumber: matchedInvoice.invoiceNumber,
        clientName: matchedInvoice.clientName, tdsAmount: tdsAmount, matchType: matchType
      });
    } else {
      unmatched.push(credit);
    }
  });

  return { matches, unmatched };
}

function extractSignificantWords_(text, minLength, stopwords) {
  const words = String(text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  return words.filter(w => w.length > minLength && stopwords.indexOf(w) === -1);
}

/* ============================================================= */
/* NOTIFICATIONS                                                  */
/* ============================================================= */

function sendIngestionSummaryEmail_(weekLabel, matches, unmatched, fileName) {
  const matchRows = matches.map(m => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">${m.projectCode}</td>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">${m.clientName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">₹${m.creditAmount.toLocaleString('en-IN')}</td>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">${m.matchType}${m.tdsAmount ? ` (TDS ₹${m.tdsAmount.toLocaleString('en-IN')})` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="padding: 8px; color: #94a3b8;">No credits were auto-matched this week.</td></tr>';

  const unmatchedRows = unmatched.map(u => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">${u.date}</td>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">${u.narration}</td>
      <td style="padding: 8px; border-bottom: 1px solid #2d3748;">₹${u.creditAmount.toLocaleString('en-IN')}</td>
    </tr>`).join('') || '<tr><td colspan="3" style="padding: 8px; color: #34d399;">Every credit in the statement was matched.</td></tr>';

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; padding: 24px; border-radius: 8px;">
      <h2 style="color: #3b82f6; margin-top: 0;">🏦 Bank Statement Ingested — Please Re-Verify</h2>
      <p style="color: #cbd5e1;">Statement <strong>${fileName}</strong> for the week of <strong>${weekLabel}</strong> has been read automatically.
      <strong>Nothing has been marked Paid yet</strong> — every match below is queued in the Finance App's
      <strong>Pending Verification</strong> queue for Natasha to check against the actual bank credit before it's finalized.</p>

      <h3 style="color: #10b981; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">✅ Auto-Matched — Awaiting Verification (${matches.length})</h3>
      <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; margin-bottom: 24px;">
        <thead><tr style="background-color: #1a202c; text-align: left;">
          <th style="padding: 8px;">Project</th><th style="padding: 8px;">Client</th><th style="padding: 8px;">Amount</th><th style="padding: 8px;">Match Basis</th>
        </tr></thead>
        <tbody>${matchRows}</tbody>
      </table>

      <h3 style="color: #f59e0b; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">❓ Unmatched Credits — Needs Manual Review (${unmatched.length})</h3>
      <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; margin-bottom: 24px;">
        <thead><tr style="background-color: #1a202c; text-align: left;">
          <th style="padding: 8px;">Date</th><th style="padding: 8px;">Narration</th><th style="padding: 8px;">Amount</th>
        </tr></thead>
        <tbody>${unmatchedRows}</tbody>
      </table>

      <p style="color: #cbd5e1;">Open the <a href="${BSR_FINANCE_APP_URL}" style="color: #60a5fa;">Finance App</a> → Bank Reconciliation tab →
      Pending Verification to Approve or Reject each match.</p>

      <p style="font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #2d3748; padding-top: 12px;">
        Automated Bank Statement Ingestion — Studio Tunnel Comptroller Engine.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: BSR_ACCOUNTANT_EMAIL,
    cc: BSR_OWNER_EMAIL,
    subject: `🏦 Bank Statement Ingested (${weekLabel}) — ${matches.length} Match(es) Awaiting Your Verification`,
    htmlBody: htmlBody
  });
}

function sendIngestionErrorEmail_(weekLabel, message) {
  MailApp.sendEmail({
    to: BSR_OWNER_EMAIL,
    cc: BSR_ACCOUNTANT_EMAIL,
    subject: `⚠️ Bank Statement Ingestion Failed — Week of ${weekLabel}`,
    body: `${message}\n\nStudio Tunnel Comptroller Engine.`
  });
}

/* ============================================================= */
/* HELPERS                                                        */
/* ============================================================= */

function getOrCreateGmailLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function getProcessedMessageIds_() {
  const raw = PropertiesService.getScriptProperties().getProperty(BSR_PROCESSED_MSG_IDS_PROP);
  return raw ? JSON.parse(raw) : [];
}

function markMessageProcessed_(messageId) {
  const ids = getProcessedMessageIds_();
  ids.push(messageId);
  // Cap history so the property never grows unbounded.
  const trimmed = ids.slice(-500);
  PropertiesService.getScriptProperties().setProperty(BSR_PROCESSED_MSG_IDS_PROP, JSON.stringify(trimmed));
}
