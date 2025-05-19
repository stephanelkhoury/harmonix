// Utils for managing authentication
import axios from 'axios';

const SERVER_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

export const authUtils = {
  // Initialize auth from localStorage
  initializeAuth: () => {
    // Set baseURL globally for all axios requests
    axios.defaults.baseURL = SERVER_URL;
    
    const token = localStorage.getItem('token');
    if (token) {
      setAuthHeader(token);
      return true;
    }
    return false;
  },
  
  // Login user and store token
  login: async (username, password) => {
    try {
      // Set baseURL if it hasn't been set
      if (!axios.defaults.baseURL) {
        axios.defaults.baseURL = SERVER_URL;
      }
      
      const response = await axios.post(`/login`, { username, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        setAuthHeader(response.data.token);
        return { success: true, data: response.data };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed',
        status: error.response?.status
      };
    }
  },
  
  // Refresh token explicitly (used by SessionTimer)
  refreshToken: async (token) => {
    try {
      const response = await axios.post(`/refresh-token`, { token });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setAuthHeader(response.data.token);
        return { success: true, data: response.data };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Token refresh failed',
        status: error.response?.status
      };
    }
  },
  
  // Register new user
  signup: async (userData) => {
    try {
      const response = await axios.post(`/signup`, userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        setAuthHeader(response.data.token);
        return { success: true, data: response.data };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed', 
        status: error.response?.status
      };
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    return true;
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Check if user is an admin - enhanced to check token if user data is inconsistent
  isAdmin: () => {
    // First check user object in localStorage
    const userData = localStorage.getItem('user');
    let isAdminInUserData = false;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        isAdminInUserData = user.isAdmin === true;
        
        // If user data says we're admin, return true immediately
        if (isAdminInUserData) {
          return true;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // If user data doesn't indicate admin status, check the JWT token directly
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Decode the token to check admin status
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const tokenData = JSON.parse(jsonPayload);
      const isAdminInToken = tokenData.isAdmin === true;
      
      // If token indicates admin status but user data doesn't, fix user data
      if (isAdminInToken && !isAdminInUserData && userData) {
        try {
          const user = JSON.parse(userData);
          user.isAdmin = true;
          localStorage.setItem('user', JSON.stringify(user));
          console.log('Admin status fixed in localStorage based on token data');
        } catch (e) {
          console.error('Error updating user data with admin status:', e);
        }
      }
      
      return isAdminInToken;
    } catch (e) {
      console.error('Error checking token for admin status:', e);
      return false;
    }
  },
  
  // Get user data
  getUserData: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Get user's active sessions
  getUserSessions: async () => {
    try {
      const response = await axios.get(`/user/sessions`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to fetch sessions',
        status: error.response?.status
      };
    }
  },
  
  // Track new session
  trackSession: async (deviceInfo) => {
    try {
      const response = await axios.post(`/user/session`, { 
        device: deviceInfo || getBrowserInfo() 
      });
      localStorage.setItem('sessionId', response.data.sessionId);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to track session',
        status: error.response?.status
      };
    }
  },
  
  // End specific session
  terminateSession: async (sessionId) => {
    try {
      const response = await axios.delete(`/user/session/${sessionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to terminate session',
        status: error.response?.status
      };
    }
  },
  
  // End all other sessions
  terminateAllOtherSessions: async () => {
    try {
      const currentSessionId = localStorage.getItem('sessionId');
      if (!currentSessionId) {
        return { success: false, error: 'No current session ID found' };
      }
      
      const response = await axios.delete(`/user/sessions/all-except-current`, {
        data: { currentSessionId }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to terminate other sessions',
        status: error.response?.status
      };
    }
  }
};

// Helper function to set authorization header
function setAuthHeader(token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Helper function to get browser and device information
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let deviceInfo = 'Unknown Device';
  
  // Detect browser
  let browser;
  if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'Internet Explorer';
  else browser = 'Unknown Browser';
  
  // Detect OS
  let os;
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else os = 'Unknown OS';
  
  deviceInfo = `${browser} on ${os}`;
  
  return deviceInfo;
}

// Create axios interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'token_expired' && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // Get current token
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          throw new Error('No token available');
        }
        
        // Attempt to refresh the token
        const response = await axios.post(`/refresh-token`, { token: currentToken });
        
        if (response.data.token) {
          // Store new token
          localStorage.setItem('token', response.data.token);
          // Update authorization header
          setAuthHeader(response.data.token);
          
          // Retry original request
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login on refresh failure
        authUtils.logout();
        window.location.href = '/login?expired=true';
      }
    }
    
    return Promise.reject(error);
  }
);

export default authUtils;
