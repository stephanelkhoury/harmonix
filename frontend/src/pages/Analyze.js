import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ChordDisplay from '../components/ChordDisplay';
import ControlPanel from '../components/ControlPanel';
import './style/Analyze.css';

function Analyze() {
    const location = useLocation();
    const { audioBlob } = location.state || {};
    const [chords, setChords] = useState([]);
    const [songKey, setSongKey] = useState("");
    const [tempo, setTempo] = useState(0);
    const [loading, setLoading] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");
    const audioRef = useRef(null);

    // Use environment variables or default to localhost
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
    
    useEffect(() => {
        if (audioBlob) {
            setLoading(true);
            const formData = new FormData();
            formData.append('audio', audioBlob);
            
            // Get the name of the uploaded file if available
            if (audioBlob.name) {
                setFileName(audioBlob.name);
            }

            axios.post(`${BACKEND_URL}/api/analyze-chords`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(response => {
                    setChords(response.data.chords);
                    // Set additional analysis data
                    if (response.data.key) setSongKey(response.data.key);
                    if (response.data.tempo) setTempo(response.data.tempo);
                    if (response.data.filename) setFileName(response.data.filename);
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

    const handleYoutubeAnalyze = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setChords([]);
        setSongKey("");
        setTempo(0);
        setFileName("");
        try {
            const response = await axios.post(`${BACKEND_URL}/api/analyze-youtube`, { url: youtubeUrl });
            setChords(response.data.chords);
            
            // Set additional analysis data
            if (response.data.key) setSongKey(response.data.key);
            if (response.data.tempo) setTempo(response.data.tempo);
            if (response.data.youtube_url) setFileName("YouTube: " + response.data.youtube_url);
        } catch (err) {
            setError("Failed to analyze YouTube link. Please check the URL and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="hero-section hero-image-analyze">
                <h1>Analyze Your Song</h1>
                <p>Upload an MP3 or paste a YouTube link to discover the chords played in your music!</p>
            </div>
            <div className="container">
                <form onSubmit={handleYoutubeAnalyze} style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <input
                        type="url"
                        placeholder="Paste YouTube link here"
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        style={{ width: '60%', padding: '0.5rem', fontSize: '1rem' }}
                        required
                    />
                    <button type="submit" style={{ marginLeft: '1rem', padding: '0.5rem 1.5rem', fontSize: '1rem' }}>Analyze YouTube</button>
                </form>
                {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
                <h2>Analysis Result</h2>
                {loading ? (
                    <div style={{ textAlign: 'center', margin: '2rem' }}>
                        <div className="spinner" style={{
                            margin: '2rem auto',
                            width: 60,
                            height: 60,
                            border: '6px solid #eee',
                            borderTop: '6px solid #0fa2dc',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p>Analyzing audio, please wait...</p>
                    </div>
                ) : (
                    <>
                        {(songKey || tempo > 0) && (
                            <div className="song-info">
                                {fileName && <div className="file-name"><strong>File:</strong> {fileName}</div>}
                                <div className="analysis-details">
                                    {songKey && <span className="song-key"><strong>Key:</strong> {songKey}</span>}
                                    {tempo > 0 && <span className="song-tempo"><strong>Tempo:</strong> {tempo} BPM</span>}
                                </div>
                                <div className="info-note">
                                    <span className="storage-note">Analysis saved to SongChords folder</span>
                                </div>
                            </div>
                        )}
                        <ChordDisplay chords={chords} />
                    </>
                )}
                <ControlPanel onPlay={handlePlay} onPause={handlePause} onLoop={handleLoop} />
                {audioBlob && <audio ref={audioRef} src={URL.createObjectURL(audioBlob)} controls hidden />}
            </div>
        </div>
    );
}

export default Analyze;