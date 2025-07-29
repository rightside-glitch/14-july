// initialize-user-data.cjs
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

// The user ID from the error logs
const USER_ID = 'nyIqLk6SFfdlNUbzznGdHXotSl83';

async function initializeUserData() {
  try {
    console.log('🔄 Initializing user data for:', USER_ID);
    
    // 1. Create userStats document
    console.log('📋 Creating userStats document...');
    const userStatsData = {
      userId: USER_ID,
      totalDataUsed: 0,
      currentBandwidth: 0,
      lastUpdated: new Date(),
      isActive: true,
      networkId: 'corp-vpn', // Default network
      networkName: 'Corporate VPN'
    };
    
    await db.collection('userStats').doc(USER_ID).set(userStatsData);
    console.log('✅ userStats document created');
    
    // 2. Create user document
    console.log('📋 Creating user document...');
    const userData = {
      uid: USER_ID,
      email: 'user@example.com',
      displayName: 'Test User',
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true
    };
    
    await db.collection('users').doc(USER_ID).set(userData);
    console.log('✅ user document created');
    
    // 3. Create initial bandwidth entry
    console.log('📋 Creating initial bandwidth entry...');
    const bandwidthData = {
      timestamp: new Date(),
      bandwidth: 0,
      dataUsed: 0,
      networkId: 'corp-vpn',
      networkName: 'Corporate VPN'
    };
    
    await db.collection('userBandwidth').doc(USER_ID).collection('entries').add(bandwidthData);
    console.log('✅ initial bandwidth entry created');
    
    console.log('\n🎉 User data initialization complete!');
    console.log('💡 Now refresh your app and try again.');
    
  } catch (error) {
    console.error('❌ Error initializing user data:', error);
  }
}

initializeUserData(); 