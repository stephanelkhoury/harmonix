/**
 * Script to generate a proper password hash for the admin user
 * using the same bcryptjs library that's used in the server
 */
const bcrypt = require('bcryptjs');

async function generateAdminHash() {
  try {
    const password = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Admin password:', password);
    console.log('Generated hash:', hash);
    console.log('Hash prefix:', hash.substring(0, 7));
    console.log('\nUse this hash in the users array for the admin user');
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateAdminHash();
