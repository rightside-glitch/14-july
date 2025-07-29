// seed-virtual-networks.cjs
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// TODO: Replace with your actual Firebase project ID
const PROJECT_ID = 'bandwith-41c0a';

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const db = getFirestore();

const networks = [
  {
    name: "Corporate VPN",
    description: "Secure corporate network access",
    status: "active",
    bandwidthLimit: 1000,
    connectedUsers: 0,
  },
  {
    name: "Guest WiFi",
    description: "Public guest network",
    status: "active",
    bandwidthLimit: 100,
    connectedUsers: 0,
  },
  {
    name: "IoT Network",
    description: "Internet of Things devices",
    status: "active",
    bandwidthLimit: 50,
    connectedUsers: 0,
  },
  {
    name: "DMZ Network",
    description: "Demilitarized zone for servers",
    status: "active",
    bandwidthLimit: 500,
    connectedUsers: 0,
  },
  {
    name: "Backup VPN",
    description: "Secondary VPN connection",
    status: "maintenance",
    bandwidthLimit: 200,
    connectedUsers: 0,
  },
];

async function seed() {
  const batch = db.batch();
  networks.forEach((network) => {
    const ref = db.collection('virtualNetworks').doc();
    batch.set(ref, network);
  });
  await batch.commit();
  console.log('Seeded virtual networks!');
}

seed().catch((err) => {
  console.error('Error seeding virtual networks:', err);
  process.exit(1);
}); 