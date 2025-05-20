// Script to test the admin access fix
// Run this in the browser console or using a tool like fetch

// Helper function to decode JWT token
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
}

// Function to test authentication status
async function testAuthStatus() {
  console.log('🧪 Testing authentication status...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No authentication token found');
    return false;
  }
  
  // Decode and log the token contents
  const decodedToken = decodeJwt(token);
  console.log('📝 Token data:', decodedToken);
  
  try {
    // Test the auth-check endpoint
    const authCheckResponse = await fetch('http://localhost:5001/auth-check', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!authCheckResponse.ok) {
      console.error(`❌ Auth check failed: ${authCheckResponse.status}`);
      return false;
    }
    
    const authData = await authCheckResponse.json();
    console.log('✅ Auth check successful:', authData);
    
    // Test the admin API endpoint
    const adminApiResponse = await fetch('http://localhost:5001/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!adminApiResponse.ok) {
      console.error(`❌ Admin API test failed: ${adminApiResponse.status}`);
      const errorData = await adminApiResponse.json();
      console.error('Error details:', errorData);
      return false;
    }
    
    const adminData = await adminApiResponse.json();
    console.log('✅ Admin API test successful!', adminData);
    return true;
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Execute the test
testAuthStatus().then(success => {
  console.log(`Test ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
});
