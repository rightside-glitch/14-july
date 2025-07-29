# User Management Guide

## Overview

The system now properly separates admin users from regular users in the dashboard statistics. Admin users are excluded from the "Regular Users" count to provide accurate metrics.

## User Roles

### Regular Users (`role: "user"`)
- Counted in the "Regular Users" statistic
- Can access their own dashboard
- Limited permissions
- Created during normal signup process

### Admin Users (`role: "admin"`)
- **NOT** counted in the "Regular Users" statistic
- Can access admin dashboard
- Full system permissions
- Can manage devices and users

## Changes Made

### 1. Updated User Count Logic
- Modified `AdminDashboard.tsx` to filter out admin users
- Changed display from "Total Users" to "Regular Users"
- Added proper logging for debugging

### 2. User Management Script
- Created `manage-users.js` for easy user management
- Supports listing, creating, and modifying users
- Command-line interface for bulk operations

## Managing Users

### Option 1: Using the Management Script

1. **Install dependencies**:
   ```bash
   npm install firebase-admin
   ```

2. **Download service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

3. **List all users**:
   ```bash
   node manage-users.js list
   ```

4. **Make a user an admin**:
   ```bash
   node manage-users.js make-admin user@example.com
   ```

5. **Remove admin role**:
   ```bash
   node manage-users.js remove-admin user@example.com
   ```

6. **Change user role**:
   ```bash
   node manage-users.js change-role <userId> admin
   ```

7. **Delete a user**:
   ```bash
   node manage-users.js delete <userId>
   ```

### Option 2: Direct Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bandwith-41c0a`
3. Click "Firestore Database"
4. Navigate to `users` collection
5. Find the user document
6. Edit the `role` field:
   - Set to `"admin"` for admin access
   - Set to `"user"` for regular user access

## User Document Structure

```json
{
  "email": "user@example.com",
  "role": "user",  // or "admin"
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Verification Steps

### 1. Check User Count
- Login to admin dashboard
- Verify "Regular Users" count excludes admins
- Check browser console for detailed logs

### 2. Test Role Changes
- Change a user's role to admin
- Verify they can access admin dashboard
- Verify they're excluded from user count
- Change role back to user
- Verify they're included in user count

### 3. Check Firestore Data
- Navigate to `users` collection
- Verify role fields are set correctly
- Check that admin users have `role: "admin"`
- Check that regular users have `role: "user"`

## Common Scenarios

### Scenario 1: Create First Admin
```bash
# If you need to create your first admin user
node manage-users.js make-admin your-email@company.com
```

### Scenario 2: Remove Admin Access
```bash
# If you need to remove admin access from someone
node manage-users.js remove-admin user@company.com
```

### Scenario 3: List All Users
```bash
# To see all users and their roles
node manage-users.js list
```

## Troubleshooting

### Issue: User count still includes admins
**Solution**: 
1. Check browser console for errors
2. Verify the code changes were deployed
3. Clear browser cache and refresh

### Issue: Admin can't access admin dashboard
**Solution**:
1. Check user document in Firestore
2. Verify `role` field is set to `"admin"`
3. Check sessionStorage for user data

### Issue: Regular user can access admin dashboard
**Solution**:
1. Check user's role in Firestore
2. Update role to `"user"`
3. Clear sessionStorage and re-login

### Issue: Management script not working
**Solution**:
1. Verify `serviceAccountKey.json` exists
2. Check Firebase project permissions
3. Ensure all dependencies are installed

## Best Practices

1. **Limit Admin Users**: Only give admin access to trusted users
2. **Regular Audits**: Periodically review user roles
3. **Secure Access**: Use strong passwords for admin accounts
4. **Backup Data**: Export user data before bulk changes
5. **Test Changes**: Verify role changes work as expected

## Security Notes

- Admin users have full system access
- Regular users can only access their own data
- Role changes require proper authentication
- Always verify user permissions before granting admin access 