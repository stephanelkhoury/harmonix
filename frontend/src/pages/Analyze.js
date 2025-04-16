import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ChordDisplay from '../components/ChordDisplay';
import ControlPanel from '../components/ControlPanel';

function Analyze() {
    const location = useLocation();
    const { audioBlob } = location.state || {};
    const [chords, setChords] = useState([]);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioBlob) {
            setLoading(true);
            const formData = new FormData();
            formData.append('audio', audioBlob);

            axios.post('http://localhost:5000/api/analyze-chords', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(response => {
                    setChords(response.data.chords);
                })
                .catch(err => {
                    console.error('Error analyzing audio:', err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [audioBlob]);

    const handlePlay = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    const handlePause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const handleLoop = () => {
        if (audioRef.current) {
            audioRef.current.loop = !audioRef.current.loop;
        }
    };

    return (
        <div>
            <h1>Analysis Result</h1>
            {loading ? <p>Analyzing audio, please wait...</p> : <ChordDisplay chords={chords} />}
            <ControlPanel onPlay={handlePlay} onPause={handlePause} onLoop={handleLoop} />
            {audioBlob && <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} controls hidden />}
        </div>
    );
}

export default Analyze;