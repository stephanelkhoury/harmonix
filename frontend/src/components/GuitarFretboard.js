import React from 'react';
import './style/GuitarFretboard.css';

const GuitarFretboard = ({ currentChord, capoPosition = 0 }) => {
  // Standard tuning (low to high)
  const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
  const frets = Array.from({ length: 13 }, (_, i) => i); // 0-12 frets

  // Basic chord patterns (fret positions for each string)
  const chordPatterns = {
    'C': [null, 3, 2, 0, 1, 0],
    'Am': [null, 0, 2, 2, 1, 0],
    'F': [1, 1, 3, 3, 2, 1],
    'G': [3, 2, 0, 0, 3, 3],
    'D': [null, null, 0, 2, 3, 2],
    'Dm': [null, null, 0, 2, 3, 1],
    'E': [0, 2, 2, 1, 0, 0],
    'Em': [0, 2, 2, 0, 0, 0],
    'A': [null, 0, 2, 2, 2, 0],
    'B': [null, 2, 4, 4, 4, 2],
    'Bm': [null, 2, 4, 4, 3, 2],
    'C#': [null, 4, 6, 6, 6, 4],
    'F#': [2, 4, 4, 3, 2, 2],
    'G#': [4, 6, 6, 5, 4, 4],
  };

  // Get finger positions for current chord
  const getFingerPositions = (chord) => {
    if (!chord || chord === 'N') return [];
    
    // Handle chord variations (e.g., "Cmaj7" -> "C")
    const baseChord = chord.replace(/maj7|7|m7|sus2|sus4|add9|6|9|11|13|dim|aug|\+|\-/g, '');
    return chordPatterns[baseChord] || [];
  };

  const fingerPositions = getFingerPositions(currentChord);

  return (
    <div className="guitar-fretboard">
      <div className="fretboard-header">
        <h4>Guitar Fretboard</h4>
        {capoPosition > 0 && (
          <div className="capo-indicator">
            Capo: {capoPosition}
          </div>
        )}
      </div>
      
      <div className="fretboard-container">
        {/* Capo bar */}
        {capoPosition > 0 && (
          <div 
            className="capo-bar" 
            style={{ left: `${(capoPosition - 0.5) * 60}px` }}
          >
            <div className="capo-label">Capo</div>
          </div>
        )}
        
        {/* Strings */}
        {strings.map((string, stringIndex) => (
          <div key={stringIndex} className="guitar-string" data-string={string}>
            {/* String line */}
            <div className="string-line"></div>
            
            {/* String label */}
            <div className="string-label">{string}</div>
            
            {/* Fret positions */}
            {frets.map((fret) => {
              const fingerPosition = fingerPositions[stringIndex];
              const isPressed = fingerPosition !== null && fingerPosition !== undefined && fingerPosition === fret;
              const isMuted = fingerPositions[stringIndex] === null;
              
              return (
                <div
                  key={fret}
                  className={`fret-position ${isPressed ? 'pressed' : ''} ${fret === 0 ? 'open' : ''}`}
                  data-fret={fret}
                >
                  {isPressed && <div className="finger-dot"></div>}
                  {fret === 0 && isMuted && <div className="muted-indicator">×</div>}
                  {fret === 0 && !isMuted && fingerPosition === 0 && <div className="open-indicator">○</div>}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Fret markers */}
        <div className="fret-markers">
          {[3, 5, 7, 9, 12].map(fret => (
            <div key={fret} className="fret-marker" style={{ left: `${fret * 60 - 30}px` }}>
              {fret === 12 ? '●●' : '●'}
            </div>
          ))}
        </div>
        
        {/* Fret numbers */}
        <div className="fret-numbers">
          {frets.slice(1).map(fret => (
            <div key={fret} className="fret-number" style={{ left: `${fret * 60 - 10}px` }}>
              {fret}
            </div>
          ))}
        </div>
      </div>
      
      {/* Chord info */}
      <div className="chord-info">
        <div className="current-chord">
          {currentChord && currentChord !== 'N' ? (
            <>
              <span className="chord-name">{currentChord}</span>
              <span className="chord-type">Guitar Chord</span>
            </>
          ) : (
            <span className="no-chord">No chord detected</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuitarFretboard;
