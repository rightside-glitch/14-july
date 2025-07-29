import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔄 Syncing Admin Dashboard with User Data...');

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

async function syncAdminWithUsers() {
  try {
    console.log('📊 Fetching user data from Firestore...');

    // Get all user stats
    const userStatsSnapshot = await db.collection('userStats').get();
    const userStats = userStatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all devices
    const devicesSnapshot = await db.collection('devices').get();
    const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${userStats.length} user stats and ${devices.length} devices`);

    // Calculate total usage from user data
    const totalUsage = userStats.reduce((sum, stat) => sum + (stat.currentUsage || 0), 0);
    const totalUsedData = userStats.reduce((sum, stat) => sum + (stat.usedData || 0), 0);
    const activeDevices = devices.filter(d => d.status === 'active').length;

    console.log('📈 Calculated totals from user data:');
    console.log(`   Total Usage: ${totalUsage.toFixed(1)} GB/h`);
    console.log(`   Total Used Data: ${totalUsedData.toFixed(1)} GB`);
    console.log(`   Active Devices: ${activeDevices}`);

    // Update global bandwidth collection with user data
    console.log('🔄 Updating global bandwidth collection...');
    const bandwidthRef = db.collection('bandwidth');
    const now = new Date();
    
    await bandwidthRef.add({
      totalUsage,
      timestamp: now,
      createdAt: now,
      deviceCount: devices.length,
      activeDeviceCount: activeDevices,
      userCount: userStats.length,
      totalUsedData,
      source: 'userStats',
      synced: true
    });

    // Create admin sync collection for each user
    console.log('🔄 Creating admin sync data for each user...');
    for (const stat of userStats) {
      const adminSyncRef = db.collection(`adminUserSync/${stat.id}/data`);
      
      await adminSyncRef.add({
        currentUsage: stat.currentUsage || 0,
        usedData: stat.usedData || 0,
        dataLimit: stat.dataLimit || 100,
        timestamp: now,
        createdAt: now,
        userEmail: stat.userEmail,
        userId: stat.id,
        synced: true
      });
    }

    // Update device usage to match user data
    console.log('🔄 Syncing device usage with user data...');
    for (const device of devices) {
      if (device.status === 'active') {
        // Find user for this device
        const userStat = userStats.find(stat => stat.userEmail === device.user);
        if (userStat) {
          // Update device usage to match user's current usage
          const deviceUsageRef = db.collection(`deviceUsage/${device.id}/data`);
          await deviceUsageRef.add({
            usage: userStat.currentUsage || device.usage || 0,
            timestamp: now,
            createdAt: now,
            deviceName: device.name,
            deviceType: device.type,
            user: device.user,
            syncedFromUser: true,
            originalUsage: device.usage
          });
        }
      }
    }

    console.log('✅ Admin dashboard successfully synced with user data!');
    console.log('📊 Admin dashboard will now show:');
    console.log('   - Real user usage data');
    console.log('   - Accurate network load calculations');
    console.log('   - Live user data sync section');
    console.log('   - Device usage matching user assignments');

  } catch (error) {
    console.error('❌ Error syncing admin with users:', error);
  }
}

// Run the sync
syncAdminWithUsers().then(() => {
  console.log('🎉 Sync complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Sync failed:', error);
  process.exit(1);
}); 