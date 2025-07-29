import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function activateAllDevices() {
  const devicesSnapshot = await db.collection('devices').get();
  for (const docSnap of devicesSnapshot.docs) {
    await db.collection('devices').doc(docSnap.id).update({ status: 'active' });
    console.log(`Set device ${docSnap.id} to active`);
  }
  console.log('All devices set to active.');
}

activateAllDevices().catch(console.error); 