const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to list all users with their roles
async function listUsers() {
  try {
    console.log('📋 Listing all users...\n');
    
    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      console.log('No users found.');
      return;
    }
    
    console.log('ID\t\t\t\tEmail\t\t\t\tRole');
    console.log('─'.repeat(80));
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`${doc.id}\t${userData.email || 'N/A'}\t\t${userData.role || 'user'}`);
    });
    
    // Count by role
    const adminCount = snapshot.docs.filter(doc => doc.data().role === 'admin').length;
    const userCount = snapshot.docs.filter(doc => doc.data().role !== 'admin').length;
    
    console.log('\n📊 Summary:');
    console.log(`Admins: ${adminCount}`);
    console.log(`Regular Users: ${userCount}`);
    console.log(`Total: ${snapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

// Function to change user role
async function changeUserRole(userId, newRole) {
  try {
    if (!['admin', 'user'].includes(newRole)) {
      console.error('❌ Invalid role. Use "admin" or "user"');
      return;
    }
    
    await db.collection('users').doc(userId).update({
      role: newRole
    });
    
    console.log(`✅ User ${userId} role changed to ${newRole}`);
  } catch (error) {
    console.error('❌ Error changing user role:', error);
  }
}

// Function to create admin user
async function createAdminUser(email) {
  try {
    // First check if user exists
    const userQuery = await db.collection('users').where('email', '==', email).get();
    
    if (!userQuery.empty) {
      // Update existing user to admin
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({ role: 'admin' });
      console.log(`✅ User ${email} updated to admin role`);
    } else {
      // Create new admin user
      const newUserRef = await db.collection('users').add({
        email: email,
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Admin user ${email} created with ID: ${newUserRef.id}`);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Function to remove admin role
async function removeAdminRole(email) {
  try {
    const userQuery = await db.collection('users').where('email', '==', email).get();
    
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({ role: 'user' });
      console.log(`✅ User ${email} role changed to regular user`);
    } else {
      console.log(`❌ User ${email} not found`);
    }
  } catch (error) {
    console.error('❌ Error removing admin role:', error);
  }
}

// Function to delete user
async function deleteUser(userId) {
  try {
    await db.collection('users').doc(userId).delete();
    console.log(`✅ User ${userId} deleted`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
}

// Main function to handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'list':
      await listUsers();
      break;
      
    case 'make-admin':
      const email = args[1];
      if (!email) {
        console.error('❌ Please provide an email address');
        console.log('Usage: node manage-users.js make-admin user@example.com');
        return;
      }
      await createAdminUser(email);
      break;
      
    case 'remove-admin':
      const emailToRemove = args[1];
      if (!emailToRemove) {
        console.error('❌ Please provide an email address');
        console.log('Usage: node manage-users.js remove-admin user@example.com');
        return;
      }
      await removeAdminRole(emailToRemove);
      break;
      
    case 'change-role':
      const userId = args[1];
      const newRole = args[2];
      if (!userId || !newRole) {
        console.error('❌ Please provide user ID and new role');
        console.log('Usage: node manage-users.js change-role <userId> <admin|user>');
        return;
      }
      await changeUserRole(userId, newRole);
      break;
      
    case 'delete':
      const userIdToDelete = args[1];
      if (!userIdToDelete) {
        console.error('❌ Please provide user ID');
        console.log('Usage: node manage-users.js delete <userId>');
        return;
      }
      await deleteUser(userIdToDelete);
      break;
      
    default:
      console.log('🔧 User Management Tool');
      console.log('\nAvailable commands:');
      console.log('  list                    - List all users with their roles');
      console.log('  make-admin <email>      - Make a user an admin');
      console.log('  remove-admin <email>    - Remove admin role from user');
      console.log('  change-role <id> <role> - Change user role (admin|user)');
      console.log('  delete <id>             - Delete a user');
      console.log('\nExamples:');
      console.log('  node manage-users.js list');
      console.log('  node manage-users.js make-admin admin@company.com');
      console.log('  node manage-users.js remove-admin user@company.com');
      console.log('  node manage-users.js change-role abc123 user');
      console.log('  node manage-users.js delete abc123');
  }
  
  process.exit(0);
}

// Run the main function
main().catch(console.error); 