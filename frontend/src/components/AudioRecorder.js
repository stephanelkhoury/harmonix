import React, { useState, useEffect, useRef } from 'react';
import './style/AudioRecorder.css';

function AudioRecorder({ onAudioReady }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);
    const [visualizerData, setVisualizerData] = useState([]);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    
    // Initialize audio recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // Set up audio analyzer for visualization
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            dataArrayRef.current = dataArray;
            
            // Start animation frame for visualizer
            requestAnimationFrame(updateVisualizer);
            
            // Create media recorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioURL(audioUrl);
                
                if (onAudioReady) {
                    onAudioReady(audioBlob);
                }
                
                // Stop all tracks on the stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };
            
            // Start recording
            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
            
            // Start timer
            startTimer();
            
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please make sure you have a microphone connected and have granted permission.");
        }
    };
    
    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
        }
    };
    
    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            clearInterval(timerRef.current);
        }
    };
    
    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setRecordingTime(prevTime => prevTime + 1);
        }, 1000);
    };
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    
    const updateVisualizer = () => {
        if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            
            // Use every 8th data point to create 32 bars
            const data = Array.from(dataArrayRef.current).filter((_, i) => i % 8 === 0).slice(0, 32);
            setVisualizerData(data);
        }
        
        if (isRecording) {
            requestAnimationFrame(updateVisualizer);
        }
    };
    
    // Clean up on unmount
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);
    
    return (
        <div className="audio-recorder-container">
            {isRecording && (
                <div className="wave-visualizer">
                    <div className="wave">
                        {visualizerData.map((value, index) => (
                            <div
                                key={index}
                                className="wave-bar"
                                style={{
                                    height: `${Math.max(4, value / 2)}px`,
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            )}
            
            {isRecording && (
                <div className="timer">
                    <span className="recording-dot"></span>
                    {formatTime(recordingTime)}
                </div>
            )}
            
            <div className="record-controls">
                {!isRecording ? (
                    <button 
                        className="record-button-small" 
                        onClick={startRecording} 
                        title="Start Recording"
                    >
                        🎤
                    </button>
                ) : (
                    <>
                        {!isPaused ? (
                            <button 
                                className="record-button-small active" 
                                onClick={pauseRecording}
                                title="Pause Recording"
                            >
                                ⏸️
                            </button>
                        ) : (
                            <button 
                                className="record-button-small paused" 
                                onClick={resumeRecording}
                                title="Resume Recording"
                            >
                                ▶️
                            </button>
                        )}
                        
                        <button 
                            className="stop-button" 
                            onClick={stopRecording}
                            title="Stop Recording"
                        >
                            ⏹️
                        </button>
                    </>
                )}
            </div>
            
            {isRecording && (
                <p className="status-message">
                    {isPaused ? "Recording paused" : "Recording in progress..."}
                    <br />
                    <span className="small-text">Speak clearly into your microphone</span>
                </p>
            )}
            
            {audioURL && !isRecording && (
                <div className="audio-preview">
                    <p className="success-message">Recording completed!</p>
                    <audio src={audioURL} controls></audio>
                </div>
            )}
        </div>
    );
}

export default AudioRecorder;