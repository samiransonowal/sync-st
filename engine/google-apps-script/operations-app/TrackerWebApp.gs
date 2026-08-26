/**
 * Studio Operations Backend (SYNC API)
 * Backend for logging Project Tracker atomic tasks, PIN Auth, 
 * Day-to-Day SYNC Atomic Logs, Accounts Master Billing Ledger, Tagged Data Registries, and Self-Test Suite.
 */

// Fresh Master Spreadsheet ID provided by Line Producer / Studio Management
let SPREADSHEET_ID = '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg';

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('TrackerUI')
    .setTitle('Studio Operations - SYNC')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * REST API Endpoint for SYNC App & External Integrations
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data || {};
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
        result = handleAddProject(data);
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
      case 'verifyPin':
        result = verifyUserPin(data.userId, data.pin);
        break;
      case 'runSelfTest':
        result = runVerificationSuite();
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

  // 4. Submissions (Work Submissions)
  const subSheet = ss.insertSheet('Submissions');
  const subHeaders = ['Submission ID (UUID)', 'Timestamp', 'Project Code ID', 'User Name', 'Work Link / Drive URL', 'Notes / Scope', 'Approval Status'];
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
        click: clickUrl || 'https://studiotunnel-sandbox-821.web.app',
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
  
  // Page 1: Atomic_Task_Logs (Day-to-Day SYNC Chronological Logs)
  const atomicSheet = getOrCreateSheet('Atomic_Task_Logs');
  if (atomicSheet.getLastRow() === 0) {
    const headers = [
      'Task ID (UUID)',
      'Timestamp',
      'Project Code ID',
      'Project Name',
      'Task Type',
      'Assigned Artist / Staff',
      'Task Date',
      'Actual Hours',
      'Task Closure Status',
      'Notes / Scope'
    ];
    atomicSheet.appendRow(headers);
    atomicSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1E1E1E').setFontColor('#FFFFFF');
    atomicSheet.setFrozenRows(1);
  }

  // Page 2: Project_Billing_Ledger (Accounts Master Format)
  const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
  if (ledgerSheet.getLastRow() === 0) {
    const headers = [
      'Project Code ID',
      'Invoice Number',
      'Invoice Date',
      'Project Name',
      'Company / Client',
      'Director',
      'Colorist / Main Artist',
      'Billing Type',
      'Booking Hrs',
      'Conform Hrs',
      'Assist Hrs',
      'Mastering Hrs',
      'Other Hrs',
      'Total Billable Hrs',
      'Per Hr Rate (INR)',
      'Discount (INR)',
      'Total Amount (INR)',
      'GST Bill Amount (INR)',
      'POC Name',
      'Email ID',
      'Phone No.',
      'GST No.',
      'PAN No.',
      'Billing Address',
      'Notes / Scope',
      'PO No.',
      'Bill Status',
      'Payment Status',
      'Amount Pending (INR)',
      'Due Date',
      'TDS @10%',
      'Last Activity Timestamp'
    ];
    ledgerSheet.appendRow(headers);
    ledgerSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1B263B').setFontColor('#FFFFFF');
    ledgerSheet.setFrozenRows(1);
  }

  // Projects Sheet
  const projSheet = getOrCreateSheet('Projects');
  if (projSheet.getLastRow() === 0) {
    projSheet.appendRow(['Project Code ID', 'Created At', 'Project Name', 'Client', 'Director', 'Billing Type', 'Hourly / Fixed Rate', 'Status']);
    projSheet.setFrozenRows(1);
  }

  // Client_CRM Sheet
  const crmSheet = getOrCreateSheet('Client_CRM');
  if (crmSheet.getLastRow() === 0) {
    const crmHeaders = ['[CRM-01] Client Name', '[CRM-02] Corporate Email', '[CRM-03] Corporate Phone', '[CRM-04] GSTIN', '[CRM-05] PAN', '[CRM-06] Billing Address'];
    crmSheet.appendRow(crmHeaders);
    crmSheet.getRange(1, 1, 1, crmHeaders.length).setFontWeight('bold').setBackground('#8E44AD').setFontColor('#FFFFFF');
    crmSheet.setFrozenRows(1);
  }
}

/**
 * Handles adding a new project and initializing its entry in the Project_Billing_Ledger
 */
function handleAddProject(data) {
  ensureSheetHeaders();
  const projSheet = getOrCreateSheet('Projects');
  const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
  
  const projectCode = data.projectCode || ('PJ-' + new Date().getTime());
  const now = new Date();
  
  // 1. Append to Projects master
  projSheet.appendRow([
    projectCode,
    now,
    data.name || 'Untitled Project',
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
      data.name || '',          // Col D: [BIL-04] Project Name
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
  }

  return { success: true, projectId: projectCode, message: `Project ${projectCode} created and initialized in Billing Ledger!` };
}

/**
 * Main Task Logging & Closure Handler: Appends to Page 1 (Atomic_Task_Logs) and updates Page 2 (Project_Billing_Ledger)
 */
function processTaskEntry(data) {
  ensureSheetHeaders();
  const atomicSheet = getOrCreateSheet('Atomic_Task_Logs');
  const ledgerSheet = getOrCreateSheet('Project_Billing_Ledger');
  
  const taskId = Utilities.getUuid();
  const now = new Date();
  const projectCode = data.projectCode || 'PJ-GENERAL';
  const taskType = data.taskType || 'Booking';
  const actualHrs = Number(data.actualHrs || 0);
  const taskStatus = data.isClosed ? 'Closed & Completed' : (data.taskStatus || 'Logged');

  // Lookup project name if omitted
  let projectName = data.projectName || '';
  if (!projectName) {
    const projRow = findProjectMetadata(projectCode);
    projectName = projRow ? projRow.name : projectCode;
  }

  // 1. PAGE 1: Append to Atomic_Task_Logs
  atomicSheet.appendRow([
    taskId,           // [LOG-01] task_id
    now,              // [LOG-02] timestamp
    projectCode,      // [LOG-03] project_code_id
    projectName,      // [LOG-04] project_name
    taskType,         // [LOG-05] task_type
    data.assignedArtist || 'Unassigned', // [LOG-06] assigned_artist
    data.date || now, // [LOG-07] task_date
    actualHrs,        // [LOG-08] actual_hrs
    taskStatus,       // [LOG-09] task_closure_status
    data.notes || ''  // [LOG-10] notes_scope
  ]);

  // 2. PAGE 2: Update Project_Billing_Ledger rollup
  let ledgerRowIndex = findRowByProjectCode(ledgerSheet, projectCode);
  
  // Auto-create ledger entry if missing
  if (ledgerRowIndex === -1) {
    handleAddProject({ projectCode: projectCode, name: projectName });
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
    ledgerSheet.getRange(ledgerRowIndex, 31).setValue(now);          // Col AE: Last Activity [BIL-31]

    if (data.isClosed) {
      ledgerSheet.getRange(ledgerRowIndex, 27).setValue('Ready for Invoice'); // Col AA: Bill Status [BIL-27]
    }

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
}

// Alias for REST / Legacy calls
function handleAddTask(data) {
  return processTaskEntry(data);
}

function handleGetProjects() {
  ensureSheetHeaders();
  const sheet = getOrCreateSheet('Projects');
  const rows = sheet.getDataRange().getValues();
  const projects = [];
  const projectStrings = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0] !== 'Project Code ID') {
      const pCode = rows[i][0];
      const pName = rows[i][2] || pCode;
      projects.push({
        id: pCode,
        created: rows[i][1],
        name: pName,
        client: rows[i][3],
        director: rows[i][4],
        billingType: rows[i][5],
        rate: rows[i][6],
        status: rows[i][7]
      });
      projectStrings.push(`${pCode} | ${pName}`);
    }
  }

  // Direct array return for client UI dropdown compatibility
  return projectStrings;
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
  const sheet = getOrCreateSheet('Submissions');
  const subId = Utilities.getUuid();
  sheet.appendRow([
    subId,
    new Date(),
    data.projectId || '',
    data.userName || '',
    data.link || '',
    data.notes || '',
    'Pending'
  ]);
  return { success: true, submissionId: subId, message: 'Submission logged!' };
}

function getStaffRegistry() {
  return [
    { id: 'usr_1', name: 'Samiran Sonowal' },
    { id: 'usr_2', name: 'Yash Soni' },
    { id: 'usr_3', name: 'Sujith Vijayan' },
    { id: 'usr_4', name: 'Aayush' },
    { id: 'usr_5', name: 'Golu' },
    { id: 'usr_6', name: 'Line Producer' }
  ];
}

function verifyUserPin(userId, pin) {
  if (pin === '0000' || pin === '1234') {
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
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch(e) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
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

function findProjectMetadata(projectCode) {
  const sheet = getOrCreateSheet('Projects');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === projectCode.toString().trim()) {
      return { code: data[i][0], name: data[i][2], client: data[i][3], director: data[i][4] };
    }
  }
  return null;
}
