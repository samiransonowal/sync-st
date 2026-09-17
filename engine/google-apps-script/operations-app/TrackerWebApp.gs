/**
 * Studio Operations Backend (SYNC API)
 * Backend for logging Project Tracker atomic tasks, PIN Auth, 
 * Day-to-Day SYNC Atomic Logs, Accounts Master Billing Ledger, Tagged Data Registries, and Self-Test Suite.
 */

// SPREADSHEET_ID is hardcoded to ensure standalone executions (like from UI) target the correct sheet.
let SPREADSHEET_ID = '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg';

function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return doPost(e);
  }
  return HtmlService.createHtmlOutputFromFile('TrackerUI')
    .setTitle('Studio Operations - SYNC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * REST API Endpoint for SYNC App & External Integrations
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter && e.parameter.action);
    const data = payload.data || payload;
    let result = { success: false, message: 'Unknown action' };

    if (data.spreadsheetId) {
      SPREADSHEET_ID = data.spreadsheetId;
    }

    // Push notification handler
    if (payload.pushNotification && payload.pushNotification.topic) {
      sendNtfyNotification(
        payload.pushNotification.topic,
        payload.pushNotification.title,
        payload.pushNotification.body,
        payload.pushNotification.clickUrl
      );
    }

    switch (action) {
      case 'createSpreadsheet':
      case 'createNewSpreadsheet':
        result = createNewMasterSpreadsheet(data.title);
        break;
      case 'addProject':
      case 'createProject':
      case 'addBooking':
      case 'createBooking':
      case 'logBooking':
        result = handleAddProject(data);
        // Ensure booking session is also recorded in Atomic_Task_Logs & Ledger rollup
        processTaskEntry(data);
        break;
      case 'addTask':
      case 'processTaskEntry':
        result = processTaskEntry(data);
        break;
      case 'addSubmission':
        result = handleAddSubmission(data);
        break;
      case 'getProjects':
      case 'getActiveProjects':
        result = handleGetProjects();
        break;
      case 'getClients':
      case 'getClientCrm':
        result = handleGetClients();
        break;
      case 'getNextProjectCode':
      case 'generateNextProjectCode':
        result = generateNextProjectCode(data.categoryCode, data.artistCode);
        break;
      case 'getTasks':
        result = handleGetTasks();
        break;
      case 'getBillingLedger':
        result = handleGetBillingLedger();
        break;
      case 'getTaggedRegistry':
        result = handleGetTaggedRegistry();
        break;
      case 'clearTasks':
        result = handleClearTasks();
        break;
      case 'addShiftLog':
      case 'clockInOut':
        result = handleAddShiftLog(data);
        break;
      case 'addLeaveRequest':
        result = handleAddLeaveRequest(data);
        break;
      case 'addITTask':
        result = handleAddITTask(data);
        break;
      case 'addNotepad':
        result = handleAddNotepad(data);
        break;
      case 'addClient':
      case 'createClient':
      case 'updateClient':
        result = handleAddClient(data);
        break;
      case 'verifyPin':
        result = verifyUserPin(data.userId, data.pin);
        break;
      case 'runSelfTest':
        result = runVerificationSuite();
        break;
      case 'fixSheetHeaders':
      case 'formatSheetHeaders':
      case 'ensureSheetHeaders':
        ensureSheetHeaders();
        result = { success: true, message: 'All 9 sheet headers formatted and standardized on LOG BOOK_SYNC!' };
        break;
      case 'sendMorningBookings':
      case 'sendDailyBookingEmail':
        result = sendMorningBookingsDailyEmail(data);
        break;
      case 'deleteBooking':
      case 'cancelBooking':
        result = handleCancelBooking(data);
        break;
      case 'setupDailyMorningTrigger':
        result = setupDailyMorningTrigger();
        break;
      case 'sendWelcomeEmail':
        result = handleSendWelcomeEmail(data);
        break;
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Programmatically creates a brand new Google Spreadsheet with all required tabs, 
 * styled headers, frozen top rows, and full column schemas ready to be filled in.
 */
function createNewMasterSpreadsheet(title) {
  const name = title || 'Day to Day SYNC Master - Studio Tunnel (' + new Date().toISOString().slice(0,10) + ')';
  const ss = SpreadsheetApp.create(name);
  
  // 1. Atomic_Task_Logs (Day-to-Day SYNC Chronological Logs)
  const atomicSheet = ss.getActiveSheet();
  atomicSheet.setName('Atomic_Task_Logs');
  const atomicHeaders = [
    '[LOG-01] Task ID (UUID)',
    '[LOG-02] Timestamp',
    '[LOG-03] Project Code ID',
    '[LOG-04] Project Name',
    '[LOG-05] Task Type',
    '[LOG-06] Assigned Artist / Staff',
    '[LOG-07] Task Date',
    '[LOG-08] Actual Hours',
    '[LOG-09] Task Closure Status',
    '[LOG-10] Notes / Scope'
  ];
  atomicSheet.appendRow(atomicHeaders);
  atomicSheet.getRange(1, 1, 1, atomicHeaders.length).setFontWeight('bold').setBackground('#1E1E1E').setFontColor('#FFFFFF');
  atomicSheet.setFrozenRows(1);

  // 2. Project_Billing_Ledger (Accounts Master Format)
  const ledgerSheet = ss.insertSheet('Project_Billing_Ledger');
  const ledgerHeaders = [
    '[BIL-01] Project Code ID',
    '[BIL-02] Sr No.',
    '[BIL-03] Invoice Date',
    '[BIL-04] Project Name',
    '[BIL-05] Company / Client',
    '[BIL-06] Director',
    '[BIL-07] Colorist / Main Artist',
    '[BIL-08] Billing Type',
    '[BIL-09] Booking Hrs',
    '[BIL-10] Conform Hrs',
    '[BIL-11] Assist Hrs',
    '[BIL-12] Mastering Hrs',
    '[BIL-13] Other Hrs',
    '[BIL-14] Total Billable Hrs',
    '[BIL-15] Per Hr Rate (INR)',
    '[BIL-16] Discount (INR)',
    '[BIL-17] Total Amount (INR)',
    '[BIL-18] GST Bill Amount (INR)',
    '[BIL-19] POC Name',
    '[BIL-20] Email ID',
    '[BIL-21] Phone No.',
    '[BIL-22] GST No.',
    '[BIL-23] PAN No.',
    '[BIL-24] Billing Address',
    '[BIL-25] Notes / Scope',
    '[BIL-26] PO No.',
    '[BIL-27] Bill Status',
    '[BIL-28] Payment Status',
    '[BIL-29] Due Date',
    '[BIL-30] TDS @10%',
    '[BIL-31] Last Activity Timestamp'
  ];
  ledgerSheet.appendRow(ledgerHeaders);
  ledgerSheet.getRange(1, 1, 1, ledgerHeaders.length).setFontWeight('bold').setBackground('#1B263B').setFontColor('#FFFFFF');
  ledgerSheet.setFrozenRows(1);

  // 3. Projects (Master Project Registry)
  const projSheet = ss.insertSheet('Projects');
  const projHeaders = ['Project Code ID', 'Created At', 'Project Name', 'Client / Production House', 'Director', 'Billing Type', 'Hourly / Fixed Rate (INR)', 'Status'];
  projSheet.appendRow(projHeaders);
  projSheet.getRange(1, 1, 1, projHeaders.length).setFontWeight('bold').setBackground('#2C3E50').setFontColor('#FFFFFF');
  projSheet.setFrozenRows(1);

  // 4. Submissions (Work Submissions & QC Hub)
  const subSheet = ss.insertSheet('Submissions');
  const subHeaders = [
    '[SUB-01] Submission ID',
    '[SUB-02] Timestamp',
    '[SUB-03] Project Code ID',
    '[SUB-04] Submitted By',
    '[SUB-05] Version / Cut Tag',
    '[SUB-06] Drive / Work URL',
    '[SUB-07] Notes / Changelog',
    '[SUB-08] QC Checked By',
    '[SUB-09] Approval Status'
  ];
  subSheet.appendRow(subHeaders);
  subSheet.getRange(1, 1, 1, subHeaders.length).setFontWeight('bold').setBackground('#34495E').setFontColor('#FFFFFF');
  subSheet.setFrozenRows(1);

  // 5. Client_CRM (Centralized Client Database)
  const crmSheet = ss.insertSheet('Client_CRM');
  const crmHeaders = ['[CRM-01] Client Name', '[CRM-02] Corporate Email', '[CRM-03] Corporate Phone', '[CRM-04] GSTIN', '[CRM-05] PAN', '[CRM-06] Billing Address'];
  crmSheet.appendRow(crmHeaders);
  crmSheet.getRange(1, 1, 1, crmHeaders.length).setFontWeight('bold').setBackground('#8E44AD').setFontColor('#FFFFFF');
  crmSheet.setFrozenRows(1);

  const url = ss.getUrl();
  const id = ss.getId();
  Logger.log('Created new Google Spreadsheet: ' + url);

  return {
    success: true,
    spreadsheetId: id,
    spreadsheetUrl: url,
    message: `New Master Spreadsheet created! URL: ${url}`
  };
}

/**
 * Dispatches Push Notifications via ntfy.sh to locked iOS & Android devices.
 */
function sendNtfyNotification(topic, title, body, clickUrl) {
  if (!topic) return;
  try {
    const url = 'https://ntfy.sh/' + topic;
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        topic: topic,
        title: title || 'Studio Tunnel',
        message: body || 'New notification.',
        click: clickUrl || 'https://sync.studiotunnel.com',
        priority: 4,
        tags: ['bell']
      }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  } catch(err) {
    Logger.log('ntfy Push Error: ' + err.toString());
  }
}

/**
 * Ensures headers exist and are styled for both Atomic_Task_Logs and Project_Billing_Ledger
 */
function ensureSheetHeaders() {
  const ss = getSpreadsheet();
  
  // Page 1: Atomic_Task_Logs (Granular Activity & Labor Accounting Ledger)
  const atomicSheet = getOrCreateSheet('Atomic_Task_Logs');
  const atomicHeaders = [
    '[TSK-01] Task ID',
    '[TSK-02] Timestamp',
    '[TSK-03] Project Code ID',
    '[TSK-04] Project Name',
    '[TSK-05] Task Type',
    '[TSK-06] Assigned Artist',
    '[TSK-07] Task Date',
    '[TSK-08] Actual Hours Worked',
    '[TSK-09] Commercial Billing Status',
    '[TSK-10] Hourly Rate (INR)',
    '[TSK-11] Line Subtotal (INR)',
    '[TSK-12] Discount Waived (INR)',
    '[TSK-13] Task Closure Status',
    '[TSK-14] Notes / Scope'
  ];

  if (atomicSheet.getLastRow() === 0) {
    atomicSheet.appendRow(atomicHeaders);
    atomicSheet.getRange(1, 1, 1, atomicHeaders.length).setFontWeight('bold').setBackground('#1E1E1E').setFontColor('#FFFFFF');
    atomicSheet.setFrozenRows(1);
  } else {
    atomicSheet.getRange(1, 1, 1, atomicHeaders.length).setValues([atomicHeaders]).setFontWeight('bold').setBackground('#1E1E1E').setFontColor('#FFFFFF');
    atomicSheet.setFrozenRows(1);
  }

  // Page 2: Project_Billing_Ledger (Accounts Master Format)
  const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
  const ledgerHeaders = [
    '[BIL-01] Project Code ID',
    '[BIL-02] Invoice Number',
    '[BIL-03] Invoice Date',
    '[BIL-04] Project Name',
    '[BIL-05] Company / Client',
    '[BIL-06] Director',
    '[BIL-07] Colorist / Main Artist',
    '[BIL-08] Billing Type',
    '[BIL-09] Booking Hrs',
    '[BIL-10] Conform Hrs',
    '[BIL-11] Assist Hrs',
    '[BIL-12] Mastering Hrs',
    '[BIL-13] Other Hrs',
    '[BIL-14] Total Billable Hrs',
    '[BIL-15] Per Hr Rate (INR)',
    '[BIL-16] Discount (INR)',
    '[BIL-17] Total Amount (INR)',
    '[BIL-18] GST Bill Amount (INR)',
    '[BIL-19] POC Name',
    '[BIL-20] Email ID',
    '[BIL-21] Phone No.',
    '[BIL-22] GST No.',
    '[BIL-23] PAN No.',
    '[BIL-24] Billing Address',
    '[BIL-25] Notes / Scope',
    '[BIL-26] PO No.',
    '[BIL-27] Bill Status',
    '[BIL-28] Payment Status',
    '[BIL-29] Amount Pending (INR)',
    '[BIL-30] Due Date',
    '[BIL-31] TDS @10%',
    '[BIL-32] Last Activity Timestamp'
  ];
  if (ledgerSheet.getLastRow() === 0) {
    ledgerSheet.appendRow(ledgerHeaders);
    ledgerSheet.getRange(1, 1, 1, ledgerHeaders.length).setFontWeight('bold').setBackground('#1B263B').setFontColor('#FFFFFF');
    ledgerSheet.setFrozenRows(1);
  } else {
    ledgerSheet.getRange(1, 1, 1, ledgerHeaders.length).setValues([ledgerHeaders]).setFontWeight('bold').setBackground('#1B263B').setFontColor('#FFFFFF');
    ledgerSheet.setFrozenRows(1);
  }

  // 3. Projects Sheet
  const projSheet = getOrCreateSheet('Projects');
  const projHeaders = [
    '[PRJ-01] Project Code ID',
    '[PRJ-02] Created At',
    '[PRJ-03] Project Name',
    '[PRJ-04] Client / Production House',
    '[PRJ-05] Director',
    '[PRJ-06] Billing Type',
    '[PRJ-07] Hourly / Fixed Rate (INR)',
    '[PRJ-08] Status'
  ];
  if (projSheet.getLastRow() === 0) {
    projSheet.appendRow(projHeaders);
    projSheet.getRange(1, 1, 1, projHeaders.length).setFontWeight('bold').setBackground('#2C3E50').setFontColor('#FFFFFF');
    projSheet.setFrozenRows(1);
  } else {
    projSheet.getRange(1, 1, 1, projHeaders.length).setValues([projHeaders]).setFontWeight('bold').setBackground('#2C3E50').setFontColor('#FFFFFF');
    projSheet.setFrozenRows(1);
  }

  // 4. Submissions (Work Submissions & QC Hub)
  const subSheet = getOrCreateSheet('Submissions');
  const subHeaders = [
    '[SUB-01] Submission ID',
    '[SUB-02] Timestamp',
    '[SUB-03] Project Code ID',
    '[SUB-04] Submitted By',
    '[SUB-05] Version / Cut Tag',
    '[SUB-06] Drive / Work URL',
    '[SUB-07] Notes / Changelog',
    '[SUB-08] QC Checked By',
    '[SUB-09] Approval Status'
  ];
  if (subSheet.getLastRow() === 0) {
    subSheet.appendRow(subHeaders);
    subSheet.getRange(1, 1, 1, subHeaders.length).setFontWeight('bold').setBackground('#34495E').setFontColor('#FFFFFF');
    subSheet.setFrozenRows(1);
  } else {
    subSheet.getRange(1, 1, 1, subHeaders.length).setValues([subHeaders]).setFontWeight('bold').setBackground('#34495E').setFontColor('#FFFFFF');
    // Clear extra trailing header column if previously 10 columns
    if (subSheet.getLastColumn() > 9) {
      subSheet.getRange(1, 10, 1, subSheet.getLastColumn() - 9).clearContent();
    }
    subSheet.setFrozenRows(1);

    // Auto-realign any existing data rows
    const numRows = subSheet.getLastRow();
    if (numRows > 1) {
      const dataRows = subSheet.getRange(2, 1, numRows - 1, Math.max(subSheet.getLastColumn(), 10)).getValues();
      for (let r = 0; r < dataRows.length; r++) {
        const row = dataRows[r];
        // If col 10 had the status from 10-col format, move it to col 9
        if (row[9] && (!row[8] || row[8] instanceof Date || String(row[8]).match(/^\d{4}-\d{2}-\d{2}/))) {
          row[8] = row[9];
        }
        // If col E is a URL and col F is notes (legacy format where Col E was URL)
        if (String(row[4] || '').startsWith('http') && !String(row[5] || '').startsWith('http')) {
          const subId = row[0];
          const ts = row[1];
          const projCode = row[2];
          const submittedBy = row[3];
          const link = row[4];
          const notes = row[5];
          const status = row[6] || row[8] || 'Pending LP Review';
          const versionTag = 'v01 — First Review Cut';
          
          subSheet.getRange(r + 2, 1, 1, 9).setValues([[
            subId, ts, projCode, submittedBy, versionTag, link, notes, '', status
          ]]);
        } else {
          // Ensure 9 columns are set
          subSheet.getRange(r + 2, 1, 1, 9).setValues([[
            row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8] || 'Pending LP Review'
          ]]);
        }
      }
      // Clear column 10 data if any
      if (subSheet.getLastColumn() > 9) {
        subSheet.getRange(2, 10, numRows - 1, subSheet.getLastColumn() - 9).clearContent();
      }
    }
  }

  // 5. Client_CRM Sheet
  const crmSheet = getOrCreateSheet('Client_CRM');
  const crmHeaders = [
    '[CRM-01] Client Name',
    '[CRM-02] Corporate Email',
    '[CRM-03] Corporate Phone',
    '[CRM-04] GSTIN',
    '[CRM-05] PAN',
    '[CRM-06] Billing Address'
  ];
  if (crmSheet.getLastRow() === 0) {
    crmSheet.appendRow(crmHeaders);
    crmSheet.getRange(1, 1, 1, crmHeaders.length).setFontWeight('bold').setBackground('#8E44AD').setFontColor('#FFFFFF');
    crmSheet.setFrozenRows(1);
  } else {
    crmSheet.getRange(1, 1, 1, crmHeaders.length).setValues([crmHeaders]).setFontWeight('bold').setBackground('#8E44AD').setFontColor('#FFFFFF');
    crmSheet.setFrozenRows(1);
  }

  // 6. Shift_Logs (Attendance)
  const shiftSheet = getOrCreateSheet('Shift_Logs');
  const sftHeaders = [
    '[SFT-01] Log ID',
    '[SFT-02] Timestamp',
    '[SFT-03] Staff ID',
    '[SFT-04] Staff Name',
    '[SFT-05] Clock In',
    '[SFT-06] Clock Out',
    '[SFT-07] Duration (Hours)',
    '[SFT-08] Date',
    '[SFT-09] Status'
  ];
  if (shiftSheet.getLastRow() === 0) {
    shiftSheet.appendRow(sftHeaders);
    shiftSheet.getRange(1, 1, 1, sftHeaders.length).setFontWeight('bold').setBackground('#2E4053').setFontColor('#FFFFFF');
    shiftSheet.setFrozenRows(1);
  } else {
    shiftSheet.getRange(1, 1, 1, sftHeaders.length).setValues([sftHeaders]).setFontWeight('bold').setBackground('#2E4053').setFontColor('#FFFFFF');
    shiftSheet.setFrozenRows(1);
  }

  // 7. Leave_Requests
  const leaveSheet = getOrCreateSheet('Leave_Requests');
  const levHeaders = [
    '[LEV-01] Request ID',
    '[LEV-02] Timestamp',
    '[LEV-03] Staff ID',
    '[LEV-04] Staff Name',
    '[LEV-05] Start Date',
    '[LEV-06] End Date',
    '[LEV-07] Reason',
    '[LEV-08] Status'
  ];
  if (leaveSheet.getLastRow() === 0) {
    leaveSheet.appendRow(levHeaders);
    leaveSheet.getRange(1, 1, 1, levHeaders.length).setFontWeight('bold').setBackground('#A04000').setFontColor('#FFFFFF');
    leaveSheet.setFrozenRows(1);
  } else {
    leaveSheet.getRange(1, 1, 1, levHeaders.length).setValues([levHeaders]).setFontWeight('bold').setBackground('#A04000').setFontColor('#FFFFFF');
    leaveSheet.setFrozenRows(1);
  }

  // 8. IT_Task_Logs
  const itSheet = getOrCreateSheet('IT_Task_Logs');
  const itHeaders = [
    '[IT-01] Ticket ID',
    '[IT-02] Timestamp',
    '[IT-03] Title',
    '[IT-04] Category',
    '[IT-05] Assigned To',
    '[IT-06] Priority',
    '[IT-07] Status',
    '[IT-08] Notes'
  ];
  if (itSheet.getLastRow() === 0) {
    itSheet.appendRow(itHeaders);
    itSheet.getRange(1, 1, 1, itHeaders.length).setFontWeight('bold').setBackground('#117A65').setFontColor('#FFFFFF');
    itSheet.setFrozenRows(1);
  } else {
    itSheet.getRange(1, 1, 1, itHeaders.length).setValues([itHeaders]).setFontWeight('bold').setBackground('#117A65').setFontColor('#FFFFFF');
    itSheet.setFrozenRows(1);
  }

  // Remove Team_Notepad_Logs if present (notepad is strictly maintained in-app)
  const oldNoteSheet = ss.getSheetByName('Team_Notepad_Logs');
  if (oldNoteSheet) {
    try {
      ss.deleteSheet(oldNoteSheet);
    } catch (e) {
      Logger.log('Could not delete Team_Notepad_Logs: ' + e.message);
    }
  }
}

/**
 * Auto-generates the next sequential project code in 1001_MIS_OT format
 * Format: [Seq4Digit]_[CategoryCode]_[ArtistCode] (e.g. 1001_AD_SS)
 */
function generateNextProjectCode(categoryCode, artistCode) {
  try {
    const cat = (categoryCode || 'MIS').toString().toUpperCase().trim();
    const art = (artistCode || 'OT').toString().toUpperCase().trim();
    ensureSheetHeaders();
    const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
    const data = ledgerSheet.getDataRange().getValues();

    let maxNum = 1000;

    for (let i = 1; i < data.length; i++) {
      const code = String(data[i][0] || '').trim();
      const match = code.match(/^(\d{4})_/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const nextCode = `${nextNum}_${cat}_${art}`;
    return { success: true, projectCode: nextCode, nextNumber: nextNum, category: cat, artist: art };
  } catch (err) {
    return { success: false, projectCode: `1001_${categoryCode || 'MIS'}_${artistCode || 'OT'}`, error: err.message };
  }
}

/**
 * Handles adding a new project and initializing its entry in the Project_Billing_Ledger
 */
function handleAddProject(data) {
  ensureSheetHeaders();
  const projSheet = getOrCreateSheet('Projects');
  const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
  
  let projectCode = data.projectCode;
  if (!projectCode) {
    projectCode = generateNextProjectCode(data.categoryCode, data.artistCode).projectCode;
  }
  const now = new Date();
  
  // Auto-register client in Client_CRM if new
  if (data.client && data.client !== 'General Client') {
    ensureClientInCrm(data.client, data.pocEmail, data.pocPhone, data.gstin, data.pan, data.billingAddress);
  }

  // 1. Append to Projects master
  projSheet.appendRow([
    projectCode,
    now,
    data.projectName || data.name || 'Untitled Project',
    data.client || 'General Client',
    data.director || '',
    data.billingType || 'Hourly',
    data.fixedAmount || data.hourlyRate || 5000,
    'Active'
  ]);

  // 2. Initialize entry in Project_Billing_Ledger (Page 2) if not present
  let ledgerRowIndex = findRowByProjectCode(ledgerSheet, projectCode);
  if (ledgerRowIndex === -1) {
    const srNo = Math.max(1, ledgerSheet.getLastRow());
    const rate = Number(data.fixedAmount || data.hourlyRate || 5000);
    const rowNum = srNo + 1; // Since row 1 is header
    
    ledgerSheet.appendRow([
      projectCode,              // Col A: [BIL-01] Project Code ID
      data.invoiceNumber || '', // Col B: [BIL-02] Invoice Number
      now,                      // Col C: [BIL-03] Invoice Date
      data.projectName || data.name || '',          // Col D: [BIL-04] Project Name
      data.client || '',        // Col E: [BIL-05] Company / Client
      data.director || '',      // Col F: [BIL-06] Director
      data.colorist || 'Staff', // Col G: [BIL-07] Colorist / Main Artist
      data.billingType || 'Hourly', // Col H: [BIL-08] Billing Type
      0,                        // Col I: [BIL-09] Booking Hrs
      0,                        // Col J: [BIL-10] Conform Hrs
      0,                        // Col K: [BIL-11] Assist Hrs
      0,                        // Col L: [BIL-12] Mastering Hrs
      0,                        // Col M: [BIL-13] Other Hrs
      0,                        // Col N: [BIL-14] Total Billable Hrs
      rate,                     // Col O: [BIL-15] Per Hr Rate (INR)
      0,                        // Col P: [BIL-16] Discount
      0,                        // Col Q: [BIL-17] Total Amount
      0,                        // Col R: [BIL-18] GST Bill Amount
      data.pocName || '',       // Col S: [BIL-19] POC Name
      data.pocEmail || '',      // Col T: [BIL-20] Email ID
      data.pocPhone || '',      // Col U: [BIL-21] Phone No.
      `=IFERROR(VLOOKUP(E${rowNum}, Client_CRM!A:F, 4, FALSE), "")`, // Col V: [BIL-22] GST No. (VLOOKUP CRM)
      `=IFERROR(VLOOKUP(E${rowNum}, Client_CRM!A:F, 5, FALSE), "")`, // Col W: [BIL-23] PAN No. (VLOOKUP CRM)
      `=IFERROR(VLOOKUP(E${rowNum}, Client_CRM!A:F, 6, FALSE), "")`, // Col X: [BIL-24] Billing Address (VLOOKUP CRM)
      data.notes || '',         // Col Y: [BIL-25] Notes / Scope
      '',                       // Col Z: [BIL-26] PO No.
      'Active / In Progress',   // Col AA: [BIL-27] Bill Status
      'Unpaid',                 // Col AB: [BIL-28] Payment Status
      0,                        // Col AC: [BIL-29] Amount Pending (INR)
      '',                       // Col AD: [BIL-30] Due Date
      0,                        // Col AE: [BIL-31] TDS @10%
      now                       // Col AF: [BIL-32] Last Activity Timestamp
    ]);
    SpreadsheetApp.flush(); // Crucial: Flush so immediately following queries can find this row
  }

  return { success: true, projectId: projectCode, message: `Project ${projectCode} created and initialized in Billing Ledger!` };
}

/**
 * Main Task Logging & Closure Handler: Appends to Page 1 (Atomic_Task_Logs) and updates Page 2 (Project_Billing_Ledger)
 */
function processTaskEntry(data) {
  Logger.log('Incoming Payload: ' + JSON.stringify(data));
  try {
    ensureSheetHeaders();
    const atomicSheet = getOrCreateSheet('Atomic_Task_Logs');
    const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
    
    const taskId = Utilities.getUuid();
    const now = new Date();
    let inputCode = String(data.projectCode || data.projectId || 'PJ-GENERAL').trim();
    let projectCode = inputCode;
    let projectName = String(data.projectName || '').trim();

    // Auto-resolve official Project Code ID & Project Name from LOG BOOK_SYNC if matching code, name, or client
    // Only attempt resolution if this isn't explicitly marked as a new project
    if (!data.isNewProject) {
      const meta = findProjectMetadata(inputCode) || findProjectMetadata(projectName);
      if (meta) {
        projectCode = meta.code;
        if (!projectName || projectName === inputCode) projectName = meta.name;
      }
    }

    const taskType = String(data.taskType || data.type || 'Booking').trim();
    const actualHrs = Number(data.actualHrs || data.duration || data.scheduledHrs || data.bookingHrs || data.hours || data.bookingHours || data.scheduledHours || 0);
    const assignedArtist = String(data.assignedArtist || data.artist || data.staff || 'Staff').trim();
    const taskDate = data.date || data.taskDate || now;
    const commercialStatus = String(data.commercialStatus || data.billingStatus || (data.isFoc ? 'FOC / Complimentary' : 'Billable')).trim();
    const hourlyRate = Number(data.hourlyRate || data.rate || 5000);
    const lineSubtotal = commercialStatus === 'FOC / Complimentary' ? 0 : (actualHrs * hourlyRate);
    const focDiscount = commercialStatus === 'FOC / Complimentary' ? (actualHrs * hourlyRate) : 0;
    const taskStatus = data.isClosed ? 'Closed & Completed' : (data.taskStatus || 'Logged');
    const notes = String(data.notes || data.scope || '').trim();
    const clientName = String(data.client || data.company || data.productionHouse || data.clientName || 'General Client').trim();

    // 1. PAGE 1: Fail-safe append to Atomic_Task_Logs (14-Column Schema)
    atomicSheet.appendRow([
      taskId,           // [LOG-01] Task ID (UUID)
      now,              // [LOG-02] Timestamp
      projectCode,      // [LOG-03] Project Code ID
      projectName,      // [LOG-04] Project Name
      taskType,         // [LOG-05] Task Type
      assignedArtist,   // [LOG-06] Assigned Artist / Staff
      taskDate,         // [LOG-07] Task Date
      actualHrs,        // [LOG-08] Actual Hours Worked
      commercialStatus, // [LOG-09] Commercial Billing Status
      hourlyRate,       // [LOG-10] Hourly Rate (INR)
      lineSubtotal,     // [LOG-11] Line Subtotal (INR)
      focDiscount,      // [LOG-12] Discount / FOC Waived (INR)
      taskStatus,       // [LOG-13] Task Closure Status
      notes             // [LOG-14] Notes / Scope
    ]);
    SpreadsheetApp.flush(); // Force immediate persistence to LOG BOOK_SYNC

  // 2. PAGE 2: Update Project_Billing_Ledger rollup
  let ledgerRowIndex = findRowByProjectCode(ledgerSheet, projectCode);
  
  // Auto-create ledger entry if new project or missing from ledger
  if (data.isNewProject || ledgerRowIndex === -1) {
    handleAddProject({
      projectCode: projectCode,
      name: projectName,
      client: clientName,
      billingType: data.billingType || 'Hourly',
      hourlyRate: data.hourlyRate || 5000,
      colorist: data.assignedArtist || 'Staff',
      notes: data.notes || ''
    });
    ledgerRowIndex = findRowByProjectCode(ledgerSheet, projectCode);
  }

  if (ledgerRowIndex !== -1) {
    const rowValues = ledgerSheet.getRange(ledgerRowIndex, 1, 1, 31).getValues()[0];
    
    let bookingHrs = Number(rowValues[8] || 0);   // Col I: [BIL-09]
    let conformHrs = Number(rowValues[9] || 0);   // Col J: [BIL-10]
    let assistHrs = Number(rowValues[10] || 0);   // Col K: [BIL-11]
    let masteringHrs = Number(rowValues[11] || 0);// Col L: [BIL-12]
    let otherHrs = Number(rowValues[12] || 0);    // Col M: [BIL-13]
    const rate = Number(rowValues[14] || 5000);   // Col O: [BIL-15]
    const discount = Number(rowValues[15] || 0);  // Col P: [BIL-16]

    // Increment specific task category hours
    const normalizedType = taskType.toLowerCase();
    if (normalizedType.includes('booking')) {
      bookingHrs += actualHrs;
    } else if (normalizedType.includes('conform')) {
      conformHrs += actualHrs;
    } else if (normalizedType.includes('assist')) {
      assistHrs += actualHrs;
    } else if (normalizedType.includes('mastering')) {
      masteringHrs += actualHrs;
    } else {
      otherHrs += actualHrs;
    }

    const totalHrs = bookingHrs + conformHrs + assistHrs + masteringHrs + otherHrs;
    const totalAmount = Math.max(0, (totalHrs * rate) - discount);
    const gstAmount = totalAmount * 1.18; // 18% GST

    // Update cells in Ledger Row
    ledgerSheet.getRange(ledgerRowIndex, 9).setValue(bookingHrs);   // Col I: Booking [BIL-09]
    ledgerSheet.getRange(ledgerRowIndex, 10).setValue(conformHrs);  // Col J: Conform [BIL-10]
    ledgerSheet.getRange(ledgerRowIndex, 11).setValue(assistHrs);   // Col K: Assist [BIL-11]
    ledgerSheet.getRange(ledgerRowIndex, 12).setValue(masteringHrs);// Col L: Mastering [BIL-12]
    ledgerSheet.getRange(ledgerRowIndex, 13).setValue(otherHrs);    // Col M: Other [BIL-13]
    ledgerSheet.getRange(ledgerRowIndex, 14).setValue(totalHrs);     // Col N: Total Hrs [BIL-14]
    ledgerSheet.getRange(ledgerRowIndex, 17).setValue(totalAmount);  // Col Q: Total Amount [BIL-17]
    ledgerSheet.getRange(ledgerRowIndex, 18).setValue(gstAmount);    // Col R: GST Amount [BIL-18]
    ledgerSheet.getRange(ledgerRowIndex, 32).setValue(now);          // Col AF: Last Activity [BIL-32] (Col 31/AE is reserved for TDS Deducted)

    if (data.isClosed) {
      ledgerSheet.getRange(ledgerRowIndex, 27).setValue('Ready for Invoice'); // Col AA: Bill Status [BIL-27]
    }


    SpreadsheetApp.flush(); // Force immediate persistence

    return {
      success: true,
      taskId: taskId,
      projectCode: projectCode,
      totals: {
        bookingHrs: bookingHrs,
        conformHrs: conformHrs,
        assistHrs: assistHrs,
        masteringHrs: masteringHrs,
        otherHrs: otherHrs,
        totalHrs: totalHrs,
        totalAmount: totalAmount,
        gstAmount: gstAmount
      },
      message: `Task ${taskStatus}! Logged ${actualHrs} hrs (${taskType}) for ${projectCode}. Total Billable: ${totalHrs} hrs!`
    };
  }
    return { success: true, taskId: taskId, message: 'Task logged successfully!' };
  } catch (err) {
    Logger.log('ERROR in processTaskEntry: ' + err.toString());
    return { success: false, message: 'Server Error: ' + err.message };
  }
}

// Alias for REST / Legacy calls
function handleAddTask(data) {
  return processTaskEntry(data);
}

function handleGetProjects() {
  ensureSheetHeaders();
  const projectsMap = new Map();
  const ss = getSpreadsheet();
  const sheetsToScan = ['Project_Billing_Ledger', 'Project_Billing_Ledger_FY25_26', 'Projects'];

  sheetsToScan.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      const pCode = String(rows[i][0] || '').trim();
      if (!pCode || pCode === 'Project Code ID' || pCode.includes('[BIL-01]')) continue;

      let pName = '';
      let pClient = '';
      let pDirector = '';
      let pRate = 5000;
      let pStatus = 'Active';

      if (sheetName.includes('Project_Billing_Ledger')) {
        pName = String(rows[i][3] || '').trim() || pCode;
        pClient = String(rows[i][4] || '').trim();
        pDirector = String(rows[i][5] || '').trim();
        pRate = Number(rows[i][14] || 5000);
        pStatus = String(rows[i][26] || 'Active').trim();
      } else {
        pName = String(rows[i][2] || '').trim() || pCode;
        pClient = String(rows[i][3] || '').trim();
        pDirector = String(rows[i][4] || '').trim();
        pRate = Number(rows[i][6] || 5000);
        pStatus = String(rows[i][7] || 'Active').trim();
      }

      if (!projectsMap.has(pCode)) {
        projectsMap.set(pCode, {
          id: pCode,
          code: pCode,
          projectCode: pCode,
          project_code_id: pCode,
          projectId: pCode,
          name: pName,
          projectName: pName,
          client: pClient,
          clientName: pClient,
          director: pDirector,
          rate: pRate,
          status: pStatus,
          display: `${pCode} - ${pName}`,
          string: `${pCode} | ${pName}`
        });
      }
    }
  });

  const projectsList = Array.from(projectsMap.values());
  return {
    success: true,
    projects: projectsList,
    projectStrings: projectsList.map(p => `${p.code} | ${p.name}`)
  };
}

/**
 * Fetches client database from Client_CRM sheet in LOG BOOK_SYNC
 */
function handleGetClients() {
  ensureSheetHeaders();
  const crmSheet = getOrCreateSheet('Client_CRM');
  const rows = crmSheet.getDataRange().getValues();
  const clients = [];

  for (let i = 1; i < rows.length; i++) {
    const clientName = String(rows[i][0] || '').trim();
    if (clientName && clientName !== 'Client Name' && !clientName.includes('[CRM-01]')) {
      clients.push({
        name: clientName,
        email: String(rows[i][1] || '').trim(),
        phone: String(rows[i][2] || '').trim(),
        gstin: String(rows[i][3] || '').trim(),
        pan: String(rows[i][4] || '').trim(),
        address: String(rows[i][5] || '').trim()
      });
    }
  }

  return { success: true, clients: clients };
}

/**
 * Checks if a client exists in Client_CRM. If not, adds a new entry to Client_CRM.
 */
function ensureClientInCrm(clientName, email, phone, gstin, pan, address) {
  if (!clientName || !clientName.trim()) return null;
  const cleanName = clientName.trim();
  ensureSheetHeaders();
  const crmSheet = getOrCreateSheet('Client_CRM');
  const rows = crmSheet.getDataRange().getValues();

  // Check if client already exists (case-insensitive)
  for (let i = 1; i < rows.length; i++) {
    const existingName = String(rows[i][0] || '').trim();
    if (existingName.toLowerCase() === cleanName.toLowerCase()) {
      return { isNew: false, name: existingName };
    }
  }

  // Add as new entry to Client_CRM
  crmSheet.appendRow([
    cleanName,
    email || '',
    phone || '',
    gstin || '',
    pan || '',
    address || ''
  ]);

  return { isNew: true, name: cleanName };
}

function handleGetBillingLedger() {
  ensureSheetHeaders();
  const sheet = getOrCreateSheet('Project_Billing_Ledger');
  const rows = sheet.getDataRange().getValues();
  const ledger = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0] !== 'Project Code ID' && !rows[i][0].toString().includes('[BIL-01]')) {
      ledger.push({
        tagId: 'BIL-01', projectCode: rows[i][0],
        tagInvoiceNumber: 'BIL-02', invoiceNumber: rows[i][1],
        tagInvoiceDate: 'BIL-03', invoiceDate: rows[i][2],
        tagProjectName: 'BIL-04', projectName: rows[i][3],
        tagClient: 'BIL-05', client: rows[i][4],
        tagDirector: 'BIL-06', director: rows[i][5],
        tagColorist: 'BIL-07', colorist: rows[i][6],
        tagBillingType: 'BIL-08', billingType: rows[i][7],
        tagBookingHrs: 'BIL-09', bookingHrs: rows[i][8],
        tagConformHrs: 'BIL-10', conformHrs: rows[i][9],
        tagAssistHrs: 'BIL-11', assistHrs: rows[i][10],
        tagMasteringHrs: 'BIL-12', masteringHrs: rows[i][11],
        tagOtherHrs: 'BIL-13', otherHrs: rows[i][12],
        tagTotalHrs: 'BIL-14', totalHrs: rows[i][13],
        tagRate: 'BIL-15', rate: rows[i][14],
        tagDiscount: 'BIL-16', discount: rows[i][15],
        tagTotalAmount: 'BIL-17', totalAmount: rows[i][16],
        tagGstAmount: 'BIL-18', gstAmount: rows[i][17],
        tagPocName: 'BIL-19', pocName: rows[i][18],
        tagPocEmail: 'BIL-20', pocEmail: rows[i][19],
        tagPocPhone: 'BIL-21', pocPhone: rows[i][20],
        tagGstNo: 'BIL-22', gstNo: rows[i][21],
        tagPanNo: 'BIL-23', panNo: rows[i][22],
        tagBillingAddress: 'BIL-24', billingAddress: rows[i][23],
        tagNotes: 'BIL-25', notes: rows[i][24],
        tagPoNo: 'BIL-26', poNo: rows[i][25],
        tagBillStatus: 'BIL-27', billStatus: rows[i][26],
        tagPaymentStatus: 'BIL-28', paymentStatus: rows[i][27],
        tagAmountPending: 'BIL-29', amountPending: rows[i][28],
        tagDueDate: 'BIL-30', dueDate: rows[i][29],
        tagTds: 'BIL-31', tdsAmount: rows[i][30],
        tagLastActivity: 'BIL-32', lastActivity: rows[i][31]
      });
    }
  }
  return { success: true, ledger: ledger };
}

function handleGetTasks() {
  ensureSheetHeaders();
  const sheet = getOrCreateSheet('Atomic_Task_Logs');
  const rows = sheet.getDataRange().getValues();
  const tasks = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0] !== 'Task ID (UUID)' && !rows[i][0].toString().includes('[LOG-01]')) {
      tasks.push({
        tagId: 'LOG-01', taskId: rows[i][0],
        tagTimestamp: 'LOG-02', timestamp: rows[i][1],
        tagProjectCode: 'LOG-03', projectCode: rows[i][2],
        tagProjectName: 'LOG-04', projectName: rows[i][3],
        tagTaskType: 'LOG-05', taskType: rows[i][4],
        tagArtist: 'LOG-06', assignedArtist: rows[i][5],
        tagDate: 'LOG-07', date: rows[i][6],
        tagHours: 'LOG-08', actualHrs: rows[i][7],
        tagClosure: 'LOG-09', taskStatus: rows[i][8],
        tagNotes: 'LOG-10', notes: rows[i][9]
      });
    }
  }
  return { success: true, tasks: tasks };
}

function handleGetTaggedRegistry() {
  return {
    success: true,
    atomicTaskLogs: [
      { tagId: 'LOG-01', key: 'task_id', header: 'Task ID (UUID)', category: 'Core Identification' },
      { tagId: 'LOG-02', key: 'timestamp', header: 'Timestamp', category: 'System Timestamp' },
      { tagId: 'LOG-03', key: 'project_code_id', header: 'Project Code ID', category: 'Project Linking' },
      { tagId: 'LOG-04', key: 'project_name', header: 'Project Name', category: 'Project Metadata' },
      { tagId: 'LOG-05', key: 'task_type', header: 'Task Type', category: 'Operations Classification' },
      { tagId: 'LOG-06', key: 'assigned_artist', header: 'Assigned Artist / Staff', category: 'Resource Allocation' },
      { tagId: 'LOG-07', key: 'task_date', header: 'Task Date', category: 'Execution Date' },
      { tagId: 'LOG-08', key: 'actual_hrs', header: 'Actual Hours', category: 'Work Volume' },
      { tagId: 'LOG-09', key: 'task_closure_status', header: 'Task Closure Status', category: 'Workflow Lifecycle' },
      { tagId: 'LOG-10', key: 'notes_scope', header: 'Notes / Scope', category: 'Justification & Scope' }
    ],
    projectBillingLedger: [
      { tagId: 'BIL-01', key: 'project_code_id', header: 'Project Code ID', category: 'Project Identification' },
      { tagId: 'BIL-02', key: 'invoice_number', header: 'Invoice Number', category: 'Project Identification' },
      { tagId: 'BIL-03', key: 'invoice_date', header: 'Invoice Date', category: 'Project Identification' },
      { tagId: 'BIL-04', key: 'project_name', header: 'Project Name', category: 'Project Identification' },
      { tagId: 'BIL-05', key: 'client_name', header: 'Company / Client', category: 'Project Identification' },
      { tagId: 'BIL-06', key: 'director_name', header: 'Director', category: 'Project Identification' },
      { tagId: 'BIL-07', key: 'colorist_name', header: 'Colorist / Main Artist', category: 'Project Identification' },
      { tagId: 'BIL-08', key: 'billing_type', header: 'Billing Type', category: 'Task Hours Rollup' },
      { tagId: 'BIL-09', key: 'booking_hrs', header: 'Booking Hrs', category: 'Task Hours Rollup' },
      { tagId: 'BIL-10', key: 'conform_hrs', header: 'Conform Hrs', category: 'Task Hours Rollup' },
      { tagId: 'BIL-11', key: 'assist_hrs', header: 'Assist Hrs', category: 'Task Hours Rollup' },
      { tagId: 'BIL-12', key: 'mastering_hrs', header: 'Mastering Hrs', category: 'Task Hours Rollup' },
      { tagId: 'BIL-13', key: 'other_hrs', header: 'Other Hrs', category: 'Task Hours Rollup' },
      { tagId: 'BIL-14', key: 'total_billable_hrs', header: 'Total Billable Hrs', category: 'Task Hours Rollup' },
      { tagId: 'BIL-15', key: 'hourly_rate', header: 'Per Hr Rate (INR)', category: 'Financial Valuation' },
      { tagId: 'BIL-16', key: 'discount_amount', header: 'Discount (INR)', category: 'Financial Valuation' },
      { tagId: 'BIL-17', key: 'total_subtotal', header: 'Total Amount (INR)', category: 'Financial Valuation' },
      { tagId: 'BIL-18', key: 'gst_bill_amount', header: 'GST Bill Amount (INR)', category: 'Financial Valuation' },
      { tagId: 'BIL-19', key: 'poc_name', header: 'POC Name', category: 'Client Corporate Registry' },
      { tagId: 'BIL-20', key: 'poc_email', header: 'Email ID', category: 'Client Corporate Registry' },
      { tagId: 'BIL-21', key: 'poc_phone', header: 'Phone No.', category: 'Client Corporate Registry' },
      { tagId: 'BIL-22', key: 'client_gstin', header: 'GST No.', category: 'Client Corporate Registry' },
      { tagId: 'BIL-23', key: 'client_pan', header: 'PAN No.', category: 'Client Corporate Registry' },
      { tagId: 'BIL-24', key: 'billing_address', header: 'Billing Address', category: 'Client Corporate Registry' },
      { tagId: 'BIL-25', key: 'notes_scope', header: 'Notes / Scope', category: 'Audit & Scope' },
      { tagId: 'BIL-26', key: 'po_number', header: 'PO No.', category: 'Client Corporate Registry' },
      { tagId: 'BIL-27', key: 'bill_status', header: 'Bill Status', category: 'Invoicing Lifecycle' },
      { tagId: 'BIL-28', key: 'payment_status', header: 'Payment Status', category: 'Invoicing Lifecycle' },
      { tagId: 'BIL-29', key: 'amount_pending', header: 'Amount Pending (INR)', category: 'Invoicing Lifecycle' },
      { tagId: 'BIL-30', key: 'due_date', header: 'Due Date', category: 'Invoicing Lifecycle' },
      { tagId: 'BIL-31', key: 'tds_deduction', header: 'TDS @10%', category: 'Financial Valuation' },
      { tagId: 'BIL-32', key: 'last_activity', header: 'Last Activity Timestamp', category: 'Audit & Scope' }
    ]
  };
}

function handleClearTasks() {
  const sheet = getOrCreateSheet('Atomic_Task_Logs');
  sheet.clearContents();
  ensureSheetHeaders();
  return { success: true, message: 'Atomic Task Logs cleared!' };
}

function handleAddSubmission(data) {
  ensureSheetHeaders();
  const sheet = getOrCreateSheet('Submissions');
  const subId = data.id || Utilities.getUuid();
  const now = new Date();
  
  const projectCode = data.projectCode || data.code || '';
  const submittedBy = data.submittedBy || data.executedBy || data.userName || data.artist || 'Staff';
  const versionTag = data.versionTag || data.version || 'v01 — First Review Cut';
  const link = data.link || data.workUrl || '';
  const notes = data.notes || '';
  const qcCheckedBy = data.reviewedBy || data.qcCheckedBy || data.qcBy || '';
  const status = data.status || (qcCheckedBy ? 'QC Passed' : 'Pending LP Review');

  // Check if updating existing submission
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === String(subId).trim()) {
      sheet.getRange(i + 1, 1, 1, 9).setValues([[
        subId,
        rows[i][1] || now,
        projectCode || rows[i][2],
        submittedBy || rows[i][3],
        versionTag || rows[i][4],
        link || rows[i][5],
        notes || rows[i][6],
        qcCheckedBy || rows[i][7],
        status || rows[i][8]
      ]]);
      SpreadsheetApp.flush();
      return { success: true, submissionId: subId, message: 'Submission QC updated!' };
    }
  }

  // Append new submission
  sheet.appendRow([
    subId,              // [SUB-01] Submission ID
    now,                // [SUB-02] Timestamp
    projectCode,        // [SUB-03] Project Code ID
    submittedBy,        // [SUB-04] Submitted By
    versionTag,         // [SUB-05] Version / Cut Tag
    link,               // [SUB-06] Drive / Work URL
    notes,              // [SUB-07] Notes / Changelog
    qcCheckedBy,        // [SUB-08] QC Checked By
    status              // [SUB-09] Approval Status
  ]);
  SpreadsheetApp.flush();
  return { success: true, submissionId: subId, message: 'Submission logged!' };
}

function getStaffRegistry() {
  return [
    { id: 'usr_1', name: 'Samiran Sonowal' },
    { id: 'usr_2', name: 'Yash Soni' },
    { id: 'usr_3', name: 'Sujith Vijayan' },
    { id: 'usr_4', name: 'Aayush' },
    { id: 'usr_5', name: 'Golu' },
    { id: 'usr_6', name: 'Line Producer' },
    { id: 'usr_7', name: 'Aaditya Kamble' }
  ];
}

function verifyUserPin(userId, pin) {
  if (pin === '2633' || pin === '0000' || pin === '1234' || pin === '7777' || pin === '8888') {
    return { success: true, valid: true };
  }
  return { success: true, valid: false };
}

/**
 * AUTOMATED VERIFICATION & TEST SUITE MODULE
 * End-to-end testing module for Google Sheets 2-Page Logging & Billing Aggregation.
 */
function runVerificationSuite() {
  const logs = [];
  logs.push('--- STARTING SYSTEM VERIFICATION SUITE ---');
  
  try {
    // 1. Setup sheet headers
    ensureSheetHeaders();
    logs.push(`PASSED: Sheet connected (ID: ${SPREADSHEET_ID}). Headers initialized on Atomic_Task_Logs and Project_Billing_Ledger.`);

    // 2. Create test project
    const testCode = 'PJ-TEST-' + Math.floor(1000 + Math.random() * 9000);
    const addProjRes = handleAddProject({
      projectCode: testCode,
      name: 'Verification Campaign Commercial',
      client: 'Studio Tunnel QA',
      director: 'Samiran Sonowal',
      billingType: 'Hourly',
      hourlyRate: 6000
    });
    logs.push(`PASSED: Project created (${testCode}). Result: ${addProjRes.message}`);

    // 3. Log tasks across all task types (Booking, Conform, Assist, Mastering, Rendering)
    const testTasks = [
      { taskType: 'Booking', actualHrs: 4.0, notes: 'Color grading session 1' },
      { taskType: 'Conform', actualHrs: 2.0, notes: 'XML Conform & conform check' },
      { taskType: 'Assist', actualHrs: 3.0, notes: 'Pre-grade prep & node setup' },
      { taskType: 'Mastering', actualHrs: 1.5, notes: 'ProRes & DCP export' },
      { taskType: 'Rendering', actualHrs: 0.5, notes: 'Deliverable rendering' }
    ];

    let lastTotals = null;
    testTasks.forEach(t => {
      const res = processTaskEntry({
        projectCode: testCode,
        taskType: t.taskType,
        assignedArtist: 'Automated Tester',
        actualHrs: t.actualHrs,
        notes: t.notes
      });
      lastTotals = res.totals;
      logs.push(`PASSED: Logged ${t.taskType} (${t.actualHrs} hrs).`);
    });

    // 4. Verify rollup aggregations in Project_Billing_Ledger
    const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
    const rowIndex = findRowByProjectCode(ledgerSheet, testCode);
    if (rowIndex === -1) throw new Error('Test project not found in Project_Billing_Ledger!');

    const row = ledgerSheet.getRange(rowIndex, 1, 1, 31).getValues()[0];
    const bookingHrs = Number(row[8]);
    const conformHrs = Number(row[9]);
    const assistHrs = Number(row[10]);
    const masteringHrs = Number(row[11]);
    const otherHrs = Number(row[12]);
    const totalHrs = Number(row[13]);
    const totalAmount = Number(row[16]);
    const gstAmount = Number(row[17]);

    // Assertions
    if (bookingHrs !== 4.0) throw new Error(`Booking hrs mismatch: Expected 4.0, got ${bookingHrs}`);
    if (conformHrs !== 2.0) throw new Error(`Conform hrs mismatch: Expected 2.0, got ${conformHrs}`);
    if (assistHrs !== 3.0) throw new Error(`Assist hrs mismatch: Expected 3.0, got ${assistHrs}`);
    if (masteringHrs !== 1.5) throw new Error(`Mastering hrs mismatch: Expected 1.5, got ${masteringHrs}`);
    if (otherHrs !== 0.5) throw new Error(`Other hrs mismatch: Expected 0.5, got ${otherHrs}`);
    if (totalHrs !== 11.0) throw new Error(`Total hrs mismatch: Expected 11.0, got ${totalHrs}`);
    if (totalAmount !== 66000) throw new Error(`Total Amount mismatch: Expected 66000 (11*6000), got ${totalAmount}`);
    if (gstAmount !== 77880) throw new Error(`GST Amount mismatch: Expected 77880 (66000*1.18), got ${gstAmount}`);

    logs.push('SUCCESS: All Tagged 2-Page Logging & Billing Ledger aggregations verified 100% on the fresh spreadsheet!');
    logs.push('--- VERIFICATION SUITE PASSED CLEANLY ---');

    return {
      success: true,
      pass: true,
      spreadsheetId: SPREADSHEET_ID,
      testProjectCode: testCode,
      verifiedTotals: {
        bookingHrs: bookingHrs,
        conformHrs: conformHrs,
        assistHrs: assistHrs,
        masteringHrs: masteringHrs,
        otherHrs: otherHrs,
        totalHrs: totalHrs,
        totalAmount: totalAmount,
        gstAmount: gstAmount
      },
      logs: logs
    };
  } catch(err) {
    logs.push(`FAILED: ${err.message}`);
    return { success: false, pass: false, error: err.message, logs: logs };
  }
}

// Helpers
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch(e) {
      Logger.log('Could not open spreadsheet by ID (' + SPREADSHEET_ID + '): ' + e.toString());
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function findRowByProjectCode(sheet, projectCode) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === projectCode.toString().trim()) {
      return i + 1; // 1-indexed line number
    }
  }
  return -1;
}

function findProjectMetadata(queryCode) {
  if (!queryCode) return null;
  const target = String(queryCode).trim().toLowerCase();
  
  // 1. Search Project_Billing_Ledger master tab
  const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
  const ledgerData = ledgerSheet.getDataRange().getValues();
  for (let i = 1; i < ledgerData.length; i++) {
    const code = String(ledgerData[i][0] || '').trim();
    const name = String(ledgerData[i][3] || '').trim();
    const client = String(ledgerData[i][4] || '').trim();
    if (code && (code.toLowerCase() === target || (name && name.toLowerCase() === target) || (client && client.toLowerCase() === target))) {
      return { code: code, name: name || code, client: client };
    }
  }

  // 2. Search Projects tab
  const projSheet = getOrCreateSheet('Projects');
  const projData = projSheet.getDataRange().getValues();
  for (let i = 1; i < projData.length; i++) {
    const code = String(projData[i][0] || '').trim();
    const name = String(projData[i][2] || '').trim();
    const client = String(projData[i][3] || '').trim();
    if (code && (code.toLowerCase() === target || (name && name.toLowerCase() === target) || (client && client.toLowerCase() === target))) {
      return { code: code, name: name || code, client: client };
    }
  }

  return null;
}

/**
 * Appends clock-in / clock-out attendance records to Shift_Logs
 */
function handleAddShiftLog(data) {
  ensureSheetHeaders();
  const shiftSheet = getOrCreateSheet('Shift_Logs');
  const logId = data.id || Utilities.getUuid();
  const now = new Date();
  const staffId = data.userId || data.staffId || 'Unknown';
  const staffName = data.userName || data.staffName || 'Staff';
  const clockIn = data.clockIn || now;
  const clockOut = data.clockOut || '';
  const duration = data.durationMinutes ? Number(data.durationMinutes) / 60 : (data.hours || 0);
  const dateStr = data.date || now.toISOString().slice(0, 10);
  const status = data.status || (clockOut ? 'Completed Shift' : 'Clocked In');

  shiftSheet.appendRow([
    logId,
    now,
    staffId,
    staffName,
    clockIn,
    clockOut,
    duration,
    dateStr,
    status
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: `Shift logged for ${staffName}` };
}

/**
 * Appends leave applications to Leave_Requests
 */
function handleAddLeaveRequest(data) {
  ensureSheetHeaders();
  const leaveSheet = getOrCreateSheet('Leave_Requests');
  const reqId = data.id || Utilities.getUuid();
  const now = new Date();
  const staffId = data.userId || 'Unknown';
  const staffName = data.userName || data.staffName || 'Staff';

  leaveSheet.appendRow([
    reqId,
    now,
    staffId,
    staffName,
    data.startDate || '',
    data.endDate || '',
    data.reason || '',
    data.status || 'Pending'
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: `Leave request logged for ${staffName}` };
}

/**
 * Appends IT tickets to IT_Task_Logs
 */
function handleAddITTask(data) {
  ensureSheetHeaders();
  const itSheet = getOrCreateSheet('IT_Task_Logs');
  const ticketId = data.id || Utilities.getUuid();
  const now = new Date();

  itSheet.appendRow([
    ticketId,
    now,
    data.title || 'IT Task',
    data.category || 'General',
    data.assignedTo || 'IT Admin',
    data.priority || 'Normal',
    data.status || 'Open',
    data.notes || ''
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: `IT task logged: ${data.title}` };
}

/**
 * Appends notes to Team_Notepad_Logs
 */
function handleAddNotepad(data) {
  // Notepad is maintained live in-app (Firestore)
  return { success: true, message: 'Notepad maintained in-app' };
}

/**
 * Adds or updates a client profile in Client_CRM
 */
function handleAddClient(data) {
  ensureSheetHeaders();
  const crmSheet = getOrCreateSheet('Client_CRM');
  const name = String(data.name || data.clientName || '').trim();
  if (!name) return { success: false, message: 'Client name required' };

  const rows = crmSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toLowerCase() === name.toLowerCase()) {
      crmSheet.getRange(i + 1, 2, 1, 5).setValues([[
        data.email || rows[i][1],
        data.phone || rows[i][2],
        data.gstin || rows[i][3],
        data.pan || rows[i][4],
        data.address || rows[i][5]
      ]]);
      SpreadsheetApp.flush();
      return { success: true, message: `Client ${name} updated in CRM` };
    }
  }

  crmSheet.appendRow([
    name,
    data.email || '',
    data.phone || '',
    data.gstin || '',
    data.pan || '',
    data.address || ''
  ]);
  SpreadsheetApp.flush();
  return { success: true, message: `Client ${name} added to CRM` };
}

/**
 * ☀️ Daily Morning Bookings Email Digest Bot
 * Queries today's scheduled bookings from Atomic_Task_Logs,
 * uses smart chronological & room-overlap filtering to eliminate removed/stale bookings,
 * resolves client names, auto-installs 7:30 AM IST daily trigger,
 * and sends an executive morning briefing to the team.
 */
function sendMorningBookingsDailyEmail(options) {
  options = options || {};
  const tz = 'Asia/Kolkata';
  const now = new Date();
  const todayStr = options.targetDate || Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const displayDate = Utilities.formatDate(now, tz, 'dd MMMM yyyy');

  // Auto-install daily 7:30 AM IST trigger if not already registered
  try {
    const existing = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'sendMorningBookingsDailyEmail');
    if (!existing) {
      ScriptApp.newTrigger('sendMorningBookingsDailyEmail')
        .timeBased()
        .everyDays(1)
        .atHour(7)
        .nearMinute(30)
        .create();
      Logger.log('✅ Auto-installed 7:30 AM IST daily trigger.');
    }
  } catch(e) {
    Logger.log('Trigger auto-check note: ' + e.message);
  }

  const defaultRecipients = [
    'samiran@studiotunnel.com',
    'yash@studiotunnel.com',
    'art@studiotunnel.com',
    'manoj@studiotunnel.com',
    'tamash@studiotunnel.com',
    'golu@studiotunnel.com',
    'contact@studiotunnel.com',
    'ops@studiotunnel.com',
    'sujithnair991@gmail.com',
    'Dalviayush10@gmail.com',
    'arjuns825@gmail.com',
    'golu.tunnel@gmail.com',
    'aadikamble11@gmail.com',
    'prakashjai.tunnel@gmail.com',
    'natasha.cineloom@gmail.com'
  ];

  let recipients = defaultRecipients;
  if (options.recipients) {
    recipients = Array.isArray(options.recipients) 
      ? options.recipients 
      : String(options.recipients).split(',').map(s => s.trim());
  }

  const ss = getSpreadsheet();
  const atomicSheet = ss.getSheetByName('Atomic_Task_Logs');
  if (!atomicSheet) {
    return { success: false, message: 'Atomic_Task_Logs sheet not found' };
  }

  const rows = atomicSheet.getDataRange().getValues();
  const rawCandidates = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const taskType = String(row[4] || '').trim(); // Col E
    let rowDate = '';
    if (row[6] instanceof Date) {
      rowDate = Utilities.formatDate(row[6], tz, 'yyyy-MM-dd');
    } else if (row[6]) {
      rowDate = String(row[6]).trim().split('T')[0];
    }

    if (taskType.toLowerCase() === 'booking' && rowDate === todayStr) {
      const taskStatus = String(row[12] || '').trim().toLowerCase();
      // Skip explicitly cancelled or deleted tasks
      if (taskStatus.includes('cancel') || taskStatus.includes('delete')) {
        continue;
      }

      const notes = String(row[13] || '').trim();
      let studio = 'Studio 01';
      let startTime = '00:00';
      let endTime = '23:59';
      let rawTime = '';

      const studioMatch = notes.match(/Studio:\s*([^(]+)/i);
      if (studioMatch) studio = studioMatch[1].trim();
      const timeMatch = notes.match(/\(([^)]+)\)/);
      if (timeMatch) {
        rawTime = timeMatch[1].trim();
        const parts = rawTime.split('-').map(s => s.trim());
        if (parts.length === 2) {
          startTime = parts[0];
          endTime = parts[1];
        }
      }

      // Parse timestamp to numeric epoch for chronological sorting
      let epoch = i;
      const tsRaw = String(row[1] || '');
      if (row[1] instanceof Date) {
        epoch = row[1].getTime();
      } else {
        const parts = tsRaw.split(/[\/\s:]/);
        if (parts.length >= 6) {
          epoch = new Date(parts[2], parts[1]-1, parts[0], parts[3], parts[4], parts[5]).getTime() || i;
        }
      }

      rawCandidates.push({
        rowIdx: i + 1,
        taskId: row[0],
        timestamp: tsRaw,
        epoch: epoch,
        projCode: String(row[2] || '').trim(),
        projName: String(row[3] || '').trim(),
        artist: String(row[5] || 'Unassigned').trim(),
        studio: studio,
        startTime: startTime,
        endTime: endTime,
        rawTime: rawTime,
        notes: notes
      });
    }
  }

  // Sort candidate rows newest-first (descending epoch)
  rawCandidates.sort((a, b) => b.epoch - a.epoch);

  function timeToMin(t) {
    if (!t) return 0;
    const parts = String(t).split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  // Smart Room-Slot & Project Conflict Resolution:
  // 1. If project was updated/moved later, skip older revisions of the same project.
  // 2. If a room time slot is already claimed by a newer confirmed session, skip older conflicting bookings.
  const confirmedBookings = [];
  const occupiedSlots = [];
  const seenProjects = new Set();

  for (const item of rawCandidates) {
    const projKey = item.projName.toLowerCase() || item.projCode.toLowerCase();
    if (seenProjects.has(projKey)) {
      continue; // Skip older revision of this project
    }

    const itemStart = timeToMin(item.startTime);
    const itemEnd = timeToMin(item.endTime);

    const hasConflict = occupiedSlots.some(slot => {
      if (slot.studio.toLowerCase() !== item.studio.toLowerCase()) return false;
      const slotStart = timeToMin(slot.start);
      const slotEnd = timeToMin(slot.end);
      return (itemStart < slotEnd && itemEnd > slotStart);
    });

    if (hasConflict) {
      continue; // Skip older booking that overlaps with a newer confirmed session
    }

    confirmedBookings.push(item);
    seenProjects.add(projKey);
    occupiedSlots.push({ studio: item.studio, start: item.startTime, end: item.endTime, proj: item.projName });
  }

  // Rotating quotes of the day
  const quotes = [
    'Creativity is intelligence having fun. — Albert Einstein',
    'Simplicity is the ultimate sophistication. — Leonardo da Vinci',
    'Design is not just what it looks like and feels like. Design is how it works. — Steve Jobs',
    'Quality is not an act, it is a habit. — Aristotle',
    'Colors, like features, follow the changes of the emotions. — Pablo Picasso',
    'The details are not the details. They make the design. — Charles Eames',
    'Every artist was first an amateur. — Ralph Waldo Emerson'
  ];
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const quoteOfTheDay = quotes[dayOfYear % quotes.length];

  // Group by artist (with preferred order: Yash, Sujith, Manoj, Samiran, others)
  const grouped = {};
  confirmedBookings.forEach(b => {
    let artistKey = b.artist;
    if (artistKey.toLowerCase().includes('yash')) artistKey = 'Yash';
    else if (artistKey.toLowerCase().includes('sujith')) artistKey = 'Sujith';
    else if (artistKey.toLowerCase().includes('manoj')) artistKey = 'Manoj';
    else if (artistKey.toLowerCase().includes('samiran')) artistKey = 'Samiran';

    if (!grouped[artistKey]) grouped[artistKey] = [];
    
    // Resolve Client / Production House
    let clientName = '—';
    const meta = findProjectMetadata(b.projCode || b.projName);
    if (meta && meta.client) {
      clientName = meta.client;
    }

    grouped[artistKey].push({
      project: b.projName || b.projCode,
      client: clientName,
      studio: b.studio,
      time: b.rawTime,
      startMin: timeToMin(b.startTime)
    });
  });

  // Sort each artist's sessions chronologically
  for (const artist in grouped) {
    grouped[artist].sort((a, b) => a.startMin - b.startMin);
  }

  // Construct Plain Text Body
  let textBody = `Good morning,\n\nHere are the bookings for the day (${displayDate}):\n\n`;
  if (Object.keys(grouped).length === 0) {
    textBody += `No active studio bookings scheduled for today.\n\n`;
  } else {
    for (const [artist, list] of Object.entries(grouped)) {
      textBody += `${artist}:\n`;
      list.forEach(item => {
        const timePart = item.time ? ` — ${item.time}` : '';
        const roomPart = item.studio ? ` (${item.studio})` : '';
        textBody += `• ${item.project} — ${item.client}${timePart}${roomPart}\n`;
      });
      textBody += `\n`;
    }
  }
  textBody += `"${quoteOfTheDay}"\n\n— SYNC - Studio Tunnel\n`;

  // Construct Branded Responsive HTML Body
  let artistHtmlBlocks = '';
  if (Object.keys(grouped).length === 0) {
    artistHtmlBlocks = `
      <div style="background: #1e293b; border-radius: 8px; padding: 20px; text-align: center; color: #94a3b8;">
        ☀️ No active studio bookings logged for today. Have a productive day ahead!
      </div>`;
  } else {
    for (const [artist, list] of Object.entries(grouped)) {
      let rowsHtml = '';
      list.forEach((item, idx) => {
        const bg = idx % 2 === 0 ? '#1e293b' : '#0f172a';
        rowsHtml += `
          <tr style="background-color: ${bg};">
            <td style="padding: 12px 16px; font-weight: 700; color: #f8fafc; font-size: 14px;">
              ${item.project}
            </td>
            <td style="padding: 12px 16px; color: #38bdf8; font-size: 13px;">
              ${item.client}
            </td>
            <td style="padding: 12px 16px; color: #fde047; font-weight: 600; font-size: 13px;">
              ${item.time || '—'}
            </td>
            <td style="padding: 12px 16px; color: #a78bfa; font-size: 12px;">
              ${item.studio}
            </td>
          </tr>`;
      });

      artistHtmlBlocks += `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 16px; font-weight: 800; color: #10b981; letter-spacing: 0.5px; text-transform: uppercase;">
              👤 ${artist}
            </span>
            <span style="margin-left: 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700;">
              ${list.length} ${list.length === 1 ? 'Booking' : 'Bookings'}
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
            <thead>
              <tr style="background-color: #334155; color: #cbd5e1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">
                <th style="padding: 8px 16px;">Project</th>
                <th style="padding: 8px 16px;">Production House / Client</th>
                <th style="padding: 8px 16px;">Time</th>
                <th style="padding: 8px 16px;">Room</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>`;
    }
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 680px; margin: 20px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 32px; border-bottom: 2px solid #3b82f6;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="margin: 0; color: #f8fafc; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                  STUDIO TUNNEL <span style="color: #38bdf8;">• SYNC</span>
                </h1>
                <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
                  Daily Schedule & Artist Briefing — <strong style="color: #e2e8f0;">${displayDate}</strong>
                </p>
              </div>
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px 32px;">
            <p style="margin-top: 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Good morning Team, here are the studio sessions and client bookings confirmed for today:
            </p>

            ${artistHtmlBlocks}

            <!-- Quote of the Day -->
            <div style="margin-top: 32px; padding: 18px 20px; background: rgba(59, 130, 246, 0.08); border-left: 4px solid #38bdf8; border-radius: 6px;">
              <p style="margin: 0; color: #93c5fd; font-size: 13px; font-style: italic; line-height: 1.5;">
                "${quoteOfTheDay}"
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 18px 32px; background: #0b0f17; border-top: 1px solid #1e293b; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 11px;">
              SYNC Operations Hub • Cineloom Postworks Pvt. Ltd. • <a href="https://sync.studiotunnel.com" style="color: #38bdf8; text-decoration: none;">sync.studiotunnel.com</a>
            </p>
          </div>

        </div>
      </body>
    </html>`;

  // Dispatch Email via Google Workspace
  const recipientStr = recipients.join(',');
  MailApp.sendEmail({
    to: recipientStr,
    subject: `☀️ Studio Bookings for Today — ${displayDate}`,
    body: textBody,
    htmlBody: htmlBody
  });

  Logger.log(`✅ Daily morning briefing email sent to: ${recipientStr}`);
  return {
    success: true,
    recipients: recipients,
    date: todayStr,
    bookingCount: confirmedBookings.length,
    message: `Morning briefing dispatched successfully to ${recipients.length} recipients for ${displayDate}!`
  };
}

/**
 * Installs or updates the daily morning time trigger (7:30 AM IST sharp)
 */
function setupDailyMorningTrigger() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendMorningBookingsDailyEmail') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('sendMorningBookingsDailyEmail')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(30)
    .create();

  Logger.log('✅ Daily Morning 7:30 AM IST Trigger configured successfully!');
  return { success: true, message: 'Automated 7:30 AM IST morning trigger installed successfully!' };
}

/**
 * Cancels/removes booking entries from Atomic_Task_Logs
 */
function handleCancelBooking(data) {
  const ss = getSpreadsheet();
  const atomicSheet = ss.getSheetByName('Atomic_Task_Logs');
  if (!atomicSheet) return { success: false, message: 'Sheet not found' };

  const targetId = String(data.id || '').trim();
  const targetProj = String(data.project || data.projectName || '').trim().toLowerCase();
  const targetDate = String(data.date || '').trim();

  const rows = atomicSheet.getDataRange().getValues();
  let cancelledCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const rowId = String(rows[i][0] || '').trim();
    const rowProj = String(rows[i][3] || '').trim().toLowerCase();
    let rowDate = '';
    if (rows[i][6] instanceof Date) {
      rowDate = Utilities.formatDate(rows[i][6], 'Asia/Kolkata', 'yyyy-MM-dd');
    } else if (rows[i][6]) {
      rowDate = String(rows[i][6]).trim().split('T')[0];
    }

    if ((targetId && rowId === targetId) || (targetProj && rowProj === targetProj && (!targetDate || rowDate === targetDate))) {
      atomicSheet.getRange(i + 1, 13).setValue('Cancelled / Deleted');
      cancelledCount++;
    }
  }

  SpreadsheetApp.flush();
  return { success: true, cancelledCount: cancelledCount, message: `Cancelled ${cancelledCount} booking log entries` };
}

/**
 * Sends a welcome email with onboarding and login instructions to a newly provisioned team member.
 */
function handleSendWelcomeEmail(data) {
  const recipient = (data && data.email) ? String(data.email).trim() : 'natasha.cineloom@gmail.com';
  const name = (data && data.name) ? String(data.name).trim() : 'Natasha Dodiya';
  const role = (data && data.role) ? String(data.role).trim() : 'Admin Executive';
  const userId = (data && data.userId) ? String(data.userId).trim() : 'u13';
  const username = (data && data.username) ? String(data.username).trim() : 'natasha';

  const subject = `Welcome to Cineloom Postworks & Studio Tunnel — ${role} Account Setup`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; margin-top: 24px; margin-bottom: 24px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); padding: 32px; text-align: center; border-bottom: 1px solid #312e81;">
            <div style="display: inline-block; padding: 8px 16px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 9999px; margin-bottom: 16px;">
              <span style="color: #a5b4fc; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">CINELOOM POSTWORKS × STUDIO TUNNEL</span>
            </div>
            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: 800;">Welcome to the Team, ${name}!</h1>
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">Your <strong>${role}</strong> profile has been provisioned on the SYNC Operations & Finance Platform.</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px;">
            <div style="background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #38bdf8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Your Account Credentials</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; width: 140px;">Full Name:</td>
                  <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Role / Designation:</td>
                  <td style="padding: 6px 0; color: #34d399; font-weight: 600;">${role} (Office Admin)</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">Primary Email:</td>
                  <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${recipient}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">User ID / Login:</td>
                  <td style="padding: 6px 0; color: #fde047; font-weight: 700; font-family: monospace;">${username} <span style="color: #64748b; font-weight: normal;">(or ${recipient})</span></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8;">System ID:</td>
                  <td style="padding: 6px 0; color: #a78bfa; font-family: monospace;">${userId}</td>
                </tr>
              </table>
            </div>

            <!-- Login Instructions -->
            <div style="margin-bottom: 28px;">
              <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 12px 0;">How to Set Up Your Password & Log In</h2>
              <ol style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                <li>Open the SYNC Operations Hub at: <br/><a href="https://sync.studiotunnel.com" style="color: #38bdf8; font-weight: 700; text-decoration: none;">https://sync.studiotunnel.com</a></li>
                <li>On the login screen, click <strong>"First time? Click here to set up password"</strong>.</li>
                <li>Enter your registered email (<code>${recipient}</code>) or User ID (<code>${username}</code>).</li>
                <li>Choose a secure password and click <strong>"Create Account & Sign In"</strong>.</li>
                <li>You're in! You will have immediate access to the Executive Dashboard, Studio Bookings, Attendance, Project Tracker, and Operations Hub.</li>
              </ol>
            </div>

            <!-- Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://sync.studiotunnel.com" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                Open SYNC Portal →
              </a>
            </div>

            <!-- Access Privileges -->
            <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px 0; color: #34d399; font-size: 13px; text-transform: uppercase;">Your Administrative Scope</h3>
              <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                As Admin Executive, you have full administrative oversight for studio booking schedules, staff leaves and shifts, client project tracking, delivery pipelines, daily morning briefings, and operational communication.
              </p>
            </div>

            <!-- Help -->
            <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
              If you have any questions or need technical support, reach out to Samiran Sonowal or the Tech Dev team at <a href="mailto:samiran@studiotunnel.com" style="color: #38bdf8;">samiran@studiotunnel.com</a>.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 18px 32px; background: #0b0f17; border-top: 1px solid #1e293b; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 11px;">
              SYNC Operations Hub • Cineloom Postworks Pvt. Ltd. • Studio Tunnel
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textBody = `Welcome to Cineloom Postworks & Studio Tunnel, ${name}!\n\n`
    + `Your ${role} account has been provisioned on the SYNC Operations & Finance Platform.\n\n`
    + `Login Details:\n`
    + `• Portal: https://sync.studiotunnel.com\n`
    + `• Email: ${recipient}\n`
    + `• User ID: ${username} (or ${userId})\n`
    + `• Role: ${role}\n\n`
    + `How to Log In for the First Time:\n`
    + `1. Go to https://sync.studiotunnel.com\n`
    + `2. Click "First time? Click here to set up password"\n`
    + `3. Enter your email (${recipient}) or User ID (${username})\n`
    + `4. Set your password and click "Create Account & Sign In"\n\n`
    + `If you need any assistance, please contact Samiran Sonowal.\n\n`
    + `— Cineloom Postworks & Studio Tunnel Management`;

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody
  });

  Logger.log(`✅ Welcome email dispatched to: ${recipient}`);
  return {
    success: true,
    recipient: recipient,
    message: `Welcome email successfully dispatched to ${recipient}`
  };
}


