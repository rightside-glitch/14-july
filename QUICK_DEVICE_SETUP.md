# Quick Device Setup Guide

## Option 1: Add Devices via Web Interface (Recommended)

1. **Deploy the updated code** to Vercel
2. **Login as Admin** to your dashboard
3. **Click "Add Device"** button in the Device Management section
4. **Fill in the form**:
   - Device Name: e.g., "John's Laptop"
   - Device Type: Select from dropdown
   - User Email: user@example.com
   - IP Address: 192.168.1.100
   - Initial Usage: 0.0 (will update automatically)

## Option 2: Add Devices via Firestore Console

### Step-by-Step:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `bandwith-41c0a`
3. Click "Firestore Database"
4. Click "Start collection" → Collection ID: `devices`
5. Add document with these fields:

```
name: "Sample Device"
status: "active"
type: "desktop"
usage: 1.5
user: "user@example.com"
ip: "192.168.1.100"
lastSeen: [Current timestamp]
createdAt: [Current timestamp]
```

## Option 3: Use the Node.js Script

1. **Install dependencies**:
   ```bash
   npm install firebase-admin
   ```

2. **Download service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

3. **Run the script**:
   ```bash
   node add-sample-devices.js
   ```

## Device Types Available:
- `desktop` - Desktop computers
- `laptop` - Laptop computers  
- `mobile` - Mobile phones/tablets
- `tv` - Smart TVs/streaming devices
- `gaming` - Gaming consoles/PCs

## Status Values:
- `active` - Device is connected and active
- `inactive` - Device is disconnected
- `suspended` - Device is temporarily suspended

## Sample Device Data:

### Desktop Computer
```json
{
  "name": "Admin Desktop",
  "status": "active",
  "type": "desktop",
  "usage": 2.5,
  "user": "admin@company.com",
  "ip": "192.168.1.100"
}
```

### Mobile Device
```json
{
  "name": "Mike's iPhone",
  "status": "active", 
  "type": "mobile",
  "usage": 0.5,
  "user": "mike@company.com",
  "ip": "192.168.1.102"
}
```

### Laptop
```json
{
  "name": "Sarah's MacBook",
  "status": "active",
  "type": "laptop",
  "usage": 1.8,
  "user": "sarah@company.com",
  "ip": "192.168.1.101"
}
```

## Verification Steps:

1. **Check Admin Dashboard**:
   - Active device count should increase
   - Devices should appear in Device Management section
   - Real-time charts should show data

2. **Check Firestore Console**:
   - Navigate to `devices` collection
   - Verify documents are created
   - Check field values are correct

3. **Test Device Management**:
   - Try activating/deactivating devices
   - Test delete functionality
   - Verify status changes

## Troubleshooting:

**Issue**: Devices not appearing in dashboard
**Solution**: Check browser console for Firebase errors

**Issue**: Permission denied errors
**Solution**: Deploy updated security rules

**Issue**: Real-time updates not working
**Solution**: Verify Firestore listeners are connected

**Issue**: Device count not updating
**Solution**: Check if devices have `status: "active"` 