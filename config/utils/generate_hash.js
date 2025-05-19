const bcrypt = require('bcryptjs');

async function hashPassword() {
  try {
    // Generate hash for 'Admin@123' using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Admin@123', salt);
    console.log('Generated hash for Admin@123:', hash);
  } catch (error) {
    console.error('Error:', error);
  }
}

hashPassword();
