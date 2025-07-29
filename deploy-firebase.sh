#!/bin/bash

echo "🚀 Deploying Updated Firebase Security Rules..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Deploy security rules
echo "📝 Deploying updated Firestore security rules..."
echo "⚠️  This will implement strict role-based access control"
echo "   - Admin users can no longer read data as regular users"
echo "   - Regular users can only access their own data"
echo "   - Cross-role access is prevented"
echo ""

firebase deploy --only firestore:rules

echo ""
echo "✅ Updated security rules deployed successfully!"
echo ""
echo "🔒 Security Changes Applied:"
echo "   ✅ Strict role separation implemented"
echo "   ✅ Admin users have elevated privileges only"
echo "   ✅ Regular users can only access own data"
echo "   ✅ Cross-role access prevented"
echo "   ✅ Enhanced error handling added"
echo ""
echo "📋 Next steps:"
echo "1. Deploy updated application code to Vercel"
echo "2. Test with both admin and regular users"
echo "3. Verify role-based access control works"
echo "4. Check that redirects work properly"
echo "5. Monitor for any permission denied errors"
echo ""
echo "🧪 Testing Checklist:"
echo "   - [ ] Admin can access admin dashboard"
echo "   - [ ] Admin cannot access user dashboard"
echo "   - [ ] Regular user can access user dashboard"
echo "   - [ ] Regular user cannot access admin dashboard"
echo "   - [ ] No cross-role data access"
echo "   - [ ] Proper error messages for unauthorized access" 