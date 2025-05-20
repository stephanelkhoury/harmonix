import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Modal, Button } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaUserCircle } from 'react-icons/fa';
import authUtils from '../utils/authUtils';
import SessionTimer from './SessionTimer';
import logo from '../assets/images/harmonix-logo-02.png';
import './style/Navbar.css';

function AppNavbar({ isAuthenticated, setIsAuthenticated }) {
  const [showAccount, setShowAccount] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [expiryTime, setExpiryTime] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Use authentication utility to handle logout
    authUtils.logout();
    setIsAuthenticated(false);
    navigate('/login');
    setShowAccount(false);
  };
  
  const handleTokenExpiringSoon = useCallback((remainingTime) => {
    // Show the session expiry warning modal when token is expiring soon
    setExpiryTime(Math.floor(remainingTime / 1000)); // Convert to seconds
    setShowExpiryModal(true);
  }, []);
  
  const handleRefreshSession = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authUtils.refreshToken(token);
        if (response.success) {
          setShowExpiryModal(false);
        }
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  };

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary navbar-custom" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to={isAuthenticated ? "/" : "/login"}>
            <img src={logo} alt="Harmonix Logo" style={{ height: 40 }} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {isAuthenticated && (
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/analyze">Chord Analyzer</Nav.Link>
                <Nav.Link as={Link} to="/tuner">Instrument Tuner</Nav.Link>
                <Nav.Link as={Link} to="/about">About</Nav.Link>
                <Nav.Link as={Link} to="/contact">Contact Us</Nav.Link>
                <Nav.Link as={Link} to="/faq">FAQ</Nav.Link>
              </Nav>
            )}
            <div className="d-flex align-items-center ms-auto">
              {isAuthenticated && (
                <div className="me-3">
                  <SessionTimer onExpiringSoon={handleTokenExpiringSoon} />
                </div>
              )}
              <div className="navbar-account position-relative me-3">
                <a href="#" className="account-icon" onClick={(e) => {e.preventDefault(); setShowAccount(!showAccount);}}>
                  <FaUserCircle />
                </a>
                {showAccount && (
                  <div className="account-dropdown-reactbs">
                    {isAuthenticated ? (
                      <>
                        <Link to="/account" onClick={() => setShowAccount(false)}>My Account</Link>
                        <Link to="#" onClick={handleLogout}>Logout</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setShowAccount(false)}>Login</Link>
                        <Link to="/signup" onClick={() => setShowAccount(false)}>Signup</Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              </div>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Session Expiration Modal */}
      <Modal show={showExpiryModal} onHide={() => setShowExpiryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Session Expiring Soon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Your session will expire in {expiryTime} seconds. Would you like to stay logged in?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="primary" onClick={handleRefreshSession}>
            Stay Logged In
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AppNavbar;