# Chart Display Troubleshooting Guide

## Problem: Device Distribution and Real-Time Bandwidth Charts Not Displaying

### Root Causes
1. **No data in Firestore collections**
2. **Firebase security rules blocking access**
3. **Network connectivity issues**
4. **Missing dependencies or configuration**

## Solutions Implemented

### 1. Fallback Sample Data
- **Real-Time Bandwidth Chart**: Now generates sample data when no devices exist
- **Device Distribution Chart**: Shows sample devices when no real devices are found
- **Visual Indicators**: "Sample Data" badges appear when showing fallback data

### 2. Enhanced Error Handling
- Better console logging for debugging
- Graceful fallbacks when data is missing
- Clear visual indicators for sample vs real data

### 3. Data Generation Scripts
- `add-sample-devices.js` - Add sample devices to Firestore
- `add-bandwidth-data.js` - Add sample bandwidth data to Firestore

## Quick Fix Steps

### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for Firebase errors or warnings
4. Check for any JavaScript errors

### Step 2: Verify Firestore Data
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bandwith-41c0a`
3. Click "Firestore Database"
4. Check if these collections exist:
   - `devices` - Should contain device documents
   - `bandwidth` - Should contain bandwidth data points
   - `users` - Should contain user documents

### Step 3: Add Sample Data (If Collections Are Empty)

#### Option A: Using Scripts (Recommended)
```bash
# Install dependencies
npm install firebase-admin

# Download service account key from Firebase Console
# Save as serviceAccountKey.json in project root

# Add sample devices
node add-sample-devices.js

# Add sample bandwidth data
node add-bandwidth-data.js
```

#### Option B: Manual Firestore Entry
1. **Add Devices**:
   ```
   Collection: devices
   Document ID: auto-generated
   Fields:
   - name: "Sample Device"
   - status: "active"
   - type: "desktop"
   - usage: 2.5
   - user: "user@example.com"
   - ip: "192.168.1.100"
   ```

2. **Add Bandwidth Data**:
   ```
   Collection: bandwidth
   Document ID: auto-generated
   Fields:
   - timestamp: [Current timestamp]
   - usage: 2.5
   - totalUsage: 2.5
   ```

### Step 4: Deploy Firebase Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
```

### Step 5: Check Environment Variables
Ensure these are set in Vercel:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## Chart-Specific Issues

### Real-Time Bandwidth Chart Not Working
**Symptoms**: Empty chart or no data points
**Solutions**:
1. Check if `bandwidth` collection has data
2. Verify timestamp format in Firestore
3. Check browser console for errors
4. Run `node add-bandwidth-data.js` to add sample data

### Device Distribution Chart Not Working
**Symptoms**: Empty chart or no bars
**Solutions**:
1. Check if `devices` collection has data
2. Verify device documents have `usage` field
3. Check browser console for errors
4. Run `node add-sample-devices.js` to add sample devices

## Debugging Steps

### 1. Check Network Tab
1. Open browser developer tools
2. Go to Network tab
3. Refresh the page
4. Look for Firebase requests
5. Check if requests are successful (200 status)

### 2. Check Firebase Console
1. Go to Firebase Console → Firestore Database
2. Check "Usage" tab for any errors
3. Verify security rules are deployed
4. Check if collections are accessible

### 3. Test with Sample Data
1. Run the sample data scripts
2. Refresh the admin dashboard
3. Verify charts display sample data
4. Check that "Sample Data" badges appear

## Expected Behavior

### With Real Data:
- Charts display actual device and bandwidth data
- No "Sample Data" badges
- Real-time updates from Firestore
- Accurate statistics in cards

### With Sample Data:
- Charts display sample data
- "Sample Data" badges appear
- Sample devices shown in device management
- Blue notification about sample data

### With No Data:
- Charts show empty or error states
- Console errors about missing data
- No devices in device management

## Common Error Messages

### "permission-denied"
**Solution**: Deploy updated security rules

### "unauthenticated"
**Solution**: Check user authentication and session

### "unavailable"
**Solution**: Check network connection and Firebase status

### "not-found"
**Solution**: Verify collection names and document IDs

## Prevention

### 1. Always Have Sample Data
- Run sample data scripts during development
- Keep fallback data for demo purposes
- Test with both real and sample data

### 2. Monitor Firestore Usage
- Check Firebase Console regularly
- Monitor for security rule violations
- Track data collection performance

### 3. Implement Proper Error Handling
- Add try-catch blocks around Firestore operations
- Log errors for debugging
- Provide user-friendly error messages

## Verification Checklist

- [ ] Browser console shows no errors
- [ ] Firestore collections contain data
- [ ] Security rules are deployed
- [ ] Environment variables are set
- [ ] Charts display data (real or sample)
- [ ] Real-time updates work
- [ ] Device management shows devices
- [ ] Statistics cards show correct values

## Next Steps

After fixing the charts:
1. Add real devices through the web interface
2. Monitor real-time data collection
3. Customize chart appearance and data
4. Implement additional analytics features 