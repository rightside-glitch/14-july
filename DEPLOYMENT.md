# Deployment Guide - Fixing Firebase Data Collection Issues

## Problem
After deploying to Vercel, the system was not collecting the number of users and devices.

## Root Causes
1. **Firebase Security Rules**: Default rules block read/write operations
2. **Missing Environment Variables**: Firebase config might need production environment variables
3. **CORS Issues**: Vercel deployment might have CORS restrictions
4. **Firebase Project Configuration**: Domain not properly configured

## Solutions

### 1. Deploy Firebase Security Rules

First, install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

Initialize Firebase in your project:
```bash
firebase init
```

Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel dashboard and add these environment variables:

```
VITE_FIREBASE_API_KEY=AIzaSyBSDtdlxpLThQ0NZq-r8O6g6cVqVrtYDBU
VITE_FIREBASE_AUTH_DOMAIN=bandwith-41c0a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bandwith-41c0a
VITE_FIREBASE_STORAGE_BUCKET=bandwith-41c0a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=21824344608
VITE_FIREBASE_APP_ID=1:21824344608:web:931de49de100d1f0ef2245
VITE_FIREBASE_MEASUREMENT_ID=G-Y9ME17HHSZ
```

### 3. Configure Firebase Project Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bandwith-41c0a`
3. Go to Project Settings > General
4. Add your Vercel domain to "Authorized domains"
5. Go to Authentication > Settings > Authorized domains
6. Add your Vercel domain

### 4. Check Firebase Security Rules

The security rules in `firestore.rules` should allow:
- Authenticated users to read/write their own data
- Admins to read all data
- Proper access to collections: users, devices, userStats, bandwidth

### 5. Debug Steps

1. **Check Browser Console**: Look for Firebase errors
2. **Check Network Tab**: Verify Firebase requests are being made
3. **Check Authentication**: Ensure users are properly authenticated
4. **Check Firestore Rules**: Verify rules are deployed correctly

### 6. Test Data Collection

After deployment:
1. Create a new user account
2. Check if user document is created in Firestore
3. Check if device document is created
4. Verify admin dashboard shows the data

### 7. Common Issues and Fixes

**Issue**: "permission-denied" errors
**Fix**: Deploy updated security rules

**Issue**: "unauthenticated" errors  
**Fix**: Check authentication flow and domain configuration

**Issue**: No data in collections
**Fix**: Verify user creation process and Firestore writes

**Issue**: CORS errors
**Fix**: Add Vercel domain to Firebase authorized domains

### 8. Monitoring

Use Firebase Console to monitor:
- Authentication events
- Firestore read/write operations
- Security rule violations
- Real-time database usage

## Files Modified

1. `src/lib/firebase.ts` - Added environment variables and error handling
2. `src/pages/AdminDashboard.tsx` - Added debugging logs and error handling
3. `firestore.rules` - Created security rules
4. `firebase.json` - Created Firebase configuration
5. `firestore.indexes.json` - Created Firestore indexes

## Next Steps

1. Deploy the updated code to Vercel
2. Deploy Firebase security rules
3. Configure environment variables
4. Test user registration and data collection
5. Monitor Firebase Console for any issues 