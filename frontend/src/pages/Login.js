import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <h1>Welcome back!</h1>
          <p>Enter to get unlimited access to data & information.</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your mail address"
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
              <a href="#">Forgot your password?</a>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button">Log In</button>
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