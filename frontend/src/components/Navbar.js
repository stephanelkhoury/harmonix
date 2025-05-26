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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const isAdmin = authUtils.isAdmin();

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDropdownClick = (dropdownName, e) => {
    if (isMobile) {
      e.preventDefault();
      setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    }
  };

  const handleDropdownHover = (dropdownName) => {
    if (!isMobile) {
      setActiveDropdown(dropdownName);
    }
  };

  const handleDropdownLeave = () => {
    if (!isMobile) {
      setActiveDropdown(null);
    }
  };

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
                {/* Home link for all users */}
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                
                {/* Admin Dropdown - only for admin users */}
                {isAdmin && (
                  <Nav.Item 
                    className={`dropdown ${activeDropdown === 'admin' ? 'show' : ''}`}
                    onMouseEnter={() => handleDropdownHover('admin')}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <Nav.Link 
                      className="dropdown-toggle" 
                      onClick={(e) => handleDropdownClick('admin', e)}
                    >
                      Admin
                    </Nav.Link>
                    <div className={`dropdown-menu ${activeDropdown === 'admin' ? 'show' : ''}`}>
                      <Link 
                        className="dropdown-item" 
                        to="/dashboard" 
                        onClick={() => setActiveDropdown(null)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        className="dropdown-item" 
                        to="/messages" 
                        onClick={() => setActiveDropdown(null)}
                      >
                        Messages
                      </Link>
                    </div>
                  </Nav.Item>
                )}

                {/* Musician Tools */}
                <Nav.Item 
                  className={`dropdown ${activeDropdown === 'musician' ? 'show' : ''}`}
                  onMouseEnter={() => handleDropdownHover('musician')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Nav.Link 
                    as={Link}
                    to="/musician-tools"
                    className="dropdown-toggle" 
                    onClick={(e) => handleDropdownClick('musician', e)}
                  >
                    Musician Tools
                  </Nav.Link>
                  <div className={`dropdown-menu ${activeDropdown === 'musician' ? 'show' : ''}`}>
                    <Link 
                      className="dropdown-item" 
                      to="/analyze" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      Chord Analyzer
                    </Link>
                    <Link 
                      className="dropdown-item" 
                      to="/tuner" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      Instrument Tuner
                    </Link>
                    <Link 
                      className="dropdown-item" 
                      to="/tap-tempo" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      Tap Tempo
                    </Link>
                    <Link 
                      className="dropdown-item" 
                      to="/lyrics-identifier" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      Lyrics Analyzer
                    </Link>
                    <Link 
                      className="dropdown-item" 
                      to="/chords-dictionary" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      Chords Dictionary
                    </Link>
                  </div>
                </Nav.Item>
                
                {/* About Dropdown */}
                <Nav.Item 
                  className={`dropdown ${activeDropdown === 'about' ? 'show' : ''}`}
                  onMouseEnter={() => handleDropdownHover('about')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Nav.Link 
                    className="dropdown-toggle" 
                    onClick={(e) => handleDropdownClick('about', e)}
                  >
                    About
                  </Nav.Link>
                  <div className={`dropdown-menu ${activeDropdown === 'about' ? 'show' : ''}`}>
                    <Link 
                      className="dropdown-item" 
                      to="/about" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      About Us
                    </Link>
                    <Link 
                      className="dropdown-item" 
                      to="/faq" 
                      onClick={() => setActiveDropdown(null)}
                    >
                      FAQ
                    </Link>
                  </div>
                </Nav.Item>
                
                <Nav.Link as={Link} to="/contact">Contact Us</Nav.Link>
              </Nav>
            )}
            <div className="d-flex align-items-center ms-auto">
              {isAuthenticated && (
                <div className="me-3">
                  <SessionTimer onExpiringSoon={handleTokenExpiringSoon} />
                </div>
              )}
              <div className={`navbar-account position-relative me-3${isAuthenticated ? ' is-authenticated' : ''}`}>
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
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon"><FaFacebook /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon"><FaInstagram /></a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <svg viewBox="0 0 24 24" width="1em" height="1em" className="x-icon">
                    <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
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