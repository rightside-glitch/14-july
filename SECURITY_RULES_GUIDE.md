# Updated Firestore Security Rules Guide

## Overview

The Firestore security rules have been updated to implement strict role-based access control (RBAC). Admin users can no longer read data as regular users - they have separate, elevated permissions.

## Key Changes

### 1. Strict Role Separation
- **Admin users**: Can access all data with admin privileges
- **Regular users**: Can only access their own data
- **No cross-role access**: Admins cannot read data as regular users

### 2. Helper Functions
```javascript
// Check if user is admin
function isAdmin() {
  return request.auth != null && 
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Check if user is regular user
function isRegularUser() {
  return request.auth != null && 
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'user';
}

// Check if user is accessing their own data
function isOwnData(userId) {
  return request.auth != null && request.auth.uid == userId;
}
```

## Collection Access Rules

### 1. Users Collection (`/users/{userId}`)
```javascript
// Regular users: Can only read/write their own document
allow read, write: if isRegularUser() && isOwnData(userId);

// Admins: Can read all user documents but cannot write
allow read: if isAdmin();
allow write: if false; // Admins cannot modify user documents
```

### 2. Devices Collection (`/devices/{deviceId}`)
```javascript
// Regular users: Can only read/write their own device
allow read, write: if isRegularUser() && isOwnData(deviceId);

// Admins: Can read/write all device documents
allow read, write: if isAdmin();
```

### 3. UserStats Collection (`/userStats/{userId}`)
```javascript
// Regular users: Can only read/write their own stats
allow read, write: if isRegularUser() && isOwnData(userId);

// Admins: Can read all userStats but cannot write
allow read: if isAdmin();
allow write: if false; // Admins cannot modify user stats
```

### 4. Bandwidth Collection (`/bandwidth/{docId}`)
```javascript
// Only admins can access bandwidth data
allow read, write: if isAdmin();

// Regular users cannot access bandwidth data
allow read, write: if false;
```

## User Access Patterns

### Regular User Access
- ✅ Can read/write their own user document
- ✅ Can read/write their own device document
- ✅ Can read/write their own userStats document
- ❌ Cannot access bandwidth data
- ❌ Cannot access other users' data
- ❌ Cannot access admin-only collections

### Admin User Access
- ✅ Can read all user documents (but cannot write)
- ✅ Can read/write all device documents
- ✅ Can read all userStats documents (but cannot write)
- ✅ Can read/write all bandwidth data
- ❌ Cannot access data as a regular user
- ❌ Cannot modify user documents or userStats

## Application Changes

### 1. UserDashboard.tsx
- Added admin detection and redirect
- Enhanced error handling for permission denied
- Only allows regular users to access

### 2. AdminDashboard.tsx
- Added non-admin user redirect
- Enhanced error handling
- Only allows admin users to access

## Deployment Steps

### 1. Deploy Updated Security Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the updated rules
firebase deploy --only firestore:rules
```

### 2. Test the Rules
```bash
# Test with regular user
# Should only access own data

# Test with admin user
# Should access all data with admin privileges
```

## Testing Scenarios

### Scenario 1: Regular User Access
1. Login as regular user
2. Try to access `/dashboard`
3. Should only see own data
4. Should be redirected if trying to access admin areas

### Scenario 2: Admin User Access
1. Login as admin user
2. Try to access `/admin`
3. Should see all data
4. Should be redirected if trying to access user dashboard

### Scenario 3: Cross-Role Access Prevention
1. Admin user cannot read data as regular user
2. Regular user cannot access admin data
3. Proper error messages for unauthorized access

## Error Handling

### Common Error Codes
- `permission-denied`: User doesn't have permission
- `unauthenticated`: User not logged in
- `not-found`: Document doesn't exist

### Error Messages
```javascript
// In UserDashboard
if (error.code === 'permission-denied') {
  console.error('Permission denied: User cannot access userStats');
}

// In AdminDashboard
if (error.code === 'permission-denied') {
  console.error('Permission denied: Admin cannot access this data');
}
```

## Security Benefits

### 1. Data Isolation
- Regular users can only access their own data
- No cross-user data leakage
- Proper separation of concerns

### 2. Admin Privileges
- Admins have elevated access for management
- Cannot accidentally modify user data
- Clear audit trail for admin actions

### 3. Role Enforcement
- Strict role checking at database level
- Application-level redirects for wrong roles
- Consistent access patterns

## Troubleshooting

### Issue: Permission Denied Errors
**Solution**: 
1. Check user role in Firestore
2. Verify security rules are deployed
3. Check if user is accessing correct data

### Issue: Admin Cannot Access Data
**Solution**:
1. Verify admin role is set correctly
2. Check if admin document exists in users collection
3. Ensure security rules are properly deployed

### Issue: Regular User Cannot Access Own Data
**Solution**:
1. Check if user document exists
2. Verify user role is 'user'
3. Check if user is accessing correct document ID

## Best Practices

### 1. Role Management
- Always verify user roles before granting access
- Use helper functions for role checking
- Implement proper error handling

### 2. Data Access
- Regular users should only access their own data
- Admins should have clear, limited privileges
- Audit all data access patterns

### 3. Security Monitoring
- Monitor Firestore usage for unusual patterns
- Log permission denied errors
- Regular security rule reviews

## Verification Checklist

- [ ] Security rules deployed successfully
- [ ] Regular users can access their own data
- [ ] Regular users cannot access other users' data
- [ ] Admin users can access all data
- [ ] Admin users cannot modify user documents
- [ ] Cross-role access is prevented
- [ ] Error handling works properly
- [ ] Redirects work for wrong roles
- [ ] No permission denied errors for valid access 