// test-virtual-networks.cjs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase config (same as in the app)
const firebaseConfig = {
  apiKey: "AIzaSyBSDtdlxpLThQ0NZq-r8O6g6cVqVrtYDBU",
  authDomain: "bandwith-41c0a.firebaseapp.com",
  projectId: "bandwith-41c0a",
  storageBucket: "bandwith-41c0a.firebasestorage.app",
  messagingSenderId: "21824344608",
  appId: "1:21824344608:web:931de49de100d1f0ef2245",
  measurementId: "G-Y9ME17HHSZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testVirtualNetworks() {
  try {
    console.log('🔄 Testing virtual networks access...');
    
    // Try to fetch virtual networks
    const networksSnapshot = await getDocs(collection(db, "virtualNetworks"));
    
    if (networksSnapshot.empty) {
      console.log('❌ No virtual networks found in collection');
    } else {
      console.log(`✅ Found ${networksSnapshot.size} virtual networks:`);
      networksSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name} (${data.status}) - ${data.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error accessing virtual networks:', error);
    console.log('💡 This might be due to Firestore security rules blocking access');
    console.log('📝 Please update Firestore rules to allow reading from virtualNetworks collection');
  }
}

testVirtualNetworks(); 