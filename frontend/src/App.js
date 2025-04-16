import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AudioProcessingPage from './components/AudioProcessingPage';
import Analyze from './pages/Analyze';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/process" element={<AudioProcessingPage />} />
                <Route path="/analyze" element={<Analyze />} />
            </Routes>
        </Router>
    );
}

export default App;
