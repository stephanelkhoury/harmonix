import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import authUtils from './utils/authUtils';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './components/HomePage';
import AudioProcessingPage from './components/AudioProcessingPage';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Signup from './pages/Signup';
import Account from './pages/Account';
import AccountSecurity from './pages/AccountSecurity';
import PasswordResetRequest from './pages/PasswordResetRequest';
import PasswordReset from './pages/PasswordReset';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';
import Refund from './pages/Refund';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    useEffect(() => {
        // Initialize authentication state using our utility
        const isAuth = authUtils.initializeAuth();
        setIsAuthenticated(isAuth);
    }, []);

    // Initialize session tracking when user is authenticated
    useEffect(() => {
        if (isAuthenticated && !localStorage.getItem('sessionId')) {
            authUtils.trackSession();
        }
    }, [isAuthenticated]);

    return (
        <Router>
            <div className="app-container d-flex flex-column min-vh-100">
                <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
                <div className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
                        <Route path="/process" element={isAuthenticated ? <AudioProcessingPage /> : <Navigate to="/login" />} />
                        <Route path="/analyze" element={isAuthenticated ? <Analyze /> : <Navigate to="/login" />} />
                        <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
                        <Route path="/signup" element={!isAuthenticated ? <Signup setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
                        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/account" element={isAuthenticated ? <Account /> : <Navigate to="/login" />} />
                        <Route path="/account/security" element={isAuthenticated ? <AccountSecurity /> : <Navigate to="/login" />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/faq" element={<FAQ />} />
                        {/* Legal Pages - Public Access */}
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/cookies" element={<Cookies />} />
                        <Route path="/refund" element={<Refund />} />
                        {/* Public routes for password reset */}
                        <Route path="/reset-password-request" element={<PasswordResetRequest />} />
                        <Route path="/reset-password/:token" element={<PasswordReset />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
