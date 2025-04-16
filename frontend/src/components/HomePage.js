import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';

function HomePage() {
    const [audioBlob, setAudioBlob] = useState(null);
    const navigate = useNavigate();

    const handleAudioReady = (blob) => {
        setAudioBlob(blob);
    };

    const handleAnalyze = () => {
        navigate('/analyze', { state: { audioBlob } });
    };

    return (
        <div>
            <h1>Welcome to Harmonix</h1>
            <p>Real-time audio chord recognition and visualization.</p>
            <AudioRecorder onAudioReady={handleAudioReady} />
            {audioBlob && (
                <div>
                    <p>Audio ready for analysis.</p>
                    <button onClick={handleAnalyze}>Analyze Audio</button>
                </div>
            )}
        </div>
    );
}

export default HomePage;
