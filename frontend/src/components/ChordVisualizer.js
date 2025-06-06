import React, { useState, useEffect, useRef } from 'react';
import './style/ChordVisualizer.css';

function ChordVisualizer({ chordType = '', onChordChange, defaultChord = 'C', isControlled = false }) {
  const [activeChord, setActiveChord] = useState(defaultChord);
  const [activeNote, setActiveNote] = useState(defaultChord);
  const [activeChordType, setActiveChordType] = useState(chordType);
  const [visualizerType, setVisualizerType] = useState('keyboard'); // 'keyboard' or 'fretboard'
  const [showFingerNumbers, setShowFingerNumbers] = useState(true);
  const [playingNote, setPlayingNote] = useState(null);
  const [chordTransition, setChordTransition] = useState(false);
  const audioContextRef = useRef(null);
  
  // Piano keyboard note mapping - 2 octaves
  const pianoKeys = [
    // First octave
    { note: 'C', octave: 4, position: 0, isBlack: false },
    { note: 'C#', octave: 4, position: 0.5, isBlack: true },
    { note: 'D', octave: 4, position: 1, isBlack: false },
    { note: 'D#', octave: 4, position: 1.5, isBlack: true },
    { note: 'E', octave: 4, position: 2, isBlack: false },
    { note: 'F', octave: 4, position: 3, isBlack: false },
    { note: 'F#', octave: 4, position: 3.5, isBlack: true },
    { note: 'G', octave: 4, position: 4, isBlack: false },
    { note: 'G#', octave: 4, position: 4.5, isBlack: true },
    { note: 'A', octave: 4, position: 5, isBlack: false },
    { note: 'A#', octave: 4, position: 5.5, isBlack: true },
    { note: 'B', octave: 4, position: 6, isBlack: false },
    // Second octave
    { note: 'C', octave: 5, position: 7, isBlack: false },
    { note: 'C#', octave: 5, position: 7.5, isBlack: true },
    { note: 'D', octave: 5, position: 8, isBlack: false },
    { note: 'D#', octave: 5, position: 8.5, isBlack: true },
    { note: 'E', octave: 5, position: 9, isBlack: false },
    { note: 'F', octave: 5, position: 10, isBlack: false },
    { note: 'F#', octave: 5, position: 10.5, isBlack: true },
    { note: 'G', octave: 5, position: 11, isBlack: false },
    { note: 'G#', octave: 5, position: 11.5, isBlack: true },
    { note: 'A', octave: 5, position: 12, isBlack: false },
    { note: 'A#', octave: 5, position: 12.5, isBlack: true },
    { note: 'B', octave: 5, position: 13, isBlack: false },
    { note: 'C', octave: 6, position: 14, isBlack: false },
  ];

  // Guitar fretboard note mapping (6 strings, 5 frets)
  // Ordered from string 1 (high E) to string 6 (low E)
  const guitarStrings = [
    { name: 'E', notes: ['E', 'F', 'F#', 'G', 'G#'] }, // String 1 (high E)
    { name: 'B', notes: ['B', 'C', 'C#', 'D', 'D#'] }, // String 2 (B)
    { name: 'G', notes: ['G', 'G#', 'A', 'A#', 'B'] }, // String 3 (G)
    { name: 'D', notes: ['D', 'D#', 'E', 'F', 'F#'] }, // String 4 (D)
    { name: 'A', notes: ['A', 'A#', 'B', 'C', 'C#'] }, // String 5 (A)
    { name: 'E', notes: ['E', 'F', 'F#', 'G', 'G#'] }  // String 6 (low E)
  ];
  
  // Chord note mappings
const chordNotes = {
  'C': ['C', 'E', 'G'],
  'Cm': ['C', 'D#', 'G'],
  'Cdim': ['C', 'D#', 'F#'],
  'Caug': ['C', 'E', 'G#'],
  'C7': ['C', 'E', 'G', 'A#'],
  'Cmaj7': ['C', 'E', 'G', 'B'],
  'Cm7': ['C', 'D#', 'G', 'A#'],
  'Cdim7': ['C', 'D#', 'F#', 'A'],
  'Csus2': ['C', 'D', 'G'],
  'Csus4': ['C', 'F', 'G'],
  'C6': ['C', 'E', 'G', 'A'],      // Added
  'Cm6': ['C', 'D#', 'G', 'A'],   // Added
  'C7#5': ['C', 'E', 'G#', 'A#'], // Added
  'Cm7b5': ['C', 'D#', 'F#', 'A#'],// Added

  'C#': ['C#', 'F', 'G#'],
  'C#m': ['C#', 'E', 'G#'],
  'C#dim': ['C#', 'E', 'G'],
  'C#aug': ['C#', 'F', 'A'],
  'C#7': ['C#', 'F', 'G#', 'B'],
  'C#maj7': ['C#', 'F', 'G#', 'C'], // Note: C is B#
  'C#m7': ['C#', 'E', 'G#', 'B'],
  'C#dim7': ['C#', 'E', 'G', 'A#'],
  'C#sus2': ['C#', 'D#', 'G#'],
  'C#sus4': ['C#', 'F#', 'G#'],
  'C#6': ['C#', 'F', 'G#', 'A#'],    // Added
  'C#m6': ['C#', 'E', 'G#', 'A#'],  // Added
  'C#7#5': ['C#', 'F', 'A', 'B'],   // Added
  'C#m7b5': ['C#', 'E', 'G', 'B'], // Added

  'D': ['D', 'F#', 'A'],
  'Dm': ['D', 'F', 'A'],
  'Ddim': ['D', 'F', 'G#'],
  'Daug': ['D', 'F#', 'A#'],
  'D7': ['D', 'F#', 'A', 'C'],
  'Dmaj7': ['D', 'F#', 'A', 'C#'],
  'Dm7': ['D', 'F', 'A', 'C'],
  'Ddim7': ['D', 'F', 'G#', 'B'],
  'Dsus2': ['D', 'E', 'A'],
  'Dsus4': ['D', 'G', 'A'],
  'D6': ['D', 'F#', 'A', 'B'],      // Added
  'Dm6': ['D', 'F', 'A', 'B'],    // Added
  'D7#5': ['D', 'F#', 'A#', 'C'],   // Added
  'Dm7b5': ['D', 'F', 'G#', 'C'], // Added

  'D#': ['D#', 'G', 'A#'],
  'D#m': ['D#', 'F#', 'A#'],
  'D#dim': ['D#', 'F#', 'A'],
  'D#aug': ['D#', 'G', 'B'],
  'D#7': ['D#', 'G', 'A#', 'C#'],
  'D#maj7': ['D#', 'G', 'A#', 'D'], // Note: D is C##
  'D#m7': ['D#', 'F#', 'A#', 'C#'],
  'D#dim7': ['D#', 'F#', 'A', 'C'],
  'D#sus2': ['D#', 'F', 'A#'],
  'D#sus4': ['D#', 'G#', 'A#'],
  'D#6': ['D#', 'G', 'A#', 'C'],     // Added
  'D#m6': ['D#', 'F#', 'A#', 'C'], // Added
  'D#7#5': ['D#', 'G', 'B', 'C#'],  // Added
  'D#m7b5': ['D#', 'F#', 'A', 'C#'],// Added

  'E': ['E', 'G#', 'B'],
  'Em': ['E', 'G', 'B'],
  'Edim': ['E', 'G', 'A#'],
  'Eaug': ['E', 'G#', 'C'], // Note: C is B#
  'E7': ['E', 'G#', 'B', 'D'],
  'Emaj7': ['E', 'G#', 'B', 'D#'],
  'Em7': ['E', 'G', 'B', 'D'],
  'Edim7': ['E', 'G', 'A#', 'C#'],
  'Esus2': ['E', 'F#', 'B'],
  'Esus4': ['E', 'A', 'B'],
  'E6': ['E', 'G#', 'B', 'C#'],     // Added
  'Em6': ['E', 'G', 'B', 'C#'],   // Added
  'E7#5': ['E', 'G#', 'C', 'D'],    // Added
  'Em7b5': ['E', 'G', 'A#', 'D'], // Added

  'F': ['F', 'A', 'C'],
  'Fm': ['F', 'G#', 'C'],
  'Fdim': ['F', 'G#', 'B'], // Note: B is Cb
  'Faug': ['F', 'A', 'C#'],
  'F7': ['F', 'A', 'C', 'D#'],
  'Fmaj7': ['F', 'A', 'C', 'E'],
  'Fm7': ['F', 'G#', 'C', 'D#'],
  'Fdim7': ['F', 'G#', 'B', 'D'], // Note: D is Ebb
  'Fsus2': ['F', 'G', 'C'],
  'Fsus4': ['F', 'A#', 'C'],
  'F6': ['F', 'A', 'C', 'D'],       // Added
  'Fm6': ['F', 'G#', 'C', 'D'],     // Added
  'F7#5': ['F', 'A', 'C#', 'D#'],   // Added
  'Fm7b5': ['F', 'G#', 'B', 'D#'],  // Added

  'F#': ['F#', 'A#', 'C#'],
  'F#m': ['F#', 'A', 'C#'],
  'F#dim': ['F#', 'A', 'C'],
  'F#aug': ['F#', 'A#', 'D'], // Note: D is Cx
  'F#7': ['F#', 'A#', 'C#', 'E'],
  'F#maj7': ['F#', 'A#', 'C#', 'F'], // Note: F is E#
  'F#m7': ['F#', 'A', 'C#', 'E'],
  'F#dim7': ['F#', 'A', 'C', 'D#'], // Note: D# is Ebb from C (dim3)
  'F#sus2': ['F#', 'G#', 'C#'],
  'F#sus4': ['F#', 'B', 'C#'],
  'F#6': ['F#', 'A#', 'C#', 'D#'],    // Added
  'F#m6': ['F#', 'A', 'C#', 'D#'],  // Added
  'F#7#5': ['F#', 'A#', 'D', 'E'],   // Added
  'F#m7b5': ['F#', 'A', 'C', 'E'], // Added

  'G': ['G', 'B', 'D'],
  'Gm': ['G', 'A#', 'D'],
  'Gdim': ['G', 'A#', 'C#'],
  'Gaug': ['G', 'B', 'D#'],
  'G7': ['G', 'B', 'D', 'F'],
  'Gmaj7': ['G', 'B', 'D', 'F#'],
  'Gm7': ['G', 'A#', 'D', 'F'],
  'Gdim7': ['G', 'A#', 'C#', 'E'], // Note: E is Fb from C# (dim3)
  'Gsus2': ['G', 'A', 'D'],
  'Gsus4': ['G', 'C', 'D'],
  'G6': ['G', 'B', 'D', 'E'],       // Added
  'Gm6': ['G', 'A#', 'D', 'E'],     // Added
  'G7#5': ['G', 'B', 'D#', 'F'],    // Added
  'Gm7b5': ['G', 'A#', 'C#', 'F'],  // Added

  'G#': ['G#', 'C', 'D#'],
  'G#m': ['G#', 'B', 'D#'],
  'G#dim': ['G#', 'B', 'D'],
  'G#aug': ['G#', 'C', 'E'], // Note: E is Fx
  'G#7': ['G#', 'C', 'D#', 'F#'],
  'G#maj7': ['G#', 'C', 'D#', 'G'], // Note: G is F##
  'G#m7': ['G#', 'B', 'D#', 'F#'],
  'G#dim7': ['G#', 'B', 'D', 'F'], // Note: F is E#
  'G#sus2': ['G#', 'A#', 'D#'],
  'G#sus4': ['G#', 'C#', 'D#'],
  'G#6': ['G#', 'C', 'D#', 'F'],     // Added
  'G#m6': ['G#', 'B', 'D#', 'F'],   // Added
  'G#7#5': ['G#', 'C', 'E', 'F#'],  // Added
  'G#m7b5': ['G#', 'B', 'D', 'F#'],// Added

  'A': ['A', 'C#', 'E'],
  'Am': ['A', 'C', 'E'],
  'Adim': ['A', 'C', 'D#'],
  'Aaug': ['A', 'C#', 'F'], // Note: F is E#
  'A7': ['A', 'C#', 'E', 'G'],
  'Amaj7': ['A', 'C#', 'E', 'G#'],
  'Am7': ['A', 'C', 'E', 'G'],
  'Adim7': ['A', 'C', 'D#', 'F#'],
  'Asus2': ['A', 'B', 'E'],
  'Asus4': ['A', 'D', 'E'],
  'A6': ['A', 'C#', 'E', 'F#'],     // Added
  'Am6': ['A', 'C', 'E', 'F#'],   // Added
  'A7#5': ['A', 'C#', 'F', 'G'],    // Added
  'Am7b5': ['A', 'C', 'D#', 'G'], // Added

  'A#': ['A#', 'D', 'F'],
  'A#m': ['A#', 'C#', 'F'],
  'A#dim': ['A#', 'C#', 'E'],
  'A#aug': ['A#', 'D', 'F#'], // Note: F# is Gbb
  'A#7': ['A#', 'D', 'F', 'G#'],
  'A#maj7': ['A#', 'D', 'F', 'A'], // Note: A is G##
  'A#m7': ['A#', 'C#', 'F', 'G#'],
  'A#dim7': ['A#', 'C#', 'E', 'G'],
  'A#sus2': ['A#', 'C', 'F'],
  'A#sus4': ['A#', 'D#', 'F'],
  'A#6': ['A#', 'D', 'F', 'G'],     // Added
  'A#m6': ['A#', 'C#', 'F', 'G'],   // Added
  'A#7#5': ['A#', 'D', 'F#', 'G#'], // Added
  'A#m7b5': ['A#', 'C#', 'E', 'G#'],// Added

  'B': ['B', 'D#', 'F#'],
  'Bm': ['B', 'D', 'F#'],
  'Bdim': ['B', 'D', 'F'],
  'Baug': ['B', 'D#', 'G'], // Note: G is F##
  'B7': ['B', 'D#', 'F#', 'A'],
  'Bmaj7': ['B', 'D#', 'F#', 'A#'],
  'Bm7': ['B', 'D', 'F#', 'A'],
  'Bdim7': ['B', 'D', 'F', 'G#'],
  'Bsus2': ['B', 'C#', 'F#'],
  'Bsus4': ['B', 'E', 'F#'],
  'B6': ['B', 'D#', 'F#', 'G#'],     // Added
  'Bm6': ['B', 'D', 'F#', 'G#'],   // Added
  'B7#5': ['B', 'D#', 'G', 'A'],    // Added
  'Bm7b5': ['B', 'D', 'F', 'A']   // Added
};

  const extractRoot = (chordName) => {
    if (!chordName) return 'C';
    const match = chordName.match(/^[A-G]#?/);
    return match ? match[0] : 'C';
  };

  // Enhanced guitar chord fingering positions [string, fret, finger]
  const chordFingerings = {
    'C': [[5, 3, 3], [4, 2, 2], [3, 0, 0], [2, 1, 1], [1, 0, 0]],
    'G': [[6, 3, 4], [5, 2, 1], [4, 0, 0], [3, 0, 0], [2, 0, 0], [1, 3, 3]],
    'D': [[4, 0, 0], [3, 2, 1], [2, 3, 3], [1, 2, 2]],
    'A': [[5, 0, 0], [4, 2, 2], [3, 2, 1], [2, 2, 3], [1, 0, 0]],
    'E': [[6, 0, 0], [5, 2, 2], [4, 2, 1], [3, 1, 3], [2, 0, 0], [1, 0, 0]],
    'F': [[6, 1, 1], [5, 3, 4], [4, 3, 3], [3, 2, 2], [2, 1, 1], [1, 1, 1]],
    'Am': [[5, 0, 0], [4, 2, 2], [3, 2, 1], [2, 1, 3], [1, 0, 0]],
    'Dm': [[4, 0, 0], [3, 2, 1], [2, 3, 3], [1, 1, 2]],
    'Em': [[6, 0, 0], [5, 2, 2], [4, 2, 3], [3, 0, 0], [2, 0, 0], [1, 0, 0]],
    'G7': [[6, 3, 3], [5, 2, 2], [4, 0, 0], [3, 0, 0], [2, 0, 0], [1, 1, 1]],
    'C7': [[5, 3, 3], [4, 2, 2], [3, 3, 4], [2, 1, 1], [1, 0, 0]],
    'D7': [[4, 0, 0], [3, 2, 2], [2, 1, 1], [1, 2, 3]],
    'A7': [[5, 0, 0], [4, 2, 2], [3, 0, 0], [2, 2, 3], [1, 0, 0]],
    'E7': [[6, 0, 0], [5, 2, 2], [4, 0, 0], [3, 1, 1], [2, 0, 0], [1, 0, 0]],
  };

  // Chord progression suggestions
  const chordProgressions = {
    'C': ['F', 'G', 'Am', 'Dm'],
    'G': ['C', 'D', 'Em', 'Am'],
    'D': ['G', 'A', 'Bm', 'Em'],
    'A': ['D', 'E', 'F#m', 'Bm'],
    'E': ['A', 'B', 'C#m', 'F#m'],
    'F': ['Bb', 'C', 'Dm', 'Gm'],
    'Am': ['C', 'F', 'G', 'Dm'],
    'Em': ['G', 'C', 'D', 'Am'],
    'Dm': ['F', 'Bb', 'C', 'Gm'],
  };

  // Audio synthesis for note playback
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playNote = (frequency, duration = 0.5) => {
    const audioContext = initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  // Note to frequency mapping
  const noteFrequencies = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23,
    'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
  };

  // Get available notes and chord types
  const availableNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const chordTypes = [
    { value: '', label: 'Major' },
    { value: 'm', label: 'Minor' },
    { value: 'dim', label: 'Diminished' },
    { value: 'aug', label: 'Augmented' },
    { value: '7', label: 'Dominant 7th' },
    { value: 'maj7', label: 'Major 7th' },
    { value: 'm7', label: 'Minor 7th' },
    { value: 'dim7', label: 'Diminished 7th' },
    { value: 'sus2', label: 'Sus2' },
    { value: 'sus4', label: 'Sus4' },
    { value: '6', label: 'Major 6th' },
    { value: 'm6', label: 'Minor 6th' },
    { value: '7#5', label: 'Augmented 7th' },
    { value: 'm7b5', label: 'Half-Diminished' }
  ];
  
  // Check if a piano key is included in the current chord
  const isPianoKeyActive = (note) => {
    // Use the new chord highlighting logic
    const notesToHighlight = getChordNotesToHighlight(activeChord, activeChordType);
    return notesToHighlight.includes(note);
  };
  
  // Update existing handlers with smooth transitions
  const handleNoteChange = (note) => {
    setChordTransition(true);
    setTimeout(() => {
      setActiveNote(note);
      const newChord = note + activeChordType;
      if (chordNotes[newChord]) {
        setActiveChord(newChord);
        if (onChordChange) onChordChange(newChord);
      }
      setChordTransition(false);
    }, 150);
  };
  
  const handleChordTypeChange = (type) => {
    // If controlled by parent (e.g., in ChordsDictionary), don't change state internally
    if (isControlled) {
      // Just notify parent, don't change internal state
      if (onChordChange) {
        const newChord = activeNote + type;
        onChordChange(newChord);
      }
      return;
    }

    // If not controlled, behave as before
    setChordTransition(true);
    setTimeout(() => {
      setActiveChordType(type);
      const newChord = activeNote + type;
      if (chordNotes[newChord]) {
        setActiveChord(newChord);
        if (onChordChange) onChordChange(newChord);
      }
      setChordTransition(false);
    }, 150);
  };

  const handleKeyClick = (note) => {
    handleNoteChange(note);
    setActiveChordType('');
    if (onChordChange) onChordChange(note);
    // Play the note
    if (noteFrequencies[note]) {
      playNote(noteFrequencies[note]);
    }
  };
  
  // Enhanced guitar fret interaction
  const handleFretClick = (stringIndex, fretIndex) => {
    // Safety checks
    if (stringIndex < 0 || stringIndex >= guitarStrings.length) return;
    if (fretIndex < 0 || fretIndex >= guitarStrings[stringIndex].notes.length) return;
    
    const note = guitarStrings[stringIndex].notes[fretIndex];
    setPlayingNote(`${stringIndex}-${fretIndex}`);
    
    // Calculate frequency based on string and fret
    const baseFreq = noteFrequencies[note] || 440;
    playNote(baseFreq);
    
    setTimeout(() => setPlayingNote(null), 500);
  };
  
  // Check if a guitar fret position is active for the current chord
  const isGuitarFretActive = (stringIndex, fretIndex) => {
    // Safety check for valid indices
    if (stringIndex < 0 || stringIndex >= guitarStrings.length) return false;
    if (fretIndex < 0 || fretIndex >= guitarStrings[stringIndex].notes.length) return false;
    
    // Get the note at this string and fret position (stringIndex is 0-based)
    const note = guitarStrings[stringIndex].notes[fretIndex];
    
    // Get the notes that should be highlighted for the current chord
    const notesToHighlight = getChordNotesToHighlight(activeChord, activeChordType);
    
    // Check if this note is in the chord
    const isNoteInChord = notesToHighlight.includes(note);
    
    // For specific chord fingerings, use those if available
    if (chordFingerings[activeChord]) {
      const hasSpecificFingering = chordFingerings[activeChord].some(
        ([stringNum, fretNum]) => stringNum === (stringIndex + 1) && fretNum === fretIndex
      );
      if (hasSpecificFingering) {
        return true;
      }
    }
    
    // Otherwise, show the note if it's in the chord and in a reasonable position
    // Prioritize lower frets (0-3) for better playability
    return isNoteInChord && fretIndex <= 3;
  };

  // Get finger number for a fret position
  const getFingerNumber = (stringIndex, fretIndex) => {
    // Safety checks
    if (stringIndex < 0 || stringIndex >= guitarStrings.length) return null;
    if (fretIndex < 0) return null;
    
    // Only show finger numbers if we have specific fingering data
    if (!chordFingerings[activeChord]) return null;
    
    const fingering = chordFingerings[activeChord].find(
      ([stringNum, fretNum]) => stringNum === (stringIndex + 1) && fretNum === fretIndex
    );
    
    return fingering ? fingering[2] : null;
  };

  // Get suggested next chords
  const getSuggestedChords = () => {
    const rootNote = activeNote;
    return chordProgressions[rootNote] || [];
  };

  // New chord highlighting logic
  const getChordNotesToHighlight = (currentChordName, currentChordType) => {
    let notesToHighlight = [];
    let chordKeyToLookup = null;
    const rootNote = extractRoot(currentChordName); 

    // Primary strategy: Use currentChordName directly if it's a valid key in chordNotes.
    // currentChordName is expected to be the full name like "Am", "Cmaj7", "C".
    if (chordNotes[currentChordName]) {
      chordKeyToLookup = currentChordName;
      notesToHighlight = chordNotes[currentChordName];
    } 
    // Secondary strategy: If currentChordName wasn't a direct key,
    // or if currentChordType specifies a quality different from currentChordName's implicit quality,
    // construct the key from rootNote + currentChordType.
    // (e.g., currentChordName="C", currentChordType="maj7" -> "Cmaj7")
    else if (currentChordType && currentChordType !== '') {
      const constructedKey = rootNote + currentChordType;
      if (chordNotes[constructedKey]) {
        chordKeyToLookup = constructedKey;
        notesToHighlight = chordNotes[constructedKey];
      }
    }

    // Fallbacks if the above strategies didn't yield notes
    if (!notesToHighlight || notesToHighlight.length === 0) {
      // Fallback 1: Try the root note as a major chord if currentChordType is empty (major)
      // or if other lookups failed.
      if (chordNotes[rootNote] && (currentChordType === '' || !notesToHighlight || notesToHighlight.length === 0)) {
        chordKeyToLookup = rootNote;
        notesToHighlight = chordNotes[rootNote];
      } else {
        // Ultimate fallback: C major
        chordKeyToLookup = 'C';
        notesToHighlight = chordNotes['C'] || [];
      }
    }
    return notesToHighlight;
  };

  useEffect(() => {
    setChordTransition(true);
    setTimeout(() => setChordTransition(false), 300);

    // Extract root note from defaultChord
    const rootNote = extractRoot(defaultChord);
    setActiveNote(rootNote);
    setActiveChord(defaultChord);
    setActiveChordType(chordType);

    if (onChordChange) {
      // Pass the full chord name that is intended to be displayed.
      // defaultChord is already the full name like "Am", "C", "Cmaj7".
      onChordChange(defaultChord);
    }
  }, [defaultChord, chordType, onChordChange]);

  // Function to play a single note (for piano key click)
  const playSingleNote = (note) => {
    if (noteFrequencies[note]) {
      playNote(noteFrequencies[note]);
    }
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
        <div className="chord-dropdowns">
          <div className="dropdown-container">
            <label>Note:</label>
            <select 
              value={activeNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              className="chord-dropdown"
            >
              {availableNotes.map(note => (
                <option key={note} value={note}>{note}</option>
              ))}
            </select>
          </div>
          
          <div className="dropdown-container">
            <label>Type:</label>
            <select 
              value={activeChordType}
              onChange={(e) => handleChordTypeChange(e.target.value)}
              className={`chord-dropdown ${isControlled ? 'controlled' : ''}`}
              disabled={isControlled} // Disable dropdown when controlled by parent
              title={isControlled ? "Chord type is controlled by the dictionary selection" : "Select chord type"}
            >
              {chordTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="chord-quick-select">
          <span>Quick Select:</span>
          <div className="chord-buttons">
            {['C', 'G', 'D', 'A', 'E', 'F'].map(note => (
              <button 
                key={note} 
                className={`chord-button ${activeNote === note && activeChordType === '' ? 'active' : ''}`}
                onClick={() => {
                  handleNoteChange(note);
                  handleChordTypeChange('');
                }}
              >
                {note}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="visualizer-display">
        {visualizerType === 'keyboard' ? (
          <div className="piano-keyboard two-octaves">
            {/* White keys first (to position at the bottom layer) */}
            {pianoKeys
              .filter(key => !key.isBlack)
              .map((key, index) => {
                const whiteKeyIndex = pianoKeys.filter(k => !k.isBlack).indexOf(key);
                return (
                  <div 
                    key={`white-${key.note}-${key.octave}-${index}`}
                    className={`piano-key white ${isPianoKeyActive(key.note) ? 'active' : ''}`}
                    style={{ left: `${whiteKeyIndex * 7.14}%` }}
                    onClick={() => handleKeyClick(key.note)}
                  >
                    <span className="key-label">{key.note}{key.octave}</span>
                  </div>
                );
              })
            }
            
            {/* Black keys on top */}
            {pianoKeys
              .filter(key => key.isBlack)
              .map((key, index) => {
                // Find the previous white key's index
                const prevWhiteKeyIndex = pianoKeys
                  .filter(k => !k.isBlack)
                  .findIndex(k => (k.note === key.note.charAt(0) && k.octave === key.octave));
                
                return (
                  <div 
                    key={`black-${key.note}-${key.octave}-${index}`}
                    className={`piano-key black ${isPianoKeyActive(key.note) ? 'active' : ''}`}
                    style={{ left: `${prevWhiteKeyIndex * 7.14 + 5}%` }}
                    onClick={() => handleKeyClick(key.note)}
                  >
                    <span className="key-label">{key.note}</span>
                  </div>
                );
              })
            }
          </div>
        ) : (
          <div className={`guitar-fretboard ${chordTransition ? 'transitioning' : ''}`}>
            <div className="fretboard-controls">
              <button 
                className={`control-button ${showFingerNumbers ? 'active' : ''}`}
                onClick={() => setShowFingerNumbers(!showFingerNumbers)}
                title="Toggle finger numbers"
              >
                <span className="finger-icon">👆</span>
                Fingers
              </button>
              <div className="chord-suggestions">
                <span className="suggestions-label">Try next:</span>
                <div className="suggestion-buttons">
                  {getSuggestedChords().slice(0, 3).map(chord => (
                    <button 
                      key={chord}
                      className="suggestion-button"
                      onClick={() => {
                        const rootNote = extractRoot(chord);
                        const chordType = chord.replace(rootNote, '');
                        handleNoteChange(rootNote);
                        handleChordTypeChange(chordType);
                      }}
                    >
                      {chord}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="fret-markers">
              {[0, 1, 2, 3, 4].map(fret => (
                <div key={fret} className="fret-marker">
                  {fret > 0 ? fret : 'Open'}
                </div>
              ))}
            </div>
            
            {guitarStrings.map((string, stringIndex) => (
              <div key={stringIndex} className="guitar-string" style={{'--string-index': stringIndex}}>
                <div className="string-name">{string.name}</div>
                {string.notes.map((note, fretIndex) => {
                  const isActive = isGuitarFretActive(stringIndex, fretIndex);
                  const fingerNumber = getFingerNumber(stringIndex, fretIndex);
                  const isPlaying = playingNote === `${stringIndex}-${fretIndex}`;
                  
                  return (
                    <div 
                      key={`${stringIndex}-${fretIndex}`}
                      className={`guitar-fret ${isActive ? 'active' : ''} ${isPlaying ? 'playing' : ''}`}
                      onClick={() => handleFretClick(stringIndex, fretIndex)}
                      title={`${note} - String ${stringIndex + 1}, Fret ${fretIndex}`}
                    >
                      {isActive && (
                        <div className="fret-dot" style={{'--dot-delay': `${stringIndex * 0.1}s`}}>
                          {showFingerNumbers && fingerNumber > 0 ? fingerNumber : ''}
                        </div>
                      )}
                      <div className="note-indicator">{note}</div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            <div className="fretboard-info">
              <div className="playing-technique">
                <span className="technique-label">Technique Tips:</span>
                <div className="technique-tips">
                  <div className="tip">• Keep thumb behind neck</div>
                  <div className="tip">• Curve fingers to avoid muting</div>
                  <div className="tip">• Press just behind fret wire</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chord-info">
        <h3>{activeChord} Chord</h3>
        <div className="chord-badge-container">
          {getChordNotesToHighlight(activeChord, activeChordType)?.map((note, index) => (
            <span key={index} className="chord-note-badge">{note}</span>
          ))}
        </div>
        <p>Notes: {getChordNotesToHighlight(activeChord, activeChordType)?.join(', ')}</p>
      </div>
    </div>
  );
}

export default ChordVisualizer;
