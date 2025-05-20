import React from 'react';
import './style/ChordDiagram.css';

/**
 * ChordDiagram component renders a guitar chord diagram
 * @param {string} chordName - The name of the chord (e.g., 'C', 'Am')
 * @param {boolean} showFull - Whether to show the full diagram or compact version
 */
const ChordDiagram = ({ chordName, showFull = false }) => {
  // This function returns the dots positions for a given chord
  const getChordDots = (chord) => {
    // Basic chord dictionary - can be expanded in the future
    const chords = {
      // Major chords
      'C': [
        { string: 1, fret: 0 }, // 1st string (high E) open
        { string: 2, fret: 1 }, // 2nd string (B) fret 1
        { string: 3, fret: 0 }, // 3rd string (G) open
        { string: 4, fret: 2 }, // 4th string (D) fret 2
        { string: 5, fret: 3 }, // 5th string (A) fret 3
        { string: 6, fret: 'x' } // 6th string (low E) muted
      ],
      'G': [
        { string: 1, fret: 3 },
        { string: 2, fret: 0 },
        { string: 3, fret: 0 },
        { string: 4, fret: 0 },
        { string: 5, fret: 2 },
        { string: 6, fret: 3 }
      ],
      'D': [
        { string: 1, fret: 2 },
        { string: 2, fret: 3 },
        { string: 3, fret: 2 },
        { string: 4, fret: 0 },
        { string: 5, fret: 'x' },
        { string: 6, fret: 'x' }
      ],
      'A': [
        { string: 1, fret: 0 },
        { string: 2, fret: 2 },
        { string: 3, fret: 2 },
        { string: 4, fret: 2 },
        { string: 5, fret: 0 },
        { string: 6, fret: 'x' }
      ],
      'E': [
        { string: 1, fret: 0 },
        { string: 2, fret: 0 },
        { string: 3, fret: 1 },
        { string: 4, fret: 2 },
        { string: 5, fret: 2 },
        { string: 6, fret: 0 }
      ],
      'F': [
        { string: 1, fret: 1 },
        { string: 2, fret: 1 },
        { string: 3, fret: 2 },
        { string: 4, fret: 3 },
        { string: 5, fret: 3 },
        { string: 6, fret: 1 }
      ],
      'B': [
        { string: 1, fret: 2 },
        { string: 2, fret: 4 },
        { string: 3, fret: 4 },
        { string: 4, fret: 4 },
        { string: 5, fret: 2 },
        { string: 6, fret: 'x' }
      ],
      // Minor chords
      'Am': [
        { string: 1, fret: 0 },
        { string: 2, fret: 1 },
        { string: 3, fret: 2 },
        { string: 4, fret: 2 },
        { string: 5, fret: 0 },
        { string: 6, fret: 'x' }
      ],
      'Em': [
        { string: 1, fret: 0 },
        { string: 2, fret: 0 },
        { string: 3, fret: 0 },
        { string: 4, fret: 2 },
        { string: 5, fret: 2 },
        { string: 6, fret: 0 }
      ],
      'Dm': [
        { string: 1, fret: 1 },
        { string: 2, fret: 3 },
        { string: 3, fret: 2 },
        { string: 4, fret: 0 },
        { string: 5, fret: 'x' },
        { string: 6, fret: 'x' }
      ],
      // 7th chords
      'C7': [
        { string: 1, fret: 0 },
        { string: 2, fret: 1 },
        { string: 3, fret: 3 },
        { string: 4, fret: 2 },
        { string: 5, fret: 3 },
        { string: 6, fret: 'x' }
      ],
      'G7': [
        { string: 1, fret: 1 },
        { string: 2, fret: 0 },
        { string: 3, fret: 0 },
        { string: 4, fret: 0 },
        { string: 5, fret: 2 },
        { string: 6, fret: 3 }
      ],
      'D7': [
        { string: 1, fret: 2 },
        { string: 2, fret: 1 },
        { string: 3, fret: 2 },
        { string: 4, fret: 0 },
        { string: 5, fret: 'x' },
        { string: 6, fret: 'x' }
      ],
      'A7': [
        { string: 1, fret: 0 },
        { string: 2, fret: 2 },
        { string: 3, fret: 0 },
        { string: 4, fret: 2 },
        { string: 5, fret: 0 },
        { string: 6, fret: 'x' }
      ],
      'E7': [
        { string: 1, fret: 0 },
        { string: 2, fret: 3 },
        { string: 3, fret: 1 },
        { string: 4, fret: 2 },
        { string: 5, fret: 2 },
        { string: 6, fret: 0 }
      ]
    };

    // Extract the base chord name without modifiers
    const baseChord = chord.charAt(0);
    
    // Detect minor chord
    const isMinor = chord.includes('m') || chord.includes('min');
    
    // Detect 7th chord
    const is7th = chord.includes('7');
    
    // Form the look-up key
    let lookupKey = baseChord;
    if (isMinor) lookupKey += 'm';
    if (is7th) lookupKey += '7';
    
    // Return the chord dots if available, or a default chord
    return chords[lookupKey] || chords['C']; // Default to C chord if not found
  };

  // Get chord dots based on the name
  const dots = getChordDots(chordName);

  // Render the chord diagram
  return (
    <div className={`chord-diagram ${showFull ? 'full-size' : ''}`}>
      <h3 className="chord-name">{chordName}</h3>
      <div className="fretboard">
        {/* Nut */}
        <div className="nut"></div>
        
        {/* Fret numbers */}
        {showFull && (
          <div className="fret-numbers">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
          </div>
        )}
        
        {/* Frets and strings */}
        <div className="frets">
          {[...Array(5)].map((_, fretIndex) => (
            <div key={`fret-${fretIndex}`} className="fret"></div>
          ))}
        </div>
        <div className="strings">
          {[...Array(6)].map((_, stringIndex) => (
            <div key={`string-${stringIndex + 1}`} className="string"></div>
          ))}
        </div>
        
        {/* Dots representing finger positions */}
        {dots.map((dot, index) => {
          if (dot.fret === 'x') {
            return (
              <div 
                key={`mute-${index}`}
                className="muted-string"
                style={{ left: `${(dot.string - 1) * 16.6 + 8}%` }}
              >
                ×
              </div>
            );
          } else if (dot.fret === 0) {
            return (
              <div 
                key={`open-${index}`}
                className="open-string"
                style={{ left: `${(dot.string - 1) * 16.6 + 8}%` }}
              >
                ○
              </div>
            );
          } else {
            return (
              <div 
                key={`dot-${index}`}
                className="finger-dot"
                style={{ 
                  top: `${(dot.fret - 0.5) * 20 + 10}%`, 
                  left: `${(dot.string - 1) * 16.6 + 8}%` 
                }}
              >
                {showFull ? dot.fret : ''}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default ChordDiagram;
