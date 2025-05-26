// Piano samples utility for realistic piano sounds
let audioContext;
let pianoSampleBuffers = new Map();
let isLoading = false;

// Initialize audio context
export const initAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
};

// Create high-quality synthesized piano sound as fallback
const createAdvancedPianoSynth = (frequency, startTime, duration, velocity = 0.7) => {
    const ctx = audioContext;
    
    // Create multiple oscillators for rich harmonic content
    const oscillators = [];
    const gains = [];
    
    // Piano harmonics with realistic ratios and inharmonicity
    const harmonics = [
        { ratio: 1, amplitude: 1.0, type: 'sine', detune: 0 },
        { ratio: 2, amplitude: 0.45, type: 'sine', detune: 1.2 },
        { ratio: 3, amplitude: 0.25, type: 'sine', detune: 2.1 },
        { ratio: 4, amplitude: 0.15, type: 'triangle', detune: 3.5 },
        { ratio: 5, amplitude: 0.08, type: 'triangle', detune: 5.2 },
        { ratio: 6, amplitude: 0.04, type: 'sawtooth', detune: 7.1 },
        { ratio: 7, amplitude: 0.02, type: 'sawtooth', detune: 9.3 }
    ];
    
    // Master gain for the note
    const masterGain = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const filter = ctx.createBiquadFilter();
    const convolver = ctx.createConvolver();
    const reverbGain = ctx.createGain();
    const dryGain = ctx.createGain();
    
    // Configure filter for warmer sound (piano body resonance)
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(frequency * 6, 12000);
    filter.Q.value = 0.7;
    
    // Configure compressor for piano-like dynamics
    compressor.threshold.value = -18;
    compressor.knee.value = 8;
    compressor.ratio.value = 3.5;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.15;
    
    // Create simple reverb impulse
    const impulseLength = ctx.sampleRate * 1.5;
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseLength; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 1.5) * 0.3;
        }
    }
    convolver.buffer = impulse;
    
    // Reverb mix
    reverbGain.gain.value = 0.15;
    dryGain.gain.value = 0.85;
    
    harmonics.forEach(({ ratio, amplitude, type, detune }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const harmFilter = ctx.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.value = frequency * ratio;
        osc.detune.value = detune * (frequency / 440); // Inharmonicity increases with frequency
        
        // Individual harmonic filtering
        harmFilter.type = 'peaking';
        harmFilter.frequency.value = frequency * ratio;
        harmFilter.Q.value = 2;
        harmFilter.gain.value = -3; // Slight cut for realism
        
        // Piano-like ADSR envelope with harmonic-specific timing
        const attack = 0.003 + (ratio - 1) * 0.001; // Higher harmonics attack slightly later
        const decay = 0.4 - (ratio - 1) * 0.05; // Higher harmonics decay faster
        const sustain = 0.5 - (ratio - 1) * 0.08;
        const release = Math.min(duration * 0.7, 2.2);
        
        const peakGain = velocity * amplitude * 0.35;
        const sustainGain = Math.max(peakGain * sustain, 0.001);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
        gain.gain.exponentialRampToValueAtTime(sustainGain, startTime + attack + decay);
        gain.gain.setValueAtTime(sustainGain, startTime + duration - release);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(harmFilter);
        harmFilter.connect(gain);
        gain.connect(masterGain);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        
        oscillators.push(osc);
        gains.push(gain);
    });
    
    // Add subtle frequency modulation for realism
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 2.5 + Math.random() * 2; // Subtle vibrato
    lfoGain.gain.value = 0.5;
    
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start(startTime);
    lfo.stop(startTime + duration);
    
    // Connect audio chain
    masterGain.connect(dryGain);
    masterGain.connect(convolver);
    convolver.connect(reverbGain);
    
    dryGain.connect(filter);
    reverbGain.connect(filter);
    filter.connect(compressor);
    compressor.connect(ctx.destination);
    
    return { oscillators, gains, masterGain, lfo };
};

// Play a piano note using advanced synthesis
export const playPianoNote = (note, velocity = 0.7, duration = 2.0) => {
    const ctx = initAudioContext();
    const now = ctx.currentTime;
    
    // Note frequencies
    const noteFrequencies = {
        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
        'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
        'A#3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66,
        'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
        'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88, 'C5': 523.25,
        'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
        'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33,
        'B5': 987.77, 'C6': 1046.50
    };
    
    const frequency = noteFrequencies[note];
    if (frequency) {
        return createAdvancedPianoSynth(frequency, now, duration, velocity);
    }
    
    return null;
};

// Play a chord using piano sounds
export const playPianoChord = (notes, velocity = 0.6) => {
    const ctx = initAudioContext();
    const playedNotes = [];
    
    notes.forEach((note, index) => {
        // Slight delay between notes for realistic chord voicing
        setTimeout(() => {
            const result = playPianoNote(note, velocity, 3.0);
            if (result) {
                playedNotes.push({ note, ...result });
            }
        }, index * 10);
    });
    
    return playedNotes;
};

// Keyboard mapping for live piano
export const keyboardMapping = {
    // White keys (lower octave)
    'q': 'C4', 'w': 'D4', 'e': 'E4', 'r': 'F4', 't': 'G4', 'y': 'A4', 'u': 'B4',
    // Black keys (lower octave)
    '2': 'C#4', '3': 'D#4', '5': 'F#4', '6': 'G#4', '7': 'A#4',
    // White keys (higher octave)
    'i': 'C5', 'o': 'D5', 'p': 'E5', '[': 'F5', ']': 'G5',
    // Black keys (higher octave)
    '9': 'C#5', '0': 'D#5',
    // Additional lower octave keys
    'z': 'C3', 'x': 'D3', 'c': 'E3', 'v': 'F3', 'b': 'G3', 'n': 'A3', 'm': 'B3',
    // Additional black keys for lower octave
    's': 'C#3', 'd': 'D#3', 'g': 'F#3', 'h': 'G#3', 'j': 'A#3'
};

// Get note from keyboard key
export const getNoteFromKey = (key) => {
    return keyboardMapping[key.toLowerCase()];
};

// Play note from keyboard input with piano sound
export const playPianoNoteFromKey = (key, velocity = 0.7) => {
    const note = getNoteFromKey(key);
    if (note) {
        return playPianoNote(note, velocity);
    }
    return null;
};

// Release a note (for sustain pedal simulation)
export const releaseNote = (note) => {
    // This can be enhanced later for more advanced sustain control
    console.log('Note released:', note);
};

// Initialize audio context
initAudioContext();
