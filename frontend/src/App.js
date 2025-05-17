import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './components/HomePage';
import AudioProcessingPage from './components/AudioProcessingPage';
import Analyze from './pages/Analyze';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Signup from './pages/Signup';
import Account from './pages/Account';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    return (
        <Router>
            <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            <Routes>
                <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
                <Route path="/process" element={isAuthenticated ? <AudioProcessingPage /> : <Navigate to="/login" />} />
                <Route path="/analyze" element={isAuthenticated ? <Analyze /> : <Navigate to="/login" />} />
                <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} />
                <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/account" element={isAuthenticated ? <Account /> : <Navigate to="/login" />} />
                <Route path="/about" element={isAuthenticated ? <About /> : <Navigate to="/login" />} />
                <Route path="/contact" element={isAuthenticated ? <Contact /> : <Navigate to="/login" />} />
                <Route path="/faq" element={isAuthenticated ? <FAQ /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
