import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// --- DYNAMIC SANDBOX SWITCHER ---
export const isSandboxEnv = typeof window !== 'undefined' && (
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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = isSandboxEnv ? '1:203252538450:web:e6da657340ca315e0e538b' : (
  typeof __app_id !== 'undefined' ? __app_id : '1:20065203766:web:1ae9688fc973f4bad9ca97'
);
