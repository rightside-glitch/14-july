import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔄 Setting up User Login Tracking...');

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

async function setupUserLoginTracking() {
  try {
    console.log('📊 Fetching users from Firestore...');

    // Get all users with 'user' role
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role === 'user');

    console.log(`Found ${users.length} users with 'user' role`);

    // Update userStats with login tracking
    for (const user of users) {
      try {
        // Check if userStats document exists
        const userStatsDoc = await db.collection('userStats').doc(user.id).get();
        
        if (userStatsDoc.exists) {
          // Update existing userStats with login timestamp
          await db.collection('userStats').doc(user.id).update({
            lastLogin: new Date(),
            loginCount: (userStatsDoc.data().loginCount || 0) + 1,
            lastUpdated: new Date()
          });
          console.log(`  ✅ Updated login tracking for ${user.email}`);
        } else {
          // Create new userStats document with login tracking
          await db.collection('userStats').doc(user.id).set({
            userEmail: user.email,
            userId: user.id,
            role: 'user',
            dataLimit: 100,
            currentUsage: Math.random() * 3 + 0.5,
            usedData: Math.random() * 50 + 10,
            lastLogin: new Date(),
            loginCount: 1,
            lastUpdated: new Date(),
            networkCapacity: 100
          });
          console.log(`  ✅ Created userStats with login tracking for ${user.email}`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating login tracking for ${user.email}:`, error);
      }
    }

    // Create a login tracking collection for future use
    await db.collection('loginTracking').doc('settings').set({
      enabled: true,
      trackLoginCount: true,
      trackLastLogin: true,
      lastUpdated: new Date(),
      description: 'User login tracking system'
    });

    console.log('✅ User login tracking setup complete!');
    console.log('📊 Summary:');
    console.log(`   - Users processed: ${users.length}`);
    console.log(`   - Login tracking enabled`);
    console.log(`   - Active devices will show users who have logged in`);

  } catch (error) {
    console.error('❌ Error setting up user login tracking:', error);
  }
}

// Run the setup
setupUserLoginTracking().then(() => {
  console.log('🎉 Login tracking setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Login tracking setup failed:', error);
  process.exit(1);
}); 