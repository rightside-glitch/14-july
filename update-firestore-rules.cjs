// update-firestore-rules.cjs
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

async function checkVirtualNetworks() {
  try {
    console.log('🔄 Checking if virtual networks exist...');
    
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
    
    console.log('\n📝 To fix the display issue, please update Firestore rules:');
    console.log('1. Go to https://console.firebase.google.com/');
    console.log('2. Select project: bandwith-41c0a');
    console.log('3. Go to Firestore Database > Rules');
    console.log('4. Copy and paste the rules from FIRESTORE_RULES_UPDATE.md');
    console.log('5. Click "Publish"');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkVirtualNetworks(); 