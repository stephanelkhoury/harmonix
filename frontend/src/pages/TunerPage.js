import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaGuitar, FaMusic, FaMicrophone, FaMicrophoneSlash, FaBug } from 'react-icons/fa';
import './style/TunerPage.css';
import TunerDebugOverlay from '../components/TunerDebugOverlay';

function TunerPage() {
    const [selectedInstrument, setSelectedInstrument] = useState('guitar');
    const [isListening, setIsListening] = useState(false);
    const [detectedNote, setDetectedNote] = useState(null);
    const [detectedFrequency, setDetectedFrequency] = useState(null);
    const [tuningStatus, setTuningStatus] = useState('waiting'); // 'waiting', 'too-low', 'in-tune', 'too-high'
    const [tuningOffset, setTuningOffset] = useState(0); // Offset value for tuning indicator (-50 to 50)
    const [micAccessDenied, setMicAccessDenied] = useState(false);
    const [calibrating, setCalibrating] = useState(false); // State for calibration phase
    const [signalStrength, setSignalStrength] = useState(0); // Track signal strength for UI
    const [noteDetectionActive, setNoteDetectionActive] = useState(false); // Track if active detection is happening
    const [showDebugInfo, setShowDebugInfo] = useState(false); // Toggle for debug information overlay
    const [lastWorkletMessage, setLastWorkletMessage] = useState(null); // Track last message from worklet
    const [rawSignalLevel, setRawSignalLevel] = useState(0); // Track raw signal level for debugging
    
    // Debug state for the TunerDebugOverlay
    const [debugState, setDebugState] = useState({
        audio: { contextReady: false, microphoneReady: false, sampleRate: null },
        worklet: { supported: false, ready: false, lastMessage: null },
        detection: { detectionActive: false, note: null, frequency: null, tuningStatus: 'waiting', rawLevel: 0 }
    });
    
    // References for audio processing
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);
    const workletNodeRef = useRef(null);
    const workletReadyRef = useRef(false);
    const lastSignalUpdateRef = useRef(0);
    const missedUpdatesCountRef = useRef(0);
    
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
        },
        saxophone: {
            name: 'Saxophone',
            icon: <FaMusic />,
            tuning: ['Bb3'] // Standard Bb saxophone reference note
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
    
    // Start the microphone and pitch detection with improved calibration phase
    const startListening = async () => {
        try {
            console.log("🎤 Starting microphone access request...");
            
            // Reset all previous state and clear any saved frequency data
            window.recentFreqs = [];
            window.recentNotes = [];
            window.lastFreq = null;
            window.noteTimeoutId = null;
            
            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("getUserMedia not supported in this browser");
                alert("Audio input is not supported in this browser. Please try using Chrome, Firefox, or Edge.");
                return;
            }
            
            // Resume audio context if it's in suspended state (required by some browsers)
            // Initialize audio context if not already created
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                
                // Try to set up AudioWorklet for Safari/iOS support
                if (audioContextRef.current.audioWorklet) {
                    try {
                        const baseUrl = window.location.origin;
                        // We need to create a full URL to the worklet file
                        const workletUrl = `${baseUrl}/tunerProcessor.js`;
                        
                        console.log("Setting up AudioWorklet from:", workletUrl);
                        
                        // Properly load the AudioWorklet module using addModule
                        await audioContextRef.current.audioWorklet.addModule(workletUrl);
                        console.log("AudioWorklet module loaded successfully");
                        
                        // Set ready flag after module is successfully loaded
                        workletReadyRef.current = true;
                    } catch (err) {
                        console.warn("Failed to set up AudioWorklet:", err);
                    }
                } else {
                    console.log("AudioWorklet not supported in this browser");
                }
            } else if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
                console.log("AudioContext resumed from suspended state");
            }
            
            // Create analyzer with optimized settings for musical instruments
            if (!analyserRef.current) {
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 8192; // Reduced from 16384 for better performance while still good resolution
                analyserRef.current.smoothingTimeConstant = 0.85; // Slightly smoother averaging
                analyserRef.current.minDecibels = -90; // Further increased sensitivity for quieter sounds
                analyserRef.current.maxDecibels = -10; // Better dynamic range
            }
            
            // First check if permission has already been granted
            console.log("Checking microphone permissions...");
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
                console.log(`Microphone permission status: ${permissionStatus.state}`);
                
                if (permissionStatus.state === 'denied') {
                    throw new Error("Microphone access has been blocked. Please enable microphone access in your browser settings.");
                }
            } catch (permError) {
                // Not all browsers support the permissions API, so just continue if it fails
                console.log("Could not check permissions directly:", permError);
            }
            
            // Request microphone access with optimized audio settings - use less strict constraints
            // as some browsers/devices don't support all options
            console.log("Requesting microphone stream...");
            let stream;
            try {
                // Try with ideal settings first
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: false, 
                        noiseSuppression: false, 
                        autoGainControl: false,
                        latency: 0.003,
                        sampleRate: 48000,
                        channelCount: 1
                    }
                });
                console.log("Microphone accessed with ideal settings");
            } catch (err) {
                // If that fails, try with minimal constraints
                console.warn("Couldn't access microphone with ideal settings. Trying minimal settings:", err);
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: true
                });
                console.log("Microphone accessed with minimal settings");
            }
            
            // Verify we have tracks in the stream
            if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
                throw new Error("No audio tracks received from microphone");
            }
            
            // Log the actual track settings we got
            const audioTrack = stream.getAudioTracks()[0];
            console.log("Audio track settings:", audioTrack.getSettings());
            console.log("Audio track constraints:", audioTrack.getConstraints());
            
            streamRef.current = stream;
            
            // Create a clear audio routing chain for better debugging
            try {
                // Create source from microphone stream
                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                
                // Add a gain node to control volume (set to 1.0 = unchanged)
                const gainNode = audioContextRef.current.createGain();
                gainNode.gain.value = 1.0;
                sourceRef.current.connect(gainNode);
                
                // Connect to analyzer
                gainNode.connect(analyserRef.current);
                
                // Try using AudioWorklet on supporting browsers to process audio in parallel
                if (workletReadyRef.current) {
                    console.log("Attempting to use AudioWorklet...");
                    try {
                        // Create a worklet node and connect it - with better error handling
                        if (!audioContextRef.current) {
                            throw new Error("AudioContext is not initialized");
                        }
                        
                        console.log("Creating AudioWorkletNode with processor: 'tuner-processor'");
                        // Store the audio context in a local variable to prevent "this" binding issues
                        const audioContext = audioContextRef.current;
                        // Store the sampleRate locally first to avoid illegal invocation
                        const currentSampleRate = audioContext.sampleRate;
                        
                        workletNodeRef.current = new AudioWorkletNode(audioContext, 'tuner-processor', {
                            outputChannelCount: [1], // Mono output
                            numberOfInputs: 1,
                            numberOfOutputs: 1,
                            processorOptions: {
                                // Pass any configuration to the processor
                                sampleRate: currentSampleRate,
                                bufferSize: 4096
                            }
                        });
                        gainNode.connect(workletNodeRef.current);
                        
                        // Listen for messages from the worklet
                        workletNodeRef.current.port.onmessage = (event) => {
                            // Store last message type for debug display
                            setLastWorkletMessage(event.data.type);
                            
                            // Handle different message types from the worklet
                            switch (event.data.type) {
                                case 'ready':
                                    console.log("🎉 AudioWorklet ready message:", event.data.message);
                                    
                                    // Send a ping to test bidirectional communication
                                    setTimeout(() => {
                                        try {
                                            workletNodeRef.current.port.postMessage({ type: 'ping' });
                                            console.log("Ping sent to AudioWorklet");
                                        } catch (err) {
                                            console.error("Failed to ping AudioWorklet:", err);
                                        }
                                    }, 500);
                                    break;
                                    
                                case 'pong':
                                    console.log("📡 AudioWorklet bidirectional communication confirmed");
                                    break;
                                    
                                case 'status':
                                    console.log("ℹ️ AudioWorklet status update:", event.data.message);
                                    break;
                                    
                                case 'level':
                                    // Direct signal level update from worklet with enhanced data
                                    const level = event.data.level;
                                    const peak = event.data.peak || 0;
                                    const signalPresent = event.data.signalPresent || level > 0.0005;
                                    const signalStrong = event.data.signalStrong || level > 0.001;
                                    
                                    // Store raw signal level for debugging
                                    setRawSignalLevel(level);
                                    
                                    // Scale signal level to 0-100% range for UI with adaptive scaling
                                    // Higher amplification for vocal and quieter instruments
                                    const amplificationFactor = 3500; // Increased from 3000 for better visibility
                                    const normalizedLevel = Math.min(100, Math.round(level * amplificationFactor));
                                    setSignalStrength(normalizedLevel);
                                    
                                    // Track signal activity for UI feedback with more explicit visual feedback
                                    if (signalPresent) {
                                        lastSignalUpdateRef.current = Date.now();
                                        // Reset missed updates counter since we're getting signals
                                        missedUpdatesCountRef.current = 0;
                                        
                                        // Directly update the active state when signal is present
                                        // This provides immediate UI feedback without waiting for note detection
                                        if (!noteDetectionActive && signalStrong) {
                                            setNoteDetectionActive(true);
                                            console.log("Signal detected, activating note detection display");
                                        }
                                    }
                                    
                                    // Update debug state with current signal info
                                    setDebugState(prevState => ({
                                        ...prevState,
                                        detection: {
                                            ...prevState.detection,
                                            rawLevel: level,
                                            signalPresent: signalPresent,
                                            signalStrong: signalStrong
                                        }
                                    }));
                                    break;
                                    
                                case 'buffer':
                                    try {
                                        // Process the buffer from the worklet with enhanced debug info
                                        const bufferLevel = event.data.level;
                                        const bufferPeak = event.data.peak || 0;
                                        const signalQuality = event.data.signalQuality || 'unknown';
                                        const shouldProcess = event.data.shouldProcess !== false; // Default to true
                                        const forceSend = event.data.forceSend || false;
                                        const zeroCrossingRate = event.data.zeroCrossingRate || 0;
                                        const periodicity = event.data.periodicity || 0;
                                        const silenceRatio = event.data.silenceRatio || 0;
                                        
                                        // Update lastSignalUpdate timestamp to prevent health check warnings
                                        lastSignalUpdateRef.current = Date.now();
                                        missedUpdatesCountRef.current = 0; // Reset counter on buffer receive
                                        
                                        // Add more detailed logging for debugging
                                        console.log(`Received audio buffer [${signalQuality}] - level: ${bufferLevel?.toFixed(6) || 'unknown'}, peak: ${bufferPeak?.toFixed(6) || 'unknown'}, ZCR: ${zeroCrossingRate.toFixed(4)}, forceSend: ${forceSend}`);
                                        
                                        // Update UI indicators for signal strength immediately
                                        if (bufferLevel !== undefined) {
                                            setRawSignalLevel(bufferLevel);
                                            const normalizedStrength = Math.min(100, Math.round(bufferLevel * 3500));
                                            setSignalStrength(normalizedStrength);
                                            
                                            // Activate note detection display if good signal is present
                                            if (normalizedStrength > 15 && !noteDetectionActive) {
                                                console.log("Signal strength sufficient, activating note detection display");
                                                setNoteDetectionActive(true);
                                            }
                                        }
                                        
                                        // Skip processing if signal quality is too poor and not forced
                                        if (!shouldProcess && !forceSend) {
                                            console.log("Skipping buffer processing: low quality signal");
                                            return;
                                        }
                                        
                                        // Validate buffer before processing
                                        if (!event.data.buffer || event.data.buffer.length === 0) {
                                            console.warn("Received empty buffer from AudioWorklet");
                                            return;
                                        }
                                        
                                        // Enhanced validation - check for valid audio content
                                        const hasValidSignal = bufferLevel > 0.0002 && zeroCrossingRate > 0.005;
                                        
                                        if (!audioContextRef.current) {
                                            console.warn("AudioContext not available for processing");
                                            return;
                                        }
                                        
                                        // Update note detection active state
                                        setNoteDetectionActive(bufferLevel > 0.0005);
                                        
                                        // Store the AudioContext and its sampleRate in local variables to prevent "this" binding issues
                                        const audioContext = audioContextRef.current;
                                        if (!audioContext) {
                                            console.warn("AudioContext not available for processing buffer");
                                            return;
                                        }
                                        const sampleRate = audioContext.sampleRate;
                                        
                                        // Process this buffer with our pitch detection algorithm
                                        // Get signal quality information
                                        // Using the signalQuality already declared above
                                        // Re-using zeroCrossingRate, shouldProcess, and forceSend that are already declared
                                        
                                        // Enhanced logging for debugging note display issues
                                        console.log(`Processing buffer: quality=${signalQuality}, ZCR=${zeroCrossingRate.toFixed(4)}, forceSend=${forceSend}`);
                                        
                                        // Only process frequency detection for signals that are strong enough
                                        // or explicitly marked for processing
                                        if (shouldProcess || forceSend) {
                                            const frequency = findFundamentalFrequency(
                                                event.data.buffer, 
                                                sampleRate,
                                                // Pass current instrument's target frequencies for better tuning
                                                instruments[selectedInstrument]?.tuning.map(note => noteFrequencies[note] || 0).filter(f => f > 0)
                                            );
                                            
                                            if (frequency > 0) {
                                                // Direct frequency update with smoothing
                                                const roundedFreq = Math.round(frequency * 10) / 10;
                                                console.log(`🎵 Worklet detected frequency: ${roundedFreq}Hz (updating UI)`);
                                                
                                                // Update UI directly from worklet buffer processing
                                                setDetectedFrequency(roundedFreq);
                                                
                                                // Find the matching note with enhanced stability
                                                const { note, cents } = findClosestNote(frequency);
                                                
                                                // Log all successful detections for debugging
                                                console.log(`Note detected: ${note}, cents: ${cents}, freq: ${roundedFreq}Hz`);
                                                
                                                // Update UI state with forced update to ensure rendering
                                                setDetectedNote(prevNote => {
                                                    if (prevNote !== note) {
                                                        console.log(`Note changed: ${prevNote} -> ${note}`);
                                                    }
                                                    return note;
                                                });
                                                
                                                // Update tuning status with slightly wider "in-tune" range
                                                setTuningStatus(prev => {
                                                    const newStatus = Math.abs(cents) < 15 ? 'in-tune' : 
                                                                     cents < 0 ? 'too-low' : 'too-high';
                                                    if (prev !== newStatus) {
                                                        console.log(`Tuning status changed: ${prev} -> ${newStatus}`);
                                                    }
                                                    return newStatus;
                                                });
                                                
                                                // Set tuning offset with smoothing
                                                const smoothedOffset = Math.max(-50, Math.min(50, cents));
                                                setTuningOffset(smoothedOffset);
                                                
                                                // Mark detection as active with guaranteed state update
                                                if (!noteDetectionActive) {
                                                    console.log("Note detection activated");
                                                    setNoteDetectionActive(true);
                                                }
                                                
                                                // Update the debug state
                                                setDebugState(prevState => ({
                                                    ...prevState,
                                                    detection: {
                                                        ...prevState.detection,
                                                        detectionActive: true,
                                                        note,
                                                        frequency: roundedFreq,
                                                        tuningStatus: Math.abs(cents) < 15 ? 'in-tune' : 
                                                                     cents < 0 ? 'too-low' : 'too-high',
                                                        cents
                                                    }
                                                }));
                                                
                                                // Reset missed updates counter since we got a valid frequency
                                                missedUpdatesCountRef.current = 0;
                                            } else {
                                                // No valid frequency in this buffer, but don't immediately clear display
                                                // Track missed updates
                                                missedUpdatesCountRef.current++;
                                                console.log(`No frequency detected, missed update count: ${missedUpdatesCountRef.current}`);
                                                
                                                // After several missed updates, mark detection as inactive
                                                // but keep the displayed note/frequency visible for stability
                                                if (missedUpdatesCountRef.current > 15) {
                                                    if (noteDetectionActive) {
                                                        console.log("Note detection deactivated after missed updates");
                                                        setNoteDetectionActive(false);
                                                        
                                                        // Update debug state
                                                        setDebugState(prevState => ({
                                                            ...prevState,
                                                            detection: {
                                                                ...prevState.detection,
                                                                detectionActive: false
                                                            }
                                                        }));
                                                    }
                                                }
                                            }
                                        } else {
                                            console.log("Skipping frequency detection due to poor signal quality");
                                        }
                                    } catch (err) {
                                        console.error("Error processing audio buffer:", err);
                                    }
                                    break;
                                    
                                case 'error':
                                    console.error("❌ AudioWorklet error:", event.data.message);
                                    break;
                                    
                                default:
                                    console.log("Unknown worklet message:", event.data);
                            }
                            
                            // Update debug state with the latest worklet message
                            setDebugState(prevState => ({
                                ...prevState,
                                worklet: { 
                                    ...prevState.worklet, 
                                    lastMessage: event.data,
                                    ready: event.data.type === 'ready'
                                },
                                detection: {
                                    ...prevState.detection,
                                    detectionActive: event.data.type === 'buffer' && event.data.level > 0.0005,
                                    rawLevel: event.data.level || prevState.detection.rawLevel
                                }
                            }));
                        };
                        
                        // Add error handler for worklet node
                        workletNodeRef.current.onprocessorerror = (err) => {
                            console.error("AudioWorklet processor error:", err);
                        };
                        
                        console.log("AudioWorklet connected successfully");
                    } catch (err) {
                        console.warn("Failed to initialize AudioWorklet:", err);
                        console.error("AudioWorklet error details:", err.message);
                        workletReadyRef.current = false; // Reset flag on error
                    }
                }
                
                console.log("Audio routing completed successfully");
            } catch (routingError) {
                console.error("Error setting up audio routing:", routingError);
                
                // Fallback to direct connection if the full routing fails
                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                sourceRef.current.connect(analyserRef.current);
            }
            
            console.log("Audio source connected to analyzer");
            
            // Start calibration phase to adjust to ambient noise levels
            setCalibrating(true);
            setIsListening(true);
            setMicAccessDenied(false);
            setDetectedNote(null);
            setDetectedFrequency(null);
            setTuningStatus('waiting');
            setTuningOffset(0);
            
            // Run a quick calibration test to adjust to ambient noise
            console.log('🎵 Starting calibration phase...');
            setTimeout(() => {
                setCalibrating(false);
                console.log('🎵 Calibration complete, tuner is now active');
                
                // After calibration, send a health check to the worklet to ensure it's responsive
                if (workletNodeRef.current && workletNodeRef.current.port) {
                    try {
                        workletNodeRef.current.port.postMessage({ 
                            type: 'ping', 
                            message: 'Initial health check after calibration' 
                        });
                        console.log("Initial health check sent to AudioWorklet");
                    } catch (err) {
                        console.error("Failed to send health check to AudioWorklet:", err);
                    }
                }
            }, 1200); // Short calibration phase
            
            // Start pitch detection loop
            detectPitch();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setMicAccessDenied(true);
            setCalibrating(false);
            setIsListening(false);
            
            // Provide more helpful error messages based on specific error
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                alert('Microphone access was denied. Please allow microphone access in your browser settings and try again.');
            } else if (error.name === 'NotFoundError') {
                alert('No microphone found. Please connect a microphone and try again.');
            } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
                alert('Your microphone is busy or unavailable. Please close other applications that might be using it and try again.');
            } else {
                alert(`Unable to access microphone: ${error.message}. Please check your browser settings and try again.`);
            }
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
    
    // Enhanced and optimized pitch detection using autocorrelation with calibration support
    const detectPitch = () => {
        if (!isListening || !analyserRef.current) return;
        
        const bufferLength = analyserRef.current.fftSize;
        const timeData = new Float32Array(bufferLength);
        analyserRef.current.getFloatTimeDomainData(timeData);
        
        // Check if there's enough signal - improved RMS calculation
        const volumeLevel = getRMS(timeData);
        
        // Update signal strength for UI display (scale to 0-100) - more amplification
        const normalizedStrength = Math.min(100, Math.round(volumeLevel * 3000)); // Increased amplification factor
        setSignalStrength(normalizedStrength);
        
        // Log all signal activity, even very weak signals to help debug
        console.log(`Signal: ${normalizedStrength}% | Raw: ${volumeLevel.toFixed(6)} | Buffer: ${bufferLength}`);
        
        // Debug state values to see if they're being updated
        console.log(`Current UI state: Note=${detectedNote}, Freq=${detectedFrequency}, Signal=${signalStrength}%`);
        
        // Debug and display raw frequency data periodically
        if (!window.debugCounter) window.debugCounter = 0;
        if (window.debugCounter % 30 === 0) { // Every ~30 frames (roughly once per second)
            // Log a snapshot of the buffer data to inspect the waveform
            const sampleSize = 20; // Just show a small sample
            const bufferSample = [];
            for (let i = 0; i < sampleSize && i < timeData.length; i++) {
                bufferSample.push(timeData[i].toFixed(6));
            }
            console.log("Buffer sample:", bufferSample.join(', '));
            
            // Calculate FFT to see frequency content (to debug if frequency content is present)
            if (analyserRef.current) {
                const fftSize = analyserRef.current.fftSize;
                const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(freqData);
                console.log("FFT data available, size:", fftSize);
                console.log("Some frequency content:", freqData.slice(0, 10).join(', '));
            }
        }
        window.debugCounter++;
        
        // During calibration phase, just measure background noise and don't try to detect pitch
        if (calibrating) {
            // While calibrating, update UI to show that we're analyzing the ambient noise
            setDebugState(prevState => ({
                ...prevState,
                detection: {
                    ...prevState.detection,
                    detectionActive: false,
                    rawLevel: volumeLevel
                }
            }));
            
            animationFrameRef.current = requestAnimationFrame(detectPitch);
            return;
        }
        
        // Much more sensitive threshold for weak signals - significantly reduced to detect very soft sounds
        const baseThreshold = 0.0015; // Reduced base threshold by 2-3x
        
        // Use different thresholds based on the selected instrument
        const instrumentThreshold = selectedInstrument === 'guitar' || selectedInstrument === 'bass' 
            ? baseThreshold * 0.8  // Even lower threshold for plucked instruments
            : baseThreshold; // Base threshold for wind/other instruments
            
        if (volumeLevel < instrumentThreshold) {
            // Clear with longer delay to avoid flickering - but don't clear immediately to maintain stability
            if (detectedNote) {
                // Using a simple state variable instead of setTimeout to avoid timing issues
                // This creates a "sticky" note display that's more stable
                clearTimeout(window.noteTimeoutId);
                window.noteTimeoutId = setTimeout(() => {
                    setDetectedNote(null);
                    setDetectedFrequency(null);
                    setTuningStatus('waiting');
                    setTuningOffset(0);
                }, 1200); // Even longer timeout (1.2s) for more stable display
            }
            animationFrameRef.current = requestAnimationFrame(detectPitch);
            return;
        } else if (window.noteTimeoutId) {
            // If we have a valid signal now, clear any pending timeouts to prevent note clearing
            clearTimeout(window.noteTimeoutId);
            window.noteTimeoutId = null;
        }
        
        // Debug signal presence
        console.log(`🎵 Signal detected above threshold! Level: ${volumeLevel.toFixed(6)} (min: ${instrumentThreshold.toFixed(6)})`);
        
        // Apply a frequency bias toward the selected instrument's tuning
        // This helps stabilize readings for the expected notes
        const selectedTuning = instruments[selectedInstrument]?.tuning || ['A4'];
        const targetFreqs = selectedTuning.map(note => noteFrequencies[note]);
        
        // Use enhanced algorithm for pitch detection with target frequency hints
        const frequency = findFundamentalFrequency(timeData, audioContextRef.current.sampleRate, targetFreqs);
        
        if (frequency > 0) {
            // Apply a low-pass filter to frequency changes to smooth out readings
            const filteredFreq = window.lastFreq ? 
                window.lastFreq * 0.7 + frequency * 0.3 : 
                frequency; // Apply smoothing only if we have a previous freq
            
            window.lastFreq = filteredFreq;
            
            // Update detection with the filtered frequency
            console.log(`Raw: ${frequency.toFixed(2)}Hz | Filtered: ${filteredFreq.toFixed(2)}Hz`);
            
            // Format the frequency for consistent display and force state update
            const roundedFreq = Math.round(filteredFreq * 10) / 10;
            console.log(`🎯 Setting frequency in UI to: ${roundedFreq} Hz`);
            setDetectedFrequency(roundedFreq);
            
            // Find the closest note using the filtered frequency
            const { note, cents } = findClosestNote(filteredFreq);
            console.log(`🎵 Setting note in UI to: ${note}`);
            setDetectedNote(note);
            
            // Mark detection as active
            setNoteDetectionActive(true);
            
            // Set tuning status based on cents deviation - wider "in-tune" range for better UX
            if (Math.abs(cents) < 15) { // Increased from 10 to 15 for more forgiving tuning
                setTuningStatus('in-tune');
            } else if (cents < 0) {
                setTuningStatus('too-low');
            } else {
                setTuningStatus('too-high');
            }
            
            // Set tuning offset for the indicator with smoothing (-50 to 50)
            const smoothedOffset = Math.max(-50, Math.min(50, cents));
            setTuningOffset(smoothedOffset);
            
            // Show helpful debug info for tuning
            const closestStandardNote = Object.keys(noteFrequencies).find(
                noteName => noteFrequencies[noteName] === 
                    Math.min(...Object.values(noteFrequencies).map(f => 
                        Math.abs(filteredFreq - f)))
            );
            console.log(`Note: ${note} | Standard: ${closestStandardNote} | Offset: ${cents.toFixed(1)} cents`);
        } else {
            // No valid frequency detected but signal is present - show helpful debug info
            console.log(`Signal detected (${(volumeLevel * 100).toFixed(2)}%), but no stable pitch found. Try playing a clearer note.`);
            
            // We don't immediately clear the note - let the "sticky" behavior handle it
            // This prevents flickering between notes
        }
        
        // Continue detection loop
        animationFrameRef.current = requestAnimationFrame(detectPitch);
    };
    
    // Function to test AudioWorklet capabilities
    const runAudioWorkletDiagnostics = async () => {
        console.log("🔍 Running AudioWorklet diagnostics...");
        
        // Check if AudioWorklet is supported
        if (!window.AudioContext || !window.AudioContext.prototype.audioWorklet) {
            console.log("❌ AudioWorklet API is not supported in this browser");
            return false;
        }
        
        try {
            const tempContext = new AudioContext();
            console.log(`✅ AudioContext created successfully, state: ${tempContext.state}`);
            
            // Check if addModule is available
            if (typeof tempContext.audioWorklet.addModule !== 'function') {
                console.log("❌ audioWorklet.addModule is not a function");
                tempContext.close();
                return false;
            }
            
            console.log("✅ audioWorklet.addModule is supported");
            
            // Attempt to load a simple module to verify functionality
            try {
                const baseUrl = window.location.origin;
                const workletUrl = `${baseUrl}/tunerProcessor.js`;
                console.log(`🔄 Testing AudioWorklet with URL: ${workletUrl}`);
                
                await tempContext.audioWorklet.addModule(workletUrl);
                console.log("✅ Successfully loaded AudioWorklet module");
                
                // Try to create a node
                try {
                    const node = new AudioWorkletNode(tempContext, 'tuner-processor');
                    console.log("✅ Successfully created AudioWorkletNode");
                    node.port.postMessage({ type: 'test' });
                    console.log("✅ Successfully sent message to processor");
                } catch (nodeErr) {
                    console.error("❌ Failed to create AudioWorkletNode:", nodeErr);
                }
            } catch (moduleErr) {
                console.error("❌ Failed to load AudioWorklet module:", moduleErr);
                return false;
            }
            
            tempContext.close();
            return true;
        } catch (err) {
            console.error("❌ Error during AudioWorklet diagnostics:", err);
            return false;
        }
    };
    
    // Function specifically for diagnosing UI display issues in tuner
    const diagnoseDisplayIssues = () => {
        console.log("🔍 Diagnosing UI display issues in tuner...");
        
        // Check React state
        console.log("Current UI state:");
        console.log(`- Detected note: ${detectedNote || 'None'}`);
        console.log(`- Frequency: ${detectedFrequency || 'None'}`);
        console.log(`- Signal strength: ${signalStrength}%`);
        console.log(`- Raw level: ${rawSignalLevel?.toFixed(8) || 'N/A'}`);
        console.log(`- Detection active: ${noteDetectionActive ? 'Yes' : 'No'}`);
        
        // Check Worklet connection
        console.log(`AudioWorklet ready: ${workletReadyRef.current ? 'Yes' : 'No'}`);
        console.log(`Last worklet message: ${lastWorkletMessage || 'None'}`);
        
        // Force state updates to ensure UI is in sync with actual detected values
        setDebugState(prevState => ({
            ...prevState,
            audio: {
                contextReady: !!audioContextRef.current,
                microphoneReady: !!streamRef.current,
                sampleRate: audioContextRef.current ? audioContextRef.current.sampleRate : null
            },
            worklet: {
                supported: !!window.AudioWorkletNode,
                ready: workletReadyRef.current,
                lastMessage: lastWorkletMessage ? { type: lastWorkletMessage } : null
            },
            detection: {
                detectionActive: noteDetectionActive,
                note: detectedNote,
                frequency: detectedFrequency,
                tuningStatus,
                rawLevel: rawSignalLevel
            }
        }));
        
        // Force a worklet reset to clear any stalled state
        if (workletNodeRef.current && workletNodeRef.current.port) {
            try {
                console.log("Sending reset command to AudioWorklet...");
                workletNodeRef.current.port.postMessage({ 
                    type: 'reset',
                    timestamp: Date.now() 
                });
                
                // Also ping to verify connection is alive
                workletNodeRef.current.port.postMessage({ 
                    type: 'ping',
                    timestamp: Date.now(),
                    forceUpdate: true  // Flag to force a UI update on response
                });
                console.log("Reset and ping commands sent to AudioWorklet");
                
                // Force a new detection cycle if the AudioWorklet is responsive
                setTimeout(() => {
                    if (isListening && animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                        detectPitch(); // Restart the detection loop
                        console.log("Detection loop restarted");
                    }
                }, 500);
            } catch (err) {
                console.error("Failed to communicate with AudioWorklet:", err);
            }
        } else {
            console.log("AudioWorklet node or port not available");
        }
        
        // Check for potential browser-specific issues
        const isFirefox = navigator.userAgent.includes('Firefox');
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isSafari) {
            console.log("⚠️ Safari detected: may have limited AudioWorklet support");
        }
        
        if (isFirefox) {
            console.log("⚠️ Firefox detected: check about:config for privacy.resistFingerprinting");
        }
        
        return "Diagnostics logged to console and state updated. Check browser console for details.";
    };
    
    // Further enhanced RMS calculation with improved sensitivity
    const getRMS = (buffer) => {
        let sum = 0;
        let max = 0;
        let zeroCount = 0;
        const bufferLength = buffer.length;
        
        // Calculate RMS with improved handling for outliers and silence
        for (let i = 0; i < bufferLength; i++) {
            // Track max values for peak detection
            const absVal = Math.abs(buffer[i]);
            if (absVal > max) max = absVal;
            
            // Squared sum for RMS calculation
            sum += buffer[i] * buffer[i];
            
            // Count near-zero values to detect silence or DC offset
            if (absVal < 0.0005) zeroCount++; // Reduced threshold for zero detection
        }
        
        // If too many near-zero values, signal might be very weak or contain DC offset
        const silenceRatio = zeroCount / bufferLength;
        if (silenceRatio > 0.9) { // Increased from 0.8 to be more lenient with silence
            console.log("Mostly silence detected in buffer, silenceRatio:", silenceRatio);
            return 0; // Mostly silence
        }
        
        // Standard RMS calculation
        const rms = Math.sqrt(sum / bufferLength);
        
        // Amplify very weak signals to make them detectable
        // This helps with quieter instruments or microphones that are farther away
        if (rms > 0 && rms < 0.001) {
            const boostedRms = rms * 1.5; // Boost very weak signals
            console.log(`Boosting weak signal: ${rms.toFixed(6)} → ${boostedRms.toFixed(6)}`);
            return boostedRms;
        }
        
        // Use peak-to-RMS ratio (crest factor) to identify noise vs. clear signal
        // Clean tones have higher crest factors, noise has lower crest factors
        const crestFactor = max / (rms || 0.00001); // Avoid division by zero
        
        // Boost RMS value for clear signals with high crest factors
        // This helps separate actual notes from background noise
        if (rms > 0.0005 && crestFactor > 3.0) { // Lowered threshold from 3.5 to 3.0
            const boostedRms = rms * (1 + (crestFactor - 3.0) / 8); // More aggressive boost
            console.log(`Signal with good crest factor: ${crestFactor.toFixed(2)}, boosting: ${rms.toFixed(6)} → ${boostedRms.toFixed(6)}`);
            return boostedRms;
        }
        
        return rms;
    };
    
    // Enhanced optimized autocorrelation algorithm for pitch detection
    const findFundamentalFrequency = (buffer, sampleRate, targetFrequencies = []) => {
        // Enhanced and optimized autocorrelation for more accurate pitch detection
        const autoCorrelateBuffer = (buf, sampleRate) => {
            // Buffer preparation with optimizations
            const bufferSize = buf.length;
            const correlations = new Float32Array(bufferSize);
            
            // Calculate normalized autocorrelation using a more efficient approach
            let sum = 0;
            for (let i = 0; i < bufferSize; i++) {
                sum += buf[i] * buf[i];
            }
            
            if (sum <= 0) return -1; // No signal
            
            // Pre-normalize by signal power for better peak detection
            const normalizedBuffer = new Float32Array(bufferSize);
            for (let i = 0; i < bufferSize; i++) {
                normalizedBuffer[i] = buf[i] / Math.sqrt(sum);
            }
            
            // Calculate normalized autocorrelation - optimized to reduce computation
            // We only need to compute from minLag to maxSearchLag to find guitar/instrument frequencies
            const minLag = Math.floor(sampleRate / 1500); // ~1500Hz max
            const maxSearchLag = Math.ceil(sampleRate / 65); // ~65Hz min - typical for guitars/instruments
            
            // Process in chunks for better performance
            for (let lag = 0; lag < maxSearchLag && lag < bufferSize; lag++) {
                let sumCorr = 0;
                // Only compute every other sample for efficiency on longer lags
                const step = lag > 240 ? 2 : 1; 
                const samples = Math.floor((bufferSize - lag) / step);
                for (let i = 0; i < bufferSize - lag; i += step) {
                    sumCorr += normalizedBuffer[i] * normalizedBuffer[i + lag];
                }
                correlations[lag] = sumCorr * (lag > 240 ? 2 : 1); // Compensate for the step
            }
            
            // Enhanced peak finding with robust peak validation
            let foundZeroCrossing = false;
            let maxCorrelation = -1;
            let maxLag = -1;
            let secondPeakValue = -1;
            let secondPeakLag = -1;
            
            // First, normalize the correlation values for better comparison
            const normalizeFactor = correlations[0] || 1;
            
            // Find multiple peaks to verify the fundamental frequency
            const peaks = [];
            
            for (let lag = minLag; lag < Math.min(maxSearchLag, bufferSize - 1); lag++) {
                // Look for zero crossing with hysteresis for better stability
                if (!foundZeroCrossing && correlations[lag] <= 0 && correlations[lag + 1] > 0) {
                    foundZeroCrossing = true;
                }
                
                // After zero crossing, look for peaks
                if (foundZeroCrossing) {
                    // Detect if this is a peak (higher than neighbors)
                    if (lag > minLag + 1 && lag < maxSearchLag - 1 &&
                        correlations[lag] > correlations[lag - 1] &&
                        correlations[lag] >= correlations[lag + 1]) {
                        
                        const peakValue = correlations[lag] / normalizeFactor;
                        
                        // Only consider significant peaks
                        if (peakValue > 0.1) {  
                            peaks.push({ lag, value: peakValue });
                            
                            // Keep track of highest peak
                            if (peakValue > maxCorrelation) {
                                secondPeakValue = maxCorrelation;
                                secondPeakLag = maxLag;
                                maxCorrelation = peakValue;
                                maxLag = lag;
                            } else if (peakValue > secondPeakValue) {
                                secondPeakValue = peakValue;
                                secondPeakLag = lag;
                            }
                        }
                    }
                }
            }
            
            // If we have target frequencies, check if any peaks match those frequencies
            if (targetFrequencies.length > 0 && peaks.length > 0) {
                let bestMatch = null;
                let bestMatchDiff = Infinity;
                
                for (const peak of peaks) {
                    const peakFreq = sampleRate / peak.lag;
                    
                    for (const targetFreq of targetFrequencies) {
                        // Check if this peak is close to a target frequency
                        // Allow for octave errors by checking multiples
                        for (let multiple = 0.5; multiple <= 2; multiple += 0.5) {
                            const adjustedTarget = targetFreq * multiple;
                            const diff = Math.abs(peakFreq - adjustedTarget) / adjustedTarget;
                            
                            if (diff < bestMatchDiff && diff < 0.05) { // Within 5% of target
                                bestMatch = peak;
                                bestMatchDiff = diff;
                            }
                        }
                    }
                }
                
                // If we found a good match to a target frequency, use it
                if (bestMatch && bestMatch.value > 0.2) {
                    maxLag = bestMatch.lag;
                    maxCorrelation = bestMatch.value;
                }
            }
            
            // Enhanced validation: check if peaks are harmonically related
            if (secondPeakLag > 0 && maxLag > 0) {
                // If second peak is approximately double the frequency (half the lag)
                // then it's likely the fundamental is actually the lower one
                const ratio = maxLag / secondPeakLag;
                if (Math.abs(ratio - 2) < 0.2 && secondPeakValue > maxCorrelation * 0.7) {
                    // Second peak is likely the actual fundamental
                    maxLag = secondPeakLag;
                    maxCorrelation = secondPeakValue;
                }
            }
            
            // If we found a valid peak, calculate frequency with enhanced precision
            if (maxLag > 0 && maxCorrelation > 0.15) {  // Higher threshold for clean detection
                // Improve precision with parabolic interpolation
                const y1 = correlations[maxLag - 1] / normalizeFactor;
                const y2 = correlations[maxLag] / normalizeFactor;
                const y3 = correlations[maxLag + 1] / normalizeFactor;
                
                const a = (y1 + y3 - 2 * y2) / 2;
                const b = (y3 - y1) / 2;
                
                if (a < 0) {  // Make sure it's a peak, not a valley
                    const peakLag = maxLag - b / (2 * a);
                    return sampleRate / peakLag;
                } else {
                    return sampleRate / maxLag;
                }
            }
            
            return -1; // No valid peak found
        };
        
        // Check if the signal is strong enough with enhanced RMS evaluation
        const rms = getRMS(buffer);
        if (rms < 0.005) return -1; // Reduced threshold for better sensitivity
        
        // Apply advanced windowing to reduce edge effects and improve frequency resolution
        const windowedBuffer = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            // Blackman-Harris window - better side lobe suppression than Hann
            const window = 0.35875 - 
                           0.48829 * Math.cos(2 * Math.PI * i / (buffer.length - 1)) + 
                           0.14128 * Math.cos(4 * Math.PI * i / (buffer.length - 1)) - 
                           0.01168 * Math.cos(6 * Math.PI * i / (buffer.length - 1));
            windowedBuffer[i] = buffer[i] * window;
        }
        
        // Get the frequency using enhanced autocorrelation
        const detectedFreq = autoCorrelateBuffer(windowedBuffer, sampleRate);
        
        // Verify the detected frequency is within a reasonable range for musical instruments
        if (detectedFreq > 60 && detectedFreq < 1500) {
            return detectedFreq;
        }
        
        return -1; // Out of expected range
    };
    
    // Add periodic health checks when listening is active
    useEffect(() => {
        if (!isListening || !workletNodeRef.current || !workletNodeRef.current.port) {
            return;
        }
        
        // Set up periodic health checks to ensure the AudioWorklet is responsive
        const healthCheckInterval = setInterval(() => {
            try {
                // Send a ping to verify worklet is responsive
                workletNodeRef.current.port.postMessage({ 
                    type: 'ping', 
                    timestamp: Date.now() 
                });
                
                // Check if we've had signal updates recently
                const timeSinceLastSignal = Date.now() - lastSignalUpdateRef.current;
                if (lastSignalUpdateRef.current > 0 && timeSinceLastSignal > 3000) {
                    console.warn(`No signal updates for ${timeSinceLastSignal}ms, worklet may be stalled`);
                    
                    // If signal updates have stalled, try to reset the worklet state
                    workletNodeRef.current.port.postMessage({ 
                        type: 'reset', 
                        message: 'Resetting due to stalled signals' 
                    });
                    
                    // Update the debug UI to show this issue
                    setDebugState(prevState => ({
                        ...prevState,
                        worklet: {
                            ...prevState.worklet,
                            lastMessage: {
                                type: 'stalled',
                                timestamp: Date.now(),
                                timeSinceLastSignal
                            }
                        }
                    }));
                }
            } catch (err) {
                console.error("Health check failed:", err);
            }
        }, 2500); // Check every 2.5 seconds
        
        return () => {
            clearInterval(healthCheckInterval);
        };
    }, [isListening]);
    
    // Enhanced note finding with historical data for stability
    const findClosestNote = (frequency) => {
        // Use a window of recent frequencies for stability (maintained in component scope)
        if (!window.recentFreqs) window.recentFreqs = [];
        window.recentFreqs.push(frequency);
        
        // Keep a sliding window of the last 5 frequencies for smoothing
        if (window.recentFreqs.length > 5) {
            window.recentFreqs.shift();
        }
        
        // If we have enough data, filter out outliers and average
        let stableFrequency = frequency;
        if (window.recentFreqs.length >= 3) {
            // Sort frequencies to find median
            const sortedFreqs = [...window.recentFreqs].sort((a, b) => a - b);
            const median = sortedFreqs[Math.floor(sortedFreqs.length / 2)];
            
            // Filter out any values that are too far from median (likely glitches)
            const validFreqs = window.recentFreqs.filter(f => 
                Math.abs(f - median) / median < 0.1 // Within 10% of median
            );
            
            // Use the average of valid frequencies for more stability
            if (validFreqs.length >= 2) {
                stableFrequency = validFreqs.reduce((sum, f) => sum + f, 0) / validFreqs.length;
            } else {
                stableFrequency = median; // If not enough valid values, use median
            }
        }
        
        // A4 is 440Hz, and there are 12 semitones in an octave
        // Each semitone is a factor of 2^(1/12) in frequency
        const A4 = 440.0;
        const semitone = Math.log2(stableFrequency / A4) * 12;
        
        // Round to nearest semitone
        const roundedSemitone = Math.round(semitone);
        
        // Calculate the cents deviation (precise to 1 decimal place)
        const cents = Math.round((semitone - roundedSemitone) * 100 * 10) / 10;
        
        // Calculate note index (A is at index 9)
        let noteIndex = (roundedSemitone + 9) % 12;
        if (noteIndex < 0) noteIndex += 12;
        
        // Calculate octave
        const octave = Math.floor((roundedSemitone + 9) / 12) + 4;
        
        // Return the note name with octave and cents deviation
        const noteName = noteNames[noteIndex];
        
        // Store recent notes to prevent oscillation between adjacent notes
        if (!window.recentNotes) window.recentNotes = [];
        const thisNote = `${noteName}${octave}`;
        window.recentNotes.push(thisNote);
        if (window.recentNotes.length > 8) window.recentNotes.shift();
        
        // If we're oscillating between adjacent notes, stick with the most common one
        if (window.recentNotes.length >= 5) {
            // Count occurrences of each note
            const noteCounts = {};
            window.recentNotes.forEach(n => {
                noteCounts[n] = (noteCounts[n] || 0) + 1;
            });
            
            // Find the most common note
            let mostCommonNote = thisNote;
            let maxCount = 0;
            Object.entries(noteCounts).forEach(([note, count]) => {
                if (count > maxCount) {
                    mostCommonNote = note;
                    maxCount = count;
                }
            });
            
            // If our most common note is different from the current one, use it instead
            // but adjust the cents value accordingly
            if (mostCommonNote !== thisNote && maxCount >= 3) {
                // The detected note is probably oscillating, use the stable one
                const stableNoteName = mostCommonNote.slice(0, -1);
                const stableOctave = parseInt(mostCommonNote.slice(-1));
                
                // Find semitone difference between stable note and current frequency
                const stableNoteIndex = noteNames.indexOf(stableNoteName);
                const semitonesDiff = ((stableNoteIndex - noteIndex + 12) % 12) +
                                      (stableOctave - octave) * 12;
                
                // Adjust cents based on semitone difference
                const adjustedCents = Math.round((semitone - (roundedSemitone - semitonesDiff)) * 100);
                
                return {
                    note: mostCommonNote,
                    cents: adjustedCents
                };
            }
        }
        
        // Return the stable calculated note and cents
        return { 
            note: thisNote,
            cents: cents
        };
    };
    
    // Monitor detected note changes for debugging
    useEffect(() => {
        if (detectedNote) {
            console.log(`🔄 React state updated: Note=${detectedNote}, Freq=${detectedFrequency}Hz, Status=${tuningStatus}`);
        }
    }, [detectedNote, detectedFrequency, tuningStatus]);
    
    // AudioWorklet health check - ensures stable connection
    useEffect(() => {
        if (!isListening || !workletNodeRef.current) return;
        
        // Set up periodic ping to detect AudioWorklet health
        const pingInterval = setInterval(() => {
            if (workletNodeRef.current && workletNodeRef.current.port) {
                try {
                    // Send a ping to check if the worklet is still responsive
                    workletNodeRef.current.port.postMessage({ 
                        type: 'ping', 
                        timestamp: Date.now() 
                    });
                    
                    // Check if we haven't received signal updates in a while
                    const now = Date.now();
                    const lastSignal = lastSignalUpdateRef.current || 0;
                    if (lastSignal && (now - lastSignal > 2000)) {
                        console.log("⚠️ No signal updates received in the last 2 seconds");
                        // Force signal level update to ensure UI remains responsive
                        setSignalStrength(prev => Math.max(0, prev - 10)); // Gradually reduce
                    }
                } catch (err) {
                    console.error("❌ Error communicating with AudioWorklet:", err);
                    workletReadyRef.current = false;
                }
            }
        }, 3000); // Check every 3 seconds
        
        return () => {
            clearInterval(pingInterval);
        };
    }, [isListening]);
    
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
                                                className={`microphone-button ${isListening ? 'active' : ''} ${micAccessDenied ? 'error' : ''} ${calibrating ? 'calibrating' : ''}`}
                                                onClick={toggleListening}
                                                title={micAccessDenied ? "Microphone access denied" : calibrating ? "Calibrating..." : isListening ? "Stop tuning" : "Start tuning"}
                                                disabled={calibrating}
                                            >
                                                {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                            </Button>
                                            {calibrating && 
                                                <div className="calibrating-indicator">
                                                    <div className="calibrating-spinner"></div>
                                                    <div className="calibrating-text">Calibrating...</div>
                                                </div>
                                            }
                                            
                                            {/* Diagnostic buttons */}
                                            <div className="diagnostic-section">
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    onClick={() => {
                                                        // Run microphone diagnostics
                                                        console.log("🔍 Running microphone diagnostics...");
                                                        
                                                        // Check audio context
                                                        if (audioContextRef.current) {
                                                            console.log(`AudioContext state: ${audioContextRef.current.state}`);
                                                            console.log(`AudioContext sample rate: ${audioContextRef.current.sampleRate}Hz`);
                                                        } else {
                                                            console.log("AudioContext not initialized");
                                                        }
                                                        
                                                        // Check mic stream
                                                        if (streamRef.current) {
                                                            const tracks = streamRef.current.getAudioTracks();
                                                            console.log(`Audio tracks: ${tracks.length}`);
                                                            tracks.forEach((track, i) => {
                                                                console.log(`Track ${i} enabled: ${track.enabled}`);
                                                                console.log(`Track ${i} muted: ${track.muted}`);
                                                                console.log(`Track ${i} settings:`, track.getSettings());
                                                            });
                                                        } else {
                                                            console.log("No active audio stream");
                                                        }
                                                        
                                                        // Check analyser
                                                        if (analyserRef.current) {
                                                            console.log(`Analyser FFT size: ${analyserRef.current.fftSize}`);
                                                            console.log(`Analyser frequency bins: ${analyserRef.current.frequencyBinCount}`);
                                                            console.log(`Analyser smoothing: ${analyserRef.current.smoothingTimeConstant}`);
                                                        } else {
                                                            console.log("Analyser not initialized");
                                                        }
                                                        
                                                        // Check AudioWorklet support
                                                        if (workletReadyRef.current) {
                                                            console.log("AudioWorklet is supported and ready to use");
                                                        } else {
                                                            console.log("AudioWorklet is not ready, attempting to diagnose...");
                                                            runAudioWorkletDiagnostics();
                                                        }
                                                        
                                                        // Alert the user
                                                        alert("Microphone diagnostic information has been logged to the console. Please open your browser's developer tools to view it (F12 or Ctrl+Shift+I).");
                                                    }}
                                                    className="diagnostic-button"
                                                    title="Run diagnostics to troubleshoot microphone issues"
                                                >
                                                    Troubleshoot Mic
                                                </Button>
                                                
                                                <Button
                                                    size="sm"
                                                    variant="outline-info"
                                                    onClick={() => {
                                                        // Run targeted display diagnostics
                                                        const message = diagnoseDisplayIssues();
                                                        
                                                        // Show debug overlay to help troubleshoot
                                                        setShowDebugInfo(true);
                                                        
                                                        // Reset the AudioWorklet to try to restore function
                                                        if (workletNodeRef.current?.port) {
                                                            workletNodeRef.current.port.postMessage({ 
                                                                type: 'reset'
                                                            });
                                                        }
                                                        
                                                        // Force a UI refresh by toggling detection flag
                                                        setNoteDetectionActive(true);
                                                        setTimeout(() => {
                                                            setNoteDetectionActive(noteDetectionActive);
                                                        }, 500);
                                                        
                                                        // Alert the user
                                                        alert("Display diagnostics complete. " + message);
                                                    }}
                                                    className="diagnostic-button ml-2"
                                                    title="Specifically diagnose display issues with the note detection"
                                                    style={{ marginLeft: '8px' }}
                                                >
                                                    Fix Display
                                                </Button>
                                            </div>
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
                                                    <span className="note-placeholder" title="No note detected yet">--</span>
                                                )}
                                                {/* Small badge to show if note detection is active */}
                                                {noteDetectionActive && !detectedNote && (
                                                    <small className="detection-active-badge">
                                                        (Detection active)
                                                    </small>
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
                                            
                                            {/* Signal Strength Meter */}
                                            <div className="signal-meter">
                                                <div className="signal-bar-container">
                                                    <div 
                                                        className="signal-bar" 
                                                        style={{ 
                                                            width: isListening ? `${signalStrength}%` : '0%',
                                                            backgroundColor: signalStrength > 80 ? '#d9534f' : 
                                                                           signalStrength > 30 ? '#5cb85c' : 
                                                                           signalStrength > 10 ? '#f0ad4e' : '#6c757d',
                                                            transition: 'width 0.3s ease, background-color 0.3s ease'
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="signal-label">
                                                    {isListening ? 
                                                        `Signal: ${signalStrength}%` : 
                                                        'Microphone inactive'}
                                                </div>
                                            </div>
                                            
                                            {/* Status Message */}
                                            <div className={`tuning-status ${tuningStatus}`}>
                                                {!isListening && <span>Press the microphone button to start</span>}
                                                {isListening && calibrating && <span>Calibrating microphone...</span>}
                                                {isListening && !calibrating && !detectedNote && signalStrength < 10 && <span>Signal too weak. Play louder...</span>}
                                                {isListening && !calibrating && !detectedNote && signalStrength >= 10 && <span>Waiting for a clear note...</span>}
                                                {isListening && !calibrating && detectedNote && tuningStatus === 'too-low' && <span>Tune higher ↑</span>}
                                                {isListening && !calibrating && detectedNote && tuningStatus === 'in-tune' && <span>In tune ✓</span>}
                                                {isListening && !calibrating && detectedNote && tuningStatus === 'too-high' && <span>Tune lower ↓</span>}
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
            
            {/* Debug overlay toggle button */}
            <Button
                variant="outline-secondary"
                size="sm"
                className="debug-toggle-button"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 1000,
                    opacity: 0.7
                }}
            >
                <FaBug /> {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
            </Button>
            
            {/* Debug overlay */}
            {showDebugInfo && (
                <TunerDebugOverlay 
                    visible={showDebugInfo}
                    onClose={() => setShowDebugInfo(false)}
                    audioState={{
                        contextReady: !!audioContextRef.current,
                        microphoneReady: !!streamRef.current,
                        sampleRate: audioContextRef.current ? audioContextRef.current.sampleRate : null
                    }}
                    signalStrength={signalStrength}
                    detectionState={{
                        detectionActive: noteDetectionActive,
                        rawLevel: rawSignalLevel,
                        note: detectedNote,
                        frequency: detectedFrequency,
                        tuningStatus: tuningStatus
                    }}
                    workletState={{
                        supported: !!window.AudioContext?.prototype?.audioWorklet,
                        ready: workletReadyRef.current,
                        lastMessage: lastWorkletMessage
                    }}
                />
            )}
        </div>
    );
}

export default TunerPage;
