import React, { useState } from 'react';
import './style/ChordVisualizer.css';

function ChordVisualizer() {
  const [activeChord, setActiveChord] = useState('C');
  const [visualizerType, setVisualizerType] = useState('keyboard'); // 'keyboard' or 'fretboard'
  
  // Piano keyboard note mapping
  const pianoKeys = [
    { note: 'C', position: 0, isBlack: false },
    { note: 'C#', position: 0.5, isBlack: true },
    { note: 'D', position: 1, isBlack: false },
    { note: 'D#', position: 1.5, isBlack: true },
    { note: 'E', position: 2, isBlack: false },
    { note: 'F', position: 3, isBlack: false },
    { note: 'F#', position: 3.5, isBlack: true },
    { note: 'G', position: 4, isBlack: false },
    { note: 'G#', position: 4.5, isBlack: true },
    { note: 'A', position: 5, isBlack: false },
    { note: 'A#', position: 5.5, isBlack: true },
    { note: 'B', position: 6, isBlack: false },
    { note: 'C', position: 7, isBlack: false },
  ];

  // Guitar fretboard note mapping (6 strings, 5 frets)
  const guitarStrings = [
    { name: 'E', notes: ['E', 'F', 'F#', 'G', 'G#'] },
    { name: 'A', notes: ['A', 'A#', 'B', 'C', 'C#'] },
    { name: 'D', notes: ['D', 'D#', 'E', 'F', 'F#'] },
    { name: 'G', notes: ['G', 'G#', 'A', 'A#', 'B'] },
    { name: 'B', notes: ['B', 'C', 'C#', 'D', 'D#'] },
    { name: 'E', notes: ['E', 'F', 'F#', 'G', 'G#'] }
  ];
  
  // Chord note mappings
  const chordNotes = {
    'C': ['C', 'E', 'G'],
    'Dm': ['D', 'F', 'A'],
    'Em': ['E', 'G', 'B'],
    'F': ['F', 'A', 'C'],
    'G': ['G', 'B', 'D'],
    'Am': ['A', 'C', 'E'],
    'Bdim': ['B', 'D', 'F'],
    'C7': ['C', 'E', 'G', 'A#'],
    'Fmaj7': ['F', 'A', 'C', 'E'],
    'G7': ['G', 'B', 'D', 'F']
  };

  // Guitar chord fingering positions [string, fret]
  const chordFingerings = {
    'C': [[5, 3], [4, 2], [3, 0], [2, 1], [1, 0]],
    'G': [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 3]],
    'D': [[4, 0], [3, 2], [2, 3], [1, 2]],
    'A': [[5, 0], [4, 2], [3, 2], [2, 2], [1, 0]],
    'E': [[6, 0], [5, 2], [4, 2], [3, 1], [2, 0], [1, 0]],
    'F': [[6, 1], [5, 3], [4, 3], [3, 2], [2, 1], [1, 1]],
    'Am': [[5, 0], [4, 2], [3, 2], [2, 1], [1, 0]],
    'Dm': [[4, 0], [3, 2], [2, 3], [1, 1]],
    'Em': [[6, 0], [5, 2], [4, 2], [3, 0], [2, 0], [1, 0]],
    'G7': [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 1]],
  };

  // Get available chords
  const availableChords = Object.keys(chordNotes);
  
  // Check if a piano key is included in the current chord
  const isPianoKeyActive = (note) => {
    return chordNotes[activeChord] && chordNotes[activeChord].includes(note);
  };
  
  // Check if a guitar fret position is active for the current chord
  const isGuitarFretActive = (string, fret) => {
    if (!chordFingerings[activeChord]) return false;
    
    return chordFingerings[activeChord].some(
      ([stringNum, fretNum]) => stringNum === string && fretNum === fret
    );
  };

  return (
    <div className="chord-visualizer">
      <div className="visualizer-tabs">
        <button 
          className={`visualizer-tab ${visualizerType === 'keyboard' ? 'active' : ''}`}
          onClick={() => setVisualizerType('keyboard')}
        >
          <img 
            src={`${process.env.PUBLIC_URL}/assets/images/welcome/keyboard-icon.svg`} 
            alt="Keyboard" 
            className="tab-icon" 
          /> 
          Piano
        </button>
        <button 
          className={`visualizer-tab ${visualizerType === 'fretboard' ? 'active' : ''}`}
          onClick={() => setVisualizerType('fretboard')}
        >
          <img 
            src={`${process.env.PUBLIC_URL}/assets/images/welcome/fretboard-icon.svg`} 
            alt="Fretboard" 
            className="tab-icon" 
          /> 
          Guitar
        </button>
      </div>

      <div className="chord-selector">
        <span>Try a chord: </span>
        <div className="chord-buttons">
          {availableChords.slice(0, 6).map(chord => (
            <button 
              key={chord} 
              className={`chord-button ${activeChord === chord ? 'active' : ''}`}
              onClick={() => setActiveChord(chord)}
            >
              {chord}
            </button>
          ))}
        </div>
      </div>
      
      <div className="visualizer-display">
        {visualizerType === 'keyboard' ? (
          <div className="piano-keyboard">
            {pianoKeys.map((key, index) => (
              <div 
                key={`${key.note}-${index}`}
                className={`piano-key ${key.isBlack ? 'black' : 'white'} ${isPianoKeyActive(key.note) ? 'active' : ''}`}
                style={{ left: `${key.position * 14}%` }}
              >
                <span className="key-label">{key.note}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="guitar-fretboard">
            <div className="fret-markers">
              {[0, 1, 2, 3, 4].map(fret => (
                <div key={fret} className="fret-marker">
                  {fret > 0 ? fret : ''}
                </div>
              ))}
            </div>
            
            {guitarStrings.map((string, stringIndex) => (
              <div key={stringIndex} className="guitar-string">
                <div className="string-name">{string.name}</div>
                {string.notes.map((note, fretIndex) => (
                  <div 
                    key={`${stringIndex}-${fretIndex}`}
                    className={`guitar-fret ${isGuitarFretActive(stringIndex + 1, fretIndex) ? 'active' : ''}`}
                  >
                    {isGuitarFretActive(stringIndex + 1, fretIndex) && (
                      <div className="fret-dot">{note}</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chord-info">
        <h3>{activeChord} Chord</h3>
        <p>Notes: {chordNotes[activeChord]?.join(', ')}</p>
      </div>
    </div>
  );
}

export default ChordVisualizer;
