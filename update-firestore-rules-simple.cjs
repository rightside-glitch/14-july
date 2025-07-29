// update-firestore-rules-simple.cjs
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

// Simplified Firestore rules that will definitely work
const simplifiedRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // VirtualNetworks - PUBLIC READ ACCESS (most important)
    match /virtualNetworks/{networkId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Users - authenticated access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Devices - authenticated access
    match /devices/{deviceId} {
      allow read, write: if request.auth != null;
    }
    
    // UserStats - authenticated access
    match /userStats/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // UserBandwidth - authenticated access
    match /userBandwidth/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // UserHourlyUsage - authenticated access
    match /userHourlyUsage/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // UserDailyUsage - authenticated access
    match /userDailyUsage/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default - deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

async function updateFirestoreRules() {
  try {
    console.log('🔄 Attempting to update Firestore rules...');
    console.log('📝 Note: This script can check rules but cannot update them directly.');
    console.log('💡 You need to manually update rules in Firebase Console.');
    
    // Check if virtual networks exist
    console.log('\n📋 Checking virtual networks...');
    const networksSnapshot = await db.collection('virtualNetworks').get();
    
    if (networksSnapshot.empty) {
      console.log('❌ No virtual networks found in collection');
      console.log('💡 Run: node seed-virtual-networks.cjs');
    } else {
      console.log(`✅ Found ${networksSnapshot.size} virtual networks:`);
      networksSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name} (${data.status})`);
      });
    }
    
    console.log('\n📝 MANUAL STEPS REQUIRED:');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log('2. Select project: bandwith-41c0a');
    console.log('3. Go to Firestore Database > Rules');
    console.log('4. Replace ALL rules with the code below:');
    console.log('\n' + '='.repeat(50));
    console.log(simplifiedRules);
    console.log('='.repeat(50));
    console.log('\n5. Click "Publish"');
    console.log('6. Test your app at: http://localhost:8081/');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateFirestoreRules(); 