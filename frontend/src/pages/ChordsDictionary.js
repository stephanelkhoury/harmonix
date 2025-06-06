import React, { useState, useCallback } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaMusic, FaPlay } from 'react-icons/fa';
import ChordVisualizer from '../components/ChordVisualizer';
import LivePiano from '../components/LivePiano';
import { playPianoChord } from '../utils/pianoSamples';
import './style/ChordsDictionary.css';

function ChordsDictionary() {
  const [selectedChordType, setSelectedChordType] = useState('major');
  const [selectedChord, setSelectedChord] = useState('C'); // Represents the full chord name, e.g., "C", "Am", "Gmaj7"

  const chordTypes = [
    { id: 'major', name: 'Major Chords', description: 'Major chords are triads constructed using a root, a major third and a perfect fifth. Major chords usually sound happy and bright.' },
    { id: 'major7', name: 'Major 7th Chords', description: 'Major 7th chords are 4-note chords constructed with a root, major third, perfect fifth, and major seventh.' },
    { id: 'minor', name: 'Minor Chords', description: 'Minor chords are triads constructed using a root, a minor third and a perfect fifth. Minor chords usually sound sad and darker.' },
    { id: 'minor7', name: 'Minor 7th Chords', description: 'Minor 7th chords are 4-note chords constructed with a root, minor third, perfect fifth, and minor seventh.' },
    { id: 'diminished', name: 'Diminished Chords', description: 'Diminished chords are triads constructed using a root, a minor third and a diminished fifth. They tend to sound dissonant and unresolved.' },
    { id: 'diminished7', name: 'Diminished 7th Chords', description: 'Diminished 7th chords are 4-note chords constructed with a root, minor third, diminished fifth, and diminished seventh.' },
    { id: 'augmented', name: 'Augmented Chords', description: 'Augmented chords are triads constructed using a root, a major third and an augmented fifth. They tend to sound dissonant and unresolved.' },
    { id: 'aug7', name: 'Augmented 7th Chords', description: 'Augmented 7th chords (7th ♯5th) are constructed with a root, major third, augmented fifth, and minor seventh.' },
    { id: 'sus2', name: 'Suspended 2nd Chords', description: 'Sus2 chords are constructed using a root, a major second and a perfect fifth. They tend to sound open and unresolved.' },
    { id: 'sus4', name: 'Suspended 4th Chords', description: 'Sus4 chords are constructed using a root, a perfect fourth and a perfect fifth. They tend to sound somewhat dissonant.' },
    { id: 'dom7', name: 'Dominant 7th Chords', description: 'Dominant 7th chords are constructed using a root, major third, perfect fifth, and minor seventh. They tend to sound tense and unresolved.' },
    { id: 'm7b5', name: 'Half-Diminished Chords', description: 'Half-Diminished chords (m7b5) are constructed using a root, minor third, diminished fifth, and minor seventh.' },
    { id: 'maj6', name: 'Major 6th Chords', description: 'Major 6th chords are constructed with a root, major third, perfect fifth, and major sixth. They have less tension than major 7th chords.' },
    { id: 'min6', name: 'Minor 6th Chords', description: 'Minor 6th chords are constructed with a root, minor third, perfect fifth, and major sixth. They have less tension than minor 7th chords.' }
  ];

  // Map chord types to ChordVisualizer types
  const chordTypeMapping = {
    'major': '',
    'major7': 'maj7',
    'minor': 'm',
    'minor7': 'm7',
    'diminished': 'dim',
    'diminished7': 'dim7',
    'augmented': 'aug',
    'aug7': '7#5', // ChordVisualizer will need 'C7#5', etc. in its map
    'sus2': 'sus2',
    'sus4': 'sus4',
    'dom7': '7',
    'm7b5': 'm7b5', // ChordVisualizer will need 'Cm7b5', etc.
    'maj6': '6',     // ChordVisualizer will need 'C6', etc.
    'min6': 'm6'     // ChordVisualizer will need 'Cm6', etc.
  };

  // Map chord types to note intervals for playback
  const chordNoteMap = {
    'major': [0, 4, 7],          // root, major 3rd, perfect 5th
    'major7': [0, 4, 7, 11],     // root, major 3rd, perfect 5th, major 7th
    'minor': [0, 3, 7],          // root, minor 3rd, perfect 5th
    'minor7': [0, 3, 7, 10],     // root, minor 3rd, perfect 5th, minor 7th
    'diminished': [0, 3, 6],     // root, minor 3rd, diminished 5th
    'diminished7': [0, 3, 6, 9], // root, minor 3rd, diminished 5th, diminished 7th
    'augmented': [0, 4, 8],      // root, major 3rd, augmented 5th
    'aug7': [0, 4, 8, 10],       // root, major 3rd, augmented 5th, minor 7th
    'sus2': [0, 2, 7],          // root, major 2nd, perfect 5th
    'sus4': [0, 5, 7],          // root, perfect 4th, perfect 5th
    'dom7': [0, 4, 7, 10],      // root, major 3rd, perfect 5th, minor 7th
    'm7b5': [0, 3, 6, 10],      // root, minor 3rd, diminished 5th, minor 7th
    'maj6': [0, 4, 7, 9],       // root, major 3rd, perfect 5th, major 6th
    'min6': [0, 3, 7, 9]        // root, minor 3rd, perfect 5th, major 6th
  };

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const getChordNotes = useCallback((chordRoot, type) => {
    // Get the intervals for this chord type
    const intervals = chordNoteMap[type] || chordNoteMap['major'];
    
    // Find the root note index
    const rootIndex = noteNames.indexOf(chordRoot.replace(/[0-9m#bA-Za-z]*(sus|aug|dim|maj|min)/g, '').replace(/[0-9#b]/g,'')); // Improved root extraction
    if (rootIndex === -1) {
        console.warn(`Could not find root index for: ${chordRoot}`);
        return [];
    }

    // Calculate all notes in the chord
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return noteNames[noteIndex] + '4'; // Add octave number for audio synthesis
    });
  }, []);

  // Example chords for each type
  const getExampleChords = useCallback((typeId) => {
    // typeId is 'major', 'minor', 'major7', etc.
    let exampleRoots = [];
    if (typeId.includes('minor') || typeId.includes('diminished') || typeId === 'm7b5' || typeId === 'min6') {
      exampleRoots = ['A', 'D', 'E', 'B', 'F#', 'C#'].slice(0, 6);
    } else if (typeId.includes('sus')) {
      exampleRoots = ['C', 'D', 'G', 'A', 'E', 'F'].slice(0, 6);
    } else {
      exampleRoots = ['C', 'F', 'G', 'D', 'A', 'E'].slice(0, 6);
    }

    const suffix = chordTypeMapping[typeId];

    if (suffix === undefined) {
      console.error(`[ChordsDictionary] Unknown typeId in getExampleChords: ${typeId}`);
      return exampleRoots; // Return root notes as a fallback
    }
    return exampleRoots.map(root => root + suffix);
  }, [chordTypeMapping]); // Added chordTypeMapping to dependencies

  // Handle chord type change
  const handleChordTypeChange = useCallback((newTypeId) => {
    setSelectedChordType(newTypeId);
    const examples = getExampleChords(newTypeId);
    if (examples.length > 0) {
      setSelectedChord(examples[0]);
    } else {
      // Fallback, though getExampleChords should always provide examples
      const rootNotesForFallback = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      const suffix = chordTypeMapping[newTypeId] || '';
      setSelectedChord(rootNotesForFallback[0] + suffix);
    }
  }, [getExampleChords, chordTypeMapping]); // Added dependencies

  // Handle chord change from ChordVisualizer (or example buttons)
  const handleChordSelection = (chord) => {
    setSelectedChord(chord);
    // Optional: If the selected chord implies a type different from selectedChordType,
    // you could try to update selectedChordType here, but it might lead to complex state interactions.
    // For now, clicking an example chord just sets the chord, type remains.
  };

  // Function to handle playing a chord
  const playSelectedChord = () => {
    const chordRoot = selectedChord.replace(/[^A-G#]/g, ''); // Extract root note
    const notes = getChordNotes(chordRoot, selectedChordType);
    playPianoChord(notes);
  };

  // Handle note played from live piano
  const handleNotePlay = (note) => {
    console.log('Note played:', note);
    // Optional: Update UI to show played note
  };

  return (
    <div className="chords-dictionary-page">
      <Container>
        <Row className="justify-content-center mb-5">
          <Col lg={12} className="text-center">
            <h1>Piano Chords Dictionary</h1>
            <p className="lead">
              Explore different types of piano chords with interactive visualizations and audio playback
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={3} md={4} className="mb-4">
            <div className="chord-types-sidebar">
              <h3>Chord Types</h3>
              <div className="chord-type-list">
                {chordTypes.map(type => (
                  <button
                    key={type.id}
                    className={`chord-type-button ${selectedChordType === type.id ? 'active' : ''}`}
                    onClick={() => handleChordTypeChange(type.id)} // Updated onClick
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </Col>

          <Col lg={9} md={8}>
            <div className="chord-content">
              <Card className="chord-info-card">
                <Card.Body>
                  <div className="chord-type-info">
                    <h2>{chordTypes.find(type => type.id === selectedChordType)?.name}</h2>
                    <p>{chordTypes.find(type => type.id === selectedChordType)?.description}</p>
                  </div>

                  <div className="chord-visualizer-wrapper">
                    <ChordVisualizer
                      chordType={chordTypeMapping[selectedChordType]}
                      onChordChange={handleChordSelection}
                      defaultChord={selectedChord}
                      isControlled={true}
                    />
                    <button 
                      className="play-chord-button" 
                      onClick={playSelectedChord}
                    >
                      <FaPlay /> Play Chord
                    </button>
                  </div>

                  <div className="chord-examples">
                    <h3>Common {chordTypes.find(type => type.id === selectedChordType)?.name}</h3>
                    <div className="example-list">
                      {getExampleChords(selectedChordType).map(chord => (
                        <button
                          key={chord}
                          className={`example-button ${selectedChord === chord ? 'active' : ''}`}
                          onClick={() => handleChordSelection(chord)} // Updated onClick
                        >
                          {chord}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Piano Integration */}
                  <div className="live-piano-section">
                    <LivePiano onNotePlay={handleNotePlay} />
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ChordsDictionary;
