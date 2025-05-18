import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUser } from 'react-icons/fa';
import './Account.css';

function Account() {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    createdAt: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to get user data from localStorage
        const cachedUserData = localStorage.getItem('user');
        if (cachedUserData) {
          setUserData(JSON.parse(cachedUserData));
          setLoading(false);
        }
        
        // Still make the API call to get the latest data
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUserData(response.data);
        // Update the cached user data
        localStorage.setItem('user', JSON.stringify(response.data));
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        
        // If we have cached data, don't show error
        const cachedUserData = localStorage.getItem('user');
        if (!cachedUserData) {
          setError('Failed to load account information. Please try again later.');
        }
        
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="account-page"><div className="account-container">Loading profile information...</div></div>;
  }

  if (error) {
    return <div className="account-page"><div className="account-container">{error}</div></div>;
  }

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1>My Account</h1>
          <p>View and manage your account details</p>
        </div>

        <div className="account-profile">
          <div className="profile-avatar">
            <FaUser />
          </div>
          <h2>{userData.username}</h2>
        </div>

        <div className="profile-info">
          <div className="info-row">
            <div className="info-label">Username</div>
            <div className="info-value">{userData.username}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Email</div>
            <div className="info-value">{userData.email}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Member Since</div>
            <div className="info-value">
              {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <div className="account-actions">
          <button className="account-btn">Edit Profile</button>
          <button className="account-btn" onClick={() => window.location.href = '/account/security'}>Account Security</button>
        </div>
      </div>
    </div>
  );
}

export default Account;
