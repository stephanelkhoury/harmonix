import React, { useState, useEffect } from 'react';
import { Container, Card, Button, ListGroup, Alert } from 'react-bootstrap';
import authUtils from '../utils/authUtils';

function AccountSecurity() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load user sessions
  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authUtils.getUserSessions();
      if (response.success) {
        setSessions(response.data.sessions);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load sessions. Please try again later.');
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Handle terminating a specific session
  const handleTerminateSession = async (sessionId) => {
    try {
      const response = await authUtils.terminateSession(sessionId);
      if (response.success) {
        setSuccessMessage('Session terminated successfully');
        // Refresh the sessions list
        loadSessions();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to terminate session. Please try again.');
      console.error('Error terminating session:', err);
    }
  };

  // Handle terminating all other sessions
  const handleTerminateAllOtherSessions = async () => {
    try {
      const response = await authUtils.terminateAllOtherSessions();
      if (response.success) {
        setSuccessMessage(`Successfully terminated ${response.data.terminatedCount} other sessions`);
        // Refresh the sessions list
        loadSessions();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to terminate other sessions. Please try again.');
      console.error('Error terminating other sessions:', err);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // Get current session ID
  const currentSessionId = localStorage.getItem('sessionId');

  return (
    <Container className="py-5">
      <h1 className="mb-4">Account Security</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      <Card className="mb-4">
        <Card.Header>
          <h2 className="h5 m-0">Active Sessions</h2>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <p>Loading your active sessions...</p>
          ) : sessions.length === 0 ? (
            <p>No active sessions found.</p>
          ) : (
            <>
              <ListGroup variant="flush">
                {sessions.map(session => (
                  <ListGroup.Item key={session.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div><strong>{session.device}</strong></div>
                      <div className="text-muted small">
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </div>
                      <div className="text-muted small">IP: {session.ipAddress}</div>
                      {session.id === currentSessionId && (
                        <span className="badge bg-primary me-2">Current Session</span>
                      )}
                    </div>
                    {session.id !== currentSessionId && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleTerminateSession(session.id)}
                      >
                        Terminate
                      </Button>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              
              <div className="mt-3">
                <Button 
                  variant="danger" 
                  onClick={handleTerminateAllOtherSessions}
                  disabled={sessions.length <= 1}
                >
                  Log Out From All Other Devices
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h2 className="h5 m-0">Password Security</h2>
        </Card.Header>
        <Card.Body>
          <p>
            For strong password security, we recommend that you:
          </p>
          <ul>
            <li>Use at least 8 characters</li>
            <li>Include both uppercase and lowercase letters</li>
            <li>Include at least one number</li>
            <li>Include at least one special character (like !@#$%^&*)</li>
            <li>Avoid using common words or personal information</li>
          </ul>
          <Button variant="primary">Change Password</Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AccountSecurity;
