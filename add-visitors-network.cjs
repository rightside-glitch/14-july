// add-visitors-network.js
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

async function addVisitorsNetwork() {
  try {
    console.log('🔄 Adding Visitors Net network...');
    
    // 1. Create Visitors Net network
    console.log('📋 Creating Visitors Net network...');
    const visitorsNetworkData = {
      id: 'visitors-net',
      name: 'Visitors Net',
      description: 'Public network for visitors and guests',
      status: 'active',
      type: 'public',
      maxUsers: 50,
      bandwidthLimit: 10, // GB/h
      createdAt: new Date(),
      lastUpdated: new Date(),
      security: {
        isolation: true,
        monitoring: true,
        restrictions: ['no-vpn', 'limited-bandwidth']
      }
    };
    
    await db.collection('virtualNetworks').doc('visitors-net').set(visitorsNetworkData);
    console.log('✅ Visitors Net network created');
    
    // 2. Create visitors collection for tracking
    console.log('📋 Creating visitors collection...');
    const visitorsCollectionRef = db.collection('visitors');
    
    // Add some sample visitors
    const sampleVisitors = [
      {
        id: 'visitor-001',
        name: 'John Doe',
        email: 'john.visitor@example.com',
        phone: '+1234567890',
        deviceId: 'device-visitor-001',
        ipAddress: '192.168.100.101',
        macAddress: '00:11:22:33:44:55',
        connectedAt: new Date(),
        lastSeen: new Date(),
        status: 'active',
        bandwidthUsed: 0.5,
        timeLimit: 2, // hours
        networkId: 'visitors-net'
      },
      {
        id: 'visitor-002',
        name: 'Jane Smith',
        email: 'jane.visitor@example.com',
        phone: '+1234567891',
        deviceId: 'device-visitor-002',
        ipAddress: '192.168.100.102',
        macAddress: '00:11:22:33:44:56',
        connectedAt: new Date(),
        lastSeen: new Date(),
        status: 'active',
        bandwidthUsed: 0.3,
        timeLimit: 1, // hours
        networkId: 'visitors-net'
      },
      {
        id: 'visitor-003',
        name: 'Bob Wilson',
        email: 'bob.visitor@example.com',
        phone: '+1234567892',
        deviceId: 'device-visitor-003',
        ipAddress: '192.168.100.103',
        macAddress: '00:11:22:33:44:57',
        connectedAt: new Date(),
        lastSeen: new Date(),
        status: 'inactive',
        bandwidthUsed: 1.2,
        timeLimit: 3, // hours
        networkId: 'visitors-net'
      }
    ];
    
    for (const visitor of sampleVisitors) {
      await visitorsCollectionRef.doc(visitor.id).set(visitor);
    }
    console.log('✅ Sample visitors added');
    
    // 3. Create visitor devices collection
    console.log('📋 Creating visitor devices...');
    const visitorDevices = [
      {
        id: 'device-visitor-001',
        name: "John's iPhone",
        type: 'mobile',
        user: 'john.visitor@example.com',
        ip: '192.168.100.101',
        usage: 0.5,
        status: 'active',
        networkId: 'visitors-net',
        lastSeen: new Date(),
        createdAt: new Date()
      },
      {
        id: 'device-visitor-002',
        name: "Jane's Laptop",
        type: 'laptop',
        user: 'jane.visitor@example.com',
        ip: '192.168.100.102',
        usage: 0.3,
        status: 'active',
        networkId: 'visitors-net',
        lastSeen: new Date(),
        createdAt: new Date()
      },
      {
        id: 'device-visitor-003',
        name: "Bob's Tablet",
        type: 'tablet',
        user: 'bob.visitor@example.com',
        ip: '192.168.100.103',
        usage: 1.2,
        status: 'inactive',
        networkId: 'visitors-net',
        lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date()
      }
    ];
    
    for (const device of visitorDevices) {
      await db.collection('devices').doc(device.id).set(device);
    }
    console.log('✅ Visitor devices added');
    
    // 4. Create visitor bandwidth tracking
    console.log('📋 Creating visitor bandwidth tracking...');
    const visitorBandwidthData = {
      networkId: 'visitors-net',
      totalVisitors: sampleVisitors.length,
      activeVisitors: sampleVisitors.filter(v => v.status === 'active').length,
      totalBandwidthUsed: sampleVisitors.reduce((sum, v) => sum + v.bandwidthUsed, 0),
      timestamp: new Date(),
      createdAt: new Date()
    };
    
    await db.collection('visitorBandwidth').doc('visitors-net').set(visitorBandwidthData);
    console.log('✅ Visitor bandwidth tracking created');
    
    // 5. Create visitor access logs
    console.log('📋 Creating visitor access logs...');
    const accessLogs = [
      {
        visitorId: 'visitor-001',
        action: 'connect',
        timestamp: new Date(),
        ipAddress: '192.168.100.101',
        deviceType: 'mobile',
        networkId: 'visitors-net'
      },
      {
        visitorId: 'visitor-002',
        action: 'connect',
        timestamp: new Date(),
        ipAddress: '192.168.100.102',
        deviceType: 'laptop',
        networkId: 'visitors-net'
      },
      {
        visitorId: 'visitor-003',
        action: 'disconnect',
        timestamp: new Date(Date.now() - 3600000),
        ipAddress: '192.168.100.103',
        deviceType: 'tablet',
        networkId: 'visitors-net'
      }
    ];
    
    for (const log of accessLogs) {
      await db.collection('visitorAccessLogs').add(log);
    }
    console.log('✅ Visitor access logs created');
    
    console.log('\n🎉 Visitors Net setup complete!');
    console.log('📊 Network Details:');
    console.log('   - Network ID: visitors-net');
    console.log('   - Name: Visitors Net');
    console.log('   - Max Users: 50');
    console.log('   - Bandwidth Limit: 10 GB/h');
    console.log('   - Sample Visitors: 3');
    console.log('   - Sample Devices: 3');
    console.log('\n💡 You can now monitor and control the Visitors Net from the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Error setting up Visitors Net:', error);
  }
}

addVisitorsNetwork(); 