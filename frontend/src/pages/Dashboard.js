import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/authUtils';
import './style/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Check if user is authenticated
        if (!authUtils.isAuthenticated()) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Check if user is an admin
        console.log('Admin check - user data:', JSON.parse(localStorage.getItem('user')));
        console.log('Admin check - isAdmin result:', authUtils.isAdmin());
        console.log('Admin check - auth headers:', axios.defaults.headers.common['Authorization']);
        
        if (!authUtils.isAdmin()) {
          setError('You do not have admin privileges to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        // Proceed with fetching users for admin
        console.log('Making API request with headers:', axios.defaults.headers.common);
        try {
          const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/admin/users`);
          console.log('User data received:', response.data);
          setUsers(response.data);
          setMessage('Admin dashboard loaded successfully');
          setError(null);
        } catch (apiError) {
          console.error('API Error details:', {
            status: apiError.response?.status,
            data: apiError.response?.data,
            headers: apiError.response?.headers
          });
          throw apiError; // Re-throw to be caught by the outer catch
        }
      } catch (err) {
        console.error('Failed to fetch users:', err.response?.data || err.message);
        
        // Enhanced error messages
        if (err.response?.status === 403) {
          setError('Access denied. You need admin privileges to view this page.');
          setTimeout(() => navigate('/'), 3000);
        } else if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
        }
        
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        {message && <p className="success-message">{message}</p>}
      </div>

      {error ? (
        <div className="dashboard-card error-card">
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className="dashboard-card">
          <h2>Registered Users</h2>
          
          {loading ? (
            <div className="loading-spinner">
              <p className="text-center">Loading user data...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center">No users found in the system.</p>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Admin</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id || user._id}>
                      <td>{user.id || user._id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role || 'user'}</td>
                      <td>{user.isAdmin ? '✓' : '✗'}</td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;