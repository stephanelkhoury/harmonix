import React, { useState, useRef, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    InputGroup,
    Nav,
    Dropdown,
    Spinner
} from 'react-bootstrap';
import {
    FaYoutube,
    FaFileUpload,
    FaMusic,
    FaLanguage,
    FaGlobe
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style/LyricsIdentifier.css';
import axios from 'axios';

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
        if (!lyrics || lyrics.length === 0) {
            return (
                <div className="no-lyrics">
                    {loading ? (
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    ) : (
                        <p>No lyrics available. Upload an audio file or enter a YouTube URL to get started.</p>
                    )}
                </div>
            );
        }

        return (
            <div 
                className={`lyrics-container ${isRTL(autoDetectedLanguage || selectedLanguage) ? 'rtl' : 'ltr'}`}
                ref={lyricsDisplayRef}
            >
                {lyrics.map((lyric, index) => (
                    <div 
                        key={index}
                        className={`lyric-line ${currentLyricIndex === index ? 'active' : ''}`}
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.currentTime = lyric.startTime;
                            }
                        }}
                    >
                        <span className="timestamp">{formatTime(lyric.startTime)}</span>
                        <span className="text">{lyric.text}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Container className="lyrics-identifier-container">
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                            <Nav variant="tabs" className="mb-3">
                                <Nav.Item>
                                    <Nav.Link 
                                        active={activeTab === "youtube"}
                                        onClick={() => handleTabChange("youtube")}
                                    >
                                        <FaYoutube /> YouTube
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        active={activeTab === "upload"}
                                        onClick={() => handleTabChange("upload")}
                                    >
                                        <FaFileUpload /> Upload File
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            {activeTab === "youtube" ? (
                                <div className="youtube-section">
                                    <InputGroup className="mb-3">
                                        <Form.Control
                                            placeholder="Enter YouTube URL"
                                            value={youtubeUrl}
                                            onChange={handleYoutubeUrlChange}
                                        />
                                        <Button 
                                            variant="primary"
                                            onClick={analyzeLyricsFromYoutube}
                                            disabled={loading || !youtubeUrl}
                                        >
                                            {loading ? (
                                                <Spinner animation="border" size="sm" />
                                            ) : (
                                                "Analyze"
                                            )}
                                        </Button>
                                    </InputGroup>

                                    {showYoutubePlayer && youtubeVideoId && (
                                        <div className="youtube-embed-container mb-3">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                                title="YouTube video player"
                                                width="100%"
                                                height="360"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div 
                                    className="upload-section"
                                    ref={dropZoneRef}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="upload-zone">
                                        <FaMusic className="upload-icon" />
                                        <p>Drag & drop an audio file here or click to select</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="audio/*"
                                            style={{ display: 'none' }}
                                        />
                                        <Button 
                                            variant="outline-primary"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={loading}
                                        >
                                            Select File
                                        </Button>
                                    </div>

                                    {fileName && (
                                        <div className="file-info">
                                            <strong>Selected file:</strong> {fileName}
                                        </div>
                                    )}

                                    {uploadedFile && (
                                        <audio
                                            ref={audioRef}
                                            controls
                                            className="audio-player"
                                        >
                                            <source 
                                                src={URL.createObjectURL(uploadedFile)}
                                                type={uploadedFile.type}
                                            />
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                </div>
                            )}

                            <div className="language-selector">
                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-secondary">
                                        <FaLanguage /> {getLanguageDisplayName(selectedLanguage)}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {["auto", "english", "arabic", "french"].map(lang => (
                                            <Dropdown.Item
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                active={selectedLanguage === lang}
                                            >
                                                {getLanguageDisplayName(lang)}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>

                                {autoDetectedLanguage && selectedLanguage === "auto" && (
                                    <div className="detected-language">
                                        <FaGlobe /> Detected: {getLanguageDisplayName(autoDetectedLanguage)}
                                    </div>
                                )}
                            </div>

                            {renderLyrics()}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default LyricsIdentifier;