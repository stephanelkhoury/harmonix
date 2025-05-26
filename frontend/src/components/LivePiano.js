import React, { useEffect, useState, useRef } from 'react';
import { playPianoNoteFromKey, releaseNote, getNoteFromKey, initAudioContext } from '../utils/pianoSamples';
import './style/LivePiano.css';

const LivePiano = ({ onNotePlay }) => {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [sustainedNotes, setSustainedNotes] = useState(new Set());
  const pianoRef = useRef(null);

  // Piano layout definition
  const whiteKeys = [
    { note: 'C3', key: 'z', label: 'Z' },
    { note: 'D3', key: 'x', label: 'X' },
    { note: 'E3', key: 'c', label: 'C' },
    { note: 'F3', key: 'v', label: 'V' },
    { note: 'G3', key: 'b', label: 'B' },
    { note: 'A3', key: 'n', label: 'N' },
    { note: 'B3', key: 'm', label: 'M' },
    { note: 'C4', key: 'q', label: 'Q' },
    { note: 'D4', key: 'w', label: 'W' },
    { note: 'E4', key: 'e', label: 'E' },
    { note: 'F4', key: 'r', label: 'R' },
    { note: 'G4', key: 't', label: 'T' },
    { note: 'A4', key: 'y', label: 'Y' },
    { note: 'B4', key: 'u', label: 'U' },
    { note: 'C5', key: 'i', label: 'I' },
    { note: 'D5', key: 'o', label: 'O' },
    { note: 'E5', key: 'p', label: 'P' }
  ];

  const blackKeys = [
    { note: 'C#3', key: 'g', label: '2', position: 0.5 },
    { note: 'D#3', key: 'h', label: '3', position: 1.5 },
    { note: 'F#3', key: 'k', label: '5', position: 3.5 },
    { note: 'G#3', key: 'l', label: '6', position: 4.5 },
    { note: 'A#3', key: ';', label: '7', position: 5.5 },
    { note: 'C#4', key: '2', label: '2', position: 7.5 },
    { note: 'D#4', key: '3', label: '3', position: 8.5 },
    { note: 'F#4', key: '5', label: '5', position: 10.5 },
    { note: 'G#4', key: '6', label: '6', position: 11.5 },
    { note: 'A#4', key: '7', label: '7', position: 12.5 },
    { note: 'C#5', key: '9', label: '9', position: 14.5 },
    { note: 'D#5', key: '0', label: '0', position: 15.5 }
  ];

  useEffect(() => {
    // Initialize audio context on component mount
    initAudioContext();

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      
      // Prevent default for piano keys to avoid browser shortcuts
      if (getNoteFromKey(key)) {
        event.preventDefault();
      }
      
      // Avoid key repeat
      if (event.repeat || pressedKeys.has(key)) return;

      const note = getNoteFromKey(key);
      if (note) {
        setPressedKeys(prev => new Set([...prev, key]));
        setSustainedNotes(prev => new Set([...prev, note]));
        playPianoNoteFromKey(key, 0.8);
        
        // Callback for parent component
        if (onNotePlay) {
          onNotePlay(note);
        }
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      const note = getNoteFromKey(key);
      
      if (note && pressedKeys.has(key)) {
        setPressedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        
        setSustainedNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(note);
          return newSet;
        });
        
        releaseNote(note);
      }
    };

    // Mouse/touch handlers for piano keys
    const handleMouseDown = (note, key) => {
      if (!pressedKeys.has(key)) {
        setPressedKeys(prev => new Set([...prev, key]));
        setSustainedNotes(prev => new Set([...prev, note]));
        playPianoNoteFromKey(key, 0.8);
        
        if (onNotePlay) {
          onNotePlay(note);
        }
      }
    };

    const handleMouseUp = (note, key) => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      
      setSustainedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
      
      releaseNote(note);
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Store handlers for cleanup
    const pianoElement = pianoRef.current;
    if (pianoElement) {
      // Add mouse event listeners to piano keys
      const whiteKeyElements = pianoElement.querySelectorAll('.white-key');
      const blackKeyElements = pianoElement.querySelectorAll('.black-key');
      
      whiteKeyElements.forEach((element) => {
        const note = element.dataset.note;
        const key = element.dataset.key;
        
        element.addEventListener('mousedown', () => handleMouseDown(note, key));
        element.addEventListener('mouseup', () => handleMouseUp(note, key));
        element.addEventListener('mouseleave', () => handleMouseUp(note, key));
      });
      
      blackKeyElements.forEach((element) => {
        const note = element.dataset.note;
        const key = element.dataset.key;
        
        element.addEventListener('mousedown', () => handleMouseDown(note, key));
        element.addEventListener('mouseup', () => handleMouseUp(note, key));
        element.addEventListener('mouseleave', () => handleMouseUp(note, key));
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKeys, onNotePlay]);

  const isKeyPressed = (key) => pressedKeys.has(key);

  return (
    <div className="live-piano-container">
      <div className="piano-instructions">
        <h4>🎹 Live Piano</h4>
        <p>Play with your keyboard! Use keys Q-U for C4-B4, Z-M for C3-B3, and number keys for sharps/flats.</p>
      </div>
      
      <div className="piano-keyboard" ref={pianoRef}>
        {/* White Keys */}
        <div className="white-keys">
          {whiteKeys.map(({ note, key, label }) => (
            <div
              key={note}
              className={`white-key ${isKeyPressed(key) ? 'pressed' : ''}`}
              data-note={note}
              data-key={key}
            >
              <span className="key-label">{label}</span>
              <span className="note-label">{note}</span>
            </div>
          ))}
        </div>
        
        {/* Black Keys */}
        <div className="black-keys">
          {blackKeys.map(({ note, key, label, position }) => (
            <div
              key={note}
              className={`black-key ${isKeyPressed(key) ? 'pressed' : ''}`}
              data-note={note}
              data-key={key}
              style={{ left: `${position * (100 / whiteKeys.length)}%` }}
            >
              <span className="key-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="sustained-notes">
        {sustainedNotes.size > 0 && (
          <div className="playing-notes">
            <strong>Playing: </strong>
            {Array.from(sustainedNotes).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePiano;
