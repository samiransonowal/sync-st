const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAkkiYgBR8-eYWiyBfHR_n20O_WCF9gfK4",
  authDomain: "studio-tunnel.firebaseapp.com",
  projectId: "studio-tunnel",
  storageBucket: "studio-tunnel.firebasestorage.app",
  messagingSenderId: "20065203766",
  appId: "1:20065203766:web:1ae9688fc973f4bad9ca97",
  measurementId: "G-DK3HJJQ78L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInAnonymously(auth);
    console.log('Signed in anonymously to Firestore');

    const app_id = "1:20065203766:web:1ae9688fc973f4bad9ca97";
    const projectsCol = collection(db, "artifacts", app_id, "public", "data", "projects");
    const snapshot = await getDocs(projectsCol);
    console.log(`Found ${snapshot.size} projects in Firestore collection`);

    // 1. Fetch FY 2026-27 Active Ledger
    const url27 = 'https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/gviz/tq?tqx=out:csv&sheet=Project_Billing_Ledger';
    const res27 = await fetch(url27);
    const text27 = await res27.text();
    
    // 2. Fetch FY 2025-26 Archive Ledger
    const url26 = 'https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/gviz/tq?tqx=out:csv&sheet=Project_Billing_Ledger_FY25_26';
    const res26 = await fetch(url26);
    const text26 = await res26.text();

    // 3. Fetch Client_CRM Tab
    const urlCrm = 'https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/gviz/tq?tqx=out:csv&sheet=Client_CRM';
    const resCrm = await fetch(urlCrm);
    const textCrm = await resCrm.text();

    const parseCsvRows = (text, isLedger = true) => {
      const lines = text.trim().split('\n');
      const items = [];
      lines.forEach((l, i) => {
        if (i === 0) return;
        const cols = l.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (isLedger) {
          const code = cols[0];
          const name = cols[3] || '';
          const client = cols[4] || '';
          if (code && code !== 'Project Code ID' && !code.includes('[BIL-01]')) {
            items.push({ code, name, client });
          }
        } else {
          const name = cols[0];
          if (name && name !== 'Client Name' && !name.includes('[CRM-01]')) {
            items.push({ name, email: cols[1] || '', phone: cols[2] || '', gstin: cols[3] || '', pan: cols[4] || '', address: cols[5] || '' });
          }
        }
      });
      return items;
    };

    const ledger27 = parseCsvRows(text27, true);
    const ledger26 = parseCsvRows(text26, true);
    const crmList = parseCsvRows(textCrm, false);

    const allLedgerItems = [...ledger27, ...ledger26];
    console.log(`Loaded ${allLedgerItems.length} total projects across both FYs (${ledger27.length} FY27 + ${ledger26.length} FY26)`);
    console.log(`Loaded ${crmList.length} CRM clients`);

    // Update existing Firestore docs and add missing ones
    let updatedCount = 0;
    let createdCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const docName = (data.name || data.projectName || '').toLowerCase().trim();
      const docCode = (data.projectCode || data.code || '').toLowerCase().trim();

      let matchedItem = allLedgerItems.find(item => 
        (item.code && item.code.toLowerCase() === docCode) ||
        (item.name && item.name.toLowerCase() === docName) ||
        (docName && item.name && (docName.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(docName)))
      );

      if (matchedItem) {
        console.log(`Updating ${docSnap.id} (${data.name}) -> code: ${matchedItem.code}`);
        await setDoc(docSnap.ref, {
          code: matchedItem.code,
          projectCode: matchedItem.code,
          project_code_id: matchedItem.code,
          id: matchedItem.code,
          name: matchedItem.name || data.name,
          projectName: matchedItem.name || data.name,
          client: matchedItem.client || data.client,
          clientName: matchedItem.client || data.client
        }, { merge: true });
        updatedCount++;
      }
    }

    // Also sync all missing projects from master ledger into Firestore!
    for (const item of allLedgerItems) {
      if (!item.code) continue;
      const cleanDocId = item.code.replace(/[^a-zA-Z0-9_-]/g, '_');
      const docRef = doc(db, "artifacts", app_id, "public", "data", "projects", cleanDocId);
      await setDoc(docRef, {
        code: item.code,
        projectCode: item.code,
        project_code_id: item.code,
        id: item.code,
        name: item.name,
        projectName: item.name,
        client: item.client,
        clientName: item.client,
        createdAt: new Date().toISOString()
      }, { merge: true });
      createdCount++;
    }

    // Sync CRM clients to Firestore
    const clientsCol = collection(db, "artifacts", app_id, "public", "data", "clients");
    for (const client of crmList) {
      if (!client.name) continue;
      const clientDocId = client.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const clientRef = doc(db, "artifacts", app_id, "public", "data", "clients", clientDocId);
      await setDoc(clientRef, client, { merge: true });
    }

    console.log(`✅ SUCCESS: Synced ${createdCount} total projects with normalized codes (code, projectCode, project_code_id, id) & ${crmList.length} CRM clients into Firestore!`);
    process.exit(0);
  } catch (err) {
    console.error('ERROR syncing Firestore:', err);
    process.exit(1);
  }
}

run();
