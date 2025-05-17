import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUserEdit, FaTrash } from 'react-icons/fa';
import './Dashboard.css';

function Dashboard() {
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage(response.data.message);
      } catch (err) {
        setMessage('Failed to load dashboard. Please log in again.');
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load user data. Please try again later.');
        setLoading(false);
      }
    };

    fetchDashboard();
    fetchUsers();
  }, []);
  
  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove user from state
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>{message}</p>
      </div>

      <div className="dashboard-card">
        <h2>Registered Users</h2>
        {loading ? (
          <p>Loading user data...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={user._id || user.id || index}>
                      <td>{user._id || user.id || index + 1}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="actions-column">
                        <button
                          className="action-btn edit"
                          title="Edit User"
                        >
                          <FaUserEdit />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete User"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;