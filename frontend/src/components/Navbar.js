import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaUserCircle } from 'react-icons/fa';
import logo from '../assets/images/harmonix-logo-02.png';
import './Navbar.css';

function AppNavbar({ isAuthenticated, setIsAuthenticated }) {
  const [showAccount, setShowAccount] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
    setShowAccount(false);
  };

  return (
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
              <Nav.Link as={Link} to="/about">About</Nav.Link>
              <Nav.Link as={Link} to="/contact">Contact Us</Nav.Link>
              <Nav.Link as={Link} to="/faq">FAQ</Nav.Link>
            </Nav>
          )}
          <div className="d-flex align-items-center ms-auto">
            <div className="navbar-account position-relative">
              <FaUserCircle size={24} style={{ cursor: 'pointer' }} onClick={() => setShowAccount(!showAccount)} />
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
            <div className="social-icons ms-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;