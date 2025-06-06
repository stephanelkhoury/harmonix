import React, { useState, useEffect, useRef, useCallback } from 'react';
import GuitarFretboard from './GuitarFretboard';
import './RealTimeChordDetector.css';

const RealTimeChordDetector = () => {
    // State management
    const [isListening, setIsListening] = useState(false);
    const [currentChord, setCurrentChord] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [capoPosition, setCapoPosition] = useState(0);
    const [key, setKey] = useState('');
    const [bpm, setBpm] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');
    
    // Audio processing refs
    const audioContextRef = useRef(null);
    const sourceRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);
    const wsRef = useRef(null);
    const chordHistoryRef = useRef([]);
    
    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        const PYTHON_SERVICE_URL = process.env.REACT_APP_PYTHON_SERVICE_URL || 'http://localhost:8000';
        const wsUrl = PYTHON_SERVICE_URL.replace('http', 'ws') + '/api/ws/real-time-chords';
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
            setIsConnected(true);
            setError('');
            console.log('WebSocket connected for real-time chord detection');
        };
        
        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message); // Debug log
            
            if (message.type === 'chord_update') {
                const { chord, confidence, key, capo_position } = message.data;
                console.log(`Chord update: ${chord} (${confidence})`); // Debug log
                setCurrentChord(chord);
                setConfidence(confidence);
                
                // Update chord history for BPM detection
                const now = Date.now();
                chordHistoryRef.current.push({ chord, time: now, confidence });
                
                // Keep only last 20 chords for BPM calculation
                if (chordHistoryRef.current.length > 20) {
                    chordHistoryRef.current.shift();
                }
                
                // Calculate approximate BPM from chord changes
                if (chordHistoryRef.current.length > 4) {
                    const recentChords = chordHistoryRef.current.slice(-8);
                    const chordChanges = recentChords.filter((chord, i) => 
                        i > 0 && chord.chord !== recentChords[i-1].chord
                    );
                    
                    if (chordChanges.length > 2) {
                        const timeDiff = chordChanges[chordChanges.length - 1].time - chordChanges[0].time;
                        const changesPerMinute = (chordChanges.length / timeDiff) * 60000;
                        // Assume 1 chord change per beat (rough estimation)
                        setBpm(Math.round(changesPerMinute));
                    }
                }
                
                if (key) setKey(key);
            } else if (message.type === 'capo_updated') {
                setCapoPosition(message.data.capo_position);
            }
        };
        
        wsRef.current.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected');
        };
        
        wsRef.current.onerror = (error) => {
            setError('WebSocket connection failed');
            console.error('WebSocket error:', error);
        };
    }, []);
    
    // Audio processing setup
    const setupAudioProcessing = useCallback(async () => {
        try {
            // Get microphone access
            console.log('[Debug] Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 44100,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            streamRef.current = stream;
            console.log('[Debug] Microphone access granted.');
            
            // Create audio context
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 44100
            });
            console.log('[Debug] AudioContext created.');
            
            // Create source from microphone
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            console.log('[Debug] MediaStreamSource created.');
            
            // Create script processor for audio chunks
            const bufferSize = 8192; // Larger buffer for better frequency resolution
            processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
            console.log('[Debug] ScriptProcessorNode created.');
            
            let audioBuffer = [];
            const chunkDuration = 0.5; // 500ms chunks
            const samplesPerChunk = Math.floor(audioContextRef.current.sampleRate * chunkDuration);
            
            processorRef.current.onaudioprocess = (event) => {
                console.log('[Debug] onaudioprocess triggered.'); // New log
                console.log(`[Debug] onaudioprocess: isListening=${isListening}, wsState=${wsRef.current?.readyState}`); // New log

                if (!isListening || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    if (!isListening) console.log('[Debug] onaudioprocess: Not sending because isListening is false.');
                    if (!wsRef.current) console.log('[Debug] onaudioprocess: Not sending because wsRef.current is null.');
                    if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) console.log(`[Debug] onaudioprocess: Not sending because WebSocket state is ${wsRef.current.readyState}.`);
                    return;
                }
                
                const inputData = event.inputBuffer.getChannelData(0);
                audioBuffer = audioBuffer.concat(Array.from(inputData));
                
                // Send chunk when we have enough samples
                if (audioBuffer.length >= samplesPerChunk) {
                    const chunk = audioBuffer.slice(0, samplesPerChunk);
                    audioBuffer = audioBuffer.slice(samplesPerChunk);
                    
                    // Convert float32 audio to int16 for Python service
                    const int16Array = new Int16Array(chunk.length);
                    for (let i = 0; i < chunk.length; i++) {
                        // Clamp and convert float32 (-1 to 1) to int16 (-32768 to 32767)
                        const sample = Math.max(-1, Math.min(1, chunk[i]));
                        int16Array[i] = sample * 32767;
                    }
                    
                    // Convert to base64 for transmission
                    const buffer = int16Array.buffer;
                    const binary = String.fromCharCode(...new Uint8Array(buffer));
                    const base64Audio = btoa(binary);
                    
                    // Send to WebSocket
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        console.log(`Sending audio chunk: ${chunk.length} samples`); // Debug log
                        wsRef.current.send(JSON.stringify({
                            type: 'audio_chunk',
                            data: {
                                audio_data: base64Audio,
                                sample_rate: audioContextRef.current.sampleRate,
                                chunk_duration: chunkDuration
                            }
                        }));
                    }
                }
            };
            
            // Connect audio graph
            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
            console.log('[Debug] Audio graph connected.');
            
        } catch (error) {
            setError('Microphone access denied or not available');
            console.error('Audio setup error:', error);
        }
    }, [isListening]);
    
    // Start/stop listening
    const toggleListening = useCallback(async () => {
        if (!isListening) {
            console.log('[Debug] toggleListening: Attempting to start listening.');
            if (!isConnected) {
                console.log('[Debug] toggleListening: WebSocket not connected, attempting to connect.');
                connectWebSocket();
            }
            await setupAudioProcessing();
            setIsListening(true);
            console.log('[Debug] toggleListening: isListening set to true.');
        } else {
            console.log('[Debug] toggleListening: Attempting to stop listening.');
            setIsListening(false);
            console.log('[Debug] toggleListening: isListening set to false.');
            
            // Stop audio processing
            if (processorRef.current) {
                processorRef.current.disconnect();
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
            
            // Clear state
            setCurrentChord('');
            setConfidence(0);
            chordHistoryRef.current = [];
        }
    }, [isListening, isConnected, connectWebSocket, setupAudioProcessing]);
    
    // Update capo position
    const updateCapoPosition = useCallback((position) => {
        setCapoPosition(position);
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'capo_change',
                data: {
                    capo_position: position,
                    tuning: 'standard'
                }
            }));
        }
    }, []);
    
    // Initialize WebSocket on mount
    useEffect(() => {
        connectWebSocket();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connectWebSocket]);
    
    // Chord quality indicator
    const getChordQuality = (confidence) => {
        if (confidence > 0.8) return 'excellent';
        if (confidence > 0.6) return 'good';
        if (confidence > 0.4) return 'fair';
        return 'poor';
    };
    
    return (
        <div className="real-time-chord-detector">
            <div className="detector-header">
                <h2>🎸 Real-Time Chord Detection</h2>
                <div className="connection-status">
                    <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                </div>
            </div>
            
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}
            
            <div className="main-display">
                <div className="current-chord-display">
                    <div className="chord-name">
                        {currentChord || (isListening ? 'Listening...' : 'Not detecting')}
                    </div>
                    <div className={`confidence-bar ${getChordQuality(confidence)}`}>
                        <div 
                            className="confidence-fill" 
                            style={{ width: `${confidence * 100}%` }}
                        ></div>
                    </div>
                    <div className="confidence-text">
                        Confidence: {Math.round(confidence * 100)}%
                    </div>
                </div>
                
                <div className="song-info">
                    {key && (
                        <div className="info-item">
                            <span className="label">Key:</span>
                            <span className="value">{key}</span>
                        </div>
                    )}
                    {bpm > 0 && (
                        <div className="info-item">
                            <span className="label">BPM:</span>
                            <span className="value">{bpm}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Guitar Fretboard Visualization */}
            <GuitarFretboard 
                currentChord={currentChord} 
                capoPosition={capoPosition} 
            />
            
            <div className="capo-controls">
                <h3>Capo Position</h3>
                <div className="capo-selector">
                    {[...Array(13)].map((_, i) => (
                        <button
                            key={i}
                            className={`capo-button ${capoPosition === i ? 'active' : ''}`}
                            onClick={() => updateCapoPosition(i)}
                        >
                            {i === 0 ? 'Open' : `${i}`}
                        </button>
                    ))}
                </div>
                {capoPosition > 0 && (
                    <div className="capo-info">
                        Capo on fret {capoPosition} - Chords shown relative to capo
                    </div>
                )}
            </div>
            
            <div className="controls">
                <button
                    className={`listen-button ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    disabled={!isConnected}
                >
                    {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
                </button>
            </div>
            
            <div className="chord-history">
                <h3>Recent Chords</h3>
                <div className="chord-list">
                    {chordHistoryRef.current.slice(-10).reverse().map((chord, index) => (
                        <div key={index} className="chord-item">
                            <span className="chord-name">{chord.chord}</span>
                            <span className="chord-confidence">{Math.round(chord.confidence * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="tips">
                <h3>🎯 Tips for Best Results</h3>
                <ul>
                    <li>Play chords clearly and hold them for at least 1 second</li>
                    <li>Position your instrument close to the microphone</li>
                    <li>Use a quiet environment for better detection</li>
                    <li>Set the capo position if you're using one</li>
                    <li>Works best with guitar, piano, and other harmonic instruments</li>
                </ul>
            </div>
        </div>
    );
};

export default RealTimeChordDetector;
