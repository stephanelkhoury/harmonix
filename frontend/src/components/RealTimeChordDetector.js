import React, { useState, useEffect, useRef, useCallback } from 'react';
import GuitarFretboard from './GuitarFretboard';
import './RealTimeChordDetector.css';

const RealTimeChordDetector = () => {
    // State management
    const [isListening, setIsListening] = useState(false);
    const isListeningRef = useRef(isListening); // Ref to track isListening for callbacks
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
    
    // Effect to keep isListeningRef in sync with isListening state
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        return new Promise((resolve, reject) => {
            const PYTHON_SERVICE_URL = process.env.REACT_APP_PYTHON_SERVICE_URL || 'http://localhost:8000';
            const wsUrl = PYTHON_SERVICE_URL.replace('http', 'ws') + '/api/ws/real-time-chords';
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log('[Debug] WebSocket already connected.');
                resolve();
                return;
            }
            // Avoid creating multiple connections if one is already in progress
            if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
                console.log('[Debug] WebSocket connection already in progress. Waiting for it to open or fail.');
                // Simple way: attach to existing promise or wait. For now, let's just log.
                // More robust: store the promise from the first call and return it.
                // For this iteration, we'll let it try to connect, and the onopen/onerror handlers should manage.
                // However, to prevent multiple WebSocket objects, we can return early if connecting.
                // This needs careful handling if the original promise should be returned.
                // A simple guard:
                // return; // Or handle more gracefully
            }

            console.log('[Debug] Attempting WebSocket connection to:', wsUrl);
            wsRef.current = new WebSocket(wsUrl);
            
            wsRef.current.onopen = () => {
                setIsConnected(true);
                setError('');
                console.log('WebSocket connected for real-time chord detection');
                resolve();
            };
            
            wsRef.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                // console.log('WebSocket message received:', message); // Can be noisy
                
                if (message.type === 'chord_update') {
                    const { chord, confidence, key } = message.data; 
                    // console.log(`Chord update: ${chord} (${confidence})`); 
                    setCurrentChord(chord);
                    setConfidence(confidence);
                    
                    const now = Date.now();
                    chordHistoryRef.current.push({ chord, time: now, confidence });
                    if (chordHistoryRef.current.length > 20) {
                        chordHistoryRef.current.shift();
                    }
                    
                    if (chordHistoryRef.current.length > 4) {
                        const recentChords = chordHistoryRef.current.slice(-8);
                        const chordChanges = recentChords.filter((c, i) => 
                            i > 0 && c.chord !== recentChords[i-1].chord
                        );
                        if (chordChanges.length > 2) {
                            const timeDiff = chordChanges[chordChanges.length - 1].time - chordChanges[0].time;
                            if (timeDiff > 0) { 
                                const changesPerMinute = (chordChanges.length / timeDiff) * 60000;
                                setBpm(Math.round(changesPerMinute));
                            }
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
                // Optionally, you might want to reject the promise here if it hasn't resolved yet
                // and the closure was unexpected during connection phase.
            };
            
            wsRef.current.onerror = (errorEvent) => {
                setError('WebSocket connection failed. Ensure backend is running.');
                console.error('WebSocket error:', errorEvent);
                reject(new Error('WebSocket connection failed'));
            };
        });
    }, [ setIsConnected, setError, setCurrentChord, setConfidence, setBpm, setKey, setCapoPosition ]); // Added state setters
    
    // Audio processing setup
    const setupAudioProcessing = useCallback(async () => {
        // Ensure AudioContext is running
        if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
            console.error('[Debug] setupAudioProcessing: AudioContext not ready or not running.');
            setError('AudioContext not ready. Please click "Start Listening" again or ensure microphone access.');
            return false; // Indicate failure
        }
        // Ensure WebSocket is connected
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('[Debug] setupAudioProcessing: WebSocket not ready.');
            setError('WebSocket not connected. Please ensure backend is running and try again.');
            return false; // Indicate failure
        }

        try {
            console.log('[Debug] Requesting microphone access for audio processing setup...');
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
            console.log('[Debug] Microphone access granted for audio processing.');
            
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            console.log('[Debug] MediaStreamSource created from microphone stream.');
            
            const bufferSize = 8192; 
            processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
            console.log('[Debug] ScriptProcessorNode created.');
            
            let audioBuffer = [];
            const chunkDuration = 0.5; 
            const samplesPerChunk = Math.floor(audioContextRef.current.sampleRate * chunkDuration);
            
            processorRef.current.onaudioprocess = (event) => {
                // Using isListeningRef.current here to get the latest value
                if (!isListeningRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    return;
                }
                
                const inputData = event.inputBuffer.getChannelData(0);
                audioBuffer = audioBuffer.concat(Array.from(inputData));
                
                if (audioBuffer.length >= samplesPerChunk) {
                    const chunk = audioBuffer.slice(0, samplesPerChunk);
                    audioBuffer = audioBuffer.slice(samplesPerChunk);
                    
                    const int16Array = new Int16Array(chunk.length);
                    for (let i = 0; i < chunk.length; i++) {
                        const sample = Math.max(-1, Math.min(1, chunk[i]));
                        int16Array[i] = sample * 32767;
                    }
                    
                    const buffer = int16Array.buffer;
                    const binaryString = String.fromCharCode.apply(null, new Uint8Array(buffer));
                    const base64Audio = btoa(binaryString);
                    
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        // console.log(`Sending audio chunk: ${chunk.length} samples`); // Can be too noisy
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
            
            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination); // Connect to destination to enable processing
            console.log('[Debug] Audio graph connected (source -> processor -> destination).');
            return true; // Indicate success
            
        } catch (err) {
            setError('Microphone access denied or an error occurred during audio setup.');
            console.error('Audio setup error:', err);
            return false; // Indicate failure
        }
    }, [setError]); // Dependencies: setError. isListeningRef is a ref.
    
    // Start/stop listening
    const toggleListening = useCallback(async () => {
        // --- STARTING ---
        if (!isListeningRef.current) { 
            console.log('[Debug] toggleListening: Attempting to START listening.');

            // 1. Initialize/Resume AudioContext (must be user gesture)
            if (!audioContextRef.current) {
                console.log('[Debug] toggleListening: Creating new AudioContext.');
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
            }
            if (audioContextRef.current.state === 'suspended') {
                console.log('[Debug] toggleListening: AudioContext is suspended, attempting to resume...');
                try {
                    await audioContextRef.current.resume();
                    console.log('[Debug] toggleListening: AudioContext resumed successfully.');
                } catch (e) {
                    setError('Failed to resume AudioContext. Please click the button again or interact with the page.');
                    console.error('[Debug] toggleListening: AudioContext resume failed.', e);
                    return; // Stop if AudioContext cannot be resumed
                }
            }
            if (audioContextRef.current.state !== 'running') {
                setError('AudioContext could not be started. Please ensure microphone permissions and interact with the page.');
                console.error('[Debug] toggleListening: AudioContext is not running after attempt. State:', audioContextRef.current.state);
                return; // Stop if AudioContext is not running
            }
            console.log('[Debug] toggleListening: AudioContext is running.');

            // 2. Ensure WebSocket is connected
            // isConnected state might be stale here, check wsRef.current directly or await connectWebSocket
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                console.log('[Debug] toggleListening: WebSocket not connected or not open. Attempting to connect/reconnect.');
                try {
                    await connectWebSocket(); // connectWebSocket now returns a promise
                    console.log('[Debug] toggleListening: WebSocket connection successful or already open.');
                } catch (error) {
                    console.error('[Debug] toggleListening: WebSocket connection failed during toggle.', error);
                    // setError is handled within connectWebSocket
                    return; // Stop if WebSocket connection fails
                }
            }
            
            // 3. Setup Audio Processing (requires running AudioContext and open WebSocket)
            const setupSuccess = await setupAudioProcessing();
            if (!setupSuccess) {
                console.error('[Debug] toggleListening: Audio processing setup failed. Aborting start.');
                // setError is handled within setupAudioProcessing
                return; // Stop if audio processing setup fails
            }
            console.log('[Debug] toggleListening: Audio processing setup successful.');

            // 4. If all successful, update state to indicate listening
            setIsListening(true);
            console.log('[Debug] toggleListening: setIsListening(true) called. Now listening.');

        // --- STOPPING ---
        } else { 
            console.log('[Debug] toggleListening: Attempting to STOP listening.');
            setIsListening(false); // Set state first to update UI and isListeningRef.current via useEffect
            console.log('[Debug] toggleListening: setIsListening(false) called.');
            
            // Disconnect audio processing nodes
            if (processorRef.current) {
                processorRef.current.disconnect();
                processorRef.current.onaudioprocess = null; // Important to remove the callback
                // processorRef.current = null; // Optional: nullify ref
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
                // sourceRef.current = null; // Optional: nullify ref
            }
            
            // Stop microphone stream tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                console.log('[Debug] Microphone stream tracks stopped.');
            }
            
            // Optionally, suspend AudioContext to save resources
            if (audioContextRef.current && audioContextRef.current.state === 'running') {
                 // await audioContextRef.current.suspend(); // Suspending can be good practice
                 // console.log('[Debug] AudioContext suspended.');
            }
            
            // Clear dynamic state related to detection
            setCurrentChord('');
            setConfidence(0);
            // chordHistoryRef.current = []; // Decide if history should be cleared on stop
            console.log('[Debug] Listening stopped, state cleared.');
        }
    }, [connectWebSocket, setupAudioProcessing, setIsListening, setError, setCurrentChord, setConfidence]); // Dependencies

    // Effect for initial WebSocket connection and cleanup
    useEffect(() => {
        console.log('[Debug] Initial component mount: Attempting WebSocket connection.');
        connectWebSocket().catch(err => {
            console.error("[Debug] Initial WebSocket connection failed on mount:", err);
            // setError is handled in connectWebSocket
        });
        
        // Cleanup function on component unmount
        return () => {
            console.log('[Debug] Component unmounting: Cleaning up resources.');
            if (wsRef.current) {
                wsRef.current.onopen = null;
                wsRef.current.onmessage = null;
                wsRef.current.onerror = null;
                wsRef.current.onclose = null;
                if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                    wsRef.current.close();
                    console.log('[Debug] WebSocket closed on unmount.');
                }
                wsRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                console.log('[Debug] Microphone stream stopped on unmount.');
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().then(() => {
                    console.log('[Debug] AudioContext closed on unmount.');
                    audioContextRef.current = null;
                });
            }
        };
    }, [connectWebSocket]); // connectWebSocket is memoized
    
    // Chord quality indicator
    const getChordQuality = (confidence) => {
        if (confidence > 0.8) return 'high';
        if (confidence > 0.5) return 'medium';
        return 'low';
    };

    return (
        <div className="realtime-chord-detector">
            <h1>Real-Time Chord Detector</h1>
            <div className="chord-info">
                <div className="current-chord">
                    <span>Chord:</span> {currentChord || 'N/A'}
                </div>
                <div className="chord-confidence">
                    <span>Confidence:</span> {confidence > 0 ? (confidence * 100).toFixed(1) + '%' : 'N/A'}
                </div>
                <div className="capo-position">
                    <span>Capo Position:</span> {capoPosition}
                </div>
                <div className="key-signature">
                    <span>Key:</span> {key || 'N/A'}
                </div>
                <div className="bpm">
                    <span>BPM:</span> {bpm}
                </div>
            </div>
            <div className="controls">
                <button 
                    onClick={toggleListening} 
                    className={isListening ? 'active' : ''}
                    disabled={isConnected === false} // Disable if WebSocket is not connected
                >
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
                <div className="error-message">
                    {error}
                </div>
            </div>
            <GuitarFretboard 
                currentChord={currentChord} 
                confidence={confidence} 
                capoPosition={capoPosition}
                keySignature={key}
                bpm={bpm}
                chordQuality={getChordQuality(confidence)}
            />
        </div>
    );
};

export default RealTimeChordDetector;
