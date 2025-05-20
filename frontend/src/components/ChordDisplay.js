import React, { useState, useEffect } from 'react';
import './style/ChordDisplay.css';

function ChordDisplay({ chords = [], currentIndex = -1, transpositionValue = 0, transposeChord, displayMode = 'timeline' }) {
    const [visualizerType, setVisualizerType] = useState('keyboard'); // 'keyboard' or 'fretboard'

    if (!chords || chords.length === 0) {
        return <div style={{textAlign: 'center', color: '#888'}}>No chords detected yet.</div>;
    }
    
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
    
    // Check if a piano key is included in a chord
    const isPianoKeyActive = (note, chordValue) => {
        // Extract base chord without transposition
        const baseChord = chordValue.charAt(0) + 
                        (chordValue.length > 1 && (chordValue.charAt(1) === '#' || chordValue.charAt(1) === 'b') 
                            ? chordValue.charAt(1) 
                            : '');
        
        let chordType = baseChord.length === 1 ? chordValue.substring(1) : chordValue.substring(2);
        
        // Default to major if no chord type specified
        if (chordType === '') chordType = '';
        
        // Create lookup key
        const lookupKey = baseChord + chordType;
        
        // Try exact match first
        if (chordNotes[lookupKey] && chordNotes[lookupKey].includes(note)) return true;
        
        // If no exact match, try basic chord types
        if (chordType.includes('m') && chordNotes[baseChord + 'm'] && chordNotes[baseChord + 'm'].includes(note)) return true;
        if (chordType.includes('7') && chordNotes[baseChord + '7'] && chordNotes[baseChord + '7'].includes(note)) return true;
        if (chordNotes[baseChord] && chordNotes[baseChord].includes(note)) return true;
        
        return false;
    };
    
    // Check if a guitar fret position is active for a chord
    const isGuitarFretActive = (string, fret, chordValue) => {
        // Extract base chord without transposition
        const baseChord = chordValue.charAt(0) + 
                        (chordValue.length > 1 && (chordValue.charAt(1) === '#' || chordValue.charAt(1) === 'b') 
                            ? chordValue.charAt(1) 
                            : '');
        
        let chordType = baseChord.length === 1 ? chordValue.substring(1) : chordValue.substring(2);
        
        // Default to major if no chord type specified
        if (chordType === '') chordType = '';
        
        // Create lookup key
        const lookupKey = baseChord + chordType;
        
        // Try exact match first
        if (chordFingerings[lookupKey]) {
            return chordFingerings[lookupKey].some(
                ([stringNum, fretNum]) => stringNum === string && fretNum === fret
            );
        }
        
        // If no exact match, try basic chord types
        if (chordType.includes('m') && chordFingerings[baseChord + 'm']) {
            return chordFingerings[baseChord + 'm'].some(
                ([stringNum, fretNum]) => stringNum === string && fretNum === fret
            );
        }
        
        if (chordType.includes('7') && chordFingerings[baseChord + '7']) {
            return chordFingerings[baseChord + '7'].some(
                ([stringNum, fretNum]) => stringNum === string && fretNum === fret
            );
        }
        
        if (chordFingerings[baseChord]) {
            return chordFingerings[baseChord].some(
                ([stringNum, fretNum]) => stringNum === string && fretNum === fret
            );
        }
        
        return false;
    };
    
    // Function to filter out duplicate consecutive chords (for Chordify mode)
    const getUniqueChordsForDisplay = () => {
        if (!chords || chords.length === 0) return [];
        
        // In timeline mode, show all chords
        if (displayMode === 'timeline') return chords;
        
        // In Chordify mode, filter out consecutive duplicates
        const uniqueChords = [];
        let lastChordValue = null;
        
        chords.forEach(chord => {
            const isChordObject = typeof chord !== 'string';
            const chordValue = isChordObject ? chord.chord : chord;
            
            // If this chord is different from the last one, add it
            if (chordValue !== lastChordValue) {
                uniqueChords.push(chord);
                lastChordValue = chordValue;
            } else if (isChordObject && currentIndex !== -1) {
                // Update the last chord if this is the current chord
                const lastIdx = uniqueChords.length - 1;
                if (uniqueChords[lastIdx] && chord === chords[currentIndex]) {
                    uniqueChords[lastIdx] = chord;
                }
            }
        });
        
        return uniqueChords;
    };
    
    // Get chords to display based on the current mode
    const displayChords = getUniqueChordsForDisplay();
    
    return (
        <div className="chord-display-container">
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

            <div className={`chord-timeline ${displayMode === 'chordify' ? 'chordify-mode' : ''}`}>
                {displayChords.map((chord, idx) => {
                    // Determine if this is a raw chord string or an object with time and chord
                    const isChordObject = typeof chord !== 'string';
                    const chordValue = isChordObject ? chord.chord : chord;
                    const chordTime = isChordObject ? chord.time : null;
                    
                    // Generate the displayed chord with transposition if needed
                    const displayChord = transpositionValue !== 0 && transposeChord 
                        ? transposeChord(chordValue, transpositionValue) 
                        : chordValue;
                    
                    // Check if this chord is the current playing chord
                    const isCurrentChord = displayMode === 'timeline' 
                        ? idx === currentIndex
                        : isChordObject && chords[currentIndex] === chord;

                    return (
                        <div 
                            className={`chord-card ${isCurrentChord ? 'active-chord' : ''}`} 
                            key={idx}
                            title={transpositionValue !== 0 ? `Original: ${chordValue}` : ''}
                        >
                            <span className="chord-label">{displayChord}</span>
                            {chordTime && <span className="chord-time">{chordTime.toFixed(1)}s</span>}
                            {transpositionValue !== 0 && (
                                <span className="transposed-indicator">↑</span>
                            )}
                            
                            {/* Chord Visualization */}
                            <div className="chord-visualization">
                                {visualizerType === 'keyboard' ? (
                                    <div className="mini-piano-keyboard">
                                        {pianoKeys.map((key, index) => (
                                            <div 
                                                key={`${key.note}-${index}`}
                                                className={`piano-key ${key.isBlack ? 'black' : 'white'} ${isPianoKeyActive(key.note, displayChord) ? 'active' : ''}`}
                                                style={{ left: `${key.position * 14}%` }}
                                            >
                                                <span className="key-label">{key.isBlack ? '' : key.note}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mini-guitar-fretboard">
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
                                                        className={`guitar-fret ${isGuitarFretActive(stringIndex + 1, fretIndex, displayChord) ? 'active' : ''}`}
                                                    >
                                                        {isGuitarFretActive(stringIndex + 1, fretIndex, displayChord) && (
                                                            <div className="fret-dot"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ChordDisplay;