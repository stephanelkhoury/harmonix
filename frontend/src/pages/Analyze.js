import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaYoutube, FaMusic, FaFileDownload, FaPlay, FaPause, FaRedo } from 'react-icons/fa';
import ChordDisplay from '../components/ChordDisplay';
import ControlPanel from '../components/ControlPanel';
import SimpleYoutubePlayer from '../components/SimpleYoutubePlayer';
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
    const [activeTab, setActiveTab] = useState("youtube"); // "youtube" or "upload"
    const [uploadedFile, setUploadedFile] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentChordIndex, setCurrentChordIndex] = useState(-1);
    const [transposedKey, setTransposedKey] = useState("");
    const [transpositionValue, setTranspositionValue] = useState(0);
    const [downloadURL, setDownloadURL] = useState("");
    const [youtubeVideoId, setYoutubeVideoId] = useState("");
    const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [displayMode, setDisplayMode] = useState('timeline'); // 'timeline' or 'chordify'
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Use environment variables or default to localhost
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
    
    // Process incoming audio from navigation
    useEffect(() => {
        if (audioBlob) {
            setLoading(true);
            setActiveTab("upload");
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
                    if (response.data.key) {
                        setSongKey(response.data.key);
                        setTransposedKey(response.data.key); // Initialize transposed key
                    }
                    if (response.data.tempo) setTempo(response.data.tempo);
                    if (response.data.filename) setFileName(response.data.filename);
                    
                    // Create downloadable JSON
                    const jsonData = JSON.stringify(response.data, null, 2);
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    setDownloadURL(url);
                })
                .catch(err => {
                    console.error('Error analyzing audio:', err);
                    setError("Failed to analyze audio. Please try again.");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [audioBlob, BACKEND_URL]);
    
    // Handle timeupdate event to sync chords with audio playback
    useEffect(() => {
        if (audioRef.current) {
            // Apply playback rate when it changes
            audioRef.current.playbackRate = playbackRate;
            
            const handleTimeUpdate = () => {
                const currentTime = audioRef.current.currentTime;
                setCurrentTime(currentTime);
                
                // Find the current chord based on time
                if (chords && chords.length > 0) {
                    const timeBasedChords = chords.filter(chord => typeof chord !== 'string' && chord.time !== undefined);
                    if (timeBasedChords.length > 0) {
                        // Find the current chord index
                        for (let i = timeBasedChords.length - 1; i >= 0; i--) {
                            if (currentTime >= timeBasedChords[i].time) {
                                setCurrentChordIndex(i);
                                break;
                            }
                        }
                    }
                }
            };
            
            const handleDurationChange = () => {
                setDuration(audioRef.current.duration);
            };
            
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('durationchange', handleDurationChange);
            audioRef.current.addEventListener('play', () => setIsPlaying(true));
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
            audioRef.current.addEventListener('ended', () => setIsPlaying(false));
            
            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                    audioRef.current.removeEventListener('durationchange', handleDurationChange);
                    audioRef.current.removeEventListener('play', () => setIsPlaying(true));
                    audioRef.current.removeEventListener('pause', () => setIsPlaying(false));
                    audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
                }
            };
        }
    }, [chords]);

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
    
    const handlePreviousChord = () => {
        if (chords && chords.length > 0) {
            const timeBasedChords = chords.filter(chord => typeof chord !== 'string' && chord.time !== undefined);
            if (timeBasedChords.length > 0) {
                // Find the previous chord
                let prevIndex = currentChordIndex - 1;
                if (prevIndex < 0) prevIndex = 0;
                
                // Set audio time to the previous chord's time
                if (audioRef.current && timeBasedChords[prevIndex]) {
                    audioRef.current.currentTime = timeBasedChords[prevIndex].time;
                    setCurrentChordIndex(prevIndex);
                }
            }
        }
    };
    
    const handleNextChord = () => {
        if (chords && chords.length > 0) {
            const timeBasedChords = chords.filter(chord => typeof chord !== 'string' && chord.time !== undefined);
            if (timeBasedChords.length > 0) {
                // Find the next chord
                let nextIndex = currentChordIndex + 1;
                if (nextIndex >= timeBasedChords.length) nextIndex = timeBasedChords.length - 1;
                
                // Set audio time to the next chord's time
                if (audioRef.current && timeBasedChords[nextIndex]) {
                    audioRef.current.currentTime = timeBasedChords[nextIndex].time;
                    setCurrentChordIndex(nextIndex);
                }
            }
        }
    };
    
    const handleFileUploadClick = () => {
        fileInputRef.current.click();
    };
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
            setFileName(file.name);
            handleFileUpload(file);
        }
    };
    
    const handleFileUpload = (file) => {
        setLoading(true);
        setError("");
        setChords([]);
        setSongKey("");
        setTransposedKey("");
        setTempo(0);
        
        const formData = new FormData();
        formData.append('audio', file);
        
        axios.post(`${BACKEND_URL}/api/analyze-chords`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
            .then(response => {
                setChords(response.data.chords);
                if (response.data.key) {
                    setSongKey(response.data.key);
                    setTransposedKey(response.data.key);
                }
                if (response.data.tempo) setTempo(response.data.tempo);
                
                // Create JSON download
                const jsonData = JSON.stringify(response.data, null, 2);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                setDownloadURL(url);
                
                // Create audio URL for playback
                const audioURL = URL.createObjectURL(file);
                if (audioRef.current) {
                    audioRef.current.src = audioURL;
                }
            })
            .catch(err => {
                console.error('Error analyzing audio:', err);
                setError("Failed to analyze audio file. Please check the file format and try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.add('dragover');
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove('dragover');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove('dragover');
        }
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            setUploadedFile(file);
            setFileName(file.name);
            handleFileUpload(file);
        }
    };

    // Extract YouTube video ID from URL
    const extractYoutubeId = (url) => {
        // Check if URL is provided
        if (!url) {
            console.error("No YouTube URL provided");
            return null;
        }
        
        // Trim whitespace
        const trimmedUrl = url.trim();
        
        console.log("Extracting YouTube ID from:", trimmedUrl);
        
        // Handle various YouTube URL formats
        const regExps = [
            // Standard watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
            
            // Short URLs: https://youtu.be/VIDEO_ID
            /^.*youtu\.be\/([^#&?]*).*/,
            
            // Embed URLs: https://www.youtube.com/embed/VIDEO_ID
            /^.*youtube\.com\/embed\/([^#&?]*).*/,
            
            // Share URLs with timestamps: https://youtu.be/VIDEO_ID?t=123
            /^.*youtu\.be\/([^?]*)(\?t=\d+)?$/,
            
            // YouTube Shorts: https://youtube.com/shorts/VIDEO_ID
            /^.*youtube\.com\/shorts\/([^#&?]*).*/
        ];
        
        for (const regExp of regExps) {
            const match = trimmedUrl.match(regExp);
            if (match && (match[1]?.length === 11 || match[2]?.length === 11)) {
                const videoId = match[1] || match[2];
                console.log("Successfully extracted YouTube ID:", videoId);
                return videoId;
            }
        }
        
        // Direct video ID - if the input is exactly 11 characters, it might be a direct video ID
        if (trimmedUrl.length === 11) {
            console.log("Input appears to be a direct video ID:", trimmedUrl);
            return trimmedUrl;
        }
        
        console.error("Failed to extract YouTube video ID from:", trimmedUrl);
        return null;
    };

    const handleYoutubeAnalyze = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setChords([]);
        setSongKey("");
        setTransposedKey("");
        setTempo(0);
        setFileName("");
        setShowYoutubePlayer(false);
        
        // Validate input
        if (!youtubeUrl || youtubeUrl.trim() === '') {
            setLoading(false);
            setError("Please enter a YouTube URL");
            return;
        }
        
        // First extract video ID
        const videoId = extractYoutubeId(youtubeUrl);
        if (!videoId) {
            setLoading(false);
            setError("Invalid YouTube URL. Please enter a valid YouTube video URL. Make sure the video exists and is publicly available.");
            return;
        }
        
        // Store the video ID for the player
        setYoutubeVideoId(videoId);
        console.log("Video ID extracted:", videoId);
        
        // Try to set up the player early to check if the video exists
        // This won't actually show the player yet, just initialize it
        setShowYoutubePlayer(true);
        
        try {
            const response = await axios.post(`${BACKEND_URL}/api/analyze-youtube`, { 
                url: youtubeUrl,
                videoId: videoId // Also send the extracted video ID to backend
            });
            
            // Check if response contains an error message
            if (response.data.error) {
                console.error('YouTube analysis error:', response.data);
                setError(`Failed to analyze YouTube link: ${response.data.error}. ${response.data.details || ''}`);
                return;
            }
            
            // Only proceed if we have chords data
            if (response.data.chords && response.data.chords.length > 0) {
                setChords(response.data.chords);
                
                // Set additional analysis data
                if (response.data.key) {
                    setSongKey(response.data.key);
                    setTransposedKey(response.data.key);
                }
                if (response.data.tempo) setTempo(response.data.tempo);
                if (response.data.youtube_url) {
                    setFileName("YouTube: " + response.data.youtube_url);
                } else {
                    setFileName("YouTube: " + youtubeUrl);
                }
                
                // Enable YouTube player
                setShowYoutubePlayer(true);
                
                // Create downloadable JSON
                const jsonData = JSON.stringify(response.data, null, 2);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                setDownloadURL(url);
                
                // Create audio element if YouTube provides audio
                if (response.data.audio_url) {
                    if (audioRef.current) {
                        audioRef.current.src = response.data.audio_url;
                    }
                }
                
                // Scroll to results
                setTimeout(() => {
                    const resultsElement = document.querySelector('.analysis-results');
                    if (resultsElement) {
                        resultsElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            } else {
                setError("No chord information found in the YouTube video. The analysis might have failed.");
            }
        } catch (err) {
            console.error('YouTube analysis error:', err);
            setError("Failed to analyze YouTube link. Please check the URL and try again. The server might be experiencing issues.");
        } finally {
            setLoading(false);
        }
    };
    
    // Handle transposition
    const handleTranspose = (steps) => {
        setTranspositionValue(steps);
        
        if (!songKey) return;
        
        // Notes in chromatic scale
        const notes = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
        
        // Parse the original key
        let keyRoot = songKey.split(' ')[0]; // Get root note (e.g., "C" from "C Major")
        let keyQuality = songKey.split(' ').slice(1).join(' '); // Get quality (e.g., "Major" from "C Major")
        
        // Find index of root note
        let rootIndex = -1;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].includes(keyRoot)) {
                rootIndex = i;
                break;
            }
        }
        
        if (rootIndex === -1) return; // Invalid key
        
        // Calculate new root note index
        let newRootIndex = (rootIndex + steps) % 12;
        if (newRootIndex < 0) newRootIndex += 12;
        
        // Set new key
        const newKey = `${notes[newRootIndex].split('/')[0]} ${keyQuality}`;
        setTransposedKey(newKey);
    };
    
    // Function to transpose a single chord
    const transposeChord = (chord, steps) => {
        if (!chord || typeof chord !== 'string') return chord;
        
        const notes = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
        
        // Extract root note and the rest
        let rootNote = chord.charAt(0);
        let accidental = '';
        let startIndex = 1;
        
        if (chord.length > 1 && (chord.charAt(1) === '#' || chord.charAt(1) === 'b')) {
            accidental = chord.charAt(1);
            startIndex = 2;
        }
        
        const rootWithAccidental = rootNote + (accidental || '');
        const chordQuality = chord.substring(startIndex);
        
        // Find root note index
        let rootIndex = -1;
        for (let i = 0; i < notes.length; i++) {
            if (notes[i].includes(rootWithAccidental)) {
                rootIndex = i;
                break;
            }
        }
    
    if (rootIndex === -1) return chord; // Invalid chord
    
    // Calculate new root index
    let newRootIndex = (rootIndex + steps) % 12;
    if (newRootIndex < 0) newRootIndex += 12;
    
    // Get new root note (prefer the first notation in case of enharmonic notes)
    const newRoot = notes[newRootIndex].split('/')[0];
    
    return newRoot + chordQuality;
    };

    // Handle download of analysis results
    const handleDownloadJson = () => {
        if (downloadURL) {
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = `${fileName || 'chord-analysis'}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    // Handle playback rate changes (speed up/slow down audio)
    const handlePlaybackRateChange = (newRate) => {
        setPlaybackRate(newRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = newRate;
        }
    };

    return (
        <div className="analyze-page">
            <div className="hero-section hero-image-analyze">
                <h1>Analyze Your Song</h1>
                <p>Upload an MP3 or paste a YouTube link to discover the chords played in your music!</p>
            </div>
            
            <div className="container analyze-container">
                {/* Input Selection Tabs */}
                <div className="analyze-tabs">
                    <button 
                        className={`analyze-tab ${activeTab === 'youtube' ? 'active' : ''}`}
                        onClick={() => setActiveTab('youtube')}
                    >
                        <FaYoutube /> YouTube Link
                    </button>
                    <button 
                        className={`analyze-tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <FaMusic /> Upload Audio
                    </button>
                </div>
                
                {/* Input Forms */}
                <div className="analyze-input-container">
                    {/* YouTube Input Form */}
                    {activeTab === 'youtube' && (
                        <form onSubmit={handleYoutubeAnalyze} className="youtube-form">
                            <div className="youtube-input-group">
                                <div className="youtube-icon-container">
                                    <FaYoutube className="youtube-icon" />
                                </div>
                                <input
                                    type="url"
                                    placeholder="Paste YouTube link here"
                                    value={youtubeUrl}
                                    onChange={e => setYoutubeUrl(e.target.value)}
                                    className="youtube-input"
                                    required
                                />
                            </div>
                            <button type="submit" className="analyze-button">Analyze</button>
                            <div className="help-tip">
                                <p>Tip: After analysis, you can right-click or Ctrl+click on any chord to see detailed chord diagrams</p>
                            </div>
                        </form>
                    )}
                    
                    {/* File Upload Form */}
                    {activeTab === 'upload' && (
                        <div className="upload-container">
                            <div 
                                className="upload-dropzone" 
                                ref={dropZoneRef}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={handleFileUploadClick}
                            >
                                <FaMusic className="upload-icon" />
                                <p>Drag & drop your audio file here or click to browse</p>
                                <p className="file-formats">Supported formats: MP3, WAV, OGG, FLAC</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                accept="audio/*"
                            />
                            {uploadedFile && (
                                <div className="selected-file">
                                    <p><strong>Selected:</strong> {uploadedFile.name}</p>
                                    <button className="analyze-button" onClick={() => handleFileUpload(uploadedFile)}>
                                        Analyze
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Loading Spinner */}
                {loading && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Analyzing audio, please wait...</p>
                    </div>
                )}
                
                {/* Analysis Results */}
                {!loading && (chords.length > 0 || songKey || tempo > 0) && (
                    <div className="analysis-results">
                        <h2>Analysis Results</h2>
                        
                        {/* Song Information */}
                        <div className="song-info">
                            {fileName && <div className="file-name"><strong>File:</strong> {fileName}</div>}
                            <div className="analysis-details">
                                {songKey && (
                                    <>
                                        <span className="song-key">
                                            <strong>Original Key:</strong> {songKey}
                                        </span>
                                        {transposedKey && transposedKey !== songKey && (
                                            <span className="song-key transposed">
                                                <strong>Transposed Key:</strong> {transposedKey}
                                            </span>
                                        )}
                                    </>
                                )}
                                {tempo > 0 && <span className="song-tempo"><strong>Tempo:</strong> {tempo} BPM</span>}
                            </div>
                            
                            {/* Download & Actions */}
                            <div className="analysis-actions">
                                {downloadURL && (
                                    <a href={downloadURL} download={`${fileName || 'chord-analysis'}.json`} className="download-btn">
                                        <FaFileDownload /> Download JSON
                                    </a>
                                )}
                            </div>
                            <div className="info-note">
                                <span className="storage-note">Analysis saved to SongChords folder</span>
                            </div>
                        </div>
                        
                        {/* Transposition Controls */}
                        <div className="transposition-controls">
                            <h3>Transpose Chords:</h3>
                            <div className="transpose-buttons">
                                <button 
                                  onClick={() => handleTranspose(-6)} 
                                  className={`transpose-btn ${transpositionValue === -6 ? 'active' : ''}`}
                                >
                                  -6
                                </button>
                                <button 
                                  onClick={() => handleTranspose(-5)} 
                                  className={`transpose-btn ${transpositionValue === -5 ? 'active' : ''}`}
                                >
                                  -5
                                </button>
                                <button 
                                  onClick={() => handleTranspose(-4)} 
                                  className={`transpose-btn ${transpositionValue === -4 ? 'active' : ''}`}
                                >
                                  -4
                                </button>
                                <button 
                                  onClick={() => handleTranspose(-3)} 
                                  className={`transpose-btn ${transpositionValue === -3 ? 'active' : ''}`}
                                >
                                  -3
                                </button>
                                <button 
                                  onClick={() => handleTranspose(-2)} 
                                  className={`transpose-btn ${transpositionValue === -2 ? 'active' : ''}`}
                                >
                                  -2
                                </button>
                                <button 
                                  onClick={() => handleTranspose(-1)} 
                                  className={`transpose-btn ${transpositionValue === -1 ? 'active' : ''}`}
                                >
                                  -1
                                </button>
                                <button 
                                  onClick={() => handleTranspose(0)} 
                                  className={`transpose-btn reset ${transpositionValue === 0 ? 'active' : ''}`}
                                >
                                  Reset
                                </button>
                                <button 
                                  onClick={() => handleTranspose(1)} 
                                  className={`transpose-btn ${transpositionValue === 1 ? 'active' : ''}`}
                                >
                                  +1
                                </button>
                                <button 
                                  onClick={() => handleTranspose(2)} 
                                  className={`transpose-btn ${transpositionValue === 2 ? 'active' : ''}`}
                                >
                                  +2
                                </button>
                                <button 
                                  onClick={() => handleTranspose(3)} 
                                  className={`transpose-btn ${transpositionValue === 3 ? 'active' : ''}`}
                                >
                                  +3
                                </button>
                                <button 
                                  onClick={() => handleTranspose(4)} 
                                  className={`transpose-btn ${transpositionValue === 4 ? 'active' : ''}`}
                                >
                                  +4
                                </button>
                                <button 
                                  onClick={() => handleTranspose(5)} 
                                  className={`transpose-btn ${transpositionValue === 5 ? 'active' : ''}`}
                                >
                                  +5
                                </button>
                                <button 
                                  onClick={() => handleTranspose(6)} 
                                  className={`transpose-btn ${transpositionValue === 6 ? 'active' : ''}`}
                                >
                                  +6
                                </button>
                            </div>
                        </div>
                        
                        {/* YouTube Player (shown when analyzing YouTube videos) */}
                        {showYoutubePlayer && youtubeVideoId && (
                            <div className="youtube-player-wrapper">
                                <SimpleYoutubePlayer
                                    videoId={youtubeVideoId}
                                    onTimeUpdate={(time) => {
                                        setCurrentTime(time);
                                        // Update current chord index
                                        if (chords && chords.length > 0) {
                                            const index = chords.findIndex((chord, i) => {
                                                const nextChordTime = chords[i + 1] ? chords[i + 1].time : Infinity;
                                                return time >= chord.time && time < nextChordTime;
                                            });
                                            if (index >= 0) {
                                                setCurrentChordIndex(index);
                                            }
                                        }
                                    }}
                                />
                                {/* Chord display separate from YouTube player now */}
                                <div className="chord-display-container mt-3">
                                    <ChordDisplay 
                                        chords={chords} 
                                        currentTime={currentTime}
                                        currentChordIndex={currentChordIndex}
                                        songKey={transposedKey || songKey}
                                        tempo={tempo}
                                        duration={duration}
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Audio Player (shown when analyzing audio files) */}
                        {(audioBlob || uploadedFile) && !showYoutubePlayer && (
                            <div className="audio-player-container">
                                <audio 
                                    ref={audioRef} 
                                    controls 
                                    className="audio-player"
                                    src={audioBlob ? URL.createObjectURL(audioBlob) : null}
                                />
                                <ControlPanel 
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onLoop={handleLoop}
                                    onPrevious={handlePreviousChord}
                                    onNext={handleNextChord}
                                    onDownload={handleDownloadJson}
                                    isPlaying={isPlaying}
                                    isLooped={audioRef.current?.loop}
                                    currentTime={currentTime}
                                    duration={duration}
                                    playbackRate={playbackRate}
                                    onChangePlaybackRate={handlePlaybackRateChange}
                                />
                            </div>
                        )}
                        
                        {/* Chord Display Mode Selector */}
                        <div className="display-mode-selector">
                            <h3>Chord Progression:</h3>
                            <div className="display-mode-buttons">
                                <button 
                                    className={`display-mode-btn ${displayMode === 'timeline' ? 'active' : ''}`}
                                    onClick={() => setDisplayMode('timeline')}
                                >
                                    Timeline Mode
                                </button>
                                <button 
                                    className={`display-mode-btn ${displayMode === 'chordify' ? 'active' : ''}`}
                                    onClick={() => setDisplayMode('chordify')}
                                >
                                    Chordify Mode
                                </button>
                            </div>
                        </div>
                        
                        {/* Chord Display */}
                        <div className="chord-display-container">
                            {chords.length > 0 ? (
                                <ChordDisplay 
                                    chords={chords} 
                                    currentIndex={currentChordIndex} 
                                    transpositionValue={transpositionValue} 
                                    transposeChord={transposeChord}
                                    displayMode={displayMode}
                                />
                            ) : (
                                <p className="no-chords-message">No chords detected yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Analyze;