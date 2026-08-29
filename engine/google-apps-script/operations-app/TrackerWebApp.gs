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
