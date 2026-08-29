import { doc, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';

export const ROLES = {
  SR_COLORIST_CEO: 'Sr. Colorist / CEO',
  COLORIST_COO: 'Colorist / COO',
  SR_COLORIST: 'Sr. Colorist',
  COLORIST: 'Colorist',
  LINE_PRODUCER: 'Line Producer',
  ASSISTANT_COLORIST: 'Assistant Colorist',
  CONFORMIST_FLOOR_MGR: 'Conformist / Floor Manager',
  CONFORMIST: 'Conformist',

  // Aliases for backwards compatibility
  LEAD_COLORIST: 'Sr. Colorist',
  COLORIST_MGMT: 'Colorist / COO',
  COLORIST_ASSIST_HOD: 'Colorist',
  PRODUCTION_DEPT: 'Line Producer',
  ASSIST: 'Assistant Colorist',
  IT_ADMIN: 'IT Admin'
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_TRACKER: 'view_tracker',
  VIEW_PROJECTS: 'view_projects',
  VIEW_ATTENDANCE: 'view_attendance',
  VIEW_LONG_FORMAT: 'view_long_format',
  APPROVE_LEAVES: 'approve_leaves',
  REVIEW_SUBMISSIONS: 'review_submissions',
  EDIT_BOOKINGS: 'edit_bookings',
  MANAGE_IT: 'manage_it',
  VIEW_RECYCLE_BIN: 'view_recycle_bin'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SR_COLORIST_CEO]: {
    [PERMISSIONS.VIEW_DASHBOARD]: true,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: true,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: true,
    [PERMISSIONS.EDIT_BOOKINGS]: true,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: true
  },
  [ROLES.COLORIST_COO]: {
    [PERMISSIONS.VIEW_DASHBOARD]: true,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: true,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: true,
    [PERMISSIONS.EDIT_BOOKINGS]: true,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: true
  },
  [ROLES.LINE_PRODUCER]: {
    [PERMISSIONS.VIEW_DASHBOARD]: true,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: true,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: true,
    [PERMISSIONS.EDIT_BOOKINGS]: true,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: true
  },
  [ROLES.SR_COLORIST]: {
    [PERMISSIONS.VIEW_DASHBOARD]: true,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: false,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: true,
    [PERMISSIONS.EDIT_BOOKINGS]: true,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: false
  },
  [ROLES.COLORIST]: {
    [PERMISSIONS.VIEW_DASHBOARD]: true,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: false,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: true,
    [PERMISSIONS.EDIT_BOOKINGS]: true,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: false
  },
  [ROLES.CONFORMIST_FLOOR_MGR]: {
    [PERMISSIONS.VIEW_DASHBOARD]: true,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: false,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: false,
    [PERMISSIONS.EDIT_BOOKINGS]: true,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: false
  },
  [ROLES.CONFORMIST]: {
    [PERMISSIONS.VIEW_DASHBOARD]: false,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: false,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: false,
    [PERMISSIONS.EDIT_BOOKINGS]: false,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: false
  },
  [ROLES.ASSISTANT_COLORIST]: {
    [PERMISSIONS.VIEW_DASHBOARD]: false,
    [PERMISSIONS.VIEW_TRACKER]: true,
    [PERMISSIONS.VIEW_PROJECTS]: true,
    [PERMISSIONS.VIEW_ATTENDANCE]: true,
    [PERMISSIONS.VIEW_LONG_FORMAT]: true,
    [PERMISSIONS.APPROVE_LEAVES]: false,
    [PERMISSIONS.REVIEW_SUBMISSIONS]: false,
    [PERMISSIONS.EDIT_BOOKINGS]: false,
    [PERMISSIONS.VIEW_RECYCLE_BIN]: false
  }
};

export const USERS = [
  { 
    id: 'u1', 
    name: 'Yash Soni', 
    role: ROLES.SR_COLORIST_CEO, 
    studio: 'Studio 01', 
    isAdmin: true,
    emails: ['yash@studiotunnel.com', 'yashsoni@gmail.com']
  },
  { 
    id: 'u3', 
    name: 'Samiran Sonowal', 
    role: ROLES.COLORIST_COO, 
    studio: 'Studio 03', 
    isAdmin: true,
    emails: ['samiran@studiotunnel.com', 'samiran26sonowal@gmail.com']
  },
  { 
    id: 'u2', 
    name: 'Sujith Vijayan', 
    role: ROLES.SR_COLORIST, 
    studio: 'Studio 02', 
    isAdmin: false,
    emails: ['sujith@studiotunnel.com']
  },
  { 
    id: 'u4', 
    name: 'Manoj Sahu', 
    role: ROLES.COLORIST, 
    studio: 'Studio 03', 
    isAdmin: false,
    emails: ['manoj@studiotunnel.com', 'contactmanojsahu@gmail.com']
  },
  { 
    id: 'u11', 
    name: 'Altamash Ansari', 
    role: ROLES.LINE_PRODUCER, 
    studio: 'Office', 
    isAdmin: true, 
    replacesUserId: 'u0_a',
    emails: ['tamash@studiotunnel.com', 'tamashansari4@gmail.com']
  },
  { 
    id: 'u0_b', 
    name: 'Prakash Jaiswal', 
    role: ROLES.LINE_PRODUCER, 
    studio: 'Office', 
    isAdmin: true,
    emails: ['prakash@studiotunnel.com', 'prakashjai.tunnel@gmail.com']
  },
  { 
    id: 'u10', 
    name: 'Arjun Kohli', 
    role: ROLES.ASSISTANT_COLORIST, 
    studio: 'Assist Studio', 
    isAdmin: false,
    emails: ['arjun@studiotunnel.com', 'arjunkohli@gmail.com']
  },
  { 
    id: 'u6', 
    name: 'Ayush Dalvi', 
    role: ROLES.ASSISTANT_COLORIST, 
    studio: 'Assist Studio', 
    isAdmin: false,
    emails: ['ayush@studiotunnel.com', 'ayushdalvi@gmail.com']
  },
  { 
    id: 'u9', 
    name: 'Vijay Nool', 
    role: ROLES.ASSISTANT_COLORIST, 
    studio: 'Assist Studio', 
    isAdmin: false,
    emails: ['vijay@studiotunnel.com', 'vijaynool@gmail.com']
  },
  { 
    id: 'u5', 
    name: 'Golu Saha', 
    role: ROLES.CONFORMIST_FLOOR_MGR, 
    studio: 'Data & Conform', 
    isAdmin: false,
    emails: ['golu@studiotunnel.com', 'golu.tunnel@gmail.com']
  },
  { 
    id: 'u12', 
    name: 'Aaditya Kamble', 
    role: ROLES.CONFORMIST, 
    studio: 'Data & Conform', 
    isAdmin: false,
    emails: ['aaditya@studiotunnel.com', 'aaditya.tunnel@gmail.com']
  },

  // Archived predecessors for legacy data & log continuity
  { id: 'u0_a', name: 'Vaibhav Sorte', role: ROLES.LINE_PRODUCER, studio: 'Office', isAdmin: true, isArchived: true, emails: [] },
  { id: 'u7', name: 'Atharva Patil', role: ROLES.ASSISTANT_COLORIST, studio: 'Assist Studio', isAdmin: false, isArchived: true, emails: [] },
  { id: 'u8', name: 'Akilan', role: ROLES.ASSISTANT_COLORIST, studio: 'Assist Studio', isAdmin: false, isArchived: true, emails: [] }
];

/**
 * Finds a roster employee by their authenticated Google / personal email address.
 */
export const findUserByEmail = (email) => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return USERS.find(u => !u.isArchived && u.emails?.some(e => e.toLowerCase() === normalized)) || null;
};


/**
 * Returns an array containing the user's own ID and any predecessor ID they replaced
 * to facilitate handover and continuity of task, submission, and leave history.
 */
export const getSelfAndPredecessorIds = (user) => {
  if (!user) return [];
  const ids = [user.id];
  if (user.replacesUserId) {
    ids.push(user.replacesUserId);
  }
  return ids;
};

/**
 * Checks if a user has a specific permission.
 * Grant is given if:
 * 1. User has individual isAdmin override
 * 2. User's role has the permission defined in ROLE_PERMISSIONS
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  // IT tasks are strictly reserved for admins / future IT Admin role
  if (permission === PERMISSIONS.MANAGE_IT) {
    return user.role === ROLES.IT_ADMIN || user.isAdmin === true;
  }
  if (user.isAdmin === true) return true;
  return ROLE_PERMISSIONS[user.role]?.[permission] === true;
};


/**
 * Maps a Sidebar / activeTab ID to a specific permission check.
 */
export const getTabPermission = (tabId) => {
  switch (tabId) {
    case 'dashboard': return PERMISSIONS.VIEW_DASHBOARD;
    case 'tracker': return PERMISSIONS.VIEW_TRACKER;
    case 'projects_view': return PERMISSIONS.VIEW_PROJECTS;
    case 'attendance': return PERMISSIONS.VIEW_ATTENDANCE;
    case 'long_format': return PERMISSIONS.VIEW_LONG_FORMAT;
    case 'it_tasks': return PERMISSIONS.MANAGE_IT;
    case 'recycle_bin': return PERMISSIONS.VIEW_RECYCLE_BIN;
    default: return null;
  }
};

/**
 * Returns the name of the user with the given ID, or 'Unassigned' if not found.
 */
export const getUserName = (userId) => {
  return USERS.find(u => u.id === userId)?.name || 'Unassigned';
};

/**
 * Checks if the user is clocked in based on the live presence status.
 */
export const isUserClockedIn = (userId, presence) => {
  return presence?.[userId]?.isClockedIn === true;
};

/**
 * Handles PIN-based login validation.
 */
export const handleLoginSubmitHelper = ({
  e,
  userProfiles,
  pendingUser,
  pinInput,
  setCurrentUserProfile,
  setActiveTab,
  setLoginStep,
  setPinInput,
  showToast
}) => {
  e.preventDefault();
  const profile = userProfiles[pendingUser.id];
  const correctPin = profile?.pin || '0000';
  if (pinInput === correctPin) {
    setCurrentUserProfile(pendingUser);
    const hasAdminAccess = hasPermission(pendingUser, PERMISSIONS.VIEW_DASHBOARD);
    setActiveTab(hasAdminAccess ? 'dashboard' : 'my_tasks');
    setLoginStep('select_user');
    setPinInput('');
  } else {
    showToast('Incorrect PIN', 'error');
    setPinInput('');
  }
};

/**
 * Encapsulates the Clock In / End Shift toggle behavior.
 */
export const toggleClockInHelper = async ({
  db,
  appId,
  user,
  currentUserProfile,
  shiftLogs,
  presence,
  showToast
}) => {
  if (!user || !currentUserProfile) return;
  const currentStatus = isUserClockedIn(currentUserProfile.id, presence);
  const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', 'live_status');
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  try {
    if (!currentStatus) {
      await setDoc(presenceRef, {
        [currentUserProfile.id]: { isClockedIn: true, clockInTime: now, clockOutTime: null, lastUpdated: now }
      }, { merge: true });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shift_logs'), {
        userId: currentUserProfile.id,
        userName: currentUserProfile.name,
        role: currentUserProfile.role,
        clockIn: now,
        clockOut: null,
        date: today,
        month: today.slice(0, 7),
        year: parseInt(today.slice(0, 4)),
      });
    } else {
      await setDoc(presenceRef, {
        [currentUserProfile.id]: { isClockedIn: false, clockOutTime: now, lastUpdated: now }
      }, { merge: true });
      const openLog = shiftLogs.find(s => s.userId === currentUserProfile.id && s.clockOut === null);
      if (openLog) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shift_logs', openLog.id), { clockOut: now });
      }
    }
    showToast(currentStatus ? 'Clocked OUT' : 'Clocked IN successfully');
  } catch (error) {
    console.error("Error toggling clock in:", error);
    showToast('Failed to update shift status', 'error');
  }
};
