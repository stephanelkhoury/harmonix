import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaGuitar, FaMusic, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import './style/TunerPage.css';

function TunerPage() {
    const [selectedInstrument, setSelectedInstrument] = useState('guitar');
    const [isListening, setIsListening] = useState(false);
    const [detectedNote, setDetectedNote] = useState(null);
    const [detectedFrequency, setDetectedFrequency] = useState(null);
    const [tuningStatus, setTuningStatus] = useState('waiting'); // 'waiting', 'too-low', 'in-tune', 'too-high'
    const [tuningOffset, setTuningOffset] = useState(0); // Offset value for tuning indicator (-50 to 50)
    const [micAccessDenied, setMicAccessDenied] = useState(false);
    
    // References for audio processing
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);
    
    const instruments = {
        guitar: {
            name: 'Guitar',
            icon: <FaGuitar />,
            tuning: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']
        },
        ukulele: {
            name: 'Ukulele',
            icon: <FaGuitar style={{ transform: 'scale(0.8)' }} />,
            tuning: ['G4', 'C4', 'E4', 'A4']
        },
        bass: {
            name: 'Bass Guitar',
            icon: <FaGuitar />,
            tuning: ['E1', 'A1', 'D2', 'G2']
        },
        violin: {
            name: 'Violin',
            icon: <FaMusic />,
            tuning: ['G3', 'D4', 'A4', 'E5']
        },
        piano: {
            name: 'Piano',
            icon: <FaMusic style={{ transform: 'rotate(15deg)' }} />,
            tuning: ['A4'] // Reference note for piano tuning
        }
    };
    
    // Standard frequencies for musical notes (in Hz)
    const noteFrequencies = {
        'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00,
        'A#1': 58.27, 'B1': 61.74, 'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78,
        'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00,
        'A#2': 116.54, 'B2': 123.47, 'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
        'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
        'A#3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
        'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
        'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
        'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99
    };
    
    // Notes without octave numbers
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Toggle the microphone and pitch detection on/off
    const toggleListening = async () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };
    
    // Start the microphone and pitch detection
    const startListening = async () => {
        try {
            // Initialize audio context if not already created
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Create analyzer if not already created
            if (!analyserRef.current) {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 4096; // Higher for better resolution
                analyserRef.current.smoothingTimeConstant = 0.8;
            }
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            streamRef.current = stream;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            
            setIsListening(true);
            setMicAccessDenied(false);
            
            // Start pitch detection loop
            detectPitch();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setMicAccessDenied(true);
            alert('Unable to access microphone. Please check permissions and try again.');
        }
    };
    
    // Stop the microphone and pitch detection
    const stopListening = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        setIsListening(false);
        setDetectedNote(null);
        setDetectedFrequency(null);
        setTuningStatus('waiting');
        setTuningOffset(0);
    };
    
    // Pitch detection using YIN algorithm (simplified)
    const detectPitch = () => {
        if (!isListening || !analyserRef.current) return;
        
        const bufferLength = analyserRef.current.fftSize;
        const timeData = new Float32Array(bufferLength);
        analyserRef.current.getFloatTimeDomainData(timeData);
        
        // Check if there's enough signal
        const volumeLevel = getRMS(timeData);
        if (volumeLevel < 0.01) {
            animationFrameRef.current = requestAnimationFrame(detectPitch);
            return; // Skip processing if the sound is too quiet
        }
        
        // Use YIN algorithm for pitch detection
        const frequency = findFundamentalFrequency(timeData, audioContextRef.current.sampleRate);
        
        if (frequency > 0) {
            setDetectedFrequency(Math.round(frequency * 10) / 10); // Round to 1 decimal place
            
            // Find the closest note
            const { note, cents } = findClosestNote(frequency);
            setDetectedNote(note);
            
            // Set tuning status based on cents deviation
            if (Math.abs(cents) < 10) {
                setTuningStatus('in-tune');
            } else if (cents < 0) {
                setTuningStatus('too-low');
            } else {
                setTuningStatus('too-high');
            }
            
            // Set tuning offset for the indicator (-50 to 50)
            setTuningOffset(Math.max(-50, Math.min(50, cents)));
        }
        
        // Continue detection loop
        animationFrameRef.current = requestAnimationFrame(detectPitch);
    };
    
    // Calculate RMS (Root Mean Square) to determine volume level
    const getRMS = (buffer) => {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    };
    
    // Simplified YIN algorithm for fundamental frequency detection
    const findFundamentalFrequency = (buffer, sampleRate) => {
        const threshold = 0.1;
        const minFreq = 30; // Minimum detectable frequency
        const maxFreq = 1500; // Maximum detectable frequency
        
        // Minimum and maximum periods in samples
        const minPeriod = Math.floor(sampleRate / maxFreq);
        const maxPeriod = Math.ceil(sampleRate / minFreq);
        
        if (maxPeriod > buffer.length / 2) {
            return -1; // Not enough data
        }
        
        // Simplified difference function
        let bestPeriod = -1;
        let bestDifference = Number.MAX_VALUE;
        
        for (let period = minPeriod; period <= maxPeriod; period++) {
            let difference = 0;
            
            // Calculate difference for this potential period
            for (let i = 0; i < buffer.length - period; i++) {
                const diff = buffer[i] - buffer[i + period];
                difference += diff * diff;
            }
            
            // Normalize difference
            difference /= buffer.length - period;
            
            // Check if this period is better than our current best
            if (difference < bestDifference && difference < threshold) {
                bestPeriod = period;
                bestDifference = difference;
            }
        }
        
        return bestPeriod > 0 ? sampleRate / bestPeriod : -1;
    };
    
    // Find the closest musical note to a given frequency
    const findClosestNote = (frequency) => {
        // A4 is 440Hz, and there are 12 semitones in an octave
        // Each semitone is a factor of 2^(1/12) in frequency
        const A4 = 440.0;
        const semitone = Math.log2(frequency / A4) * 12;
        
        // Round to nearest semitone
        const roundedSemitone = Math.round(semitone);
        
        // Calculate the cents deviation
        const cents = Math.round((semitone - roundedSemitone) * 100);
        
        // Calculate note index (A is at index 9)
        let noteIndex = (roundedSemitone + 9) % 12;
        if (noteIndex < 0) noteIndex += 12;
        
        // Calculate octave
        const octave = Math.floor((roundedSemitone + 9) / 12) + 4;
        
        // Return the note name with octave and cents deviation
        const noteName = noteNames[noteIndex];
        return { 
            note: `${noteName}${octave}`,
            cents: cents
        };
    };
    
    // Clean up audio context when component unmounts
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);
    
    return (
        <div className="tuner-page">
            <section className="hero-section hero-image-tuner">
                <Container>
                    <Row>
                        <Col>
                            <h1>Instrument Tuner</h1>
                            <p>Tune your musical instruments with precision using our advanced audio analysis.</p>
                        </Col>
                    </Row>
                </Container>
            </section>
            
            <Container className="tuner-container">
                <Row className="justify-content-center">
                    <Col lg={10}>
                        <Card className="tuner-card">
                            <Card.Body>
                                <div className="tuner-main">
                                    {/* Tuner Display Section */}
                                    <div className="tuner-display-section">
                                        <div className="microphone-controls">
                                            <Button 
                                                className={`microphone-button ${isListening ? 'active' : ''} ${micAccessDenied ? 'error' : ''}`}
                                                onClick={toggleListening}
                                                title={micAccessDenied ? "Microphone access denied" : isListening ? "Stop tuning" : "Start tuning"}
                                            >
                                                {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                            </Button>
                                        </div>
                                        
                                        <div className="tuner-display">
                                            {/* Note Display */}
                                            <div className="note-display">
                                                {detectedNote ? (
                                                    <>
                                                        <span className="note-name">
                                                            {detectedNote.charAt(0)}
                                                            {detectedNote.includes('#') ? <span className="note-accidental">#</span> : ''}
                                                        </span>
                                                        <span className="note-octave">{detectedNote.charAt(detectedNote.length - 1)}</span>
                                                    </>
                                                ) : (
                                                    <span className="note-placeholder">--</span>
                                                )}
                                            </div>
                                            
                                            {/* Tuning Indicator */}
                                            <div className="tuning-meter">
                                                <div className="tuning-scale">
                                                    <div className="tuning-marker left"></div>
                                                    <div className="tuning-center-marker"></div>
                                                    <div className="tuning-marker right"></div>
                                                </div>
                                                <div 
                                                    className={`tuning-needle ${tuningStatus}`}
                                                    style={{ 
                                                        transform: `translateX(${tuningOffset}px) rotate(${tuningOffset}deg)`,
                                                        opacity: detectedNote ? 1 : 0
                                                    }}
                                                ></div>
                                            </div>
                                            
                                            {/* Frequency Display */}
                                            <div className="frequency-display">
                                                {detectedFrequency ? `${detectedFrequency} Hz` : '--'}
                                            </div>
                                            
                                            {/* Status Message */}
                                            <div className={`tuning-status ${tuningStatus}`}>
                                                {!isListening && <span>Press the microphone button to start</span>}
                                                {isListening && !detectedNote && <span>Play a note...</span>}
                                                {isListening && detectedNote && tuningStatus === 'too-low' && <span>Tune higher ↑</span>}
                                                {isListening && detectedNote && tuningStatus === 'in-tune' && <span>In tune ✓</span>}
                                                {isListening && detectedNote && tuningStatus === 'too-high' && <span>Tune lower ↓</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Instrument Selection Section */}
                                    <div className="instrument-section">
                                        <h3>Select Instrument</h3>
                                        <div className="instrument-selector">
                                            {Object.entries(instruments).map(([id, instrument]) => (
                                                <Button 
                                                    key={id}
                                                    className={`instrument-btn ${selectedInstrument === id ? 'active' : ''}`}
                                                    onClick={() => setSelectedInstrument(id)}
                                                >
                                                    <span className="instrument-icon">{instrument.icon}</span>
                                                    <span>{instrument.name}</span>
                                                </Button>
                                            ))}
                                        </div>
                                        
                                        <div className="instrument-tuning-info">
                                            <h4>Standard Tuning:</h4>
                                            <div className="tuning-notes">
                                                {instruments[selectedInstrument]?.tuning.map((note, index) => (
                                                    <Button 
                                                        key={index} 
                                                        className="tuning-note"
                                                        variant="outline-primary"
                                                    >
                                                        {note}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        
                        <div className="tuning-instructions-card">
                            <h3>How to Use the Tuner</h3>
                            <ol>
                                <li>Select your instrument from the menu on the right</li>
                                <li>Click the <FaMicrophone className="inline-icon"/> button to activate your microphone</li>
                                <li>Play a single note or string on your instrument</li>
                                <li>The tuner will show the detected note and whether you need to tune up or down</li>
                                <li>Adjust your instrument until the needle is centered and the status shows "In tune"</li>
                            </ol>
                            <div className="tuning-tip">
                                <strong>Tip:</strong> For best results, use in a quiet environment and play notes clearly one at a time.
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default TunerPage;
