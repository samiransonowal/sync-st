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
    console.log('Signed in anonymously');

    const app_id = "1:20065203766:web:1ae9688fc973f4bad9ca97";
    const projectsCol = collection(db, "artifacts", app_id, "public", "data", "projects");
    const snapshot = await getDocs(projectsCol);
    console.log(`Found ${snapshot.size} projects in Firestore`);
    
    // Fetch CSV
    const url = 'https://docs.google.com/spreadsheets/d/1YEvUPQ_ZKJyUUPM2Ib-7ZnrliZoOs5Byhf9Ga8Uzkpg/gviz/tq?tqx=out:csv&sheet=Project_Billing_Ledger';
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.trim().split('\n');
    
    const ledger = [];
    lines.forEach((l, i) => {
      if (i === 0) return;
      const cols = l.split(',').map(c => c.replace(/^"|"$/g, ''));
      if (cols[0] && cols[0] !== 'Project Code ID') {
        ledger.push({ code: cols[0], name: cols[3] || '', client: cols[4] || '' });
      }
    });
    
    let updated = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const docName = (data.name || '').toLowerCase();
      const docClient = (data.client || '').toLowerCase();
      
      let matchedCode = null;
      for (const item of ledger) {
        if (item.name.toLowerCase() === docName || (item.name && docName.includes(item.name.toLowerCase())) || (docName && item.name.toLowerCase().includes(docName))) {
          matchedCode = item.code;
          break;
        }
      }
      
      if (matchedCode) {
        console.log(`Updating ${docSnap.id} (${data.name}) -> ${matchedCode}`);
        await setDoc(docSnap.ref, { projectCode: matchedCode }, { merge: true });
        updated++;
      } else {
        console.log(`Could not find match for ${docSnap.id} (${data.name})`);
      }
    }
    console.log(`Updated ${updated} projects.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
