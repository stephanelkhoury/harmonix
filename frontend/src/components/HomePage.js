import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import ChordVisualizer from './ChordVisualizer';
import DemoSection from './DemoSection';
import FAQSection from './FAQSection';
import ThemeSwitcher from './ThemeSwitcher';
import { setupScrollAnimations } from '../utils/scrollAnimations';
import './style/HomePage.css';

function HomePage() {
    const [audioBlob, setAudioBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [showTestimonialExpand, setShowTestimonialExpand] = useState({});
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);
    const navigate = useNavigate();

    const testimonials = [
        {
            id: 1,
            name: "Alex M.",
            rating: 5,
            title: "Amazing is not the word",
            content: "How is this even possible? What an app! Just phenomenal. Accuracy is outstanding. Speed of analysis is outstanding. The elegance of the user interface is highly friendly. Take a bow, sir. This is brilliant stuff!!",
        },
        {
            id: 2,
            name: "Jessica L.",
            rating: 5,
            title: "Amazing app!!!",
            content: "I was skeptical. Didn't think it could really identify chords beyond basic triads but it is actually really good at identifying major sevenths, dominant sevenths, diminished, augmented and even altered dominant chords… Unparalleled app, worth much more then what they charge!! This app just gets better and better, grateful for all the updates!!!",
        },
        {
            id: 3,
            name: "Carlos R.",
            rating: 5,
            title: "Game changer for musicians",
            content: "As someone who has been playing piano for years but struggles with identifying chords by ear, this app has been a complete game changer. The accuracy is unbelievable, and it's helped me improve my own ear training. The interface is clean and intuitive. Highly recommend to any musician!",
        }
    ];

    const handleAudioReady = (blob) => {
        setAudioBlob(blob);
        setIsRecording(false);
        
        // Add pulse animation to analyze button when audio is ready
        const analyzeBtn = document.querySelector('.analyze-button');
        if (analyzeBtn) {
            analyzeBtn.classList.add('pulse-animation');
        }
    };

    const handleStartRecording = () => {
        setIsRecording(true);
        setUploadedFile(null);
        
        // Add visual indicators for active recording mode
        const recordSection = document.querySelector('.record-section');
        const uploadBox = document.querySelector('.upload-box');
        
        if (recordSection && uploadBox) {
            recordSection.classList.add('active-mode');
            uploadBox.classList.add('inactive-mode');
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
            setAudioBlob(null);
            setIsRecording(false);
            
            // Add visual indicators for active upload mode
            const recordSection = document.querySelector('.record-section');
            const uploadBox = document.querySelector('.upload-box');
            
            if (recordSection && uploadBox) {
                uploadBox.classList.add('active-mode');
                recordSection.classList.add('inactive-mode');
            }
            
            // Add pulse animation to analyze button when file is uploaded
            const analyzeBtn = document.querySelector('.analyze-button');
            if (analyzeBtn) {
                analyzeBtn.classList.add('pulse-animation');
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleAnalyze = () => {
        if (audioBlob) {
            navigate('/analyze', { state: { audioBlob } });
        } else if (uploadedFile) {
            navigate('/analyze', { state: { audioFile: uploadedFile } });
        }
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
        if (files.length > 0 && files[0].type.startsWith('audio/')) {
            setUploadedFile(files[0]);
            setAudioBlob(null);
            
            // Add pulse animation to analyze button when file is dropped
            const analyzeBtn = document.querySelector('.analyze-button');
            if (analyzeBtn) {
                analyzeBtn.classList.add('pulse-animation');
            }
        }
    };

    const toggleTestimonial = (id) => {
        setShowTestimonialExpand(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        // Initialize floating elements animation
        const animateFloatingElements = () => {
            const floatingElements = document.querySelectorAll('.floating-element');
            floatingElements.forEach(elem => {
                // Random initial position
                const randomX = Math.random() * 20 - 10;
                const randomY = Math.random() * 20 - 10;
                
                // Apply animation with random duration and delay
                elem.style.animation = `float ${5 + Math.random() * 5}s ease-in-out ${Math.random() * 2}s infinite alternate`;
                elem.style.transform = `translate(${randomX}px, ${randomY}px)`;
            });
        };
        
        animateFloatingElements();
        
        // Initialize scroll animations
        const scrollAnimObserver = setupScrollAnimations();
        
        // Set up global drag handlers to improve the drag and drop experience
        const handleDocumentDragOver = (e) => {
            e.preventDefault();
            if (dropZoneRef.current) {
                dropZoneRef.current.classList.add('highlight-drop');
            }
        };
        
        const handleDocumentDragLeave = (e) => {
            // Only remove highlight if we're leaving to an element outside our container
            if (!e.currentTarget.contains(e.relatedTarget) && dropZoneRef.current) {
                dropZoneRef.current.classList.remove('highlight-drop');
            }
        };
        
        const handleDocumentDrop = (e) => {
            if (dropZoneRef.current) {
                dropZoneRef.current.classList.remove('highlight-drop');
            }
        };
        
        // Add document-level event listeners
        document.addEventListener('dragover', handleDocumentDragOver);
        document.addEventListener('dragleave', handleDocumentDragLeave);
        document.addEventListener('drop', handleDocumentDrop);
        
        return () => {
            if (scrollAnimObserver) {
                // Clean up observer
                document.querySelectorAll('.scroll-animation').forEach(element => {
                    scrollAnimObserver.unobserve(element);
                });
            }
            
            // Clean up document-level event listeners
            document.removeEventListener('dragover', handleDocumentDragOver);
            document.removeEventListener('dragleave', handleDocumentDragLeave);
            document.removeEventListener('drop', handleDocumentDrop);
        };
    }, []);

    return (
        <div className="home-container">
            <ThemeSwitcher />
            
            <div className="floating-elements">
                <div className="floating-element note-1">C</div>
                <div className="floating-element note-2">Am</div>
                <div className="floating-element note-3">F</div>
                <div className="floating-element note-4">G</div>
                <div className="floating-element note-5">Dm7</div>
                <div className="floating-element note-6">Gmaj7</div>
                <div className="floating-element note-7">Esus4</div>
            </div>

            <div className="hero-section">
                <h1>Discover Chords in Your <span className="highlight">Music</span></h1>
                <p className="hero-description">
                    Harmonix uses advanced AI to identify chords in any song.
                </p>

                <div className="action-container">
                    <div className="action-content-row">
                        <div 
                            className="upload-box action-panel" 
                            onClick={handleUploadClick}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            ref={dropZoneRef}
                            tabIndex="0"
                            role="button"
                            aria-label="Upload audio file"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleUploadClick();
                                }
                            }}
                        >
                            <div className="upload-icon">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/file-upload-icon.svg`} alt="Upload" className="upload-img" />
                            </div>
                            <p>Drag & drop your audio file or click to browse</p>
                            <p className="small-text">Supports MP3, WAV and most audio formats</p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept="audio/*" 
                                style={{ display: 'none' }} 
                            />
                            {uploadedFile && <p className="success">File uploaded: {uploadedFile.name}</p>}
                        </div>

                        <div className="separator">
                            <hr />
                            <span>OR</span>
                            <hr />
                        </div>

                        <div className="record-section action-panel">
                            <button 
                                className="record-button"
                                onClick={handleStartRecording}
                                disabled={isRecording}
                                aria-label="Record Audio"
                            >
                                <i className="fas fa-microphone">🎤</i>
                            </button>
                            <p>{isRecording ? 'Recording...' : 'Record Audio'}</p>
                            
                            {isRecording && (
                                <AudioRecorder onAudioReady={handleAudioReady} />
                            )}
                            
                            {audioBlob && <p className="success">Audio recorded successfully!</p>}
                        </div>
                    </div>

                    <div className="action-button-container">
                        <button 
                            className="analyze-button"
                            onClick={handleAnalyze}
                            disabled={!(audioBlob || uploadedFile)}
                            aria-label="Analyze Audio"
                        >
                            {uploadedFile 
                                ? `Analyze "${uploadedFile.name.length > 15 ? uploadedFile.name.substring(0, 15) + '...' : uploadedFile.name}"` 
                                : audioBlob 
                                    ? "Analyze Recording" 
                                    : "Analyze Audio"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="how-it-works-section">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-container">
                    <div className="step-card" style={{animationDelay: '0.1s'}}>
                        <div className="step-number">1</div>
                        <h3>Upload or Record</h3>
                        <p>Upload an audio file or record directly using your microphone</p>
                        <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/step1-icon.svg`} alt="Upload or Record" className="step-icon" />
                    </div>
                    <div className="step-card" style={{animationDelay: '0.3s'}}>
                        <div className="step-number">2</div>
                        <h3>AI Analysis</h3>
                        <p>Our advanced AI analyzes your audio to identify all chords</p>
                        <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/step2-icon.svg`} alt="AI Analysis" className="step-icon" />
                    </div>
                    <div className="step-card" style={{animationDelay: '0.5s'}}>
                        <div className="step-number">3</div>
                        <h3>Get Results</h3>
                        <p>View your chord progression with timing, playback, and export options</p>
                        <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/step3-icon.svg`} alt="Get Results" className="step-icon" />
                    </div>
                </div>
            </div>

            <div className="features-section">
                <h2 className="section-title">Why Choose <span className="highlight">Harmonix</span></h2>
                <div className="features-grid">
                    <div className="feature-card" style={{animationDelay: '0.1s'}}>
                        <div className="feature-icon">🎯</div>
                        <h3>Accurate Recognition</h3>
                        <p>Our advanced machine learning algorithm provides accurate chord recognition even in complex compositions.</p>
                    </div>
                    <div className="feature-card" style={{animationDelay: '0.2s'}}>
                        <div className="feature-icon">⚡</div>
                        <h3>Real-Time Analysis</h3>
                        <p>Get instant results with our real-time audio processing technology. No waiting, just immediate chord insights.</p>
                    </div>
                    <div className="feature-card" style={{animationDelay: '0.3s'}}>
                        <div className="feature-icon">🎸</div>
                        <h3>Multiple Instruments</h3>
                        <p>Works with guitar, piano, and full band recordings. Our AI has been trained to recognize various instruments.</p>
                    </div>
                    <div className="feature-card" style={{animationDelay: '0.4s'}}>
                        <div className="feature-icon">🔍</div>
                        <h3>Advanced Chord Types</h3>
                        <p>Detects complex chords including major, minor, diminished, augmented, and extended chords.</p>
                    </div>
                    <div className="feature-card" style={{animationDelay: '0.5s'}}>
                        <div className="feature-icon">💾</div>
                        <h3>Export Options</h3>
                        <p>Save your chord progressions in multiple formats for use in your preferred music software.</p>
                    </div>
                    <div className="feature-card" style={{animationDelay: '0.6s'}}>
                        <div className="feature-icon">🔄</div>
                        <h3>Continuous Updates</h3>
                        <p>Our system is constantly improving with regular updates to enhance accuracy and features.</p>
                    </div>
                </div>
                
                <div className="key-benefits">
                    <div className="key-benefits-content">
                        <h2 className="key-benefits-title">Everything you need to analyze your music</h2>
                        <div className="benefits-list">
                            <div className="benefit-item">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/check-icon.svg`} alt="Check" />
                                <span>Recognize complex chord progressions</span>
                            </div>
                            <div className="benefit-item">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/check-icon.svg`} alt="Check" />
                                <span>Works with any audio source or recording</span>
                            </div>
                            <div className="benefit-item">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/check-icon.svg`} alt="Check" />
                                <span>Playback with synchronized chord display</span>
                            </div>
                            <div className="benefit-item">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/check-icon.svg`} alt="Check" />
                                <span>Export to various formats</span>
                            </div>
                            <div className="benefit-item">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/check-icon.svg`} alt="Check" />
                                <span>Detailed chord information</span>
                            </div>
                            <div className="benefit-item">
                                <img src={`${process.env.PUBLIC_URL}/assets/images/welcome/check-icon.svg`} alt="Check" />
                                <span>Save your analyses for future reference</span>
                            </div>
                        </div>
                    </div>
                    <div className="key-benefits-image">
                        <div className="benefits-image-placeholder">
                            <div className="chord-display-mockup">
                                <div className="chord-display-header">
                                    <div className="mock-title">Chord Analysis</div>
                                    <div className="mock-controls"></div>
                                </div>
                                <div className="chord-display-content">
                                    <div className="mock-chord">C</div>
                                    <div className="mock-chord active">Am</div>
                                    <div className="mock-chord">F</div>
                                    <div className="mock-chord">G</div>
                                </div>
                                <div className="chord-display-waveform"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="testimonials-section">
                <h2 className="section-title">What <span className="highlight">People</span> Say</h2>
                <p className="testimonials-subtitle">
                    Harmonix has thousands of satisfied users with an average rating of 4.7/5 on both the App Store and Google Play Store!
                </p>
                
                <div className="testimonials-grid">
                    {testimonials.map((testimonial) => (
                        <div className="testimonial-card" key={testimonial.id}>
                            <div className="testimonial-header">
                                <div className="testimonial-avatar">
                                    <img 
                                        src={require(`../assets/images/avatar/avatar-${testimonial.id}.jpg`)} 
                                        alt={testimonial.name} 
                                        onError={(e) => e.target.src = `${process.env.PUBLIC_URL}/assets/images/welcome/default-avatar.jpg`}
                                    />
                                </div>
                                <div className="testimonial-meta">
                                    <h3>{testimonial.name}</h3>
                                    <div className="testimonial-rating">
                                        {"★".repeat(testimonial.rating)}{"☆".repeat(5 - testimonial.rating)}
                                    </div>
                                </div>
                            </div>
                            <div className={`testimonial-content ${showTestimonialExpand[testimonial.id] ? 'expanded' : ''}`}>
                                <p><strong>{testimonial.title}</strong></p>
                                <p>{testimonial.content}</p>
                            </div>
                            <button 
                                className="testimonial-toggle" 
                                onClick={() => toggleTestimonial(testimonial.id)}
                            >
                                {showTestimonialExpand[testimonial.id] ? 'Show Less' : 'Read More'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="interactive-section scroll-animation">
                <h2 className="section-title">Try Our <span className="highlight">Chord Visualizer</span></h2>
                <p className="section-subtitle">
                    Explore how chords look on piano and guitar with our interactive visualizer
                </p>
                <ChordVisualizer />
            </div>

            <DemoSection />

            <FAQSection />

            <div className="cta-section scroll-animation">
                <h2>Ready to analyze your music?</h2>
                <p>Start discovering chords in your songs now!</p>
                <button className="cta-button" onClick={handleUploadClick}>
                    Get Started
                </button>
            </div>
        </div>
    );
}

export default HomePage;
