import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import authUtils from '../utils/authUtils';
import './style/Signup.css';

function Signup({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    country: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const countryOptions = countryList().getData();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCountryChange = (selectedOption) => {
    setFormData({ ...formData, country: selectedOption.label });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Client-side password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (!/\d/.test(formData.password)) {
      setError('Password must include at least one number');
      return;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError('Password must include at least one special character');
      return;
    }
    
    // Remove confirmPassword as the server doesn't need it
    const dataToSend = {...formData};
    delete dataToSend.confirmPassword;
    
    setLoading(true);
    const result = await authUtils.signup(dataToSend);
    
    if (result.success) {
      setSuccess('Signup successful! Logging you in...');
      
      // If setIsAuthenticated prop is provided, update auth state
      if (setIsAuthenticated) {
        setIsAuthenticated(true);
      }
      
      setTimeout(() => navigate('/'), 1500); // Navigate to home page
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-left">
          <img src={require('../assets/images/harmonix-logo-03.png')} alt="Signup Illustration" />
        </div>
        <div className="signup-right">
          <h1>Create Your Account</h1>
          <form onSubmit={handleSignup}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Country:</label>
                <Select
                  options={countryOptions}
                  onChange={handleCountryChange}
                  placeholder="Select your country"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <small className="form-text text-muted">
                  Password must be at least 6 characters and include a number and special character.
                </small>
              </div>
              <div className="form-group">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Gender:</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;