import React, { useState, useEffect } from 'react';
import GuitarFretboard from '../components/GuitarFretboard';
import './style/CapoDemo.css';

const CapoDemo = () => {
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [capoPosition, setCapoPosition] = useState(0);
  
  // Demo chord progression (I-vi-IV-V in C major)
  const demoChords = [
    { chord: 'C', confidence: 0.95, duration: 2000 },
    { chord: 'Am', confidence: 0.92, duration: 2000 },
    { chord: 'F', confidence: 0.88, duration: 2000 },
    { chord: 'G', confidence: 0.94, duration: 2000 },
  ];
  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentChordIndex((prev) => (prev + 1) % demoChords.length);
      }, demoChords[currentChordIndex].duration);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentChordIndex, demoChords]);

  const currentChord = demoChords[currentChordIndex];

  return (
    <div className="capo-demo">
      <div className="demo-header">
        <h1>🎸 Harmonix Capo</h1>
        <p>Real-time chord detection with visual guitar fretboard</p>
      </div>

      <div className="demo-stats">
        <div className="stat-card">
          <div className="stat-value">Real-Time</div>
          <div className="stat-label">Detection</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">95%+</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0-12</div>
          <div className="stat-label">Capo Support</div>
        </div>
      </div>

      <div className="current-chord-display">
        <div className="chord-main">
          <div className="chord-name">
            {currentChord.chord}
          </div>
          <div className="chord-confidence">
            {Math.round(currentChord.confidence * 100)}% confidence
          </div>
        </div>
      </div>

      <GuitarFretboard 
        currentChord={currentChord.chord} 
        capoPosition={capoPosition} 
      />

      <div className="demo-controls">
        <div className="playback-controls">
          <button
            className={`demo-button ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸️ Pause Demo' : '▶️ Play Demo'}
          </button>
          <button
            className="demo-button secondary"
            onClick={() => setCurrentChordIndex((prev) => (prev + 1) % demoChords.length)}
          >
            ⏭️ Next Chord
          </button>
        </div>

        <div className="capo-demo-controls">
          <h3>Capo Position</h3>
          <div className="capo-selector">
            {[...Array(5)].map((_, i) => (
              <button
                key={i}
                className={`capo-button ${capoPosition === i ? 'active' : ''}`}
                onClick={() => setCapoPosition(i)}
              >
                {i === 0 ? 'Open' : `Fret ${i}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chord-progression">
        <h3>Demo Progression (C Major)</h3>
        <div className="progression-display">
          {demoChords.map((chord, index) => (
            <div
              key={index}
              className={`progression-chord ${index === currentChordIndex ? 'active' : ''}`}
            >
              <div className="progression-chord-name">{chord.chord}</div>
              <div className="progression-chord-numeral">
                {index === 0 ? 'I' : index === 1 ? 'vi' : index === 2 ? 'IV' : 'V'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-showcase">
        <h3>🌟 Key Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎵</div>
            <h4>Real-Time Detection</h4>
            <p>Instant chord recognition from any audio source</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎸</div>
            <h4>Visual Fretboard</h4>
            <p>See exactly where to place your fingers</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h4>Capo Support</h4>
            <p>Perfect for guitarists using capos</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Confidence Scoring</h4>
            <p>Know how accurate each detection is</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h3>Ready to try it live?</h3>
        <p>Experience real-time chord detection with your own instrument!</p>
        <div className="cta-buttons">
          <a href="/real-time-chords" className="cta-button primary">
            🎤 Start Live Detection
          </a>
          <a href="/analyze" className="cta-button secondary">
            📁 Analyze Audio File
          </a>
        </div>
      </div>
    </div>
  );
};

export default CapoDemo;
