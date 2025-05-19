import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaLinkedinIn, FaEnvelope } from 'react-icons/fa';
import './style/Footer.css';

function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e) => {
        e.preventDefault();
        // Here you would typically send the email to your backend
        // For now we'll just show a success message
        if (email && email.includes('@')) {
            setSubscribed(true);
            setEmail('');
            // Reset the subscribed message after 5 seconds
            setTimeout(() => setSubscribed(false), 5000);
        }
    };

    return (
        <footer className="site-footer">
            <Container>
                <Row className="main-footer">
                    {/* Logo and About */}
                    <Col lg={3} md={6} className="footer-column mb-4">
                        <div className="footer-logo">
                            <img 
                                src="/static/media/harmonix-logo-02.png" 
                                alt="Harmonix Logo" 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    // Try the imported path as fallback
                                    e.target.src = require('../assets/images/harmonix-logo-02.png');
                                    e.target.onerror = () => {
                                        e.target.style.display = 'none';
                                    };
                                }}
                            />
                        </div>
                        <p className="footer-about-text">
                            Empowering musicians with AI-powered chord detection and analysis tools
                        </p>
                    </Col>
                    
                    {/* Quick Links */}
                    <Col lg={3} md={6} className="footer-column mb-4">
                        <h4>Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About</Link></li>
                            <li><Link to="/analyze">Analyze</Link></li>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                            <li><Link to="/faq">FAQ</Link></li>
                        </ul>
                    </Col>
                    
                    {/* Legal */}
                    <Col lg={3} md={6} className="footer-column mb-4">
                        <h4>Legal</h4>
                        <ul className="footer-links">
                            <li><Link to="/terms">Terms of Service</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                            <li><Link to="/cookies">Cookies Policy</Link></li>
                            <li><Link to="/refund">Refund Policy</Link></li>
                        </ul>
                    </Col>
                    
                    {/* Newsletter */}
                    <Col lg={3} md={6} className="footer-column mb-4">
                        <h4>Subscribe to Our Newsletter</h4>
                        <p>Stay updated with our latest features and releases</p>
                        <Form onSubmit={handleSubscribe} className="newsletter-form">
                            <Form.Group className="mb-3">
                                <Form.Control
                                    type="email"
                                    placeholder="Your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" variant="primary" className="w-100">
                                Subscribe
                            </Button>
                            {subscribed && (
                                <div className="subscription-success">
                                    Thank you for subscribing!
                                </div>
                            )}
                        </Form>
                    </Col>
                </Row>
                
                <hr className="footer-divider" />
                
                {/* Bottom Footer */}
                <Row className="bottom-footer">
                    <Col md={6} className="mb-3 mb-md-0">
                        <p className="copyright-text">
                            Copyright © {new Date().getFullYear()} Harmonix. All rights reserved.
                        </p>
                    </Col>
                    <Col md={6}>
                        <div className="social-icons">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <FaTwitter />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <FaYoutube />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <FaLinkedinIn />
                            </a>
                            <a href="mailto:info@harmonix.ai" aria-label="Email">
                                <FaEnvelope />
                            </a>
                        </div>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default Footer;