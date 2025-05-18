import React, { useState } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SERVER_URL = 'http://localhost:5001';

function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [devInfo, setDevInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${SERVER_URL}/reset-password/request`, { email });
      setSuccess(true);
      
      // Store dev info if available (only for development)
      if (response.data.dev_info) {
        setDevInfo(response.data.dev_info);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Header as="h1" className="text-center">Reset Password</Card.Header>
        <Card.Body>
          {success ? (
            <div className="text-center">
              <Alert variant="success">
                <p>If your email is in our system, you will receive reset instructions shortly.</p>
                <p>Please check your email inbox (and spam folder) for instructions to reset your password.</p>
              </Alert>
              
              {/* Development helper - would be removed in production */}
              {devInfo && (
                <div className="mt-4 p-3 border border-warning rounded bg-light">
                  <h5 className="text-warning">Development Info</h5>
                  <p><strong>Reset Token:</strong> {devInfo.resetToken}</p>
                  <p><strong>Reset Link:</strong></p>
                  <a href={devInfo.resetLink} target="_blank" rel="noreferrer">{devInfo.resetLink}</a>
                </div>
              )}
              
              <div className="mt-4">
                <Link to="/login" className="btn btn-primary">Back to Login</Link>
              </div>
            </div>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <p className="mb-4">Enter your email address and we'll send you instructions to reset your password.</p>
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-3">
                <Link to="/login">Back to Login</Link>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PasswordResetRequest;
