const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwUbgPn-eZx7XcV2ha37Ga__5IUim3oN58qg-jkYV51ZS49pyI5vhCeNTCxS4IokJD_/exec';

/**
 * Sends a request to the Google Apps Script Backend (SYNC API)
 */
async function sendToBackend(action, data) {
  try {
    const payload = {
      action: action,
      data: {
        spreadsheetId: '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg',
        ...data
      }
    };

    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || result.message || 'Unknown backend error');
    }
    return result;
  } catch (error) {
    console.error(`[SYNC API] Error calling ${action}:`, error);
    throw error;
  }
}

/**
 * Logs a new project / booking task to the Atomic_Task_Logs
 */
export async function logTaskToBackend(projectData) {
  // Format the data to match the expected payload in TrackerWebApp.gs
  const data = {
    spreadsheetId: '1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg',
    isNewProject: projectData.isNewProject !== undefined ? projectData.isNewProject : true,
    projectCode: projectData.projectCode || projectData.code || projectData.id || `PJ-${Date.now()}`,
    projectName: projectData.projectName || projectData.name || '',
    client: projectData.client || projectData.clientName || projectData.producer || 'General Client',
    hourlyRate: projectData.hourlyRate || projectData.rate || 5000,
    taskType: projectData.taskType || 'Booking',
    date: projectData.date || new Date().toISOString(),
    assignedArtist: projectData.assignedArtist || projectData.artist || 'Unassigned',
    actualHrs: projectData.actualHrs || projectData.bookingHrs || projectData.duration || projectData.scheduledHrs || 4.0,
    isClosed: !!projectData.isClosed,
    notes: projectData.notes || ''
  };

  return sendToBackend('addBooking', data);
}

/**
 * Fetches Client_CRM database from LOG BOOK_SYNC
 */
export async function getClientCrmFromBackend() {
  try {
    const res = await sendToBackend('getClients', {});
    return res.clients || [];
  } catch (err) {
    console.warn("[SYNC API] Could not fetch Client_CRM:", err);
    return [];
  }
}

/**
 * Fetches all registered projects from LOG BOOK_SYNC
 */
export async function getProjectsFromBackend() {
  try {
    const res = await sendToBackend('getProjects', {});
    return res.projects || [];
  } catch (err) {
    console.warn("[SYNC API] Could not fetch projects:", err);
    return [];
  }
}

/**
 * Fetches all atomic task logs from LOG BOOK_SYNC
 */
export async function getTasksFromBackend() {
  try {
    const res = await sendToBackend('getTasks', {});
    return res.tasks || [];
  } catch (err) {
    console.warn("[SYNC API] Could not fetch tasks:", err);
    return [];
  }
}

