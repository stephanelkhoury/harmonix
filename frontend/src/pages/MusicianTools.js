import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaGuitar, FaDrum, FaMusic, FaFileAlt, FaTimes } from 'react-icons/fa';
import './style/MusicianTools.css';

function MusicianTools() {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (e, image) => {
    e.preventDefault(); // Prevent navigation
    setSelectedImage(image);
  };

  const closeOverlay = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
  };

  return (
    <div className="musician-tools-page">
      <Container>
        <Row className="justify-content-center mb-5">
          <Col lg={12} className="text-center">
            <h1>Musician Tools</h1>
          </Col>
        </Row>

        <div className="tools-grid">
          {/* Tuner Tool */}
          <Link to="/tuner" className="tool-link">
            <Card className="tool-card h-100">
              <div className="tool-image-container">
                <img 
                  src={require('../assets/images/musiciantools/InstrumentTuner.jpg')}
                  alt="Instrument Tuner" 
                  className="tool-image"
                  onClick={(e) => handleImageClick(e, require('../assets/images/musiciantools/InstrumentTuner.jpg'))}
                />
              </div>
              <Card.Body className="text-center">
                <div className="tool-icon">
                  <FaGuitar />
                </div>
                <Card.Title>Instrument Tuner</Card.Title>
                <Card.Text>
                  Professional-grade chromatic tuner with support for multiple instruments
                </Card.Text>
              </Card.Body>
            </Card>
          </Link>

          {/* Tap Tempo Tool */}
          <Link to="/tap-tempo" className="tool-link">
            <Card className="tool-card h-100">
              <div className="tool-image-container">
                <img 
                  src={require('../assets/images/musiciantools/TapTempo.jpg')}
                  alt="Tap Tempo" 
                  className="tool-image"
                  onClick={(e) => handleImageClick(e, require('../assets/images/musiciantools/TapTempo.jpg'))}
                />
              </div>
              <Card.Body className="text-center">
                <div className="tool-icon">
                  <FaDrum />
                </div>
                <Card.Title>Tap Tempo</Card.Title>
                <Card.Text>
                  Calculate BPM by tapping along with your music
                </Card.Text>
              </Card.Body>
            </Card>
          </Link>

          {/* Chord Analyzer Tool */}
          <Link to="/analyze" className="tool-link">
            <Card className="tool-card h-100">
              <div className="tool-image-container">
                <img 
                  src={require('../assets/images/musiciantools/ChordAnalyzer.jpg')}
                  alt="Chord Analyzer" 
                  className="tool-image"
                  onClick={(e) => handleImageClick(e, require('../assets/images/musiciantools/ChordAnalyzer.jpg'))}
                />
              </div>
              <Card.Body className="text-center">
                <div className="tool-icon">
                  <FaMusic />
                </div>
                <Card.Title>Chord Analyzer</Card.Title>
                <Card.Text>
                  Record and analyze chords in real-time with advanced harmonic detection
                </Card.Text>
              </Card.Body>
            </Card>
          </Link>

          {/* Lyrics Analyzer Tool */}
          <Link to="/lyrics-identifier" className="tool-link">
            <Card className="tool-card h-100">
              <div className="tool-image-container">
                <img 
                  src={require('../assets/images/musiciantools/LyricsAnalyzer.jpg')}
                  alt="Lyrics Analyzer" 
                  className="tool-image"
                  onClick={(e) => handleImageClick(e, require('../assets/images/musiciantools/LyricsAnalyzer.jpg'))}
                />
              </div>
              <Card.Body className="text-center">
                <div className="tool-icon">
                  <FaFileAlt />
                </div>
                <Card.Title>Lyrics Analyzer</Card.Title>
                <Card.Text>
                  Analyze song lyrics with advanced natural language processing
                </Card.Text>
              </Card.Body>
            </Card>
          </Link>
        </div>

        {/* Image Overlay */}
        {selectedImage && (
          <div className="tool-image-overlay" onClick={closeOverlay}>
            <img 
              src={selectedImage} 
              alt="Full size view" 
              className="overlay-image"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="close-overlay" onClick={closeOverlay}>
              <FaTimes />
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}

export default MusicianTools;
