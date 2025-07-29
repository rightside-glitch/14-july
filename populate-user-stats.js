// Script to populate userStats/{uid} for all users with sample data
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function populateUserStats() {
  const usersSnapshot = await db.collection('users').get();
  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const statsRef = db.collection('userStats').doc(uid);
    await statsRef.set({
      currentUsage: Math.random() * 100,
      dailyData: [
        { time: '08:00', download: Math.random() * 2, upload: Math.random() * 1 },
        { time: '12:00', download: Math.random() * 2, upload: Math.random() * 1 },
        { time: '16:00', download: Math.random() * 2, upload: Math.random() * 1 },
      ],
      deviceData: [
        { name: 'Laptop', value: 60, color: '#06B6D4' },
        { name: 'Phone', value: 40, color: '#10B981' },
      ],
      monthlyUsage: [
        { day: 'Mon', usage: Math.random() * 10 },
        { day: 'Tue', usage: Math.random() * 10 },
        { day: 'Wed', usage: Math.random() * 10 },
        { day: 'Thu', usage: Math.random() * 10 },
        { day: 'Fri', usage: Math.random() * 10 },
        { day: 'Sat', usage: Math.random() * 10 },
        { day: 'Sun', usage: Math.random() * 10 },
      ],
      usedData: Math.random() * 100,
    });
    console.log(`Populated userStats for user: ${uid}`);
  }
  console.log('Done populating userStats for all users.');
}

populateUserStats().catch(console.error); 