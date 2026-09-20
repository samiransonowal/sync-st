/**
 * 🚀 Studio Tunnel — Automated Scheduled Bots & Payment Reminders
 * 
 * 1. Saturday Night Executive Summary Bot (Cron: Saturdays 10:00 PM IST)
 * 2. Monday Morning Bank Reconciliation & Overdue Collections Bot (Cron: Mondays 9:00 AM IST)
 * 3. Daily Staggered 30-Day Payment Reminders (Days 21, 23, 25, 28, 30)
 */

/**
 * Saturday Night Executive Summary Bot
 * Executed every Saturday at 10:00 PM IST
 */
function sendSaturdayNightExecutiveSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('Project_Billing_Ledger');
  const taskLogSheet = ss.getSheetByName('Atomic_Task_Logs');
  
  if (!ledgerSheet) {
    Logger.log('⚠️ Project_Billing_Ledger sheet not found');
    return;
  }
  
  const recipients = ['samiran@studiotunnel.com', 'yash@studiotunnel.com'];
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 1. Colorist Session & Billable Hours Summary
  const coloristSummary = {};
  if (taskLogSheet) {
    const taskData = taskLogSheet.getDataRange().getValues();
    for (let i = 1; i < taskData.length; i++) {
      const row = taskData[i];
      const taskDate = new Date(row[6]); // Col G
      const artistName = String(row[5] || 'Unassigned').trim(); // Col F
      const hours = parseFloat(row[7]) || 0; // Col H
      
      if (taskDate >= sevenDaysAgo && taskDate <= today) {
        if (!coloristSummary[artistName]) {
          coloristSummary[artistName] = { hours: 0, sessions: 0 };
        }
        coloristSummary[artistName].hours += hours;
        coloristSummary[artistName].sessions += 1;
      }
    }
  }
  
  // 2. Invoices Generated This Week & Flagged Issues
  const ledgerData = ledgerSheet.getDataRange().getValues();
  let weeklyInvoicesCount = 0;
  let weeklyInvoicedTotal = 0;
  const flaggedIssues = [];
  
  for (let i = 1; i < ledgerData.length; i++) {
    const row = ledgerData[i];
    const projectCode = String(row[0] || '').trim();
    const projectName = String(row[1] || '').trim();
    const billStatus = String(row[26] || '').trim(); // Col AA [BIL-27]
    const paymentStatus = String(row[27] || '').trim(); // Col AB [BIL-28]
    const netTotal = parseFloat(row[17]) || parseFloat(row[16]) || 0; // Col R [BIL-18] GST Bill Amount / Col Q [BIL-17]
    const invoiceDate = row[2] ? new Date(row[2]) : (row[29] ? new Date(row[29]) : null); // Col C [BIL-03] Invoice Date
    
    if (billStatus === 'Invoiced' && invoiceDate && invoiceDate >= sevenDaysAgo) {
      weeklyInvoicesCount++;
      weeklyInvoicedTotal += netTotal;
    }
    
    if (billStatus === 'Disputed' || (billStatus === 'Ready to Bill' && !row[19])) { // Missing GSTIN/Email
      flaggedIssues.push(`${projectCode} — ${projectName} (${billStatus === 'Disputed' ? 'Disputed' : 'Missing Client Details'})`);
    }
  }
  
  // Build Email Body
  let coloristHtml = '';
  for (const [artist, stats] of Object.entries(coloristSummary)) {
    coloristHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #2d3748;"><strong>${artist}</strong></td><td style="padding: 8px; border-bottom: 1px solid #2d3748;">${stats.hours.toFixed(1)} hrs</td><td style="padding: 8px; border-bottom: 1px solid #2d3748;">${stats.sessions} sessions</td></tr>`;
  }
  if (!coloristHtml) coloristHtml = '<tr><td colspan="3" style="padding: 8px; color: #a0aec0;">No task logs recorded this week.</td></tr>';
  
  let flaggedHtml = flaggedIssues.length > 0
    ? flaggedIssues.map(f => `<li style="color: #fc8181; margin-bottom: 4px;">${f}</li>`).join('')
    : '<li style="color: #68d391;">No operational concerns or disputes flagged.</li>';
    
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; padding: 24px; border-radius: 8px;">
      <h2 style="color: #10b981; margin-top: 0;">🚀 Studio Tunnel — Saturday Executive Weekly Summary</h2>
      <p style="color: #a0aec0;">Weekly Operations & Revenue Performance Report for week ending <strong>${today.toLocaleDateString('en-IN')}</strong>.</p>
      
      <h3 style="color: #6366f1; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">🎨 Colorist Billable Session Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #1a202c; text-align: left;">
            <th style="padding: 8px;">Colorist / Staff</th>
            <th style="padding: 8px;">Hours Worked</th>
            <th style="padding: 8px;">Sessions Logged</th>
          </tr>
        </thead>
        <tbody>${coloristHtml}</tbody>
      </table>
      
      <h3 style="color: #10b981; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">🧾 Weekly Invoicing Performance</h3>
      <div style="background-color: #1a202c; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0;">Total Invoices Dispatched: <strong>${weeklyInvoicesCount}</strong></p>
        <p style="margin: 0; font-size: 1.1em; color: #34d399;">Total Revenue Invoiced: <strong>₹${weeklyInvoicedTotal.toLocaleString('en-IN')}</strong></p>
      </div>
      
      <h3 style="color: #f59e0b; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">⚠️ Operational Concerns & Disputed Projects</h3>
      <ul style="padding-left: 20px;">${flaggedHtml}</ul>
      
      <p style="font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #2d3748; padding-top: 12px;">
        Automated Executive Report generated by Studio Tunnel Comptroller Engine.
      </p>
    </div>
  `;
  
  recipients.forEach(email => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: `📊 Studio Tunnel — Weekly Executive Summary (${today.toLocaleDateString('en-IN')})`,
        htmlBody: emailHtml
      });
      Logger.log(`✅ Saturday summary sent to ${email}`);
    } catch (e) {
      Logger.log(`❌ Failed to send email to ${email}: ${e.message}`);
    }
  });

  // Push notification via ntfy.sh
  sendNtfyNotification('studio-tunnel-samiran', '🚀 Saturday Executive Summary', `Weekly Operations & Revenue Report generated for week ending ${today.toLocaleDateString('en-IN')}.`, 'https://sync.studiotunnel.com');
  sendNtfyNotification('studio-tunnel-ops', '🚀 Saturday Executive Summary', `Weekly Operations Report published.`, 'https://sync.studiotunnel.com');
}

/**
 * Monday Morning Bank Reconciliation & Overdue Collections Bot
 * Executed every Monday at 9:00 AM IST
 */
function sendMondayMorningReconciliationAndOverdueReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('Project_Billing_Ledger');
  
  if (!ledgerSheet) return;
  
  const recipient = 'samiran@studiotunnel.com';
  const today = new Date();
  const ledgerData = ledgerSheet.getDataRange().getValues();
  
  const overdueItems = [];
  let totalOverdueAmount = 0;
  
  for (let i = 1; i < ledgerData.length; i++) {
    const row = ledgerData[i];
    const projectCode = String(row[0] || '').trim();
    const projectName = String(row[3] || projectCode); // Col D [BIL-04] Project Name
    const clientName = String(row[4] || 'Client');    // Col E [BIL-05] Company / Client
    const billStatus = String(row[26] || '').trim();  // Col AA [BIL-27]
    const paymentStatus = String(row[27] || '').trim();// Col AB [BIL-28]
    const netTotal = parseFloat(row[17]) || parseFloat(row[16]) || 0; // Col R [BIL-18] GST Amount / Col Q [BIL-17]
    const invoiceDate = row[2] ? new Date(row[2]) : (row[29] ? new Date(row[29]) : null); // Col C [BIL-03] Invoice Date
    
    if (billStatus === 'Invoiced' && paymentStatus !== 'Paid' && invoiceDate) {
      const daysElapsed = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysElapsed > 30) {
        overdueItems.push({ projectCode, projectName, clientName, netTotal, daysElapsed });
        totalOverdueAmount += netTotal;
      }
    }
  }

  
  let overdueTableRows = '';
  overdueItems.sort((a, b) => b.daysElapsed - a.daysElapsed);
  overdueItems.forEach(item => {
    overdueTableRows += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #2d3748;"><strong>${item.projectCode}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #2d3748;">${item.clientName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #2d3748;">₹${item.netTotal.toLocaleString('en-IN')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #2d3748; color: #f87171;"><strong>${item.daysElapsed} days overdue</strong></td>
      </tr>
    `;
  });
  
  if (!overdueTableRows) {
    overdueTableRows = '<tr><td colspan="4" style="padding: 8px; color: #34d399;">🎉 No overdue invoices! All payments are up to date.</td></tr>';
  }
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; padding: 24px; border-radius: 8px;">
      <h2 style="color: #3b82f6; margin-top: 0;">🏦 Studio Tunnel — Monday Reconciliation & Overdue Collections</h2>
      <p style="color: #a0aec0;">Good morning Samiran! Here is your weekly financial action checklist for <strong>${today.toLocaleDateString('en-IN')}</strong>.</p>
      
      <div style="background-color: #1e3a8a; border-left: 4px solid #60a5fa; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
        <h4 style="margin: 0 0 6px 0; color: #93c5fd;">⚡ Action Item 1: Weekend Bank Statement Reconciliation</h4>
        <p style="margin: 0; font-size: 0.95em; color: #e0f2fe;">Please check HDFC Bank credits received over the weekend and update Col AB (Payment Status → Paid) in the Master Ledger.</p>
      </div>
      
      <h3 style="color: #ef4444; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">🚨 Overdue Receivables (>30 Days Cycle)</h3>
      <p style="margin-bottom: 8px;">Total Overdue Amount: <strong style="color: #f87171; font-size: 1.1em;">₹${totalOverdueAmount.toLocaleString('en-IN')}</strong></p>
      <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #1a202c; text-align: left;">
            <th style="padding: 8px;">Project</th>
            <th style="padding: 8px;">Client</th>
            <th style="padding: 8px;">Amount Owed</th>
            <th style="padding: 8px;">Overdue Status</th>
          </tr>
        </thead>
        <tbody>${overdueTableRows}</tbody>
      </table>
      
      <h3 style="color: #f59e0b; border-bottom: 1px solid #2d3748; padding-bottom: 8px;">📞 Personal Executive Follow-up List</h3>
      <p style="color: #cbd5e1;">The clients above have exceeded the 30-day payment term. Recommended to place personal calls today.</p>
      
      <p style="font-size: 12px; color: #718096; margin-top: 32px; border-top: 1px solid #2d3748; padding-top: 12px;">
        Automated Monday Financial Report generated by Studio Tunnel Comptroller Engine.
      </p>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: `🏦 Studio Tunnel — Monday Bank Reconciliation & Overdue Report (${today.toLocaleDateString('en-IN')})`,
      htmlBody: emailHtml
    });
    Logger.log(`✅ Monday reconciliation report sent to ${recipient}`);

    // Push notification via ntfy.sh
    sendNtfyNotification('studio-tunnel-samiran', '🏦 Monday Bank Reconciliation & Overdue Report', `Weekly bank reconciliation checklist & ${overdueItems.length} overdue invoices flagged.`, 'https://sync.studiotunnel.com');
  } catch (e) {
    Logger.log(`❌ Failed to send Monday report: ${e.message}`);
  }
}

/**
 * Staggered 30-Day Payment Reminder Engine
 * Evaluates active invoiced projects daily
 */
function processDailyPaymentReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ledgerSheet = ss.getSheetByName('Project_Billing_Ledger');
  
  if (!ledgerSheet) return;
  
  const today = new Date();
  const ledgerData = ledgerSheet.getDataRange().getValues();
  const reminderDays = [21, 23, 25, 28, 30];
  
  for (let i = 1; i < ledgerData.length; i++) {
    const row = ledgerData[i];
    const projectCode = String(row[0] || '').trim();
    const projectName = String(row[1] || '').trim();
    const clientName = String(row[4] || '').trim();
    const billStatus = String(row[26] || '').trim(); // Col AA [BIL-27]
    const paymentStatus = String(row[27] || '').trim(); // Col AB [BIL-28]
    const clientEmail = String(row[19] || '').trim(); // Col T [BIL-20]
    const invoiceDate = row[2] ? new Date(row[2]) : (row[29] ? new Date(row[29]) : null); // Col C [BIL-03] Invoice Date
    
    if (billStatus === 'Invoiced' && paymentStatus !== 'Paid' && invoiceDate) {
      const daysElapsed = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (reminderDays.includes(daysElapsed)) {
        dispatchPaymentReminderNotice(projectCode, projectName, clientName, clientEmail, daysElapsed);
      }
    }
  }
}

/**
 * Helper to dispatch payment reminder notice (internal safety enforced)
 */
function dispatchPaymentReminderNotice(projectCode, projectName, clientName, clientEmail, daysElapsed) {
  // Safety rule: Always route to internal management / finance email
  const targetEmail = 'samiran@studiotunnel.com';
  
  let reminderTitle = `Day ${daysElapsed} Payment Reminder Notice`;
  if (daysElapsed === 21) reminderTitle = 'Friendly Upcoming Due Notice (9 Days Remaining)';
  if (daysElapsed === 23) reminderTitle = 'Courtesy Check-in (7 Days Remaining)';
  if (daysElapsed === 25) reminderTitle = 'Priority Payment Reminder (5 Days Remaining)';
  if (daysElapsed === 28) reminderTitle = 'Final Pre-Due Alert (2 Days Remaining)';
  if (daysElapsed === 30) reminderTitle = '🚨 Due Date Reached — Escalation Flag';
  
  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; padding: 20px; border-radius: 8px;">
      <h3 style="color: #f59e0b; margin-top: 0;">⏱️ ${reminderTitle}</h3>
      <p><strong>Project Code:</strong> ${projectCode}</p>
      <p><strong>Project Name:</strong> ${projectName}</p>
      <p><strong>Client:</strong> ${clientName} (${clientEmail})</p>
      <p><strong>Days Since Invoiced:</strong> ${daysElapsed} / 30 Days Cycle</p>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
        Note: Per Studio Tunnel safety policy, automated payment notices are queued for internal finance verification before dispatch.
      </p>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: targetEmail,
      subject: `⏱️ [Day ${daysElapsed}] Payment Reminder: ${projectCode} — ${clientName}`,
      htmlBody: bodyHtml
    });
    Logger.log(`✅ Day ${daysElapsed} reminder queued for ${projectCode}`);
  } catch (e) {
    Logger.log(`❌ Failed to queue reminder for ${projectCode}: ${e.message}`);
  }
}

/**
 * Programmatically install time-driven triggers for automated bots
 */
function setupSystemTriggers() {
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // 1. Saturday 10:00 PM IST
  ScriptApp.newTrigger('sendSaturdayNightExecutiveSummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(22)
    .create();
    
  // 2. Monday 9:00 AM IST
  ScriptApp.newTrigger('sendMondayMorningReconciliationAndOverdueReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
    
  // 3. Daily 9:00 AM IST for Staggered Payment Reminders
  ScriptApp.newTrigger('processDailyPaymentReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
    
  Logger.log('✅ Automated System Triggers installed successfully!');
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
