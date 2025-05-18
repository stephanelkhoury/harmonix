import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SERVER_URL = 'http://localhost:5001';

function PasswordReset() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Validate token when component loads
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/reset-password/validate/${token}`);
        if (response.data.valid) {
          setIsValid(true);
          setEmail(response.data.email);
        }
      } catch (error) {
        setError('This password reset link is invalid or has expired.');
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setIsValidating(false);
      setError('No reset token provided.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (!/\d/.test(password)) {
      setError('Password must include at least one number.');
      return;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must include at least one special character.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await axios.post(`${SERVER_URL}/reset-password/confirm`, {
        token,
        newPassword: password
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?reset=success');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <Container className="py-5 text-center">
        <Card className="mx-auto" style={{ maxWidth: '500px' }}>
          <Card.Body>
            <p>Validating your reset link...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Header as="h1" className="text-center">Reset Your Password</Card.Header>
        <Card.Body>
          {!isValid ? (
            <Alert variant="danger">
              {error || 'This password reset link is invalid or has expired.'}
              <div className="mt-3">
                <Link to="/reset-password-request" className="btn btn-primary">
                  Request a New Reset Link
                </Link>
              </div>
            </Alert>
          ) : success ? (
            <Alert variant="success">
              <p>Your password has been reset successfully!</p>
              <p>You will be redirected to the login page shortly...</p>
              <div className="mt-2">
                <Link to="/login" className="btn btn-primary">Login Now</Link>
              </div>
            </Alert>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <p className="mb-3">Set a new password for your account: <strong>{email}</strong></p>
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <Form.Text className="text-muted">
                    Must be at least 6 characters with at least one number and one special character.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PasswordReset;
