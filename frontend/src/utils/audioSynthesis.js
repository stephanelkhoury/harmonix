// Enhanced audio synthesis utility for realistic piano sounds
let audioContext;
let reverbBuffer;
let activeOscillators = new Map(); // Track active oscillators for sustain/release

// Initialize audio context on first interaction
export const initAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createReverbBuffer(); // Create reverb effect
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
};

// Create reverb impulse response for more realistic sound
const createReverbBuffer = () => {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2; // 2 seconds of reverb
    reverbBuffer = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const channelData = reverbBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
    }
};

// Extended frequency map for all octaves (C0 to C8)
const noteFrequencies = {
    'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
    'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
    'C8': 4186.01
};

// Create a realistic piano oscillator with harmonics and envelope
const createPianoOscillator = (frequency, startTime, duration, velocity = 0.5) => {
    const masterGain = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    const reverb = audioContext.createConvolver();
    const reverbGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Setup reverb
    if (reverbBuffer) {
        reverb.buffer = reverbBuffer;
        reverbGain.gain.value = 0.3; // 30% wet signal
        dryGain.gain.value = 0.7; // 70% dry signal
    }

    // Create multiple harmonics for richer piano sound
    const harmonics = [
        { ratio: 1, gain: 1.0 },      // Fundamental
        { ratio: 2, gain: 0.3 },      // 2nd harmonic
        { ratio: 3, gain: 0.15 },     // 3rd harmonic
        { ratio: 4, gain: 0.075 },    // 4th harmonic
        { ratio: 5, gain: 0.05 }      // 5th harmonic
    ];

    harmonics.forEach(({ ratio, gain }) => {
        const oscillator = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        // Use a mix of sine and triangle waves for more realistic tone
        oscillator.type = ratio === 1 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency * ratio;
        
        // Piano-like ADSR envelope
        const attack = 0.01;
        const decay = 0.3;
        const sustain = 0.4;
        const release = 1.5;
        
        const peakGain = velocity * gain * 0.4;
        const sustainGain = peakGain * sustain;
        
        harmonicGain.gain.setValueAtTime(0, startTime);
        harmonicGain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
        harmonicGain.gain.exponentialRampToValueAtTime(sustainGain, startTime + attack + decay);
        harmonicGain.gain.setValueAtTime(sustainGain, startTime + duration - release);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(harmonicGain);
        harmonicGain.connect(masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    });

    // Setup audio routing
    masterGain.connect(dryGain);
    masterGain.connect(reverb);
    reverb.connect(reverbGain);
    
    dryGain.connect(compressor);
    reverbGain.connect(compressor);
    compressor.connect(audioContext.destination);
    
    return masterGain;
};

// Play a single note with sustain/release capability
export const playNote = (note, velocity = 0.7, duration = 2.0) => {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    const frequency = noteFrequencies[note];
    
    if (!frequency) return null;
    
    const oscillatorGroup = createPianoOscillator(frequency, now, duration, velocity);
    
    // Store for potential early release
    activeOscillators.set(note, {
        gainNode: oscillatorGroup,
        startTime: now,
        duration: duration
    });
    
    // Clean up after duration
    setTimeout(() => {
        activeOscillators.delete(note);
    }, duration * 1000);
    
    return oscillatorGroup;
};

// Release a note early (for key release)
export const releaseNote = (note) => {
    const oscillatorData = activeOscillators.get(note);
    if (oscillatorData) {
        const { gainNode, startTime } = oscillatorData;
        const now = audioContext.currentTime;
        const releaseTime = 0.5; // Release time in seconds
        
        // Quick release
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
        
        activeOscillators.delete(note);
    }
};

// Play a chord with enhanced sound
export const playChord = (notes, velocity = 0.6) => {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    const duration = 3.0; // Longer duration for chords

    notes.forEach((note, index) => {
        // Parse note name and octave
        let frequency;
        const fullNote = note.includes('0') || note.includes('1') || note.includes('2') || 
                        note.includes('3') || note.includes('4') || note.includes('5') || 
                        note.includes('6') || note.includes('7') || note.includes('8') ? 
                        note : note + '4'; // Default to octave 4
        
        frequency = noteFrequencies[fullNote];
        
        // Fallback: try without octave number for legacy notes
        if (!frequency) {
            const noteBase = note.replace(/[0-9]/g, '');
            frequency = noteFrequencies[noteBase + '4'];
        }
        
        if (frequency) {
            // Slight delay between notes for more realistic chord voicing
            const noteStartTime = now + (index * 0.01);
            createPianoOscillator(frequency, noteStartTime, duration, velocity);
        }
    });
};

// Keyboard mapping for live piano playing (like onlinepianist.com)
export const keyboardMapping = {
    // White keys (lower octave)
    'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4',
    // Black keys (lower octave)
    '2': 'C#4', '3': 'D#4', '5': 'F#4', '6': 'G#4', '7': 'A#4',
    // White keys (higher octave)
    'i': 'C5', 'o': 'D5', 'p': 'E5', '[': 'F5', ']': 'G5', 'a': 'A5', 's': 'B5',
    // Black keys (higher octave)
    '9': 'C#5', '0': 'D#5', '=': 'F#5', 'd': 'G#5', 'f': 'A#5',
    // Additional lower octave keys
    'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
    // Additional black keys for lower octave
    'g': 'C#3', 'h': 'D#3', 'k': 'F#3', 'l': 'G#3', ';': 'A#3'
};

// Get note from keyboard key
export const getNoteFromKey = (key) => {
    return keyboardMapping[key.toLowerCase()];
};

// Play note from keyboard input
export const playNoteFromKey = (key, velocity = 0.7) => {
    const note = getNoteFromKey(key);
    if (note) {
        return playNote(note, velocity);
    }
    return null;
};
