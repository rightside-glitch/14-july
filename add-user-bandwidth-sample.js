import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function addUserBandwidthSample() {
  const usersSnapshot = await db.collection('users').get();
  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const bandwidthCol = db.collection('userBandwidth').doc(uid).collection('data');
    // Add 20 sample points (1 per 5 seconds)
    const now = Date.now();
    for (let i = 19; i >= 0; i--) {
      const timestamp = now - i * 5000;
      const usage = Math.max(0, 2.5 + Math.sin(i * 0.2) * 1.5 + Math.random());
      await bandwidthCol.add({ timestamp, usage });
    }
    console.log(`Added sample bandwidth data for user: ${uid}`);
  }
  console.log('Done adding user bandwidth sample data.');
}

addUserBandwidthSample().catch(console.error); 