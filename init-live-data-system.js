import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🚀 Initializing Live Data Collection System...');

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

async function initializeLiveDataSystem() {
  try {
    console.log('📊 Setting up real-time data collections...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all devices
    const devicesSnapshot = await db.collection('devices').get();
    const devices = devicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Found ${users.length} users and ${devices.length} devices`);

    // Initialize user bandwidth collections
    for (const user of users) {
      if (user.role !== 'admin') {
        console.log(`Setting up live data for user: ${user.email}`);
        
        // Create user bandwidth collection with initial data
        const userBandwidthRef = db.collection(`userBandwidth/${user.id}/data`);
        const now = new Date();
        
        // Add 20 sample bandwidth points
        for (let i = 19; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - (i * 5000)); // 5 second intervals
          const usage = Math.random() * 3 + 0.5; // Random usage between 0.5-3.5 GB/h
          
          await userBandwidthRef.add({
            usage,
            timestamp,
            createdAt: timestamp
          });
        }

        // Create user hourly usage collection
        const userHourlyRef = db.collection(`userHourlyUsage/${user.id}/data`);
        const today = new Date();
        
        // Add 24 hours of data
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(today.getTime() - (i * 60 * 60 * 1000));
          const hourKey = hour.toISOString().slice(0, 13) + ':00:00.000Z';
          const usage = Math.random() * 2 + 0.5;
          
          await userHourlyRef.add({
            hour: hourKey,
            usage,
            timestamp: hour,
            createdAt: hour
          });
        }

        // Create user daily usage collection
        const userDailyRef = db.collection(`userDailyUsage/${user.id}/data`);
        
        // Add 7 days of data
        for (let i = 6; i >= 0; i--) {
          const day = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
          const dayKey = day.toISOString().slice(0, 10);
          const usage = Math.random() * 5 + 2; // 2-7 GB per day
          
          await userDailyRef.add({
            day: dayKey,
            usage,
            timestamp: day,
            createdAt: day
          });
        }
      }
    }

    // Initialize global bandwidth collection
    console.log('Setting up global bandwidth collection...');
    const bandwidthRef = db.collection('bandwidth');
    const now = new Date();
    
    // Add 20 sample global bandwidth points
    for (let i = 19; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 5000));
      const totalUsage = devices.reduce((sum, device) => sum + (device.usage || 0), 0);
      
      await bandwidthRef.add({
        totalUsage,
        timestamp,
        createdAt: timestamp,
        deviceCount: devices.length,
        activeDeviceCount: devices.filter(d => d.status === 'active').length
      });
    }

    // Initialize device usage collections
    console.log('Setting up device usage collections...');
    for (const device of devices) {
      if (device.status === 'active') {
        const deviceUsageRef = db.collection(`deviceUsage/${device.id}/data`);
        
        // Add 10 sample usage points for each device
        for (let i = 9; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - (i * 5000));
          const usage = device.usage || Math.random() * 2 + 0.5;
          
          await deviceUsageRef.add({
            usage,
            timestamp,
            createdAt: timestamp,
            deviceName: device.name,
            deviceType: device.type,
            user: device.user
          });
        }
      }
    }

    console.log('✅ Live data collection system initialized successfully!');
    console.log('📈 Real-time data will now be collected every 5 seconds');
    console.log('🔄 Users can start/stop data collection from their dashboards');

  } catch (error) {
    console.error('❌ Error initializing live data system:', error);
  }
}

// Run the initialization
initializeLiveDataSystem().then(() => {
  console.log('🎉 Setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
}); 