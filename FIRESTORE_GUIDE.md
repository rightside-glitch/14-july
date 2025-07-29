# Adding Active Devices in Firestore Console

## Method 1: Direct Firestore Console Entry

### Step 1: Access Firestore Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bandwith-41c0a`
3. Click on "Firestore Database" in the left sidebar
4. Click on "Start collection" or navigate to existing collections

### Step 2: Create Devices Collection
1. Click "Start collection"
2. Collection ID: `devices`
3. Click "Next"

### Step 3: Add Device Document
1. **Document ID**: Use a unique identifier (e.g., `device_001`, `user_email_device`, or auto-generated)
2. **Fields to add**:

```
Field Name: name
Type: string
Value: "John's Laptop"

Field Name: status
Type: string
Value: "active"

Field Name: type
Type: string
Value: "laptop" (or: desktop, mobile, tv, gaming)

Field Name: usage
Type: number
Value: 2.5

Field Name: user
Type: string
Value: "john@example.com"

Field Name: ip
Type: string
Value: "192.168.1.100"

Field Name: lastSeen
Type: timestamp
Value: [Current timestamp]

Field Name: createdAt
Type: timestamp
Value: [Current timestamp]
```

### Step 4: Sample Device Documents

#### Device 1 (Laptop)
```json
{
  "name": "Sarah's MacBook Pro",
  "status": "active",
  "type": "laptop",
  "usage": 1.8,
  "user": "sarah@company.com",
  "ip": "192.168.1.101",
  "lastSeen": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T09:00:00Z"
}
```

#### Device 2 (Mobile)
```json
{
  "name": "Mike's iPhone",
  "status": "active",
  "type": "mobile",
  "usage": 0.5,
  "user": "mike@company.com",
  "ip": "192.168.1.102",
  "lastSeen": "2024-01-15T10:25:00Z",
  "createdAt": "2024-01-15T08:30:00Z"
}
```

#### Device 3 (Desktop)
```json
{
  "name": "Admin Desktop",
  "status": "active",
  "type": "desktop",
  "usage": 3.2,
  "user": "admin@company.com",
  "ip": "192.168.1.103",
  "lastSeen": "2024-01-15T10:35:00Z",
  "createdAt": "2024-01-15T07:00:00Z"
}
```

### Step 5: Device Types Available
- `desktop` - Desktop computers
- `laptop` - Laptop computers
- `mobile` - Mobile phones/tablets
- `tv` - Smart TVs/streaming devices
- `gaming` - Gaming consoles/PCs

### Step 6: Status Values
- `active` - Device is currently connected and active
- `inactive` - Device is disconnected or inactive
- `suspended` - Device is temporarily suspended

## Method 2: Using Firebase Admin SDK (Advanced)

If you want to add devices programmatically, you can use the Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

// Add a new device
async function addDevice(deviceData) {
  try {
    const docRef = await db.collection('devices').add({
      name: deviceData.name,
      status: 'active',
      type: deviceData.type,
      usage: 0,
      user: deviceData.user,
      ip: deviceData.ip,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Device added with ID:', docRef.id);
  } catch (error) {
    console.error('Error adding device:', error);
  }
}
```

## Method 3: Bulk Import (CSV/JSON)

For adding multiple devices at once:

1. Prepare a JSON file with device data
2. Use Firebase CLI or Admin SDK to import
3. Or manually add each device through the console

### Sample JSON for Bulk Import:
```json
[
  {
    "name": "Marketing Team Laptop 1",
    "status": "active",
    "type": "laptop",
    "usage": 1.2,
    "user": "marketing1@company.com",
    "ip": "192.168.1.201"
  },
  {
    "name": "Sales Team Desktop",
    "status": "active",
    "type": "desktop",
    "usage": 2.1,
    "user": "sales@company.com",
    "ip": "192.168.1.202"
  }
]
```

## Important Notes

1. **Document IDs**: Use meaningful IDs or let Firestore auto-generate them
2. **Timestamps**: Use server timestamps for consistency
3. **IP Addresses**: Use realistic IP addresses for your network
4. **Usage Values**: Start with realistic bandwidth usage values (0.1 - 5.0 GB/h)
5. **User Emails**: Use valid email addresses that match your user collection

## Verification

After adding devices:
1. Check your Admin Dashboard web interface
2. Verify devices appear in the device management section
3. Check that the active device count updates
4. Verify real-time data collection is working 