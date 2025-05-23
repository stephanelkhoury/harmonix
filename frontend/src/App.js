import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authUtils } from './utils/authUtils';
import { preloadPageResources } from './utils/transitionUtils';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css'; /* Custom styles to override Bootstrap */
import './styles/Modal.css'; /* Modal styling */
import HomePage from './components/HomePage';
import AudioProcessingPage from './components/AudioProcessingPage';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import LyricsIdentifier from './pages/LyricsIdentifier';
import MusicianTools from './pages/MusicianTools';
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
import TunerPage from './pages/TunerPage';
import TapTempoPage from './pages/TapTempoPage';
import PageLoader from './components/PageLoader';

// AppContent component to wrap the app and track route changes
const AppContent = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [navigating, setNavigating] = useState(false);
    const location = useLocation();
    
    // Handle route changes by showing loader briefly
    const handleRouteChange = useCallback((newPath) => {
        // Show loader for all page transitions
        setNavigating(true);
        
        // Process optimization: Preload route content
        const preloadContent = () => {
            // Save current scroll position
            const scrollPosition = window.scrollY;
            
            // Force browser to start loading content for the new route
            window.scrollTo(0, 0);
            
            // Activate any lazy-loaded elements in viewport
            const lazyLoadTrigger = new Event('scroll');
            window.dispatchEvent(lazyLoadTrigger);
            
            // Restore scroll position if navigating to the same page with a hash
            if (newPath.includes('#')) {
                setTimeout(() => window.scrollTo(0, scrollPosition), 0);
            }
            
            // Preload page-specific resources
            preloadPageResources(newPath).then(() => {
                // Hide loader after resources are loaded
                setTimeout(() => {
                    setNavigating(false);
                }, 300); // Shorter transition for better UX
            });
        };
        
        // Request idle callback for preloading, 
        // with setTimeout fallback for older browsers
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(preloadContent);
        } else {
            setTimeout(preloadContent, 10);
        }
        
        // Fallback - hide loader after a max time if something goes wrong
        setTimeout(() => {
            setNavigating(false);
        }, 2000);
    }, []);
    
    useEffect(() => {
        // Initialize axios default baseURL and auth state
        authUtils.initializeAuth();
        // Check if token exists to set auth state
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
        
        // Set page as loaded after a short delay to show the loader
        // This delay ensures the loading animation is visible even on fast connections
        const loadTimer = setTimeout(() => {
            setPageLoaded(true);
        }, 1800); // Slightly longer to ensure the animation completes
        
        // Track page document ready state
        const trackPageLoad = () => {
            if (document.readyState === 'complete') {
                setTimeout(() => setPageLoaded(true), 300); // Short delay after content loads
            }
        };
        
        document.addEventListener('readystatechange', trackPageLoad);
        
        return () => {
            clearTimeout(loadTimer);
            document.removeEventListener('readystatechange', trackPageLoad);
        };
    }, []);
    
    // Listen for route changes
    useEffect(() => {
        handleRouteChange(location.pathname);
    }, [location, handleRouteChange]);

    // Initialize session tracking when user is authenticated
    useEffect(() => {
        if (isAuthenticated && !localStorage.getItem('sessionId')) {
            authUtils.trackSession();
        }
    }, [isAuthenticated]);

    return (
        <div className="app-container d-flex flex-column min-vh-100">
            <PageLoader isLoading={!pageLoaded || navigating} />
            <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            <div className="flex-grow-1">
                <Routes>
                    <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
                    <Route path="/process" element={isAuthenticated ? <AudioProcessingPage /> : <Navigate to="/login" />} />
                    <Route path="/analyze" element={isAuthenticated ? <Analyze /> : <Navigate to="/login" />} />
                    <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
                    <Route path="/signup" element={!isAuthenticated ? <Signup setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
                    <Route path="/dashboard" element={isAuthenticated && authUtils.isAdmin() ? <Dashboard /> : <Navigate to="/" />} />
                    <Route path="/messages" element={isAuthenticated && authUtils.isAdmin() ? <Messages /> : <Navigate to="/" />} />
                    <Route path="/account" element={isAuthenticated ? <Account /> : <Navigate to="/login" />} />
                    <Route path="/account/security" element={isAuthenticated ? <AccountSecurity /> : <Navigate to="/login" />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/tuner" element={isAuthenticated ? <TunerPage /> : <Navigate to="/login" />} />
                    <Route path="/lyrics-identifier" element={isAuthenticated ? <LyricsIdentifier /> : <Navigate to="/login" />} />
                    <Route path="/musician-tools" element={isAuthenticated ? <MusicianTools /> : <Navigate to="/login" />} />
                    <Route path="/tap-tempo" element={isAuthenticated ? <TapTempoPage /> : <Navigate to="/login" />} />
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
    );
};

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
