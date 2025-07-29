// update-firestore-rules.js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Set the environment variable for authentication
process.env.GOOGLE_APPLICATION_CREDENTIALS = "C:\\Users\\DELL\\Downloads\\bandwith-41c0a-firebase-adminsdk-fbsvc-32c8210c06.json";

const PROJECT_ID = 'bandwith-41c0a';

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

// Updated Firestore rules with virtualNetworks collection
const updatedRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/\$(database)/documents/users/\$(request.auth.uid)) &&
        get(/databases/\$(database)/documents/users/\$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is regular user
    function isRegularUser() {
      return request.auth != null && 
        exists(/databases/\$(database)/documents/users/\$(request.auth.uid)) &&
        get(/databases/\$(database)/documents/users/\$(request.auth.uid)).data.role == 'user';
    }
    
    // Helper function to check if user is accessing their own data
    function isOwnData(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // VirtualNetworks collection - Public read access for network selection
    match /virtualNetworks/{networkId} {
      // Anyone can read virtual networks (needed for network selection before login)
      allow read: if true;
      
      // Only admins can write to virtual networks
      allow write: if isAdmin();
    }
    
    // Users collection - Strict role-based access
    match /users/{userId} {
      // Regular users can only read/write their own document
      allow read, write: if isRegularUser() && isOwnData(userId);
      
      // Admins can read all user documents but cannot write to them
      allow read: if isAdmin();
      
      // Prevent admins from writing to user documents (maintain data integrity)
      allow write: if false;
    }
    
    // Devices collection - Strict role-based access
    match /devices/{deviceId} {
      // Regular users can only read/write their own device
      allow read, write: if isRegularUser() && isOwnData(deviceId);
      
      // Admins can read/write all device documents
      allow read, write: if isAdmin();
    }
    
    // UserStats collection - Strict role-based access
    match /userStats/{userId} {
      // Regular users can only read/write their own stats
      allow read, write: if isRegularUser() && isOwnData(userId);
      
      // Admins can read all userStats documents
      allow read: if isAdmin();
      
      // Admins cannot write to userStats (maintain data integrity)
      allow write: if false;
    }
    
    // Bandwidth collection - Admin only access
    match /bandwidth/{docId} {
      // Only admins can read/write bandwidth data
      allow read, write: if isAdmin();
      
      // Regular users cannot access bandwidth data
      allow read, write: if false;
    }
    
    // Default rule - deny all access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

async function updateFirestoreRules() {
  try {
    console.log('🔄 Updating Firestore security rules...');
    
    // Note: Firebase Admin SDK doesn't directly support updating Firestore rules
    // This would require the Firebase CLI or manual update via console
    // For now, let's verify the virtual networks exist
    
    console.log('📋 Checking if virtual networks exist...');
    const networksSnapshot = await db.collection('virtualNetworks').get();
    
    if (networksSnapshot.empty) {
      console.log('❌ No virtual networks found in Firestore');
      console.log('💡 Please run the seed script first: node seed-virtual-networks.cjs');
    } else {
      console.log(`✅ Found ${networksSnapshot.size} virtual networks in Firestore`);
      networksSnapshot.forEach(doc => {
        console.log(`   - ${doc.data().name} (${doc.data().status})`);
      });
    }
    
    console.log('\n📝 To update Firestore rules, please:');
    console.log('1. Go to https://console.firebase.google.com/');
    console.log('2. Select project: bandwith-41c0a');
    console.log('3. Go to Firestore Database > Rules');
    console.log('4. Copy and paste the rules from FIRESTORE_RULES_UPDATE.md');
    console.log('5. Click "Publish"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateFirestoreRules(); 