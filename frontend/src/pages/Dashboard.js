import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await axios.get('http://localhost:5001/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('User data received:', response.data);
        setUsers(response.data);
        setMessage('Admin dashboard loaded successfully');
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err.response?.data || err.message);
        setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>{message}</p>
      </div>

      <div className="dashboard-card">
        <h2>Registered Users</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <p className="text-center">Loading user data...</p>
        ) : users.length === 0 ? (
          <p className="text-center">No users found. Please make sure you're logged in as an admin.</p>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user._id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;