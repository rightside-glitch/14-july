const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample devices data
const sampleDevices = [
  {
    name: "Admin Desktop",
    status: "active",
    type: "desktop",
    usage: 2.5,
    user: "admin@company.com",
    ip: "192.168.1.100",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Sarah's MacBook Pro",
    status: "active",
    type: "laptop",
    usage: 1.8,
    user: "sarah@company.com",
    ip: "192.168.1.101",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Mike's iPhone",
    status: "active",
    type: "mobile",
    usage: 0.5,
    user: "mike@company.com",
    ip: "192.168.1.102",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Marketing Team Laptop",
    status: "active",
    type: "laptop",
    usage: 1.2,
    user: "marketing@company.com",
    ip: "192.168.1.103",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Sales Desktop",
    status: "active",
    type: "desktop",
    usage: 3.1,
    user: "sales@company.com",
    ip: "192.168.1.104",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Conference Room TV",
    status: "active",
    type: "tv",
    usage: 0.8,
    user: "conference@company.com",
    ip: "192.168.1.105",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Gaming PC",
    status: "active",
    type: "gaming",
    usage: 4.2,
    user: "gaming@company.com",
    ip: "192.168.1.106",
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addSampleDevices() {
  try {
    console.log('Adding sample devices to Firestore...');
    
    for (const device of sampleDevices) {
      const docRef = await db.collection('devices').add(device);
      console.log(`Device "${device.name}" added with ID: ${docRef.id}`);
    }
    
    console.log('✅ All sample devices added successfully!');
  } catch (error) {
    console.error('❌ Error adding devices:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addSampleDevices(); 