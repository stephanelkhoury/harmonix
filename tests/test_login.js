// Test script for login functionality
const axios = require('axios');

// Test regular login
async function testLogin(username, password) {
  try {
    console.log(`Testing login for user: ${username} with password: ${password}`);
    const response = await axios.post('http://localhost:5001/login', {
      username,
      password
    });
    
    console.log('Login successful!');
    console.log('User:', response.data.user);
    console.log('Token (first 20 chars):', response.data.token.substring(0, 20) + '...');
    
    // Test admin access
    if (response.data.user.isAdmin) {
      try {
        console.log('Testing admin API access...');
        const adminResponse = await axios.get('http://localhost:5001/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${response.data.token}`
          }
        });
        console.log('✅ Admin API access successful!');
        console.log(`Found ${adminResponse.data.length} users in the system`);
      } catch (adminError) {
        console.error('❌ Admin API access failed:', adminError.response?.data?.error || adminError.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.error || error.message);
    console.error('Status:', error.response?.status);
    return false;
  }
}

// Test debug login
async function testDebugLogin(username) {
  try {
    console.log(`Testing DEBUG login for user: ${username}`);
    const response = await axios.post('http://localhost:5001/debug-login', {
      username
    });
    
    console.log('DEBUG Login successful!');
    console.log('User:', response.data.user);
    console.log('Token (first 20 chars):', response.data.token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('DEBUG Login failed:', error.response?.data?.error || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== TESTING ADMIN LOGIN ===');
  await testLogin('admin', 'Admin@123');
  
  console.log('\n=== TESTING STEPHANE LOGIN ===');
  await testLogin('stephanelkhoury', 'S@1234');
  
  console.log('\n=== TESTING DEBUG LOGIN ===');
  await testDebugLogin('admin');
}

runTests();
