// test-permissions.cjs
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

async function testPermissions() {
  try {
    console.log('🔍 Testing Firestore permissions...');
    
    // Test 1: Check if virtual networks exist
    console.log('\n📋 Test 1: Checking virtual networks collection...');
    const networksSnapshot = await db.collection('virtualNetworks').get();
    
    if (networksSnapshot.empty) {
      console.log('❌ No virtual networks found!');
      console.log('💡 Run: node seed-virtual-networks.cjs');
      return;
    }
    
    console.log(`✅ Found ${networksSnapshot.size} virtual networks:`);
    networksSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (${data.status})`);
    });
    
    // Test 2: Check current rules (this will show what rules are active)
    console.log('\n📋 Test 2: Current Firestore rules status...');
    console.log('💡 If you see networks above, the rules are working!');
    console.log('💡 If you still get permission errors in the browser:');
    console.log('   1. Make sure you clicked "Publish" in Firebase Console');
    console.log('   2. Wait 1-2 minutes for rules to propagate');
    console.log('   3. Clear browser cache and refresh');
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
    console.log('\n💡 This error means the rules need to be updated.');
    console.log('📝 Follow the steps above to update Firestore rules.');
  }
}

testPermissions(); 