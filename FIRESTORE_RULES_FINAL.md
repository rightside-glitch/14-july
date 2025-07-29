# Final Firestore Rules - Copy and Paste This

## Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Select project: `bandwith-41c0a`
3. Click **"Firestore Database"** in left sidebar
4. Click **"Rules"** tab at the top

## Step 2: Replace ALL Rules
**Delete everything** in the rules editor and paste this exact code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // VirtualNetworks - PUBLIC READ ACCESS (most important)
    match /virtualNetworks/{networkId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Users - authenticated access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Devices - authenticated access
    match /devices/{deviceId} {
      allow read, write: if request.auth != null;
    }
    
    // UserStats - authenticated access
    match /userStats/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // UserBandwidth - authenticated access
    match /userBandwidth/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // UserHourlyUsage - authenticated access
    match /userHourlyUsage/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // UserDailyUsage - authenticated access
    match /userDailyUsage/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default - deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 3: Publish
1. Click **"Publish"** button
2. Wait for "Rules published successfully" message

## Step 4: Test
1. Refresh your app: https://bandwidth-liart.vercel.app/
2. You should see **GREEN success message** instead of yellow warning
3. Virtual networks should load from Firestore in real-time

## Expected Result
- ✅ Green success indicator
- ✅ 5 virtual networks in dropdown
- ✅ Real-time data from Firestore
- ✅ No more permission errors in console 