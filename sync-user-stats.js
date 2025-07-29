// Script to sync userStats/{uid} for all users based on device data
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function syncUserStats() {
  const usersSnapshot = await db.collection('users').get();
  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const userEmail = userDoc.data().email;
    // Aggregate device data for this user
    const devicesSnapshot = await db.collection('devices').where('user', '==', userEmail).get();
    const deviceData = [];
    let usedData = 0;
    devicesSnapshot.forEach(doc => {
      const d = doc.data();
      deviceData.push({ name: d.name, value: d.usage || 0, color: '#06B6D4' });
      usedData += d.usage || 0;
    });
    // Write to userStats/{uid}
    await db.collection('userStats').doc(uid).set({
      currentUsage: usedData, // or some other metric
      dailyData: [], // Fill in if you have per-day data
      deviceData,
      monthlyUsage: [], // Fill in if you have per-month data
      usedData
    }, { merge: true });
    console.log(`Synced userStats for user: ${uid}`);
  }
  console.log('Done syncing userStats for all users.');
}

syncUserStats().catch(console.error); 