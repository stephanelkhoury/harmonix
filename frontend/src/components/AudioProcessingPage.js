import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import WaveSurfer from 'wavesurfer.js';

// Use environment variables or default to localhost
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

function AudioProcessingPage() {
    const [chords, setChords] = useState([]);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const socket = io(BACKEND_URL);

    useEffect(() => {
        socket.on('chords-update', (updatedChords) => {
            setChords(updatedChords);
        });

        return () => {
            socket.disconnect();
        };
    }, [socket]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                socket.emit('audio-stream', event.data);
            }
        };

        recorder.start(100); // Send audio chunks every 100ms
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorder.stop();
        setRecording(false);
    };

    return (
        <div>
            <h1>Audio Processing</h1>
            <p>Stream audio for real-time chord analysis.</p>
            <button onClick={recording ? stopRecording : startRecording}>
                {recording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <div>
                <h2>Recognized Chords:</h2>
                <ul>
                    {chords.map((chord, index) => (
                        <li key={index}>{chord}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default AudioProcessingPage;
