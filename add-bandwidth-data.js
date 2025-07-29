const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Generate sample bandwidth data
function generateBandwidthData() {
  const data = [];
  const now = Date.now();
  
  // Generate data for the last 20 minutes (1200 seconds)
  for (let i = 1200; i >= 0; i -= 60) { // Every minute
    const timestamp = now - (i * 1000);
    const baseUsage = 2.5; // Base usage in GB/h
    const variation = Math.sin(i * 0.1) * 1.5; // Add some variation
    const usage = Math.max(0, baseUsage + variation);
    
    data.push({
      timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
      usage: usage,
      totalUsage: usage,
      deviceCount: Math.floor(Math.random() * 5) + 3 // Random number of devices
    });
  }
  
  return data;
}

async function addBandwidthData() {
  try {
    console.log('📊 Adding sample bandwidth data to Firestore...');
    
    const bandwidthData = generateBandwidthData();
    
    for (const dataPoint of bandwidthData) {
      await db.collection('bandwidth').add(dataPoint);
    }
    
    console.log(`✅ Added ${bandwidthData.length} bandwidth data points`);
    console.log('📈 Charts should now display real data instead of samples');
    
  } catch (error) {
    console.error('❌ Error adding bandwidth data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addBandwidthData(); 