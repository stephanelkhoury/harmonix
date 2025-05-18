import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import './Login.css';

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    // Check for query params
    const queryParams = new URLSearchParams(location.search);
    
    // Handle expired session
    if (queryParams.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
    
    // Handle successful password reset
    if (queryParams.get('reset') === 'success') {
      setSuccessMessage('Your password has been reset successfully. Please log in with your new password.');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await authUtils.login(username, password);
    
    if (result.success) {
      setIsAuthenticated(true);
      navigate('/');
    } else {
      if (result.status === 401) {
        setError('Invalid username or password');
      } else {
        setError(result.error || 'Login failed. Please try again later.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <h1>Welcome back!</h1>
          <p>Enter to get unlimited access to data & information.</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <a href="/reset-password-request">Forgot your password?</a>
            </div>
            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <div className="login-divider">Or, Login with</div>
          <button className="google-login">Sign up with Google</button>
          <p className="signup-link">
            Don’t have an account? <a href="/signup">Register here</a>
          </p>
        </div>
        <div className="login-right">
          {/* Add background design or image here */}
        </div>
      </div>
    </div>
  );
}

export default Login;