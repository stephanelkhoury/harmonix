import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaDrum, FaRedo } from 'react-icons/fa';
import './style/TapTempo.css';

function TapTempo() {
  const [bpm, setBpm] = useState(0);
  const [taps, setTaps] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [visualBeat, setVisualBeat] = useState(false);
  const [accuracy, setAccuracy] = useState(0);

  // Calculate BPM from recent taps
  const calculateBPM = useCallback((timestamps) => {
    if (timestamps.length < 2) return { bpm: 0, accuracy: 0 };
    
    // Get time intervals between taps
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    // Calculate average interval and standard deviation
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, val) => acc + Math.pow(val - averageInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate accuracy (inverse of coefficient of variation, normalized to 0-100)
    const accuracy = Math.min(100, Math.max(0, 100 * (1 - stdDev / averageInterval)));
    
    // Convert to BPM
    return {
      bpm: Math.round(60000 / averageInterval),
      accuracy: Math.round(accuracy)
    };
  }, []);

  // Handle tap event
  const handleTap = useCallback(() => {
    const now = Date.now();
    setTaps(prevTaps => {
      // Keep only taps within last 5 seconds
      const recentTaps = [...prevTaps.filter(tap => now - tap < 5000), now];
      const { bpm: newBpm, accuracy: newAccuracy } = calculateBPM(recentTaps);
      setBpm(newBpm);
      setAccuracy(newAccuracy);
      return recentTaps;
    });

    // Visual feedback
    setVisualBeat(true);
    setTimeout(() => setVisualBeat(false), 100);

    // Start the metronome if not already active
    setIsActive(true);
  }, [calculateBPM]);

  // Play metronome tick
  useEffect(() => {
    if (!isActive || bpm <= 0) return;

    const interval = setInterval(() => {
      setVisualBeat(true);
      setTimeout(() => setVisualBeat(false), 100);
    }, 60000 / bpm);

    return () => clearInterval(interval);
  }, [isActive, bpm]);

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleTap]);

  // Reset metronome
  const handleReset = () => {
    setBpm(0);
    setTaps([]);
    setIsActive(false);
    setAccuracy(0);
  };

  return (
    <Card className="tap-tempo">
      <Card.Body>
        <div className="tap-tempo-header">
          <h2><FaDrum className="icon" /> Tap Tempo</h2>
        </div>

        <div className={`tempo-display ${visualBeat ? 'beat' : ''}`}>
          <div className="bpm-value">{bpm || '--'}</div>
          <div className="bpm-label">BPM</div>
          {accuracy > 0 && (
            <div className="accuracy" style={{ opacity: accuracy / 100 }}>
              Accuracy: {accuracy}%
            </div>
          )}
        </div>

        <div className="tap-instructions">
          Tap the button or press spacebar repeatedly to find the tempo
        </div>

        <div className="tap-controls">
          <Button 
            variant="primary"
            className="tap-button"
            onClick={handleTap}
          >
            TAP
          </Button>
          
          <Button 
            variant="outline-secondary"
            className="reset-button"
            onClick={handleReset}
          >
            <FaRedo /> Reset
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default TapTempo;
