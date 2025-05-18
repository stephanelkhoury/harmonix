// Utils for managing authentication
import axios from 'axios';

const SERVER_URL = 'http://localhost:5001';

export const authUtils = {
  // Initialize auth from localStorage
  initializeAuth: () => {
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
      const response = await axios.post(`${SERVER_URL}/login`, { username, password });
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
      const response = await axios.post(`${SERVER_URL}/refresh-token`, { token });
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
      const response = await axios.post(`${SERVER_URL}/signup`, userData);
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
  
  // Get user data
  getUserData: () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },
  
  // Get user's active sessions
  getUserSessions: async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/user/sessions`);
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
      const response = await axios.post(`${SERVER_URL}/user/session`, { 
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
      const response = await axios.delete(`${SERVER_URL}/user/session/${sessionId}`);
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
      
      const response = await axios.delete(`${SERVER_URL}/user/sessions/all-except-current`, {
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
        const response = await axios.post(`${SERVER_URL}/refresh-token`, { token: currentToken });
        
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
