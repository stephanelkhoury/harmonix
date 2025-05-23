import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Nav, Button, Form, InputGroup, Dropdown, ProgressBar, Spinner } from 'react-bootstrap';
import { FaYoutube, FaMusic, FaFileUpload, FaPlay, FaPause, FaRedo, FaLanguage, FaGlobe, FaTimes } from 'react-icons/fa';
import YoutubePlayer from '../components/YoutubePlayer';
import './style/LyricsIdentifier.css';

function LyricsIdentifier() {
    const [lyrics, setLyrics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");
    const [activeTab, setActiveTab] = useState("youtube"); // "youtube" or "upload"
    const [uploadedFile, setUploadedFile] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [youtubeVideoId, setYoutubeVideoId] = useState("");
    const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [selectedLanguage, setSelectedLanguage] = useState("auto"); // "auto", "english", "arabic", "french"
    const [autoDetectedLanguage, setAutoDetectedLanguage] = useState("");
    const audioRef = useRef(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);
    const lyricsDisplayRef = useRef(null);

    // Use environment variables or default to localhost
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

    // Handle YouTube URL input change
    const handleYoutubeUrlChange = (e) => {
        setYoutubeUrl(e.target.value);
        setError("");
    };

    // Extract YouTube video ID from URL
    const extractYoutubeId = (url) => {
        if (!url) {
            console.error("No YouTube URL provided");
            return null;
        }
        
        const trimmedUrl = url.trim();
        console.log("Extracting YouTube ID from:", trimmedUrl);
        
        // Handle various YouTube URL formats
        const regExps = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
            /(?:youtube\.com\/|youtu\.be\/)([^"&?\/\s]{11})/i
        ];

        for (const regex of regExps) {
            const match = trimmedUrl.match(regex);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    };

    // Analyze lyrics from YouTube URL
    const analyzeLyricsFromYoutube = () => {
        if (!youtubeUrl) {
            setError("Please enter a valid YouTube URL");
            return;
        }

        const videoId = extractYoutubeId(youtubeUrl);
        if (!videoId) {
            setError("Could not extract YouTube video ID from the URL. Please check the URL and try again.");
            return;
        }

        setLoading(true);
        setError("");
        setYoutubeVideoId(videoId);
        setShowYoutubePlayer(true);

        // API call to analyze lyrics from YouTube URL
        axios.post(`${BACKEND_URL}/api/analyze-lyrics`, {
            youtubeUrl: youtubeUrl,
            language: selectedLanguage
        }, {
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (response.data.error) {
                setError(response.data.error);
                return;
            }
            
            setLyrics(response.data.lyrics || []);
            
            if (response.data.detectedLanguage) {
                setAutoDetectedLanguage(response.data.detectedLanguage);
            }
            
            if (response.data.title) {
                setFileName(response.data.title);
            }
        })
        .catch(err => {
            console.error('Error analyzing lyrics from YouTube:', err);
            setError("Failed to analyze lyrics from YouTube. Please check the URL and try again.");
        })
        .finally(() => {
            setLoading(false);
        });
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (!file) {
            setError("No file selected");
            return;
        }

        const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'];
        if (!allowedTypes.includes(file.type)) {
            setError(`File type ${file.type} is not supported. Please upload an MP3, WAV, or M4A file.`);
            return;
        }

        setLoading(true);
        setError("");
        setFileName(file.name);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', selectedLanguage);

        // API call to analyze lyrics from uploaded file
        axios.post(`${BACKEND_URL}/api/analyze-lyrics`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then(response => {
            if (response.data.error) {
                setError(response.data.error);
                return;
            }
            
            setLyrics(response.data.lyrics || []);
            
            if (response.data.detectedLanguage) {
                setAutoDetectedLanguage(response.data.detectedLanguage);
            }
            
            // Create an audio URL for the uploaded file
            const audioUrl = URL.createObjectURL(file);
            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.load();
            }
        })
        .catch(err => {
            console.error('Error analyzing lyrics from file:', err);
            setError("Failed to analyze lyrics from the audio file. Please try again.");
        })
        .finally(() => {
            setLoading(false);
        });
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
            handleFileUpload(file);
        }
    };

    // Handle drop zone dragover
    const handleDragOver = (e) => {
        e.preventDefault();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.add('dragover');
        }
    };

    // Handle drop zone dragleave
    const handleDragLeave = (e) => {
        e.preventDefault();
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove('dragover');
        }
    };

    // Handle drop zone drop
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

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setError("");
        // Reset YouTube player when switching tabs
        if (tab === "upload") {
            setShowYoutubePlayer(false);
            setYoutubeVideoId("");
        }
    };

    // Handle play/pause
    const togglePlay = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Handle progress bar click for seeking
    const handleSeek = (e) => {
        if (!audioRef.current || !duration) return;
        
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const seekTime = (x / progressBar.offsetWidth) * duration;
        
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    // Handle language change
    const handleLanguageChange = (language) => {
        setSelectedLanguage(language);
        // If we already have lyrics, re-analyze with the new language
        if (activeTab === "youtube" && youtubeUrl) {
            analyzeLyricsFromYoutube();
        } else if (activeTab === "upload" && uploadedFile) {
            handleFileUpload(uploadedFile);
        }
    };

    // Format time (seconds) to MM:SS
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle timeupdate event to sync lyrics with audio playback
    useEffect(() => {
        if (audioRef.current) {
            // Apply playback rate when it changes
            audioRef.current.playbackRate = playbackRate;
            
            const handleTimeUpdate = () => {
                const currentTime = audioRef.current.currentTime;
                setCurrentTime(currentTime);
                
                // Find the current lyric based on time
                if (lyrics && lyrics.length > 0) {
                    const timeBasedLyrics = lyrics.filter(lyric => 
                        typeof lyric === 'object' && lyric.startTime !== undefined);
                        
                    if (timeBasedLyrics.length > 0) {
                        // Find the current lyric index
                        for (let i = timeBasedLyrics.length - 1; i >= 0; i--) {
                            if (currentTime >= timeBasedLyrics[i].startTime) {
                                setCurrentLyricIndex(i);
                                // Scroll the active lyric into view
                                if (lyricsDisplayRef.current) {
                                    const activeElement = lyricsDisplayRef.current.querySelector('.active-line');
                                    if (activeElement) {
                                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            };
            
            audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current.addEventListener('durationchange', () => {
                setDuration(audioRef.current.duration);
            });
            audioRef.current.addEventListener('play', () => setIsPlaying(true));
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
            
            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                    audioRef.current.removeEventListener('durationchange', () => {});
                    audioRef.current.removeEventListener('play', () => {});
                    audioRef.current.removeEventListener('pause', () => {});
                }
            };
        }
    }, [lyrics, playbackRate]);

    // Determine if the text is RTL based on the language
    const isRTL = (language) => {
        return language === "arabic";
    };

    // Get the display name for the current language
    const getLanguageDisplayName = (code) => {
        const languages = {
            "auto": "Auto Detect",
            "english": "English",
            "arabic": "العربية (Arabic)",
            "french": "Français (French)"
        };
        return languages[code] || code;
    };

    // Convert Lyrics array to displayable format
    const renderLyrics = () => {
        if (!lyrics || !lyrics.length) return null;
        
        const detectedLang = autoDetectedLanguage || selectedLanguage;
        const rtlClass = isRTL(detectedLang) ? "rtl-text" : "";
        
        return (
            <div className={`lyrics-display ${rtlClass}`} ref={lyricsDisplayRef}>
                {lyrics.map((line, index) => {
                    // Each line might be an object with text and timing info, or just a string
                    const text = typeof line === 'object' ? line.text : line;
                    const isActive = index === currentLyricIndex;
                    return (
                        <div 
                            key={index} 
                            className={isActive ? "active-line" : ""}
                        >
                            {text}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="lyrics-identifier">
            <Container>
                <Row className="justify-content-center">
                    <Col md={10}>
                        <h2 className="text-center mb-4">Lyrics Identifier</h2>
                        <p className="text-center text-muted mb-5">Extract and display lyrics from YouTube videos or audio files with our AI-powered lyrics identifier.</p>
                        
                        {/* Tab Selector */}
                        <Nav className="tab-selector justify-content-center" variant="pills">
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === "youtube"} 
                                    onClick={() => handleTabChange("youtube")}
                                >
                                    <FaYoutube className="me-2" /> YouTube URL
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link 
                                    active={activeTab === "upload"} 
                                    onClick={() => handleTabChange("upload")}
                                >
                                    <FaMusic className="me-2" /> Upload Audio
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                        
                        {/* Language Selector */}
                        <Row className="mb-4">
                            <Col md={4} className="mx-auto">
                                <div className="language-selector">
                                    <Dropdown>
                                        <Dropdown.Toggle variant="light">
                                            <FaLanguage className="me-2" /> {getLanguageDisplayName(selectedLanguage)}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Dropdown.Item 
                                                active={selectedLanguage === "auto"}
                                                onClick={() => handleLanguageChange("auto")}
                                            >
                                                <FaGlobe className="me-2" /> Auto Detect
                                            </Dropdown.Item>
                                            <Dropdown.Item 
                                                active={selectedLanguage === "english"}
                                                onClick={() => handleLanguageChange("english")}
                                            >
                                                🇺🇸 English
                                            </Dropdown.Item>
                                            <Dropdown.Item 
                                                active={selectedLanguage === "arabic"}
                                                onClick={() => handleLanguageChange("arabic")}
                                            >
                                                🇸🇦 العربية (Arabic)
                                            </Dropdown.Item>
                                            <Dropdown.Item 
                                                active={selectedLanguage === "french"}
                                                onClick={() => handleLanguageChange("french")}
                                            >
                                                🇫🇷 Français (French)
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </Col>
                        </Row>
                        
                        <Card>
                            <Card.Header>
                                {activeTab === "youtube" ? "Analyze Lyrics from YouTube" : "Upload Audio File"}
                            </Card.Header>
                            <Card.Body>
                                {/* YouTube URL Input */}
                                {activeTab === "youtube" && (
                                    <div className="youtube-input-wrapper">
                                        <InputGroup>
                                            <InputGroup.Prepend>
                                                <InputGroup.Text id="youtube-addon">
                                                    <FaYoutube />
                                                </InputGroup.Text>
                                            </InputGroup.Prepend>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                                                value={youtubeUrl}
                                                onChange={handleYoutubeUrlChange}
                                                aria-label="YouTube URL"
                                                aria-describedby="youtube-addon"
                                            />
                                            <Button 
                                                variant="primary" 
                                                className="btn-analyze"
                                                onClick={analyzeLyricsFromYoutube}
                                                disabled={loading || !youtubeUrl}
                                            >
                                                {loading ? <Spinner animation="border" size="sm" /> : "Analyze Lyrics"}
                                            </Button>
                                        </InputGroup>
                                    </div>
                                )}
                                
                                {/* File Upload Input */}
                                {activeTab === "upload" && (
                                    <div 
                                        className="file-upload-area"
                                        ref={dropZoneRef}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <FaFileUpload className="upload-icon" />
                                        <h5>Drag & Drop your audio file here</h5>
                                        <p>or</p>
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={loading}
                                        >
                                            Browse Files
                                        </Button>
                                        <p className="mt-3 mb-0">
                                            <small className="file-types">MP3, WAV, M4A formats supported</small>
                                        </p>
                                        <input 
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".mp3,.wav,.m4a"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                )}
                                
                                {/* Error Display */}
                                {error && (
                                    <div className="error-container">
                                        <FaTimes className="error-icon" />
                                        <h4>Oops!</h4>
                                        <p>{error}</p>
                                    </div>
                                )}
                                
                                {/* Loading State */}
                                {loading && (
                                    <div className="loading-container">
                                        <Spinner animation="border" role="status" />
                                        <h4>Analyzing Lyrics...</h4>
                                        <p>This may take a few moments as our AI processes the audio.</p>
                                    </div>
                                )}
                                
                                {/* YouTube Player */}
                                {activeTab === "youtube" && showYoutubePlayer && youtubeVideoId && (
                                    <div className="mt-4">
                                        <YoutubePlayer 
                                            videoId={youtubeVideoId} 
                                            height="360" 
                                        />
                                    </div>
                                )}
                                
                                {/* Audio Player for Uploaded Files */}
                                {activeTab === "upload" && uploadedFile && (
                                    <audio 
                                        ref={audioRef} 
                                        controls 
                                        className="d-none"
                                    >
                                        Your browser does not support the audio element.
                                    </audio>
                                )}
                                
                                {/* Lyrics Display */}
                                {!loading && lyrics && lyrics.length > 0 && (
                                    <div className="lyrics-display-container">
                                        <h3>Lyrics</h3>
                                        <div className="subtitle">
                                            <FaMusic className="me-2" /> 
                                            {fileName || "Unknown Song"}
                                            {autoDetectedLanguage && selectedLanguage === "auto" && (
                                                <span className="ms-2 badge bg-info">
                                                    <FaLanguage className="me-1" />
                                                    {getLanguageDisplayName(autoDetectedLanguage)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Lyrics Content */}
                                        {renderLyrics()}
                                        
                                        {/* Audio Controls for Uploaded Files */}
                                        {activeTab === "upload" && uploadedFile && (
                                            <div className="audio-controls">
                                                <Button 
                                                    variant="primary" 
                                                    onClick={togglePlay}
                                                >
                                                    {isPlaying ? <FaPause /> : <FaPlay />}
                                                </Button>
                                                
                                                <div className="time-display">
                                                    {formatTime(currentTime)}
                                                </div>
                                                
                                                <div 
                                                    className="progress" 
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={handleSeek}
                                                >
                                                    <div 
                                                        className="progress-bar" 
                                                        role="progressbar" 
                                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                                        aria-valuenow={(currentTime / duration) * 100}
                                                        aria-valuemin="0" 
                                                        aria-valuemax="100"
                                                    />
                                                </div>
                                                
                                                <div className="time-display">
                                                    {formatTime(duration)}
                                                </div>
                                                
                                                <Dropdown>
                                                    <Dropdown.Toggle variant="outline-secondary" id="playback-speed">
                                                        {playbackRate}x
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                                                            <Dropdown.Item 
                                                                key={rate} 
                                                                onClick={() => setPlaybackRate(rate)}
                                                                active={playbackRate === rate}
                                                            >
                                                                {rate}x
                                                            </Dropdown.Item>
                                                        ))}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default LyricsIdentifier;