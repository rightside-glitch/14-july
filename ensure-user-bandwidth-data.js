import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔄 Ensuring User Bandwidth Data for Total Calculation...');

// Initialize Firebase Admin using environment variables
let app;
try {
  // Try to use service account from environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    app = initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    // Use default credentials (for local development)
    app = initializeApp();
  }
} catch (error) {
  console.log('Using default Firebase credentials...');
  app = initializeApp();
}

const db = getFirestore(app);

async function ensureUserBandwidthData() {
  try {
    console.log('📊 Fetching users from Firestore...');

    // Get all users with 'user' role
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role === 'user');

    console.log(`Found ${users.length} users with 'user' role`);

    let totalBandwidth = 0;

    // Ensure each user has proper bandwidth data
    for (const user of users) {
      try {
        // Generate realistic bandwidth usage (0.5 to 5.0 GB/h)
        const currentUsage = Math.random() * 4.5 + 0.5;
        const usedData = Math.random() * 80 + 20; // 20-100 GB used
        
        totalBandwidth += currentUsage;

        // Update or create userStats document
        await db.collection('userStats').doc(user.id).set({
          userEmail: user.email,
          userId: user.id,
          role: 'user',
          dataLimit: 100,
          currentUsage: currentUsage,
          usedData: usedData,
          lastLogin: new Date(),
          loginCount: Math.floor(Math.random() * 10) + 1,
          lastUpdated: new Date(),
          networkCapacity: 100
        }, { merge: true });
        
        console.log(`  ✅ Updated ${user.email}: ${currentUsage.toFixed(2)} GB/h`);
      } catch (error) {
        console.error(`  ❌ Error updating ${user.email}:`, error);
      }
    }

    // Create a global bandwidth summary
    await db.collection('bandwidthSummary').doc('current').set({
      totalUsers: users.length,
      totalBandwidthUsage: totalBandwidth,
      maxCapacity: 100,
      lastUpdated: new Date(),
      description: 'Current total bandwidth usage across all users'
    });

    console.log('✅ User bandwidth data ensured!');
    console.log('📊 Summary:');
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - Total bandwidth: ${totalBandwidth.toFixed(2)} GB/h`);
    console.log(`   - Average per user: ${(totalBandwidth / users.length).toFixed(2)} GB/h`);
    console.log(`   - Capacity usage: ${((totalBandwidth / 100) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error ensuring user bandwidth data:', error);
  }
}

// Run the setup
ensureUserBandwidthData().then(() => {
  console.log('🎉 Bandwidth data setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Bandwidth data setup failed:', error);
  process.exit(1);
}); 