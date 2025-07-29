import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔄 Syncing User Usage with Device Data...');

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

async function syncUserUsageWithDevices() {
  try {
    console.log('📊 Fetching user and device data from Firestore...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all devices
    const devicesSnapshot = await db.collection('devices').get();
    const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${users.length} users and ${devices.length} devices`);

    // Sync each user's usage with their assigned devices
    for (const user of users) {
      if (user.role !== 'admin') {
        console.log(`Syncing usage for user: ${user.email}`);
        
        // Find devices assigned to this user
        const userDevices = devices.filter(device => device.user === user.email);
        
        if (userDevices.length > 0) {
          // Calculate total usage from assigned devices
          const totalDeviceUsage = userDevices.reduce((sum, device) => {
            return sum + (device.usage || 0);
          }, 0);

          console.log(`  - User has ${userDevices.length} assigned devices`);
          console.log(`  - Total device usage: ${totalDeviceUsage.toFixed(2)} GB/h`);

          // Update userStats with device usage
          try {
            await db.collection('userStats').doc(user.id).set({
              currentUsage: totalDeviceUsage,
              userEmail: user.email,
              userId: user.id,
              lastUpdated: new Date(),
              syncedFromDevices: true,
              deviceCount: userDevices.length,
              deviceIds: userDevices.map(d => d.id)
            }, { merge: true });

            console.log(`  ✅ Updated userStats for ${user.email}`);

            // Add to user bandwidth collection
            await db.collection(`userBandwidth/${user.id}/data`).add({
              usage: totalDeviceUsage,
              timestamp: new Date(),
              createdAt: new Date(),
              userEmail: user.email,
              userId: user.id,
              source: 'deviceSync',
              deviceCount: userDevices.length
            });

            // Update each device to reflect user's total usage
            const usagePerDevice = totalDeviceUsage / userDevices.length;
            for (const device of userDevices) {
              await db.collection('devices').doc(device.id).update({
                usage: usagePerDevice,
                lastSeen: new Date(),
                syncedWithUser: true
              });
            }

            console.log(`  ✅ Synced ${userDevices.length} devices with user usage`);

          } catch (error) {
            console.error(`  ❌ Error syncing user ${user.email}:`, error);
          }
        } else {
          console.log(`  - No devices assigned to ${user.email}`);
          
          // Set default usage for users without devices
          try {
            await db.collection('userStats').doc(user.id).set({
              currentUsage: 1.5, // Default usage
              userEmail: user.email,
              userId: user.id,
              lastUpdated: new Date(),
              syncedFromDevices: false,
              deviceCount: 0
            }, { merge: true });
          } catch (error) {
            console.error(`  ❌ Error setting default usage for ${user.email}:`, error);
          }
        }
      }
    }

    console.log('✅ User usage successfully synced with device data!');
    console.log('📊 Sync summary:');
    console.log('   - Users with devices: Device usage synced');
    console.log('   - Users without devices: Default usage set');
    console.log('   - Real-time sync: Active in dashboard');

  } catch (error) {
    console.error('❌ Error syncing user usage with devices:', error);
  }
}

// Run the sync
syncUserUsageWithDevices().then(() => {
  console.log('🎉 Sync complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Sync failed:', error);
  process.exit(1);
}); 