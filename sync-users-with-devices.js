import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔄 Syncing Users with Devices (1:1 ratio)...');

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

async function syncUsersWithDevices() {
  try {
    console.log('📊 Fetching users and devices from Firestore...');

    // Get all users with 'user' role
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role === 'user');

    // Get all devices
    const devicesSnapshot = await db.collection('devices').get();
    const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${users.length} users and ${devices.length} devices`);

    // Ensure each user has exactly one device
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      // Check if user already has a device
      const userDevices = devices.filter(device => device.user === user.email);
      
      if (userDevices.length === 0) {
        // Create a device for this user
        console.log(`  - Creating device for ${user.email}`);
        await db.collection('devices').add({
          name: `${user.name || user.email}'s Device`,
          type: 'desktop',
          user: user.email,
          ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          usage: Math.random() * 2 + 0.5, // Random usage between 0.5-2.5 GB/h
          status: 'active',
          lastSeen: new Date(),
          createdAt: new Date(),
          assignedToUser: true
        });
      } else if (userDevices.length > 1) {
        // Keep only the first device, remove others
        console.log(`  - User has ${userDevices.length} devices, keeping first one`);
        for (let i = 1; i < userDevices.length; i++) {
          await db.collection('devices').doc(userDevices[i].id).delete();
        }
      } else {
        // User has exactly one device, ensure it's active
        console.log(`  - User has 1 device, ensuring it's active`);
        await db.collection('devices').doc(userDevices[0].id).update({
          status: 'active',
          lastSeen: new Date()
        });
      }
    }

    // Update userStats with 100 GB network capacity
    console.log('🔄 Updating userStats with 100 GB network capacity...');
    for (const user of users) {
      try {
        await db.collection('userStats').doc(user.id).set({
          userEmail: user.email,
          userId: user.id,
          role: 'user',
          dataLimit: 100, // 100 GB per user
          currentUsage: Math.random() * 3 + 0.5, // Random current usage
          usedData: Math.random() * 50 + 10, // Random monthly usage
          lastUpdated: new Date(),
          networkCapacity: 100
        }, { merge: true });
        
        console.log(`  ✅ Updated userStats for ${user.email}`);
      } catch (error) {
        console.error(`  ❌ Error updating userStats for ${user.email}:`, error);
      }
    }

    // Update global network settings
    console.log('🔄 Updating global network settings...');
    await db.collection('networkSettings').doc('global').set({
      maxNetworkCapacity: 100, // GB/h
      totalUsers: users.length,
      totalDevices: users.length, // One device per user
      lastUpdated: new Date(),
      description: '100 GB total network capacity for all users'
    }, { merge: true });

    console.log('✅ Users successfully synced with devices!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Devices: ${users.length} (one per user)`);
    console.log(`   - Network Capacity: 100 GB`);
    console.log(`   - Active Devices: ${users.length}`);

  } catch (error) {
    console.error('❌ Error syncing users with devices:', error);
  }
}

// Run the sync
syncUsersWithDevices().then(() => {
  console.log('🎉 Sync complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Sync failed:', error);
  process.exit(1);
}); 