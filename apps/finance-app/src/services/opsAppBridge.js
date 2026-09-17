import { collection, onSnapshot } from 'firebase/firestore';
import { db, OPS_APP_ID } from '../firebase';

/**
 * OPS APP STRICT READ-ONLY BRIDGE
 * Reads live project and booking data from Studio Tunnel Ops App.
 * NEVER performs any write, update, or delete operations on Ops App paths.
 */

// Subscribe to live projects from Ops App (read-only)
export const subscribeToOpsProjects = (callback) => {
  try {
    const collRef = collection(db, 'artifacts', OPS_APP_ID, 'public', 'data', 'projects');
    return onSnapshot(collRef, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(projects);
    }, (err) => {
      console.warn('[OpsAppBridge] Read error on projects:', err);
      callback([]);
    });
  } catch (error) {
    console.error('[OpsAppBridge] Failed to subscribe to projects:', error);
    callback([]);
    return () => {};
  }
};

// Subscribe to live bookings from Ops App (read-only)
export const subscribeToOpsBookings = (callback) => {
  try {
    const collRef = collection(db, 'artifacts', OPS_APP_ID, 'public', 'data', 'bookings');
    return onSnapshot(collRef, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bookings);
    }, (err) => {
      console.warn('[OpsAppBridge] Read error on bookings:', err);
      callback([]);
    });
  } catch (error) {
    console.error('[OpsAppBridge] Failed to subscribe to bookings:', error);
    callback([]);
    return () => {};
  }
};

// Extract unique clients/parties from Ops projects
export const extractPartiesFromProjects = (projects = []) => {
  const partyMap = new Map();

  projects.forEach(p => {
    const name = (p.client_name || p.client || p.production_house || '').trim();
    if (!name) return;

    const key = name.toLowerCase();
    if (!partyMap.has(key)) {
      partyMap.set(key, {
        id: `party_${key.replace(/[^a-z0-9]/g, '_')}`,
        name: name,
        poc_name: p.poc_name || p.poc || '',
        phone: p.poc_phone || p.phone || '',
        email: p.poc_email || p.email || '',
        gstin: p.client_gstin || p.gstin || '',
        pan: p.client_pan || p.pan || '',
        billing_address: p.billing_address || p.address || '',
        type: 'customer'
      });
    } else {
      // Merge extra details if missing
      const existing = partyMap.get(key);
      if (!existing.phone && p.poc_phone) existing.phone = p.poc_phone;
      if (!existing.gstin && p.client_gstin) existing.gstin = p.client_gstin;
      if (!existing.pan && p.client_pan) existing.pan = p.client_pan;
      if (!existing.billing_address && p.billing_address) existing.billing_address = p.billing_address;
    }
  });

  return Array.from(partyMap.values());
};
