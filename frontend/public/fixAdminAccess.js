// Function to fix admin access issues by ensuring proper configuration
// This can be executed in the browser console on the admin dashboard page

function fixAdminAccess() {
  console.log('🛠️ Starting admin access fix...');
  
  // Step 1: Check token existence
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No authentication token found in localStorage');
    alert('No authentication token found. Please login first.');
    return false;
  }

  // Step 2: Parse and validate token
  let tokenData;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    tokenData = JSON.parse(jsonPayload);
    console.log('✅ Token decoded successfully:', tokenData);
  } catch (e) {
    console.error('❌ Failed to decode token:', e);
    alert('Invalid token format. Please login again.');
    return false;
  }
  
  // Step 3: Check if token contains admin privilege
  if (tokenData.isAdmin !== true) {
    console.error('❌ Token does not have admin privileges. isAdmin =', tokenData.isAdmin);
    alert('Your account does not have admin privileges according to your token.');
    return false;
  }
  
  // Step 4: Check & fix user data in localStorage
  let userData;
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      userData = JSON.parse(userString);
      if (!userData.isAdmin) {
        console.log('🔄 Fixing user data in localStorage - adding admin status');
        userData.isAdmin = true;
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('✅ User data already has admin status');
      }
    } else {
      console.log('⚠️ No user data in localStorage, creating based on token');
      userData = {
        id: tokenData.id,
        username: tokenData.username,
        role: tokenData.role || 'admin',
        isAdmin: true
      };
      localStorage.setItem('user', JSON.stringify(userData));
    }
  } catch (e) {
    console.error('❌ Failed to process user data:', e);
  }
  
  // Step 5: Force set Axios auth headers directly
  if (typeof axios !== 'undefined') {
    console.log('🔄 Setting authorization header in axios');
    
    // Set global default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Force consistent backend URL
    axios.defaults.baseURL = 'http://localhost:5001';
    
    // Add request interceptor to ensure headers are set for each request
    axios.interceptors.request.use(
      function(config) {
        // Ensure Authorization header is included
        config.headers['Authorization'] = `Bearer ${token}`;
        
        // Force correct server URL for all requests
        if (config.url.includes('localhost:5002')) {
          config.url = config.url.replace('localhost:5002', 'localhost:5001');
          console.log('🔄 Redirecting request from port 5002 to 5001:', config.url);
        }
        
        return config;
      },
      function(error) {
        return Promise.reject(error);
      }
    );
    
    console.log('✅ Axios configuration complete');
  } else {
    console.warn('⚠️ Axios not found in global scope');
  }
  
  // Step 6: Add monitoring for Axios errors
  if (typeof axios !== 'undefined') {
    axios.interceptors.response.use(
      function(response) {
        return response;
      },
      function(error) {
        if (error.response) {
          if (error.response.status === 403) {
            console.error('🛑 Access denied error:', {
              url: error.response.config.url,
              status: error.response.status,
              data: error.response.data
            });
          }
          if (error.response.status === 401) {
            console.error('🛑 Authentication error:', {
              url: error.response.config.url,
              status: error.response.status,
              data: error.response.data
            });
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  console.log('✅ Admin access fix completed');
  return true;
}

// This function makes a direct API request to test admin access
async function testAdminAccess() {
  console.log('🧪 Testing admin API access...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No token available for testing');
    return false;
  }
  
  try {
    const response = await fetch('http://localhost:5001/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API test failed: ${response.status}`, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ API test successful! Data:', data);
    return true;
  } catch (error) {
    console.error('❌ API test error:', error);
    return false;
  }
}

// Execute the fix immediately
fixAdminAccess();

// Add a message to the page
const messageDiv = document.createElement('div');
messageDiv.style.position = 'fixed';
messageDiv.style.top = '10px';
messageDiv.style.right = '10px';
messageDiv.style.padding = '15px';
messageDiv.style.background = '#4f46e5';
messageDiv.style.color = 'white';
messageDiv.style.borderRadius = '5px';
messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
messageDiv.style.zIndex = '9999';
messageDiv.innerHTML = `
  <strong>Admin Access Fix Applied</strong><br>
  Check the browser console for details.<br>
  <button id="testAdminBtn" style="margin-top:10px;padding:5px 10px;background:#fff;color:#4f46e5;border:none;border-radius:3px;cursor:pointer;">
    Test Admin API
  </button>
  <button id="closeFixMsgBtn" style="margin-left:5px;padding:5px 10px;background:#f97316;color:#fff;border:none;border-radius:3px;cursor:pointer;">
    Close
  </button>
`;

document.body.appendChild(messageDiv);

// Add event listeners
document.getElementById('testAdminBtn').addEventListener('click', async () => {
  const result = await testAdminAccess();
  if (result) {
    alert('Admin API access test successful! You can now refresh the page and access the admin dashboard.');
  } else {
    alert('Admin API access test failed. Check the browser console for details.');
  }
});

document.getElementById('closeFixMsgBtn').addEventListener('click', () => {
  messageDiv.remove();
});
