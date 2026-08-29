import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, KanbanSquare, Users, CheckCircle2, AlertCircle,
  ChevronRight, ChevronLeft, ShieldAlert, FileCheck2, LogOut, UserCircle, Briefcase,
  Loader2, Clock, Plus, AlignLeft, UserCheck, UserX, Trash2, Calendar,
  Palmtree, Settings, Lock, UserCog, Play, Timer, FolderOpen, Activity, BarChart2, Edit, Camera,
  BookOpen, Menu, Archive, MessageSquare, Bell, BellDot, Send, Sparkles, RefreshCw, Undo2, FileText, ClipboardCopy, Link, List, Search, LayoutGrid, HardDrive, Film, Share2, Smile, Paperclip, Network, Eye, EyeOff, Copy,
  ShieldCheck, ExternalLink, MessageCircle, Smartphone
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { googleProvider } from './services/firebase';

// --- COMPONENTS ---
import TeamChat from './components/TeamChat';
import RecycleBin from './components/RecycleBin';
import SOPGuides from './components/SOPGuides';
import ITTasks from './components/ITTasks';
import StudioBookings from './components/StudioBookings';
import SyncBoard from './components/SyncBoard';
import StagingPopup from './components/StagingPopup';
import ProjectDirectory from './components/ProjectDirectory';
import { NtfyModal } from './components/NtfyModal';
import { sendNtfyNotification, sendDirectUserAlert, sendQcAlert, sendOpsAlert, getUserNtfyTopic, NTFY_TOPICS } from './services/ntfy';

// --- CONFIGURATION & CONSTANTS ---
import { USERS, findUserByEmail, findUserByIdentifier, resolveEmailForAuth, getUserName as getUserNameImported, isUserClockedIn as isUserClockedInImported, toggleClockInHelper, hasPermission, getTabPermission, ROLES, PERMISSIONS, getSelfAndPredecessorIds } from './components/users';



const WORKFLOW_STAGES = ['Conform', 'Assist', 'Grade', 'Delivery Sync'];
const STUDIO_ROOMS = ['Studio 01', 'Studio 02', 'Studio 03'];

import { APP_RELEASES } from './data/releases';
import { SUBMISSION_VERSIONS, WHATSAPP_TEMPLATES } from './data/whatsappTemplates';

// GOOGLE SHEETS SYNC URL
const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzWQ1Vo3BZJAy6tfRtyOZ2bpCO7Z6QntOs3CQCq523Rux0nQ37nGQywYyKtRTpiw9To/exec';

// --- DYNAMIC SANDBOX SWITCHER ---
const isSandboxEnv = typeof window !== 'undefined' && (
  window.location.hostname === 'sandbox-tunnel.web.app' || 
  window.location.hostname === 'localhost'
);

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = isSandboxEnv ? {
  apiKey: "AIzaSyCi2ushZYRp1iWSwWfS8KbSyhxMz0sJ0TM",
  authDomain: "sandbox-tunnel.firebaseapp.com",
  projectId: "sandbox-tunnel",
  storageBucket: "sandbox-tunnel.firebasestorage.app",
  messagingSenderId: "203252538450",
  appId: "1:203252538450:web:e6da657340ca315e0e538b",
  measurementId: "G-LRJVMKX61Z"
} : (
  typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
      apiKey: "AIzaSyAkkiYgBR8-eYWiyBfHR_n20O_WCF9gfK4",
      authDomain: "studio-tunnel.firebaseapp.com",
      projectId: "studio-tunnel",
      storageBucket: "studio-tunnel.firebasestorage.app",
      messagingSenderId: "20065203766",
      appId: "1:20065203766:web:1ae9688fc973f4bad9ca97",
      measurementId: "G-DK3HJJQ78L"
    }
);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = isSandboxEnv ? '1:203252538450:web:e6da657340ca315e0e538b' : (
  typeof __app_id !== 'undefined' ? __app_id : '1:20065203766:web:1ae9688fc973f4bad9ca97'
);

// --- HELPERS ---
const formatLocalDate = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateActiveMinutes = (startIso, endIso) => {
  if (!startIso) return 0;
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : new Date();
  const diffMs = Math.max(0, end - start);
  return Math.floor(diffMs / (1000 * 60));
};

// --- NOTIFICATION INTEGRATION (DISCORD DISCONNECTED) ---
const sendDiscordAlert = async () => {
  // Legacy Discord webhook removed
  return;
};

const formatTime = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const calculateDays = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  // Authentication State
  const [user, setUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // App Data State
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [presence, setPresence] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [messages, setMessages] = useState([]);
  const [notepads, setNotepads] = useState({});
  const [waTemplates, setWaTemplates] = useState([]);
  const [shiftLogs, setShiftLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]); // NEW: Submissions State
  const [longFormatLogs, setLongFormatLogs] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedBillingId, setExpandedBillingId] = useState(null);
  const [billingRates, setBillingRates] = useState({});
  const [bookingSearchQueries, setBookingSearchQueries] = useState({});
  const [showStagingPopup, setShowStagingPopup] = useState(isSandboxEnv);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [showSOPModal, setShowSOPModal] = useState(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(null);
  const [selectedLongFormatProject, setSelectedLongFormatProject] = useState(null);
  const [lfSubTab, setLfSubTab] = useState('overview'); // 'overview' | 'tracker'
  const [lfLogType, setLfLogType] = useState('xml_received');
  const [lfTypeFilter, setLfTypeFilter] = useState('all');
  const [lfEpFilter, setLfEpFilter] = useState('all');
  const [sheetSortCol, setSheetSortCol] = useState('date');
  const [sheetSortDir, setSheetSortDir] = useState('asc');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projectViewMode, setProjectViewMode] = useState('grid'); // 'grid' or 'sheet'
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
  const [expandedReleases, setExpandedReleases] = useState(new Set([APP_RELEASES[0].id]));
  const [releaseSearchQuery, setReleaseSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [armedDeleteId, setArmedDeleteId] = useState(null); // arm-then-confirm pattern
  const [selectedQcSubmission, setSelectedQcSubmission] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('first_cut');
  const [customTemplateMessage, setCustomTemplateMessage] = useState('');
  const [copiedSubmissionId, setCopiedSubmissionId] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState('all'); // 'all' | 'pending' | 'reviewed'
  const [preselectedProjectIdForSubmission, setPreselectedProjectIdForSubmission] = useState('');
  const [showNtfyModal, setShowNtfyModal] = useState(false);

  const toggleTaskExpansion = (taskId) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleReleaseExpansion = (rid) => {
    setExpandedReleases(prev => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });
  };


  const [unreadMentions, setUnreadMentions] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Modal Data States
  const [sopBreakdown, setSopBreakdown] = useState('');

  // Login & Authentication States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Clock & Greeting State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance View State
  const [attView, setAttView] = useState('today');
  const [attMonth, setAttMonth] = useState(new Date().toISOString().slice(0, 7));
  const [attYear, setAttYear] = useState(new Date().getFullYear());

  // --- 1. AUTHENTICATION & INITIALIZATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser && authUser.email) {
        const profile = findUserByEmail(authUser.email);
        if (profile) {
          setCurrentUserProfile(profile);
          const hasAdmin = hasPermission(profile, PERMISSIONS.VIEW_DASHBOARD);
          setActiveTab(prev => (!prev || prev === 'dashboard' || prev === 'my_tasks' ? (hasAdmin ? 'dashboard' : 'my_tasks') : prev));
        } else {
          setCurrentUserProfile(null);
        }
      } else {
        setCurrentUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);


  // --- 2. DATA SYNC ---
  useEffect(() => {
    if (!user) return;

    const collections = ['tasks', 'leaves', 'bookings', 'user_profiles', 'projects', 'messages', 'notepads', 'shift_logs', 'submissions', 'long_format_logs', 'wa_templates'];
    const unsubscribes = [];

    collections.forEach(collName => {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', collName));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (collName === 'projects') setProjects(data);
        if (collName === 'tasks') setTasks(data);
        if (collName === 'leaves') setLeaves(data);
        if (collName === 'bookings') setBookings(data);
        if (collName === 'submissions') setSubmissions(data);
        if (collName === 'long_format_logs') setLongFormatLogs(data);
        if (collName === 'wa_templates') setWaTemplates(data);
        if (collName === 'messages') {
          const sorted = data.sort((a, b) => (a.createdAt ? new Date(a.createdAt) : 0) - (b.createdAt ? new Date(b.createdAt) : 0));
          
          setMessages(prev => {
            const prevIds = new Set(prev.map(m => m.id));
            sorted.forEach(msg => {
              // Toast only for new personal mentions from others
              if (!prevIds.has(msg.id) && msg.senderId !== currentUserProfile?.id && msg.mentions?.includes(currentUserProfile?.id)) {
                setToast({ message: `@You were mentioned by ${msg.senderName}`, type: 'mention' });
                setTimeout(() => setToast(null), 5000);
              }
            });
            return sorted;
          });
        }
        if (collName === 'user_profiles') {
          const profilesMap = {};
          data.forEach(p => profilesMap[p.id] = p);
          setUserProfiles(profilesMap);
        }
        if (collName === 'notepads') {
          const nMap = {};
          data.forEach(n => { nMap[n.id] = n.content || ''; });
          setNotepads(nMap);
        }
        if (collName === 'shift_logs') {
          setShiftLogs(data.sort((a, b) => (b.clockIn || '').localeCompare(a.clockIn || '')));
        }
      }, (err) => console.error(`Error fetching ${collName}:`, err));
      unsubscribes.push(unsub);
    });

    const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', 'live_status');
    const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
      if (snapshot.exists()) setPresence(snapshot.data());
    });
    unsubscribes.push(unsubPresence);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, currentUserProfile?.id]);

  // --- AUTO TASK ID MIGRATION ---
  // Assigns 5-digit zero-padded T-##### IDs to any tasks missing them or using old short format.
  // Runs silently on data load. Safe to run multiple times (idempotent).
  useEffect(() => {
    if (!db || !user) return;
    if (tasks.length === 0) return;

    // Catch tasks with no ID, OR tasks using old short format (< 5 digits after T-)
    const needsMigration = tasks.filter(t => {
      if (!t.taskId) return true;
      const match = t.taskId.match(/^T-(\d+)$/);
      return !match || match[1].length < 5;
    });
    if (needsMigration.length === 0) return;

    const runMigration = async () => {
      // Sort by createdAt for chronological ordering
      const sorted = [...needsMigration].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });

      // Find highest existing 5-digit number (ignore old short-format IDs during election)
      const existingNums = tasks
        .map(t => {
          const match = t.taskId?.match(/^T-(\d{5,})$/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter(n => n !== null);
      let currentMax = existingNums.length > 0 ? Math.max(...existingNums) : 10000;

      for (const task of sorted) {
        currentMax++;
        try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), {
            taskId: `T-${String(currentMax).padStart(5, '0')}`
          });
        } catch (err) {
          console.warn(`Could not assign taskId to task ${task.id}:`, err);
        }
      }
    };

    runMigration();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, user, db]);

  // Calculate unread counts based on user's last read time
  useEffect(() => {
    if (!currentUserProfile) {
      setUnreadTotal(0);
      setUnreadMentions(0);
      return;
    }
    const profileData = userProfiles[currentUserProfile.id];
    const lastRead = profileData?.lastReadChat || '1970-01-01';

    const unread = messages.filter(m => 
      m.senderId !== currentUserProfile.id && 
      (m.createdAt || '') > lastRead
    );
    const mentions = unread.filter(m => m.mentions?.includes(currentUserProfile.id));

    setUnreadTotal(unread.length);
    setUnreadMentions(mentions.length);
  }, [messages, userProfiles, currentUserProfile]);

  // Reset unread status when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && currentUserProfile) {
      setUnreadTotal(0);
      setUnreadMentions(0);
      // Persist last read time to Firestore
      const now = new Date().toISOString();
      if (db) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles', currentUserProfile.id), {
          lastReadChat: now
        }, { merge: true }).catch(err => console.error("Failed to update lastReadChat:", err));
      }
    }
  }, [activeTab, currentUserProfile, db, appId]);

  // --- LIVE CLOCK TICKER ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);




  // --- ACTIONS ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getTaskTotalMinutes = (task) => {
    let total = task.totalActiveMinutes || 0;
    if (task.activeCommence) {
      total += calculateActiveMinutes(task.activeCommence);
    }
    return total;
  };

  const formatMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };
  const formatTime = formatMinutes;


  const getUserName = (userId) => getUserNameImported(userId);
  const getProjectName = (projectId) => {
    if (!projectId || projectId === 'general') return 'Internal / General';
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };
  const isUserClockedIn = (userId) => isUserClockedInImported(userId, presence);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleGoogleLogin = async () => {
    try {
      setIsAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user?.email;
      const profile = findUserByEmail(email);
      if (!profile) {
        showToast(`Access Denied: ${email} is not in the approved studio roster.`, 'error');
      } else {
        showToast(`Welcome back, ${profile.name}!`, 'success');
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      showToast(err.message || 'Google sign-in failed', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      showToast('Please enter both User ID/Email and password', 'error');
      return;
    }
    const resolvedEmail = resolveEmailForAuth(emailInput, userProfiles);
    if (!resolvedEmail) {
      showToast('Unrecognized User ID or Email. Please check with your administrator.', 'error');
      return;
    }
    try {
      setIsAuthLoading(true);
      let result;
      if (authMode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, resolvedEmail, passwordInput);
      } else {
        result = await signInWithEmailAndPassword(auth, resolvedEmail, passwordInput);
      }
      const email = result.user?.email;
      const profile = findUserByEmail(email);
      if (!profile) {
        showToast(`Access Denied: ${email} is not in the approved studio roster.`, 'error');
      } else {
        showToast(`Welcome back, ${profile.name}!`, 'success');
      }
    } catch (err) {
      console.error("Email login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        showToast('Invalid User ID/Email or password', 'error');
      } else if (err.code === 'auth/email-already-in-use') {
        showToast('Account already exists. Please sign in instead.', 'error');
        setAuthMode('login');
      } else {
        showToast(err.message || 'Authentication failed', 'error');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentUserProfile(null);
      showToast('Logged out securely', 'success');
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };




  // --- SUBMISSIONS LOGIC ---
  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (!db) return;

    const formData = new FormData(e.target);
    const projId = formData.get('projectId');
    const projectObj = projects.find(p => p.id === projId);
    const versionTag = formData.get('versionTag') || 'v01 — First Review Cut';
    const link = formData.get('link');
    const notes = formData.get('notes');

    try {
      const submissionData = {
        projectId: projId || null,
        projectCode: projectObj?.code || '',
        projectName: projectObj ? projectObj.name : 'General Project',
        userId: currentUserProfile.id,
        userName: currentUserProfile.name,
        submittedBy: currentUserProfile.name,
        executedBy: currentUserProfile.name,
        executedById: currentUserProfile.id,
        versionTag: versionTag,
        link: link,
        workUrl: link,
        notes: notes,
        status: 'Pending LP Review',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), submissionData);

      e.target.reset();
      setPreselectedProjectIdForSubmission('');
      showToast('Render link submitted to Line Producer for QC!', 'success');

      // Notify Line Producers via Discord Webhook
      sendDiscordAlert(`📤 **SUBMISSION:** ${projectObj ? projectObj.name : 'General'} (${versionTag}) by ${currentUserProfile.name}\n🔗 ${link}`);

      // Notify Line Producers via ntfy.sh
      sendQcAlert(
        `📤 Render Submitted: ${projectObj ? projectObj.name : 'General'}`,
        `${currentUserProfile.name} submitted ${versionTag}. Click to QC & WhatsApp dispatch.`,
        { clickUrl: 'https://sync.studiotunnel.com', tags: 'clapper,mag,package' }
      );

      // Sync to Google Sheets
      if (syncToGoogleSheets) {
        syncToGoogleSheets('add', {
          id: docRef.id,
          ...submissionData
        }, 'submission');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to submit link.', 'error');
    }
  };

  const handleOpenQcModal = (sub) => {
    setSelectedQcSubmission(sub);
    const defaultTemplate = WHATSAPP_TEMPLATES[0];
    setSelectedTemplateId(defaultTemplate.id);
    setCustomTemplateMessage(defaultTemplate.format({
      projectName: sub.projectName,
      versionTag: sub.versionTag,
      artistName: sub.userName || sub.executedBy || 'Lead Artist',
      link: sub.link,
      notes: sub.notes
    }));
  };

  const handleSelectTemplate = (templateId, sub) => {
    setSelectedTemplateId(templateId);
    const template = WHATSAPP_TEMPLATES.find(t => t.id === templateId) || WHATSAPP_TEMPLATES[0];
    setCustomTemplateMessage(template.format({
      projectName: sub.projectName,
      versionTag: sub.versionTag,
      artistName: sub.userName || sub.executedBy || 'Lead Artist',
      link: sub.link,
      notes: sub.notes
    }));
  };

  const handleCopyAndMarkQcPassed = async (sub) => {
    if (!db || !sub) return;
    try {
      const messageToCopy = customTemplateMessage.trim();

      // Copy to clipboard
      await navigator.clipboard.writeText(messageToCopy);
      setCopiedSubmissionId(sub.id);
      setTimeout(() => setCopiedSubmissionId(null), 3000);

      // Update Firestore
      const updates = {
        status: 'QC Passed',
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUserProfile.name,
        reviewedById: currentUserProfile.id,
        templateUsed: selectedTemplateId
      };

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'submissions', sub.id), updates);
      showToast('📋 WhatsApp template copied & marked QC Passed!', 'success');
      setSelectedQcSubmission(null);

      // Notify submitting artist via ntfy.sh
      sendDirectUserAlert(
        sub.executedById || sub.userId,
        `🟢 QC Passed: ${sub.projectName || 'Render'}`,
        `Your submission (${sub.versionTag}) was verified by Line Producer (${currentUserProfile.name}). Client WhatsApp brief dispatched.`,
        { tags: 'white_check_mark,clapper' }
      );

      // Sync to Google Sheets
      if (syncToGoogleSheets) {
        syncToGoogleSheets('add', {
          id: sub.id,
          ...sub,
          ...updates
        }, 'submission');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to copy and update QC status.', 'error');
    }
  };

  const toggleClockIn = async () => {
    const isCurrentlyClockedIn = isUserClockedIn(currentUserProfile.id);
    await toggleClockInHelper({
      db,
      appId,
      user,
      currentUserProfile,
      shiftLogs,
      presence,
      showToast
    });
    
    if (currentUserProfile) {
      syncToGoogleSheets('add', {
        userId: currentUserProfile.id,
        userName: currentUserProfile.name,
        clockIn: new Date().toISOString(),
        status: isCurrentlyClockedIn ? 'Completed Shift' : 'Clocked In'
      }, 'shift');
    }
  };

  const linkBookingToProject = async (bookingId, projectId, projectCode, projectName) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingId), {
        projectId: projectId,
        projectCode: projectCode,
        project: projectName
      });
      showToast('Booking successfully linked to project!', 'success');
    } catch (error) {
      console.error("Failed to link booking:", error);
      showToast('Failed to link booking.', 'error');
    }
  };


  const softDeleteTask = async (taskId) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      showToast('Task moved to Recycle Bin.', 'success');
    } catch (error) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const permanentDeleteTask = async (taskId) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId));
      showToast('Task permanently deleted.', 'success');
    } catch (error) {
      showToast('Failed to delete task completely.', 'error');
    }
  };

  const restoreTask = async (taskId) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), {
        isDeleted: false,
        deletedAt: null
      });
      showToast('Task restored successfully.', 'success');
    } catch (error) {
      showToast('Failed to restore task.', 'error');
    }
  }

  const toggleArchiveProject = async (projectId, currentStatus) => {
    try {
      if (!projectId) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId), {
        isArchived: !currentStatus
      });
      showToast(currentStatus ? 'Project restored!' : 'Project archived', 'success');
    } catch (err) {
      console.error(err);
      showToast('Action failed.', 'error');
    }
  };

  const toggleCloseProject = async (projectId, currentStatus) => {
    try {
      if (!projectId) return;
      const willClose = !currentStatus;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId), {
        isClosed: willClose,
        status: willClose ? 'Closed' : 'Active',
        billDispatched: willClose,
        closedAt: willClose ? new Date().toISOString() : null
      });
      showToast(willClose ? '🔒 Project closed & moved to Closed Projects!' : '📂 Project reopened to Active Directory', 'success');
    } catch (err) {
      console.error(err);
      showToast('Action failed.', 'error');
    }
  };

  const toggleLongFormatProject = async (projectId, currentStatus) => {
    try {
      if (!projectId) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId), {
        isLongFormat: !currentStatus
      });
      showToast(currentStatus ? 'Removed from Long Format Hub' : 'Added to Long Format Hub', 'success');
    } catch (err) {
      console.error(err);
      showToast('Action failed.', 'error');
    }
  };

  const syncToGoogleSheets = async (action, data, type = 'project') => {
    if (!GOOGLE_SHEETS_WEBAPP_URL) return;
    try {
      let payload;
      if (action === 'bulk') {
        payload = { action: 'bulk', projects: data };
      } else if (type === 'booking') {
        let calcHours = data.actualHrs;
        if (!calcHours && data.startTime && data.endTime) {
          const [sH, sM] = String(data.startTime).split(':').map(Number);
          const [eH, eM] = String(data.endTime).split(':').map(Number);
          calcHours = ((eH * 60 + eM) - (sH * 60 + sM)) / 60;
          if (calcHours < 0) calcHours += 24;
        }

        const artistName = getUserName(data.coloristId) || data.assignedArtist || data.coloristId || 'Staff';
        
        payload = {
          action: 'addBooking',
          data: {
            id: data.id,
            projectCode: data.projectCode || data.code || '',
            projectName: data.project || data.projectName || data.name || '',
            client: data.productionHouse || data.client || '',
            studio: data.studio || 'Studio 01',
            date: data.date,
            taskDate: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            actualHrs: calcHours || 0,
            commercialStatus: data.commercialStatus || 'Billable',
            hourlyRate: data.hourlyRate || 5000,
            taskType: 'Booking',
            assignedArtist: artistName,
            artist: artistName,
            deliverables: data.deliverables || '',
            notes: data.notes || (data.studio ? `Studio: ${data.studio} (${data.startTime} - ${data.endTime})` : ''),
            isClosed: false
          }
        };
      } else if (type === 'task') {
        payload = {
          action: 'processTaskEntry',
          data: {
            ...data,
            taskType: data.taskType || data.type || 'Task',
            commercialStatus: data.commercialStatus || 'Billable',
            hourlyRate: data.hourlyRate || 5000
          }
        };
      } else if (type === 'shift') {
        payload = {
          action: 'addShiftLog',
          data: data
        };
      } else if (type === 'leave') {
        payload = {
          action: 'addLeaveRequest',
          data: data
        };
      } else if (type === 'it_task') {
        payload = {
          action: 'addITTask',
          data: data
        };
      } else if (type === 'client') {
        payload = {
          action: 'addClient',
          data: data
        };
      } else if (type === 'submission') {
        payload = {
          action: 'addSubmission',
          data: data
        };
      } else {
        payload = {
          action: 'addProject',
          data: {
            ...data,
            projectCode: data.code || data.projectCode || '',
            projectName: data.name || data.projectName || '',
            client: data.client || ''
          }
        };
      }

      // We use text/plain to avoid preflight issues with GAS no-cors mode
      await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Sheets Sync Error:", err);
    }
  };

  const handleAddProjectSubmit = async (e) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.target);

    try {
      const nextIndex = projects.length + 1;
      const generatedCode = `STEM-${String(nextIndex).padStart(3, '0')}`;
      const code = formData.get('code')?.trim() || generatedCode;

      const newProject = {
        name: formData.get('name'),
        client: formData.get('client'),
        code: code,
        director: formData.get('director') || '',
        dop: formData.get('dop') || '',
        postProducer: formData.get('postProducer') || '',
        deliverables: formData.get('deliverables') || '',
        clientPhone: formData.get('clientPhone') || '',
        clientEmail: formData.get('clientEmail') || '',
        status: formData.get('status') || 'Active',
        isArchived: false,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), newProject);

      // Trigger Sheets Sync
      syncToGoogleSheets('add', {
        id: docRef.id,
        ...newProject,
        totalBookingTime: "0h 0m",
        totalTaskTime: "0h 0m"
      }, 'project');

      setShowAddProjectModal(false);
      showToast('Project created successfully!', 'success');
    } catch (err) {
      showToast('Failed to create project.', 'error');
    }
  };

  const handleProjectEditSubmit = async (e) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.target);

    try {
      const fallbackIndex = projects.findIndex(p => p.id === showEditProjectModal.id) + 1;
      const fallbackCode = `STEM-${String(fallbackIndex || projects.length + 1).padStart(3, '0')}`;
      const code = formData.get('code')?.trim() || showEditProjectModal.code || fallbackCode;

      const updatedData = {
        name: formData.get('name'),
        client: formData.get('client'),
        code: code,
        director: formData.get('director'),
        dop: formData.get('dop'),
        postProducer: formData.get('postProducer'),
        deliverables: formData.get('deliverables'),
        clientPhone: formData.get('clientPhone') || '',
        clientEmail: formData.get('clientEmail') || '',
        status: formData.get('status')
      };
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', showEditProjectModal.id), updatedData);

      // Trigger Sheets Sync
      const projBookings = bookings.filter(b => b.projectId === showEditProjectModal.id);
      let totalBookingMins = 0;
      projBookings.forEach(b => {
        if (b.startTime && b.endTime) {
          const [sH, sM] = b.startTime.split(':').map(Number);
          const [eH, eM] = b.endTime.split(':').map(Number);
          totalBookingMins += ((eH * 60 + eM) - (sH * 60 + sM));
        }
      });
      const projTasks = tasks.filter(t => t.projectId === showEditProjectModal.id && !t.isDeleted);
      const totalTaskMins = projTasks.reduce((acc, t) => acc + (t.totalActiveMinutes || 0), 0);

      syncToGoogleSheets('edit', {
        id: showEditProjectModal.id,
        ...updatedData,
        totalBookingTime: formatMinutes(totalBookingMins),
        totalTaskTime: formatMinutes(totalTaskMins)
      }, 'project');

      setShowEditProjectModal(null);
      showToast('Project updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update project.', 'error');
    }
  };

  // --- TIME TRACKING & WORKFLOW ACTIONS ---
  const commenceTask = async (taskId) => {
    if (!db) return;
    try {
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      await updateDoc(taskRef, {
        activeCommence: new Date().toISOString()
      });
      showToast('Task timer commenced.', 'success');
    } catch (error) {
      showToast('Failed to start task.', 'error');
    }
  };

  const assignTask = async (taskId, userId) => {
    if (!db) return;
    setShowAssignModal(null);
    try {
      const task = tasks.find(t => t.id === taskId);
      let updates = { assigneeId: userId };
      if (task?.assigneeId) {
        updates.lastAssigneeId = task.assigneeId;
      }

      if (task && task.activeCommence) {
        const mins = calculateActiveMinutes(task.activeCommence, new Date().toISOString());
        updates.totalActiveMinutes = (task.totalActiveMinutes || 0) + mins;
        updates.activeCommence = null;
      }

      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
      await updateDoc(taskRef, updates);
      showToast(`Task assigned to ${getUserName(userId)}`, 'success');

      // Notify via Discord
      const assignedUser = USERS.find(u => u.id === userId);
      const projectName = getProjectName(task?.projectId);
      const userMention = assignedUser?.discordId ? `<@${assignedUser.discordId}>` : `**${assignedUser?.name}**`;
      sendDiscordAlert(`🚨 ${userMention} **ASSIGNED:** ${task?.title} (${projectName})`);

      // Notify via ntfy.sh
      sendDirectUserAlert(
        userId,
        `🚨 Task Assigned: ${task?.title}`,
        `You have been assigned to ${task?.title} (${projectName}). Phase: ${task?.status}.`,
        { tags: 'point_right,bell' }
      );
      sendOpsAlert(
        `📋 Task Assignment: ${task?.title}`,
        `${getUserName(userId)} assigned to ${task?.title} (${projectName}).`
      );

    } catch (error) {
      showToast('Failed to assign task.', 'error');
    }
  };

  const executeStageAdvance = async (taskId, nextStatus, currentStatus, coloristBreakdown = null, flaggedItems = [], nextAssignee = undefined) => {
    if (!db) return;
    setShowSOPModal(null);
    setSopBreakdown('');

    try {
      const task = tasks.find(t => t.id === taskId);
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);

      let updates = { status: nextStatus, flaggedItems: flaggedItems };
      if (nextStatus === 'Delivered') {
        updates.deliveredAt = new Date().toISOString();
      }
      let sessionMins = 0;

      if (task && task.activeCommence) {
        sessionMins = calculateActiveMinutes(task.activeCommence, new Date().toISOString());
        updates.totalActiveMinutes = (task.totalActiveMinutes || 0) + sessionMins;
        updates.activeCommence = null;
      }

      if (nextAssignee !== undefined) {
        updates.assigneeId = nextAssignee || null;
        if (task?.assigneeId && nextAssignee !== task.assigneeId) {
          updates.lastAssigneeId = task.assigneeId;
        }
      } else if (currentStatus !== nextStatus) {
        updates.assigneeId = null;
        if (task?.assigneeId) {
          updates.lastAssigneeId = task.assigneeId;
        }
      }

      const totalMins = (task?.totalActiveMinutes || 0) + sessionMins;
      const timeString = formatTime(totalMins);

      showToast(`Phase completed! You finished the task in ${timeString}.`, 'success');

      if (coloristBreakdown) {
        updates.coloristBreakdown = coloristBreakdown;
      }

      await updateDoc(taskRef, updates);

      // Sync Task Update to Google Sheets
      if (task) {
        syncToGoogleSheets('update', {
          id: taskId,
          title: task.title,
          projectName: getProjectName(task.projectId),
          assigneeName: getUserName(nextAssignee || task.assigneeId),
          status: nextStatus,
          duration: formatMinutes(totalMins)
        }, 'task');
      }


      // Notify via Discord
      const projectName = getProjectName(task?.projectId);
      if (nextStatus === 'Delivered') {
        sendDiscordAlert(`🏁 **DELIVERED:** ${task.title} (${projectName})`);
      } else {
        const lpMentions = USERS.filter(u => ['Vaibhav Sorte', 'Prakash Jai'].includes(u.name))
          .map(u => u.discordId ? `<@${u.discordId}>` : `**${u.name}**`)
          .join(' ');

        sendDiscordAlert(`✅ ${lpMentions} **PHASE COMPLETE:** ${task.title} is ready for ${nextStatus.toUpperCase()} (${projectName})`);

        if (nextAssignee) {
          const assignedUser = USERS.find(u => u.id === nextAssignee);
          const userMention = assignedUser?.discordId ? `<@${assignedUser.discordId}>` : `**${assignedUser?.name}**`;
          sendDiscordAlert(`🚨 ${userMention} **NEXT PHASE:** ${task?.title} (${projectName})`);
          sendDirectUserAlert(nextAssignee, `🚀 Next Phase Assigned: ${task?.title}`, `Ready for ${nextStatus.toUpperCase()} in ${projectName}.`);
        } else {
          sendQcAlert(`✅ Phase Complete: ${task.title}`, `Ready for ${nextStatus.toUpperCase()} in ${projectName}. Awaiting staff assignment.`);
        }
      }

    } catch (error) {
      showToast('Failed to update workflow stage.', 'error');
    }
  };

  const handleForceFinishTask = async (taskId) => {
    if (!currentUserProfile?.isAdmin) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (window.confirm(`FORCE FINISH ACTIVE TASK?\n\nTask: "${task.title}"\nProject: ${getProjectName(task.projectId)}\n\nThis will stop all timers and mark the task as DELIVERED.`)) {
      try {
        await executeStageAdvance(taskId, 'Delivered', task.status);
        sendDiscordAlert(`⚡ **FORCE FINISH:** "${task.title}" was manually marked as DELIVERED by Admin (${currentUserProfile.name}).`);
        sendOpsAlert(`⚡ Force Finish: ${task.title}`, `Marked as DELIVERED by Admin (${currentUserProfile.name}).`);
      } catch (error) {
        showToast('Force finish failed.', 'error');
      }
    }
  };

  const requestStageAdvance = (task) => {
    const currentIndex = WORKFLOW_STAGES.indexOf(task.status);

    const nextStatus = currentIndex >= WORKFLOW_STAGES.length - 1
      ? 'Delivered'
      : WORKFLOW_STAGES[currentIndex + 1];

    if (task.status === 'Conform' && nextStatus === 'Assist') {
      setShowSOPModal({ task, nextStatus, type: 'conform_to_assist' });
    } else if (task.status === 'Assist' && nextStatus === 'Grade') {
      setShowSOPModal({ task, nextStatus, type: 'assist_to_grade' });
    } else if (task.status === 'Grade' && nextStatus === 'Delivery') {
      setShowSOPModal({ task, nextStatus, type: 'grade_to_delivery' });
    } else {
      executeStageAdvance(task.id, nextStatus, task.status);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!db) return;

    const formData = new FormData(e.target);
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');

    if (startDate > endDate) {
      showToast('End date must be after start date.', 'error');
      return;
    }

    try {
      const leavesRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaves');
      await addDoc(leavesRef, {
        userId: currentUserProfile.id,
        startDate: startDate,
        endDate: endDate,
        reason: formData.get('reason'),
        status: 'Pending',
        requestedAt: new Date().toISOString()
      });
      e.target.reset();
      showToast('Leave request submitted.', 'success');

      // Notify via Discord
      sendDiscordAlert(`🌴 **LEAVE:** ${currentUserProfile.name} (${startDate} to ${endDate})`);
      sendOpsAlert(`🌴 Leave Request: ${currentUserProfile.name}`, `${currentUserProfile.name} submitted leave (${startDate} to ${endDate}).`);

      // Add to Mail Collection for Firebase Trigger Email Extension
      await addDoc(collection(db, 'mail'), {
        to: ['samiran@studiotunnel.com', 'contact@studiotunnel.com'],
        cc: ['yash@studiotunnel.com'],
        message: {
          subject: `Leave Request: ${currentUserProfile.name}`,
          text: `${currentUserProfile.name} has requested leave from ${startDate} to ${endDate}.\nReason: ${formData.get('reason')}`,
          html: `<p><strong>${currentUserProfile.name}</strong> has requested time off.</p>
                 <p><strong>From:</strong> ${startDate}<br>
                 <strong>To:</strong> ${endDate}</p>
                 <p><strong>Reason:</strong> ${formData.get('reason')}</p>`
        }
      });

    } catch (error) {
      showToast('Failed to submit leave.', 'error');
      console.error(error);
    }
  };

  const updateLeaveStatus = async (leaveId, status) => {
    if (!db) return;
    try {
      const leaveDoc = leaves.find(l => l.id === leaveId);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaves', leaveId), { status });
      showToast(`Leave ${status}.`, 'success');

      // Notify via Discord
      if (leaveDoc) {
        const reqUser = USERS.find(u => u.id === leaveDoc.userId);
        const userMention = reqUser?.discordId ? `<@${reqUser.discordId}>` : `**${reqUser?.name}**`;
        sendDiscordAlert(`🔔 ${userMention} Leave **${status}**`);
        sendDirectUserAlert(leave.userId, `🔔 Leave ${status}: ${currentUserProfile.name}`, `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status}.`);
      }

    } catch (error) {
      showToast('Failed to update leave status.', 'error');
    }
  }

  const Toast = () => {
    if (!toast) return null;
    const isMention = toast.type === 'mention';
    const isError = toast.type === 'error';
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 4.5rem))',
          right: '1rem',
          left: '1rem',
          maxWidth: '420px',
          marginLeft: 'auto',
          background: isError ? 'rgba(30,8,8,0.97)' : isMention ? 'rgba(20,16,40,0.97)' : 'rgba(8,22,16,0.97)',
          border: `1px solid ${isError ? 'var(--danger-border)' : isMention ? 'var(--accent-border)' : 'var(--online-border)'}`,
          borderRadius: 'var(--r-lg)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          zIndex: 300,
          boxShadow: 'var(--shadow-lg)',
          animation: 'slide-up 0.25s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div style={{ color: isError ? 'var(--danger)' : isMention ? 'var(--text-accent)' : 'var(--online)', flexShrink: 0 }}>
          {isError ? <AlertCircle size={18} /> : isMention ? <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>@</span> : <CheckCircle2 size={18} />}
        </div>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{toast.message}</span>
      </div>
    );
  };

  // Login Screen
  if (!currentUserProfile) {
    const isUnauthorizedEmail = user && user.email && !findUserByEmail(user.email);

    return (
      <div style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,92,252,0.18) 0%, transparent 70%), var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', animation: 'fade-in-up 0.4s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-accent)',
            }}>
              <HardDrive size={24} color="#fff" />
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem,6vw,2.75rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1, margin: '0 0 0.5rem' }}>STUDIO TUNNEL</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Ops & Financial Pipeline Management</p>
        </div>

        {isUnauthorizedEmail ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--r-2xl)',
            padding: '2.5rem 2rem',
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center',
            animation: 'scale-in 0.2s cubic-bezier(0.32,0.72,0,1)',
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'var(--danger-dim)', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Restricted</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>, which is not registered in the active studio team roster.
            </p>
            <button
              onClick={handleSignOut}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem', fontSize: '0.8125rem' }}
            >
              Sign In with Approved Account
            </button>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--r-2xl)',
            padding: '2.5rem 2rem',
            width: '100%',
            maxWidth: '420px',
            animation: 'scale-in 0.2s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '16px',
                background: 'var(--accent-dim)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <Lock size={26} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: '1.375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Team Authentication</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Sign in with your approved Google or personal account</p>
            </div>

            {/* Google 1-Click Sign-In */}
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--r-lg)',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: isAuthLoading ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {isAuthLoading ? 'Authenticating...' : 'Sign In with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>or sign in with User ID / Email</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailPasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID or Email</label>
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="e.g. samiran, yash, or email"
                  style={{
                    width: '100%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--r-md)',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontFamily: 'var(--font-sans)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>


              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--r-md)',
                      padding: '0.75rem 2.5rem 0.75rem 1rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-sans)',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: 'var(--r-md)', fontSize: '0.8125rem', padding: '0.75rem', marginTop: '0.5rem', letterSpacing: '0.05em' }}
              >
                {isAuthLoading ? 'Verifying...' : authMode === 'signup' ? 'Register Account' : 'Sign In to Workspace'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-sans)' }}
              >
                {authMode === 'login' ? 'First time? Click here to set up password' : 'Already registered? Sign In'}
              </button>
            </div>
          </div>
        )}

        <Toast />
      </div>
    );
  }

  const getRecommendedRole = (status) => {
    switch (status) {
      case 'Conform': return 'Conformist';
      case 'Assist': return 'Assist';
      case 'Grade': return 'Colorist';
      case 'Delivery': return 'Assistant / Admin';
      default: return 'Any Available';
    }
  };

  // ─── Bottom nav tab definitions (mobile) ───
  const bottomNavTabs = [
    { id: 'chat',          icon: MessageSquare, label: 'Chat' },
    { id: 'calendar',      icon: Calendar,      label: 'Bookings' },
    { id: 'kanban',        icon: KanbanSquare,  label: 'Tasks' },
    { id: 'my_tasks',      icon: Briefcase,     label: 'Mine' },
    { id: '__more__',      icon: Menu,          label: 'More' },
  ];

  const getPageTitle = () => {
    const tabMap = {
      dashboard: 'Control Center', kanban: 'Tasks', my_tasks: 'My Workspace',
      calendar: 'Studio Bookings', team: 'Live Team', attendance: 'Attendance',
      tracker: 'Project Tracker', projects_view: 'Project Directory',
      submissions: 'Submissions', long_format: 'Long Format Hub',
      chat: 'Team Chat', guidebook: 'SOP & Guides', notepad: 'Notepad',
      it_tasks: 'IT Tasks', recycle_bin: 'Recycle Bin',
      profile: 'Settings', releases: 'Release Notes', leave: 'Leave',
    };
    return tabMap[activeTab] || 'TUNNEL';
  };

  // Main Dashboard Content
  return (
    <div style={{ height: '100dvh', width: '100%', overflow: 'hidden', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', position: 'relative' }}>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, backdropFilter: 'blur(4px)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed', inset: '0 auto 0 0', zIndex: 70, width: '264px',
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', height: '100dvh',
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
      }}
        className="lg:translate-x-0"
      >
        {/* Sidebar Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-accent)', flexShrink: 0 }}>
              <HardDrive size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1, margin: 0 }}>TUNNEL</h1>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>Task Management</p>
            </div>
            <button
              onClick={() => setActiveTab('releases')}
              style={{ fontSize: '0.58rem', color: 'var(--text-accent)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-sans)' }}
            >
              {APP_RELEASES[0].id}
            </button>
            {isSandboxEnv && (
              <button
                onClick={() => setShowStagingPopup(true)}
                style={{ fontSize: '0.58rem', color: 'var(--online)', fontWeight: 800, letterSpacing: '0.1em', background: 'var(--online-dim)', border: '1px solid var(--online-border)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', flexShrink: 0, animation: 'pulse-online 2s infinite', fontFamily: 'var(--font-sans)' }}
              >
                🧪 SBX
              </button>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '8px' }}
          >✕</button>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.875rem', overflowY: 'auto' }} className="custom-scrollbar">
          <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>Communication</div>
          {[{ id: 'chat', icon: MessageSquare, label: 'Team Chat' }].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={17} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {(unreadTotal > 0 || unreadMentions > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {unreadMentions > 0 && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '2px 5px', borderRadius: '999px' }}>@</span>}
                  {unreadTotal > 0 && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '999px', minWidth: '18px', textAlign: 'center' }}>{unreadTotal}</span>}
                </div>
              )}
            </button>
          ))}

          <div className="nav-section-label">Workspace</div>
          {[
            { id: 'calendar', icon: Calendar, label: 'Studio Bookings' },
            { id: 'kanban', icon: KanbanSquare, label: 'Task Board' },
            { id: 'dashboard', icon: LayoutDashboard, label: 'Control Center', perm: 'VIEW_DASHBOARD' },
            { id: 'projects_view', icon: FolderOpen, label: 'Projects & Tracker', perm: 'VIEW_PROJECTS' },
            { id: 'team', icon: Users, label: 'Live Team Status' },
            { id: 'my_tasks', icon: Briefcase, label: 'My Tasks' },
            { id: 'submissions', icon: Link, label: 'Submissions', badge: hasPermission(currentUserProfile, PERMISSIONS.REVIEW_SUBMISSIONS) ? submissions.filter(s => s.status === 'Pending' || s.status === 'Pending LP Review').length : 0 }
          ].filter(i => !i.perm || hasPermission(currentUserProfile, PERMISSIONS[i.perm])).map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`nav-item flex items-center justify-between ${activeTab === item.id ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={17} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-slate-950 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="nav-section-label">Operations</div>
          {[
            { id: 'it_tasks', icon: Network, label: 'IT Tasks', perm: 'MANAGE_IT' },
            { id: 'guidebook', icon: BookOpen, label: 'SOP & Guides' },
            { id: 'recycle_bin', icon: Trash2, label: 'Recycle Bin', perm: 'VIEW_RECYCLE_BIN' },
          ].filter(i => !i.perm || hasPermission(currentUserProfile, PERMISSIONS[i.perm])).map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {/* Shift Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', padding: '0.625rem 0.875rem', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isUserClockedIn(currentUserProfile.id) ? <div className="online-dot" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }} />}
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Shift</span>
            </div>
            <button
              onClick={toggleClockIn}
              className={isUserClockedIn(currentUserProfile.id) ? 'btn btn-online btn-sm' : 'btn btn-secondary btn-sm'}
            >
              {isUserClockedIn(currentUserProfile.id) ? 'End Shift' : 'Clock In'}
            </button>
          </div>

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, overflow: 'hidden', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: 'var(--r-md)', transition: 'background 0.12s', fontFamily: 'var(--font-sans)', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="avatar">
                {userProfiles[currentUserProfile.id]?.photoURL
                  ? <img src={userProfiles[currentUserProfile.id].photoURL} alt="" />
                  : currentUserProfile.name.charAt(0)}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{currentUserProfile.name}</p>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{currentUserProfile.studio || currentUserProfile.role}</p>
              </div>
            </button>
            <button
              onClick={() => setShowNtfyModal(true)}
              className="btn-icon btn btn-ghost"
              title="Push Notifications (ntfy)"
            >
              <Bell size={16} className="text-amber-400" />
            </button>
            <button
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
              className={activeTab === 'profile' ? 'btn-icon btn btn-primary' : 'btn-icon btn btn-ghost'}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
          <button
            onClick={handleSignOut}
            style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem', borderRadius: 'var(--r-md)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'var(--font-sans)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <LogOut size={14} /> Secure Logout
          </button>

        </div>
      </div>

      {/* Content Area */}
      <div
        className="lg:ml-[264px] h-[100dvh] overflow-y-auto overflow-x-hidden relative custom-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'max(5.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Mobile Top Header */}
        <div
          className="lg:hidden"
          style={{
            position: 'sticky', top: 0, zIndex: 40,
            background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: `max(0.875rem, env(safe-area-inset-top)) 1rem 0.875rem`,
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
          >
            <Menu size={24} />
          </button>
          <h1 style={{ fontWeight: 900, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', flex: 1, margin: 0 }}>{getPageTitle()}</h1>
          <button
            onClick={() => setShowNtfyModal(true)}
            style={{ color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}
            title="Push Notifications (ntfy)"
          >
            <Bell size={20} />
          </button>
          <button
            onClick={() => { setActiveTab('profile'); }}
            className="avatar"
            style={{ cursor: 'pointer', border: 'none', flexShrink: 0 }}
          >
            {userProfiles[currentUserProfile.id]?.photoURL
              ? <img src={userProfiles[currentUserProfile.id].photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : currentUserProfile.name.charAt(0)}
          </button>
        </div>

        {/* Main content padding wrapper */}
        <div style={{ padding: '1.5rem 1rem 1rem' }} className="md:p-10">

        {/* RELEASES TAB */}
        {activeTab === 'releases' && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 space-y-8 pb-32">
            <header className="border-b border-slate-800 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center mb-2">
                    <ShieldAlert className="mr-3 text-indigo-400" /> Release Documentation
                  </h2>
                  <p className="text-slate-400 font-medium italic text-sm">System updates, security patches, and workflow enhancements.</p>
                </div>
                <div className="relative group w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search updates..."
                    value={releaseSearchQuery}
                    onChange={(e) => setReleaseSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                  {releaseSearchQuery && (
                    <button
                      onClick={() => setReleaseSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      <UserX size={16} />
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="space-y-6">
              {APP_RELEASES.filter(rel => {
                const query = releaseSearchQuery.toLowerCase();
                if (!query) return true;
                const matchTitle = rel.title.toLowerCase().includes(query);
                const matchId = rel.id.toLowerCase().includes(query);
                const matchUpdates = [...(rel.updates.tech || []), ...(rel.updates.feature || [])].some(u => u.toLowerCase().includes(query));
                return matchTitle || matchId || matchUpdates;
              }).map(rel => {
                const isExpanded = expandedReleases.has(rel.id);
                return (
                  <div key={rel.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 text-white rounded-2xl font-black text-lg shadow-lg ${rel.id === APP_RELEASES[0].id ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                          {rel.id}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">{rel.title}</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Released: {rel.date}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleReleaseExpansion(rel.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black tracking-widest text-slate-300 transition-all border border-slate-700"
                      >
                        {isExpanded ? 'COLLAPSE LOG' : 'EXPAND LOG'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-6 mt-8 animate-in slide-in-from-top-4 duration-300">
                        {rel.updates.tech && (
                          <div>
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" /> Tech Update
                            </h4>
                            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800/50">
                              <ul className="space-y-3">
                                {rel.updates.tech.map((upd, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 opacity-40" />
                                    {upd}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        {rel.updates.feature && (
                          <div>
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Feature Update
                            </h4>
                            <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800/50">
                              <ul className="space-y-3">
                                {rel.updates.feature.map((upd, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 font-medium leading-relaxed">
                                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                    {upd}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab(hasPermission(currentUserProfile, PERMISSIONS.VIEW_DASHBOARD) ? 'dashboard' : 'my_tasks')}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black tracking-widest transition-all border border-slate-800"
            >
              RETURN TO PIPELINE
            </button>
          </div>
        )}

        {/* TEAM CHAT & NOTEPAD HUB */}
        {activeTab === 'chat' && (
          <TeamChat 
            db={db}
            storage={storage}
            currentUserProfile={currentUserProfile}
            appId={appId}
            messages={messages}
            USERS={USERS}
            isUserClockedIn={isUserClockedIn}
            showToast={showToast}
            notepads={notepads}
            setNotepads={setNotepads}
            waTemplates={waTemplates}
          />
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && hasPermission(currentUserProfile, PERMISSIONS.VIEW_DASHBOARD) && (
          <div className="space-y-8 animate-fade-up">
            <div>
              <h2 className="section-title">Control Center</h2>
              <p className="section-subtitle">Real-time pipeline status and staff allocation.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Active Tasks',    val: tasks.filter(t => t.status !== 'Delivered' && !t.isDeleted).length, color: 'text-warn',   icon: AlertCircle },
                { label: 'Delivered',       val: tasks.filter(t => t.status === 'Delivered' && !t.isDeleted).length, color: 'text-accent',  icon: CheckCircle2 },
                { label: 'Staff Online',    val: USERS.filter(u => isUserClockedIn(u.id)).length,                    color: 'text-online',  icon: Users },
              ].map((stat, i) => (
                <div key={i} className="stat-card">
                  <p className="stat-label">{stat.label}</p>
                  <p className={`stat-value ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '1.5rem', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>Unassigned Pipeline Tasks</h3>
              <div style={{ minWidth: '420px' }}>
                {tasks.filter(t => !t.assigneeId && t.status !== 'Delivered' && !t.isDeleted).length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem', borderRadius: 'var(--r-lg)' }}>
                    <span className="empty-state-text">All active tasks are currently assigned.</span>
                  </div>
                ) : (
                  tasks.filter(t => !t.assigneeId && t.status !== 'Delivered' && !t.isDeleted).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 mt-1 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Awaiting Phase: {task.status}</p>
                          <h5 className="text-xs font-bold text-slate-300 mb-3">{task.title}</h5>
                          <div className="flex gap-4 text-[9px] text-slate-400 mb-3">
                            <span>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown'}</span>
                          </div>

                          <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-1.5 border-r border-slate-700/50 pr-3">
                              <UserCircle size={12} className="text-slate-500" />
                              <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Last Worked By</p>
                                <p className="text-[10px] font-bold text-slate-300 leading-none">{task.lastAssigneeId ? getUserName(task.lastAssigneeId) : '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase size={12} className="text-indigo-400" />
                              <div>
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Recommend Role</p>
                                <p className="text-[10px] font-bold text-slate-300 leading-none">{getRecommendedRole(task.status)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setShowAssignModal(task)}
                          className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-xs font-black tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                        >
                          ASSIGN STAFF
                        </button>
                        <button
                          onClick={() => handleForceFinishTask(task.id)}
                          className="px-6 py-2 bg-slate-800 text-slate-400 hover:bg-red-900/20 hover:text-red-400 border border-slate-700 rounded-xl text-[9px] font-black tracking-widest transition-all"
                        >
                          FORCE FINISH
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 overflow-x-auto">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Timer className="text-amber-500" size={20} /> Stale Active Tasks (from previous days)
              </h3>
              <div className="space-y-4 min-w-[500px]">
                {tasks.filter(t => t.assigneeId && t.status !== 'Delivered' && !t.isDeleted && t.createdAt?.slice(0, 10) < new Date().toISOString().slice(0, 10)).length === 0 ? (
                  <p className="text-slate-500 italic">No stale tasks from previous days.</p>
                ) : (
                  tasks.filter(t => t.assigneeId && t.status !== 'Delivered' && !t.isDeleted && t.createdAt?.slice(0, 10) < new Date().toISOString().slice(0, 10)).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-6 bg-slate-800/20 rounded-2xl border border-slate-700/30">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-700">
                          <Timer size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-sm mb-0.5 uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Current Phase: {task.status}</p>
                          <h5 className="text-xs font-bold text-slate-200 mb-2">{task.title}</h5>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                               Created: {task.createdAt ? new Date(task.createdAt).toLocaleString([], { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '') : '—'}
                            </span>
                            <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                              ASSIGNED TO: {getUserName(task.assigneeId)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleForceFinishTask(task.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-xl text-[10px] font-black tracking-widest transition-all"
                        >
                          <CheckCircle2 size={16} /> FORCE FINISH
                        </button>
                        <button
                          onClick={() => setShowAssignModal(task)}
                          className="px-6 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-[10px] font-black tracking-widest transition-all border border-slate-700"
                        >
                          REASSIGN
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* MERGED PROJECT DIRECTORY & OPERATIONS TRACKER TAB */}
        {activeTab === 'projects_view' && hasPermission(currentUserProfile, PERMISSIONS.VIEW_PROJECTS) && (
          <ProjectDirectory
            projects={projects}
            bookings={bookings}
            tasks={tasks}
            projectSearchQuery={projectSearchQuery}
            setProjectSearchQuery={setProjectSearchQuery}
            projectViewMode={projectViewMode}
            setProjectViewMode={setProjectViewMode}
            setShowAddProjectModal={setShowAddProjectModal}
            showArchivedProjects={showArchivedProjects}
            setShowArchivedProjects={setShowArchivedProjects}
            currentUserProfile={currentUserProfile}
            PERMISSIONS={PERMISSIONS}
            hasPermission={hasPermission}
            toggleLongFormatProject={toggleLongFormatProject}
            toggleArchiveProject={toggleArchiveProject}
            toggleCloseProject={toggleCloseProject}
            syncToGoogleSheets={syncToGoogleSheets}
            showToast={showToast}
            setShowEditProjectModal={setShowEditProjectModal}
            formatMinutes={formatMinutes}
            formatTime={formatTime}
            getTaskTotalMinutes={getTaskTotalMinutes}
            calculateDays={calculateDays}
            expandedBillingId={expandedBillingId}
            setExpandedBillingId={setExpandedBillingId}
            billingRates={billingRates}
            setBillingRates={setBillingRates}
            bookingSearchQueries={bookingSearchQueries}
            setBookingSearchQueries={setBookingSearchQueries}
            linkBookingToProject={linkBookingToProject}
            USERS={USERS}
            getUserName={getUserName}
            getProjectName={getProjectName}
          />
        )}

        {/* SUBMISSIONS TAB (LINE PRODUCER QC & WHATSAPP DELIVERY HUB) */}
        {activeTab === 'submissions' && (
          <div className="animate-in fade-in space-y-8 max-w-6xl pb-20">
            <header className="border-b border-slate-800 pb-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white flex items-center">
                  <Link className="mr-3 text-indigo-400" /> Work Submissions & QC Hub
                </h2>
                <p className="text-slate-400 font-medium text-sm md:text-base mt-1">
                  {hasPermission(currentUserProfile, PERMISSIONS.REVIEW_SUBMISSIONS) 
                    ? 'Inspect incoming artist renders, select standardized WhatsApp templates, and dispatch to clients.' 
                    : 'Submit your exported renders or progress links to the Line Producer for review.'}
                </p>
              </div>

              {/* Stat Counters */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total:</span>
                  <span className="text-sm font-black text-white">{submissions.length}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Pending QC:</span>
                  <span className="text-sm font-black text-amber-400">{submissions.filter(s => s.status === 'Pending' || s.status === 'Pending LP Review').length}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">QC Passed:</span>
                  <span className="text-sm font-black text-emerald-400">{submissions.filter(s => s.status === 'QC Passed' || s.status === 'Reviewed').length}</span>
                </div>
              </div>
            </header>

            {/* SUBMIT NEW LINK FORM */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center">
                  <Plus size={18} className="mr-2 text-indigo-400" /> Submit Export / Render Link
                </h3>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                  🎨 Submitting as: {currentUserProfile.name}
                </span>
              </div>

              <form onSubmit={handleSubmissionSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Project</label>
                    <select 
                      required 
                      name="projectId" 
                      defaultValue={preselectedProjectIdForSubmission}
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold"
                    >
                      <option value="">Select an active project...</option>
                      {projects.filter(p => !p.isArchived).map(p => (
                        <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Version / Deliverable Tag</label>
                    <select 
                      required 
                      name="versionTag" 
                      defaultValue="v01 — First Review Cut"
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold"
                    >
                      {SUBMISSION_VERSIONS.map(v => (
                        <option key={v.id} value={v.label}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Render / Preview URL (Drive, Frame.io, Dropbox)</label>
                  <input 
                    required 
                    type="url" 
                    name="link" 
                    placeholder="https://drive.google.com/file/d/... or https://frame.io/..." 
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Changelog / Notes for Client & Line Producer</label>
                  <textarea 
                    name="notes" 
                    placeholder="E.g. Addressed director revision on scene 04, color grade matched to reference look..." 
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 min-h-[80px] font-medium" 
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center"
                >
                  <Send size={16} className="mr-2" /> SUBMIT FOR LINE PRODUCER QC
                </button>
              </form>
            </div>

            {/* SUBMISSIONS LIST & QC HUB */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center">
                  <ShieldCheck size={20} className="mr-2 text-indigo-400" />
                  {hasPermission(currentUserProfile, PERMISSIONS.REVIEW_SUBMISSIONS) ? 'Submissions & QC Dashboard' : 'My Past Submissions'}
                </h3>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/60">
                  <button 
                    onClick={() => setSubmissionFilter('all')} 
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${submissionFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All ({submissions.length})
                  </button>
                  <button 
                    onClick={() => setSubmissionFilter('pending')} 
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${submissionFilter === 'pending' ? 'bg-amber-500 text-slate-950 font-black' : 'text-amber-400 hover:text-white'}`}
                  >
                    Pending QC ({submissions.filter(s => s.status === 'Pending' || s.status === 'Pending LP Review').length})
                  </button>
                  <button 
                    onClick={() => setSubmissionFilter('reviewed')} 
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${submissionFilter === 'reviewed' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-white'}`}
                  >
                    QC Passed ({submissions.filter(s => s.status === 'QC Passed' || s.status === 'Reviewed').length})
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  let targetSubmissions = hasPermission(currentUserProfile, PERMISSIONS.REVIEW_SUBMISSIONS)
                    ? submissions
                    : submissions.filter(s => getSelfAndPredecessorIds(currentUserProfile).includes(s.userId));

                  if (submissionFilter === 'pending') {
                    targetSubmissions = targetSubmissions.filter(s => s.status === 'Pending' || s.status === 'Pending LP Review');
                  } else if (submissionFilter === 'reviewed') {
                    targetSubmissions = targetSubmissions.filter(s => s.status === 'QC Passed' || s.status === 'Reviewed');
                  }

                  if (targetSubmissions.length === 0) {
                    return (
                      <div className="text-center p-12 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                        <Link size={40} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 font-medium">No submissions matching the current filter.</p>
                      </div>
                    );
                  }

                  return targetSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(sub => {
                    const isPending = sub.status === 'Pending' || sub.status === 'Pending LP Review';
                    return (
                      <div 
                        key={sub.id} 
                        className={`bg-slate-800/50 border rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-5 justify-between transition-all hover:border-slate-500 ${
                          isPending ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-slate-700'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                              isPending 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {isPending ? '🟡 Pending LP QC' : '🟢 QC Passed'}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {sub.versionTag || 'v01'}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">
                              {new Date(sub.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>

                          <h4 className="text-white font-black text-lg mb-2">{sub.projectName}</h4>

                          {/* Dual Accountability Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">🎨 Executed / Exported By</p>
                              <p className="text-xs font-bold text-indigo-300">{sub.userName || sub.executedBy || 'Staff'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">🎬 QC Checked By</p>
                              <p className="text-xs font-bold text-emerald-400">
                                {sub.reviewedBy ? `${sub.reviewedBy} (${new Date(sub.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : '⏳ Awaiting Review'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <a 
                              href={sub.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center text-xs font-bold text-slate-300 hover:text-indigo-400 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-700 transition-colors break-all"
                            >
                              <ExternalLink size={14} className="mr-2 shrink-0 text-indigo-400" /> {sub.link}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(sub.link);
                                showToast('Link copied to clipboard!', 'info');
                              }}
                              className="p-2.5 bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
                              title="Copy URL"
                            >
                              <Copy size={14} />
                            </button>
                          </div>

                          {sub.notes && (
                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Notes / Scope</p>
                              <p className="text-xs text-slate-300">{sub.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* LINE PRODUCER QC ACTIONS */}
                        {hasPermission(currentUserProfile, PERMISSIONS.REVIEW_SUBMISSIONS) && (
                          <div className="shrink-0 flex flex-col justify-center gap-2">
                            <button
                              onClick={() => handleOpenQcModal(sub)}
                              className={`w-full md:w-auto px-5 py-3 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center shadow-lg ${
                                isPending
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              }`}
                            >
                              <MessageCircle size={16} className="mr-2 text-indigo-300" />
                              {isPending ? 'QC & WHATSAPP DISPATCH' : 'RE-COPY TEMPLATE'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* LINE PRODUCER QC & WHATSAPP TEMPLATE MODAL */}
        {selectedQcSubmission && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center">
                    <MessageCircle className="mr-2 text-indigo-400" /> Line Producer QC & WhatsApp Dispatch
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    Project: <span className="text-white">{selectedQcSubmission.projectName}</span> | Version: <span className="text-indigo-400">{selectedQcSubmission.versionTag}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedQcSubmission(null)} 
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* 1. Quick QC Link Check */}
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Render / Review URL</p>
                  <p className="text-xs text-indigo-300 font-mono truncate max-w-md">{selectedQcSubmission.link}</p>
                </div>
                <a 
                  href={selectedQcSubmission.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-black tracking-wider transition-all flex items-center shrink-0"
                >
                  <ExternalLink size={14} className="mr-1.5" /> OPEN RENDER
                </a>
              </div>

              {/* 2. Template Selector */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select WhatsApp Delivery Template</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {WHATSAPP_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id, selectedQcSubmission)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedTemplateId === t.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-black text-white">{t.title}</span>
                      <span className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Live Formatted WhatsApp Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Formatted WhatsApp Message Preview</label>
                  <span className="text-[10px] text-slate-500 font-bold">Editable before copying</span>
                </div>
                <textarea
                  rows={9}
                  value={customTemplateMessage}
                  onChange={(e) => setCustomTemplateMessage(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl p-4 text-xs text-emerald-300 font-mono focus:border-indigo-500 outline-none leading-relaxed"
                />
              </div>

              {/* 4. Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQcSubmission(null)}
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black tracking-widest transition-all"
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyAndMarkQcPassed(selectedQcSubmission)}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center"
                >
                  <Copy size={16} className="mr-2" /> 1-CLICK COPY & MARK QC PASSED
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MY TASKS TAB */}
        {activeTab === 'my_tasks' && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="section-title">My Workspace</h2>
              <p className="section-subtitle">Your active task queue and session controls.</p>
            </div>



            {!isUserClockedIn(currentUserProfile.id) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.25rem', background: 'var(--warn-dim)', border: '1px solid var(--warn-border)', borderRadius: 'var(--r-lg)' }}>
                <AlertCircle size={18} color="var(--warn)" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--warn)', marginBottom: '0.125rem' }}>You are currently clocked out.</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clock in from the sidebar to start tracking your session.</p>
                </div>
              </div>
            )}

            <div className="grid gap-5">
              {(() => {
                const myUserIds = getSelfAndPredecessorIds(currentUserProfile);
                const myTasksList = tasks.filter(t => myUserIds.includes(t.assigneeId) && t.status !== 'Delivered' && !t.isDeleted);
                if (myTasksList.length === 0) {
                  return (
                    <div className="empty-state">
                      <CheckCircle2 size={48} className="empty-state-icon" />
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>You're all caught up!</h3>
                        <p className="empty-state-text">No active tasks in your queue right now.</p>
                      </div>
                    </div>
                  );
                }
                return myTasksList.map(task => {
                  const isRunning = !!task.activeCommence;
                  return (
                    <div key={task.id} style={{
                      background: 'var(--bg-surface)',
                      border: `2px solid ${isRunning ? 'var(--online-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-2xl)',
                      padding: '1.5rem',
                      boxShadow: isRunning ? '0 0 32px var(--online-dim)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Task Header */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <div>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 0.25rem' }}>{getProjectName(task.projectId)}</h3>
                              <span className="badge badge-accent">{task.status}</span>
                            </div>
                            {isRunning && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--online)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <div className="online-dot" />
                                Active Session
                              </div>
                            )}
                          </div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>{task.title}</h4>
                        </div>

                        {task.description && (
                          <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>Instructions</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{task.description}</p>
                          </div>
                        )}

                        {task.flaggedItems && task.flaggedItems.length > 0 && (
                          <div style={{ background: 'var(--danger-dim)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--danger-border)' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><AlertCircle size={12} /> Handoff Flags</p>
                            <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                              {task.flaggedItems.map((fi, i) => <li key={i} style={{ fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>{fi}</li>)}
                            </ul>
                          </div>
                        )}

                        {/* Time & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            <Clock size={15} />
                            <span style={{ fontWeight: 700 }}>{formatTime(getTaskTotalMinutes(task))} logged</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {/* PRIMARY: Start/Complete */}
                            {!isRunning ? (
                              <button onClick={() => commenceTask(task.id)} className="btn btn-online">
                                <Play size={16} className="fill-current" />
                                Start Session
                              </button>
                            ) : (
                              <button onClick={() => requestStageAdvance(task)} className="btn btn-primary">
                                <CheckCircle2 size={16} /> Complete Phase
                              </button>
                            )}
                            {/* TERTIARY: Force Finish */}
                            {currentUserProfile?.isAdmin && (
                              <button onClick={() => handleForceFinishTask(task.id)} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                                Force Finish
                              </button>
                            )}

                            {/* DANGER level 3: arm then confirm delete */}
                            {(() => {
                              const armKey = `del_${task.id}`;
                              const isArmed = armedDeleteId === armKey;
                              return (
                                <button
                                  onClick={() => {
                                    if (isArmed) {
                                      softDeleteTask(task.id);
                                      setArmedDeleteId(null);
                                    } else {
                                      setArmedDeleteId(armKey);
                                      setTimeout(() => setArmedDeleteId(a => a === armKey ? null : a), 3000);
                                    }
                                  }}
                                  className={isArmed ? 'btn btn-danger-armed btn-sm' : 'btn btn-danger btn-sm'}
                                  title={isArmed ? 'Tap again to confirm delete' : 'Delete task'}
                                >
                                  <Trash2 size={14} />
                                  {isArmed ? 'Confirm Delete' : 'Delete'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* KANBAN TAB */}
        {activeTab === 'kanban' && (
          <SyncBoard
            db={db}
            appId={appId}
            tasks={tasks}
            projects={projects}
            USERS={USERS}
            currentUserProfile={currentUserProfile}
            isUserClockedIn={isUserClockedIn}
            getUserName={getUserName}
            getProjectName={getProjectName}
            setShowAssignModal={setShowAssignModal}
            softDeleteTask={softDeleteTask}
            executeStageAdvance={executeStageAdvance}
            showToast={showToast}
            sendDiscordAlert={sendDiscordAlert}
            syncToGoogleSheets={syncToGoogleSheets}
            onOpenSubmission={(projId) => {
              setPreselectedProjectIdForSubmission(projId);
              setActiveTab('submissions');
            }}
          />
        )}

        {/* TEAM STATUS TAB */}
        {activeTab === 'team' && (
          <div className="animate-in fade-in space-y-8">
            <header>
              <h2 className="text-2xl md:text-3xl font-black text-white">Live Team Status</h2>
              <p className="text-slate-400 font-medium text-sm md:text-base">See who is currently clocked in and available for work.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {USERS.filter(u => !u.isArchived).map(u => {
                const isIN = isUserClockedIn(u.id);
                const userPresence = presence[u.id] || {};
                const userTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'Delivered' && !t.isDeleted);
                return (
                  <div key={u.id} className={`p-6 rounded-3xl border-2 ${isIN ? 'bg-slate-900 border-slate-700 shadow-xl' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${isIN ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-200'}`}>
                          {isIN ? <UserCheck size={24} /> : <UserX size={24} />}
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-white">{u.name}</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{u.role}</p>
                        </div>
                      </div>
                      {isIN ?
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-black tracking-widest rounded-lg">Online</span> :
                        <span className="px-3 py-1 bg-slate-800 text-slate-500 text-[10px] uppercase font-black tracking-widest rounded-lg">Offline</span>
                      }
                    </div>

                    <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 mb-4">
                      <div className="text-center w-1/2 border-r border-slate-700/50">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Clock In</p>
                        <p className="text-xs font-bold text-emerald-400">
                          {userPresence.clockInTime ? new Date(userPresence.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                      </div>
                      <div className="text-center w-1/2">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Clock Out</p>
                        <p className="text-xs font-bold text-slate-300">
                          {userPresence.clockOutTime ? new Date(userPresence.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Current Queue</p>
                      {userTasks.length > 0 ? (
                        <ul className="space-y-2">
                          {userTasks.map(t => (
                            <li key={t.id} className="text-sm text-slate-300 font-medium truncate bg-slate-800/50 px-3 py-2 rounded-lg">{t.title}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-600 font-bold italic">NO ACTIVE TASKS</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STUDIO BOOKINGS TAB */}
        {activeTab === 'calendar' && (
          <StudioBookings
            bookings={bookings}
            projects={projects}
            currentUserProfile={currentUserProfile}
            db={db}
            appId={appId}
            showToast={showToast}
            getUserName={getUserName}
            syncToGoogleSheets={syncToGoogleSheets}
            formatLocalDate={formatLocalDate}
            users={USERS}
          />
        )}




        {/* RECYCLE BIN TAB */}
        {activeTab === 'recycle_bin' && hasPermission(currentUserProfile, PERMISSIONS.VIEW_RECYCLE_BIN) && (
          <RecycleBin 
            tasks={tasks} 
            getProjectName={getProjectName} 
            restoreTask={restoreTask} 
            permanentDeleteTask={permanentDeleteTask} 
          />
        )}

        {/* IT TASKS TAB */}
        {activeTab === 'it_tasks' && hasPermission(currentUserProfile, PERMISSIONS.MANAGE_IT) && (
          <ITTasks
            db={db}
            storage={storage}
            appId={appId}
            currentUserProfile={currentUserProfile}
            showToast={showToast}
            isUserClockedIn={isUserClockedIn}
          />
        )}

        {/* GUIDEBOOK & SOP TAB */}
        {activeTab === 'guidebook' && (
          <SOPGuides />
        )}

        {/* LEAVE TAB */}
        {activeTab === 'leave' && (
          <div className="animate-in fade-in space-y-8">
            <header>
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center"><Palmtree className="mr-3 text-indigo-400" /> Leave Application</h2>
              <p className="text-slate-400 font-medium text-sm md:text-base">Request time off and track your annual allowance.</p>
            </header>

            {!hasPermission(currentUserProfile, PERMISSIONS.APPROVE_LEAVES) && (() => {
              const myLeaves = leaves.filter(l => getSelfAndPredecessorIds(currentUserProfile).includes(l.userId));
              const approvedDays = myLeaves.filter(l => l.status === 'Approved').reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);
              const balance = 21 - approvedDays;

              return (
                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 flex items-center justify-between mb-8 shadow-xl">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">Annual Leave Balance</h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Total allowance: 21 days per year</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl md:text-5xl font-black ${balance <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>{balance}</span>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs ml-2 md:ml-3">Days Left</span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 h-fit shadow-xl">
                <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Request Time Off</h3>
                <form onSubmit={handleLeaveSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                      <input required name="startDate" type="date" onClick={(e) => e.target.showPicker?.()} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium cursor-pointer [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">End Date</label>
                      <input required name="endDate" type="date" onClick={(e) => e.target.showPicker?.()} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium cursor-pointer [color-scheme:dark]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Reason</label>
                    <textarea required name="reason" placeholder="Brief explanation..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 min-h-[100px] font-medium" />
                  </div>
                  <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-emerald-500/20 transition-all mt-4">
                    SUBMIT REQUEST
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-white mb-6">
                  {hasPermission(currentUserProfile, PERMISSIONS.APPROVE_LEAVES) ? 'All Leave Requests (Admin)' : 'My Leave History'}
                </h3>

                {(() => {
                  const targetLeaves = hasPermission(currentUserProfile, PERMISSIONS.APPROVE_LEAVES) ? leaves : leaves.filter(l => getSelfAndPredecessorIds(currentUserProfile).includes(l.userId));
                  if (targetLeaves.length === 0) return (
                    <div className="text-center p-16 bg-slate-900 rounded-3xl border border-slate-800 border-dashed">
                      <p className="text-slate-500 font-medium">No leave requests found.</p>
                    </div>
                  );
                  return targetLeaves.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)).map(l => (
                    <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${l.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              l.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                            {l.status}
                          </span>
                          {hasPermission(currentUserProfile, PERMISSIONS.APPROVE_LEAVES) && <span className="text-sm font-bold text-white">{getUserName(l.userId)}</span>}
                        </div>
                        <p className="text-base text-slate-200 font-bold mb-1">
                          {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                          <span className="text-slate-500 text-sm ml-2">({calculateDays(l.startDate, l.endDate)} days)</span>
                        </p>
                        <p className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded-lg inline-block">{l.reason}</p>
                      </div>

                      {hasPermission(currentUserProfile, PERMISSIONS.APPROVE_LEAVES) && l.status === 'Pending' && (
                        <div className="flex space-x-3 shrink-0">
                          <button onClick={() => updateLeaveStatus(l.id, 'Approved')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-widest transition-all">APPROVE</button>
                          <button onClick={() => updateLeaveStatus(l.id, 'Rejected')} className="px-5 py-2.5 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 rounded-xl text-xs font-bold tracking-widest transition-all border border-slate-700">REJECT</button>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in space-y-8 max-w-4xl pb-32">
            <header>
              <h2 className="text-2xl md:text-3xl font-black text-white flex items-center tracking-tighter uppercase"><Settings className="mr-3 text-indigo-400" /> Settings</h2>
              <p className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest mt-1">Configure your workspace identity and security.</p>
            </header>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!db) return;
              const formData = new FormData(e.target);
              const customUsername = formData.get('customUsername')?.toString().trim().toLowerCase() || '';
              try {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles', currentUserProfile.id), {
                  customUsername: customUsername,
                  email: formData.get('email') || '',
                  phone: formData.get('phone') || '',
                  emergency: formData.get('emergency') || '',
                  lastUpdated: new Date().toISOString()
                }, { merge: true });
                showToast('Settings & User ID successfully updated.', 'success');
              } catch (err) {
                showToast('Failed to update settings.', 'error');
              }
            }} className="space-y-6">


              {/* SECTION: EMPLOYMENT & HR (TOP) */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all hover:border-slate-700 overflow-hidden relative">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-10">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                      <Palmtree size={28} className="text-indigo-400" /> Employment & HR
                    </h3>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Request time off and track your annual allowance.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full uppercase tracking-widest animate-pulse border border-emerald-500/20 flex items-center gap-2">
                      <Activity size={12} /> Connected
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left: Leave Balance Cards */}
                  <div className="lg:col-span-4 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                      ANNUAL ALLOWANCE
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                      {[
                        { label: 'Casual Leave', val: 12, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Sick Leave', val: 8, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Earned Leave', val: 15, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                      ].map(leave => (
                        <div key={leave.label} className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 flex justify-between items-center transition-all hover:translate-x-1 hover:border-slate-600 group">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{leave.label}</p>
                          <div className={`px-4 py-2 rounded-xl bg-slate-900 font-black text-xl ${leave.color} border border-slate-800 shadow-inner`}>{leave.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Request Form (Format from Production) */}
                  <div className="lg:col-span-8 bg-slate-950/20 rounded-[2rem] p-8 border border-slate-800/50 space-y-8 relative">
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-2">
                      <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                        Request Time Off
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                        <input type="date" onClick={(e) => e.target.showPicker?.()} className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500 transition-all font-bold cursor-pointer [color-scheme:dark]" />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date</label>
                        <input type="date" onClick={(e) => e.target.showPicker?.()} className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500 transition-all font-bold cursor-pointer [color-scheme:dark]" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason</label>
                      <textarea placeholder="Brief explanation..." className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-emerald-500 min-h-[120px] font-medium transition-all" />
                    </div>

                    <button type="button" onClick={async () => {
                      showToast('Leave request submitted to HR.', 'success');
                      const msg = `🏝️ **LEAVE REQUEST**: ${currentUserProfile.name}\n📅 **Status**: Submitted via Dashboard Portal`;
                      await sendDiscordAlert(msg);
                    }} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-black tracking-[0.2em] uppercase shadow-[0_10px_30px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] group flex items-center justify-center gap-3">
                      <Palmtree size={18} className="group-hover:rotate-12 transition-transform" /> SUBMIT REQUEST
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: PROFILE */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl overflow-hidden relative transition-all hover:border-slate-700">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="shrink-0 flex flex-col items-center space-y-4">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('dp-upload').click()}>
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center text-3xl font-black text-slate-500 shadow-2xl transition-all group-hover:border-indigo-500 group-hover:bg-slate-700">
                        {userProfiles[currentUserProfile.id]?.photoURL ? (
                          <img src={userProfiles[currentUserProfile.id].photoURL} className="w-full h-full object-cover transition-opacity group-hover:opacity-40" alt="" />
                        ) : (
                          currentUserProfile.name.charAt(0)
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="text-white" size={32} />
                        </div>
                      </div>
                      <input id="dp-upload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) return showToast('File too large (max 2MB)', 'error');
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result;
                          try {
                            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'user_profiles', currentUserProfile.id), {
                              photoURL: base64, lastUpdated: new Date().toISOString()
                            }, { merge: true });
                            showToast('Display picture updated.', 'success');
                          } catch (err) {
                            showToast('Failed to update picture.', 'error');
                          }
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <UserCircle size={16} /> Profile & Sign-In Identity
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Sign-In User ID (Alias)</label>
                          <input name="customUsername" type="text" defaultValue={userProfiles[currentUserProfile.id]?.customUsername || currentUserProfile.usernames?.[0] || currentUserProfile.id} placeholder="e.g. samiran" className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-indigo-300 font-bold outline-none focus:border-indigo-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Employee Email</label>
                          <input required name="email" type="email" defaultValue={userProfiles[currentUserProfile.id]?.email || currentUserProfile.emails?.[0] || ''} placeholder="you@studio.com" className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium transition-all" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Phone Number</label>
                          <input name="phone" type="tel" defaultValue={userProfiles[currentUserProfile.id]?.phone || ''} placeholder="+91..." className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION: EMERGENCY CONTACTS */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all hover:border-slate-700">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <ShieldAlert size={16} /> Emergency Contacts
                </h3>
                <div className="bg-slate-950/30 rounded-2xl p-6 border border-slate-800/50">
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Contact Details</label>
                  <textarea name="emergency" defaultValue={userProfiles[currentUserProfile.id]?.emergency || ''} placeholder="Name, Relationship, Phone Number..." className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 min-h-[100px] font-medium transition-all" />
                </div>
              </div>

              {/* SECTION: NTFY PUSH NOTIFICATIONS */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all hover:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Bell size={16} /> Mobile & Desktop Push Notifications (ntfy)
                    </h3>
                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Receive live lockscreen alerts for tasks, QC renders & studio updates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNtfyModal(true)}
                    className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-indigo-500/30 flex items-center gap-2"
                  >
                    <Smartphone size={14} /> Open Setup & QR Codes
                  </button>
                </div>
                <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Personal Topic</p>
                    <code className="text-sm font-mono font-black text-indigo-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                      {getUserNtfyTopic(currentUserProfile.id)}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://ntfy.sh/${getUserNtfyTopic(currentUserProfile.id)}`);
                        showToast('Personal ntfy link copied!', 'success');
                      }}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Copy size={14} /> Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await sendDirectUserAlert(
                          currentUserProfile.id,
                          `🔔 Push Alert Test`,
                          `Hello ${currentUserProfile.name}! Your ntfy push connection is active and operational.`
                        );
                        showToast(`Test push sent to ${getUserNtfyTopic(currentUserProfile.id)}!`, 'success');
                      }}
                      className="px-4 py-2.5 bg-emerald-950/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/30 flex items-center gap-1.5"
                    >
                      <Sparkles size={14} /> Send Test Push
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: SECURITY */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-xl transition-all hover:border-slate-700">
                <h3 className="text-sm font-black text-red-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Lock size={16} /> Security
                </h3>
                <div className="max-w-xs relative group">
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Change 4-Digit Access PIN</label>
                  <input required name="pin" type={showSettingsPin ? "text" : "password"} inputMode="numeric" maxLength="4" defaultValue={userProfiles[currentUserProfile.id]?.pin || '0000'} className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 tracking-[0.5em] font-black transition-all" />
                  <button
                    type="button"
                    onClick={() => setShowSettingsPin(!showSettingsPin)}
                    className="absolute right-3 bottom-2.5 p-1 text-slate-600 hover:text-white transition-colors"
                  >
                    {showSettingsPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>


              <div className="flex justify-end pt-4">
                <button type="submit" className="w-full md:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest shadow-[0_10px_30px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-95">
                  SAVE ALL SETTINGS
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}



      {/* ADD PROJECT MODAL */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-white flex items-center uppercase tracking-widest"><Plus size={20} className="mr-3 text-indigo-400" /> Add New Project</h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddProjectSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Project Name</label>
                <input required name="name" type="text" placeholder="Project title..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client / Production House</label>
                <input required name="client" type="text" placeholder="Client name..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Director</label>
                  <input name="director" type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">DOP</label>
                  <input name="dop" type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Post Producer</label>
                  <input name="postProducer" type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Deliverables</label>
                  <input name="deliverables" type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client Phone</label>
                  <input name="clientPhone" type="tel" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client Email</label>
                  <input name="clientEmail" type="email" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Project Status</label>
                <select name="status" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-4 shrink-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button type="button" onClick={() => setShowAddProjectModal(false)} className="w-full sm:w-1/3 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-black tracking-widest transition-colors">
                  CANCEL
                </button>
                <button type="submit" className="w-full sm:w-2/3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-indigo-500/20 transition-all">
                  CREATE PROJECT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditProjectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-white flex items-center uppercase tracking-widest"><Edit size={20} className="mr-3 text-indigo-400" /> Edit Project Data</h3>
              <button onClick={() => setShowEditProjectModal(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleProjectEditSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Project Name</label>
                <input required name="name" defaultValue={showEditProjectModal.name} type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client / Production House</label>
                <input required name="client" defaultValue={showEditProjectModal.client} type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Director</label>
                  <input name="director" defaultValue={showEditProjectModal.director} type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">DOP</label>
                  <input name="dop" defaultValue={showEditProjectModal.dop} type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Post Producer</label>
                  <input name="postProducer" defaultValue={showEditProjectModal.postProducer} type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Deliverables</label>
                  <input name="deliverables" defaultValue={showEditProjectModal.deliverables} type="text" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client Phone</label>
                  <input name="clientPhone" defaultValue={showEditProjectModal.clientPhone} type="tel" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Client Email</label>
                  <input name="clientEmail" defaultValue={showEditProjectModal.clientEmail} type="email" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Project Status</label>
                <select name="status" defaultValue={showEditProjectModal.status} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-4 shrink-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button type="button" onClick={() => setShowEditProjectModal(null)} className="w-full sm:w-1/3 py-4 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-black tracking-widest transition-colors">
                  CANCEL
                </button>
                <button type="submit" className="w-full sm:w-2/3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-indigo-500/20 transition-all">
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-sm shadow-2xl p-6 md:p-10">
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Assign Staff</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">{showAssignModal.title}</p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {USERS.filter(u => !u.isArchived).map(u => {
                const isIN = isUserClockedIn(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => assignTask(showAssignModal.id, u.id)}
                    className={`w-full flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all border-2 ${isIN ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-slate-900 border-slate-800 opacity-50 grayscale hover:grayscale-0'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-black text-white">{u.name.charAt(0)}</div>
                      <span className="text-sm font-bold text-white">{u.name}</span>
                    </div>
                    {isIN && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowAssignModal(null)} className="w-full mt-8 py-4 bg-slate-800 text-slate-400 text-xs font-black tracking-widest rounded-xl hover:text-white transition-colors">
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* SOP HANDOFF MODAL */}
      {showSOPModal && (() => {
        const { task, nextStatus, type } = showSOPModal;

        let title = "Handoff Verification";
        let checklist = [];

        if (type === 'conform_to_assist') {
          title = "Conform Hand-off";
          checklist = ["XML successfully imported.", "Difference blend matches 100%."];
        } else if (type === 'assist_to_grade') {
          title = "Ready-to-Grade Check";
          checklist = ["Color space transform applied.", "Technical balance normalized."];
        } else if (type === 'grade_to_delivery') {
          title = "Delivery Verification";
          checklist = ["Renders correct resolution.", "Visual QC pass completed."];
        }

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 md:p-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-indigo-600 p-6 flex justify-between items-center shrink-0">
                <h3 className="text-base md:text-lg font-black text-white flex items-center uppercase tracking-widest">
                  <FileCheck2 className="mr-3" size={20} /> {title}
                </h3>
                <button onClick={() => setShowSOPModal(null)} className="text-indigo-200 hover:text-white">✕</button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-slate-300 mb-6 font-medium">
                  Verify operations before transferring to <span className="text-white font-bold uppercase tracking-widest bg-slate-800 px-2 py-1 rounded mx-1">{nextStatus}</span>.
                </p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const flaggedItems = checklist.filter((item, idx) => !formData.get(`check_${idx}`));
                  const nextAssignee = formData.get('nextAssignee');
                  const targetStatus = formData.get('targetStatus') || nextStatus;
                  executeStageAdvance(task.id, targetStatus, task.status, sopBreakdown, flaggedItems, nextAssignee);
                }} className="space-y-5">

                  {checklist.length > 0 && (
                    <div className="space-y-3 mb-8">
                      {checklist.map((item, idx) => (
                        <label key={idx} className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors group">
                          <input type="checkbox" name={`check_${idx}`} className="w-5 h-5 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900" />
                          <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {type === 'grade_to_delivery' && (
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                      <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Session Breakdown</label>
                      <textarea
                        required
                        value={sopBreakdown}
                        onChange={(e) => setSopBreakdown(e.target.value)}
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none min-h-[100px] font-medium"
                        placeholder="e.g. Mastered in ACEScct. Applied NR to shot 4."
                      />
                    </div>
                  )}

                  {hasPermission(currentUserProfile, PERMISSIONS.VIEW_DASHBOARD) && (
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                      <label className="block text-xs font-black text-amber-500 uppercase tracking-widest mb-3">LP: Select Next Phase</label>
                      <select name="targetStatus" defaultValue={nextStatus} className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none font-bold">
                        {WORKFLOW_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <label className="block text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Assign Next Staff</label>
                    <select name="nextAssignee" className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none font-bold">
                      <option value="">Leave Unassigned (LP Queue)</option>
                      {USERS.filter(u => !u.isArchived).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>

                  <div className="pt-6 shrink-0">
                    <button type="submit" className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest text-sm transition-colors shadow-lg shadow-emerald-500/20">
                      VERIFY & TRANSFER
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

        </div>

      <Toast />

      {showStagingPopup && <StagingPopup onClose={() => setShowStagingPopup(false)} />}

      {showNtfyModal && (
        <NtfyModal
          isOpen={showNtfyModal}
          onClose={() => setShowNtfyModal(false)}
          currentUserProfile={currentUserProfile}
          showToast={showToast}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav">
        {bottomNavTabs.map(tab => {
          const isActive = tab.id !== '__more__' && activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === '__more__') {
                  setIsSidebarOpen(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              {tab.id === 'chat' && (unreadTotal > 0 || unreadMentions > 0) ? (
                <div style={{ position: 'relative' }}>
                  <tab.icon size={22} />
                  <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
                </div>
              ) : (
                <tab.icon size={22} />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}