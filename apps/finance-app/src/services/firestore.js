import { 
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc, 
  onSnapshot, getDoc 
} from 'firebase/firestore';
import { db, OPS_APP_ID } from '../firebase';

// Collection name helper (namespaced within artifacts/{appId}/public/data/)
const getCollPath = (name) => `artifacts/${OPS_APP_ID}/public/data/comptroller_${name}`;

/**
 * INVOICES (Sale Invoices)
 */
export const subscribeToInvoices = (callback) => {
  const collRef = collection(db, getCollPath('invoices'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort descending by invoice_number or created_at
    list.sort((a, b) => (Number(b.invoice_number) || 0) - (Number(a.invoice_number) || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to invoices:', err);
    callback([]);
  });
};

export const saveInvoice = async (invoiceData) => {
  const collRef = collection(db, getCollPath('invoices'));
  const now = new Date().toISOString();
  
  if (invoiceData.id) {
    const docRef = doc(db, getCollPath('invoices'), invoiceData.id);
    await updateDoc(docRef, {
      ...invoiceData,
      updated_at: now
    });
    return invoiceData.id;
  } else {
    // Increment global invoice counter
    const nextNumber = await getNextInvoiceNumber();
    const payload = {
      ...invoiceData,
      invoice_number: invoiceData.invoice_number || nextNumber,
      created_at: now,
      updated_at: now
    };
    const docRef = await addDoc(collRef, payload);
    return docRef.id;
  }
};

export const saveBulkInvoices = async (invoiceList) => {
  const now = new Date().toISOString();
  let count = 0;
  for (const inv of invoiceList) {
    const docRef = doc(db, getCollPath('invoices'), inv.id);
    await setDoc(docRef, {
      ...inv,
      created_at: inv.created_at || now,
      updated_at: now
    }, { merge: true });
    count++;
  }
  return count;
};

export const deleteInvoice = async (invoiceId) => {
  const docRef = doc(db, getCollPath('invoices'), invoiceId);
  await deleteDoc(docRef);
};

/**
 * AUTO-INCREMENT INVOICE NUMBER
 */
export const getNextInvoiceNumber = async () => {
  try {
    const settingsRef = doc(db, getCollPath('settings'), 'global_counters');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const data = snap.data();
      const current = Number(data.last_invoice_number) || 159;
      const next = current + 1;
      await setDoc(settingsRef, { last_invoice_number: next }, { merge: true });
      return next;
    } else {
      // Default initial from Vyapar screenshot (starts around 160)
      await setDoc(settingsRef, { last_invoice_number: 160 }, { merge: true });
      return 160;
    }
  } catch (err) {
    console.warn('Could not read invoice counter, defaulting:', err);
    return 160;
  }
};

/**
 * ESTIMATES / QUOTATIONS
 */
export const subscribeToEstimates = (callback) => {
  const collRef = collection(db, getCollPath('estimates'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to estimates:', err);
    callback([]);
  });
};

export const saveEstimate = async (estimateData) => {
  const collRef = collection(db, getCollPath('estimates'));
  const now = new Date().toISOString();
  if (estimateData.id) {
    const docRef = doc(db, getCollPath('estimates'), estimateData.id);
    await updateDoc(docRef, { ...estimateData, updated_at: now });
    return estimateData.id;
  } else {
    const docRef = await addDoc(collRef, {
      ...estimateData,
      status: estimateData.status || 'Open',
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }
};

/**
 * PAYMENTS-IN (Receipts & TDS Logging)
 */
export const subscribeToPaymentsIn = (callback) => {
  const collRef = collection(db, getCollPath('payments_in'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to payments_in:', err);
    callback([]);
  });
};

export const savePaymentIn = async (paymentData) => {
  const collRef = collection(db, getCollPath('payments_in'));
  const now = new Date().toISOString();
  if (paymentData.id) {
    const docRef = doc(db, getCollPath('payments_in'), paymentData.id);
    await updateDoc(docRef, { ...paymentData, updated_at: now });
    return paymentData.id;
  } else {
    const docRef = await addDoc(collRef, {
      ...paymentData,
      created_at: now,
      updated_at: now
    });

    // If linked to an invoice, optionally update invoice status
    if (paymentData.linked_invoice_id) {
      try {
        const invRef = doc(db, getCollPath('invoices'), paymentData.linked_invoice_id);
        const invSnap = await getDoc(invRef);
        if (invSnap.exists()) {
          const inv = invSnap.data();
          const prevReceived = Number(inv.amount_received) || 0;
          const newReceived = prevReceived + Number(paymentData.amount || 0);
          const total = Number(inv.invoice_total) || 0;
          const newPending = Math.max(0, total - newReceived);
          const newStatus = newPending <= 0 ? 'Paid' : 'Partial';

          await updateDoc(invRef, {
            amount_received: newReceived,
            pending_balance: newPending,
            status: newStatus,
            tds_status: paymentData.tds_status || inv.tds_status || 'TDS_DEDUCTED',
            updated_at: now
          });
        }
      } catch (e) {
        console.warn('Could not auto-update invoice on payment:', e);
      }
    }

    return docRef.id;
  }
};

/**
 * EXPENSES
 */
export const subscribeToExpenses = (callback) => {
  const collRef = collection(db, getCollPath('expenses'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to expenses:', err);
    callback([]);
  });
};

export const saveExpense = async (expenseData) => {
  const collRef = collection(db, getCollPath('expenses'));
  const now = new Date().toISOString();
  if (expenseData.id) {
    const docRef = doc(db, getCollPath('expenses'), expenseData.id);
    await updateDoc(docRef, { ...expenseData, updated_at: now });
    return expenseData.id;
  } else {
    const docRef = await addDoc(collRef, {
      ...expenseData,
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }
};

/**
 * PURCHASE BILLS
 */
export const subscribeToPurchaseBills = (callback) => {
  const collRef = collection(db, getCollPath('purchase_bills'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to purchase_bills:', err);
    callback([]);
  });
};

export const savePurchaseBill = async (billData) => {
  const collRef = collection(db, getCollPath('purchase_bills'));
  const now = new Date().toISOString();
  if (billData.id) {
    const docRef = doc(db, getCollPath('purchase_bills'), billData.id);
    await updateDoc(docRef, { ...billData, updated_at: now });
    return billData.id;
  } else {
    const docRef = await addDoc(collRef, {
      ...billData,
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }
};

/**
 * CREDIT NOTES
 */
export const subscribeToCreditNotes = (callback) => {
  const collRef = collection(db, getCollPath('credit_notes'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to credit_notes:', err);
    callback([]);
  });
};

export const saveCreditNote = async (noteData) => {
  const collRef = collection(db, getCollPath('credit_notes'));
  const now = new Date().toISOString();
  if (noteData.id) {
    const docRef = doc(db, getCollPath('credit_notes'), noteData.id);
    await updateDoc(docRef, { ...noteData, updated_at: now });
    return noteData.id;
  } else {
    const docRef = await addDoc(collRef, {
      ...noteData,
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }
};

/**
 * ITEMS (Services Catalogue)
 */
export const subscribeToItems = (callback) => {
  const collRef = collection(db, getCollPath('items'));
  return onSnapshot(collRef, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to items:', err);
    callback([]);
  });
};

export const saveItem = async (itemData) => {
  const collRef = collection(db, getCollPath('items'));
  if (itemData.id) {
    const docRef = doc(db, getCollPath('items'), itemData.id);
    await updateDoc(docRef, itemData);
    return itemData.id;
  } else {
    const docRef = await addDoc(collRef, itemData);
    return docRef.id;
  }
};

/**
 * SETTINGS
 */
export const getComptrollerSettings = async () => {
  try {
    const docRef = doc(db, getCollPath('settings'), 'firm_profile');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data();
    return {
      firm_name: 'CINELOOM POSTWORKS PRIVATE LIMITED',
      brand_name: 'Studio Tunnel',
      gstin: '27AABCC1234F1Z5',
      pan: 'AABCC1234F',
      state: 'Maharashtra',
      state_code: '27',
      bank_name: 'HDFC Bank',
      bank_account_no: '50200084729112',
      bank_ifsc: 'HDFC0000123',
      default_terms: 'Thanks for doing business with us!'
    };
  } catch (e) {
    console.warn('Could not read settings:', e);
    return null;
  }
};
