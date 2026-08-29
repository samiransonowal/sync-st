import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { db, auth, appId } from '../services/firebase';

const AppContext = createContext(null);

export function AppContextProvider({ children }) {
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
  const [submissions, setSubmissions] = useState([]);
  const [longFormatLogs, setLongFormatLogs] = useState([]);

  const [toast, setToast] = useState(null);

  // --- AUTHENTICATION & INITIALIZATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- DATA SYNC ---
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

  const value = {
    user,
    currentUserProfile,
    setCurrentUserProfile,
    projects,
    setProjects,
    tasks,
    setTasks,
    bookings,
    setBookings,
    presence,
    setPresence,
    leaves,
    setLeaves,
    userProfiles,
    setUserProfiles,
    messages,
    setMessages,
    notepads,
    setNotepads,
    waTemplates,
    setWaTemplates,
    shiftLogs,
    setShiftLogs,
    submissions,
    setSubmissions,
    longFormatLogs,
    setLongFormatLogs,
    toast,
    setToast
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
}
