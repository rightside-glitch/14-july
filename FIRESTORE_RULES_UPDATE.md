# Update Firestore Rules for Virtual Networks

## Problem
The virtual networks aren't displaying because Firestore security rules don't allow reading from the `virtualNetworks` collection.

## Solution: Manual Update via Firebase Console

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bandwith-41c0a`
3. Click on **"Firestore Database"** in the left sidebar

### Step 2: Update Security Rules
1. Click on the **"Rules"** tab at the top
2. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is regular user
    function isRegularUser() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'user';
    }
    
    // Helper function to check if user is accessing their own data
    function isOwnData(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // VirtualNetworks collection - Public read access for network selection
    match /virtualNetworks/{networkId} {
      // Anyone can read virtual networks (needed for network selection before login)
      allow read: if true;
      
      // Only admins can write to virtual networks
      allow write: if isAdmin();
    }
    
    // Users collection - Strict role-based access
    match /users/{userId} {
      // Regular users can only read/write their own document
      allow read, write: if isRegularUser() && isOwnData(userId);
      
      // Admins can read all user documents but cannot write to them
      allow read: if isAdmin();
      
      // Prevent admins from writing to user documents (maintain data integrity)
      allow write: if false;
    }
    
    // Devices collection - Strict role-based access
    match /devices/{deviceId} {
      // Regular users can only read/write their own device
      allow read, write: if isRegularUser() && isOwnData(deviceId);
      
      // Admins can read/write all device documents
      allow read, write: if isAdmin();
    }
    
    // UserStats collection - Strict role-based access
    match /userStats/{userId} {
      // Regular users can only read/write their own stats
      allow read, write: if isRegularUser() && isOwnData(userId);
      
      // Admins can read all userStats documents
      allow read: if isAdmin();
      
      // Admins cannot write to userStats (maintain data integrity)
      allow write: if false;
    }
    
    // Bandwidth collection - Admin only access
    match /bandwidth/{docId} {
      // Only admins can read/write bandwidth data
      allow read, write: if isAdmin();
      
      // Regular users cannot access bandwidth data
      allow read, write: if false;
    }
    
    // Default rule - deny all access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **"Publish"** button
2. Wait for the rules to be deployed (usually takes a few seconds)

### Step 4: Test the App
1. Refresh your app in the browser
2. Open browser developer tools (F12)
3. Check the console for debug messages
4. The virtual networks should now appear in the dropdown

## Debug Information
The app now includes console logging to help debug issues:
- 🔄 Setting up virtual networks listener...
- 📡 Virtual networks snapshot received: X networks
- 📋 Network data: [array of networks]
- ❌ Virtual networks listener error: [error details]

## Expected Result
After updating the rules, you should see:
- 5 virtual networks in the dropdown
- Network status indicators (green for active, yellow for maintenance)
- Ability to select a network before accessing dashboards 