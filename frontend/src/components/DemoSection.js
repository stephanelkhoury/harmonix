import React, { useState } from 'react';
import './style/DemoSection.css';

function DemoSection() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  
  const handlePlayVideo = () => {
    setVideoPlaying(true);
  };
  
  return (
    <div className="demo-section">
      <div className="demo-header">
        <img 
          src={`${process.env.PUBLIC_URL}/assets/images/welcome/demo-icon.svg`}
          alt="Demo" 
          className="demo-icon" 
        />
        <h2 className="section-title">See <span className="highlight">Harmonix</span> in Action</h2>
      </div>
      <div className="demo-description">
        <p>Watch how easy it is to analyze chords with Harmonix. Upload your audio file or record directly, and get accurate chord recognition in seconds.</p>
      </div>
      
      <div className="video-container">
        {!videoPlaying ? (
          <div className="video-placeholder" onClick={handlePlayVideo}>
            <div className="play-button">
              <img 
                src={`${process.env.PUBLIC_URL}/assets/images/welcome/play-icon.svg`}
                alt="Play Video" 
              />
            </div>
            <div className="video-overlay">
              <h3>Chord Analysis Demo</h3>
              <p>Click to watch video</p>
            </div>
          </div>
        ) : (
          <iframe 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
            title="Harmonix Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="demo-video"
          ></iframe>
        )}
      </div>
      
      <div className="demo-features">
        <div className="demo-feature">
          <div className="feature-number">01</div>
          <div className="feature-content">
            <h3>Upload or Record</h3>
            <p>Simply upload an audio file or record directly from your microphone</p>
          </div>
        </div>
        <div className="demo-feature">
          <div className="feature-number">02</div>
          <div className="feature-content">
            <h3>Analyze</h3>
            <p>Our AI identifies chords and progressions with advanced algorithms</p>
          </div>
        </div>
        <div className="demo-feature">
          <div className="feature-number">03</div>
          <div className="feature-content">
            <h3>View Results</h3>
            <p>Get detailed chord analysis with timing, variations and playback options</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoSection;
