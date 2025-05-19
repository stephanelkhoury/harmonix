const bcrypt = require('bcryptjs');

async function generateHash(password) {
  try {
    // Use the same library and settings as in the server
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Password:', password);
    console.log('Generated Hash:', hash);
    console.log('Hash prefix:', hash.substring(0, 7));
    
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

// Generate hash for Admin@123
generateHash('Admin@123').then(() => console.log('Hash generation complete'));
