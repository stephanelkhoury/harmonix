import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaDrum } from 'react-icons/fa';
import TapTempo from '../components/TapTempo';
import './style/TapTempoPage.css';

function TapTempoPage() {
  return (
    <div className="tap-tempo-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center mb-5">
            <Col lg={8} className="text-center">
              <div className="page-header">
                <FaDrum className="header-icon" />
                <h1>Tap Tempo</h1>
                <p className="lead">
                  Find the exact tempo of any song or rhythm by simply tapping along
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main Content */}
      <section className="main-section">
        <Container>
          {/* Tap Tempo Component */}
          <Row className="justify-content-center mb-5">
                  <TapTempo />
          </Row>

          {/* How to Use Section */}
          <Row className="features-section mt-5">
            <Col lg={12}>
              <h2 className="text-center mb-4">How to Use</h2>
            </Col>
            <Col md={4}>
              <div className="feature-item">
                <div className="feature-number">1</div>
                <h3>Listen to the Beat</h3>
                <p>Focus on the rhythm or beat of your music</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-item">
                <div className="feature-number">2</div>
                <h3>Tap Along</h3>
                <p>Tap the button or spacebar in time with the music</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="feature-item">
                <div className="feature-number">3</div>
                <h3>Get the Tempo</h3>
                <p>The BPM will be calculated automatically from your taps</p>
              </div>
            </Col>
          </Row>

          {/* Tips Section */}
          <Row className="tips-section mt-5">
            <Col lg={12}>
              <Card className="tips-card">
                <Card.Body>
                  <h3>Pro Tips</h3>
                  <ul className="tips-list">
                    <li>For best accuracy, tap at least 5-10 times</li>
                    <li>Try to tap consistently with the beat</li>
                    <li>Use the spacebar for more precise timing</li>
                    <li>The tempo will automatically adjust as you tap</li>
                    <li>Press reset to start a new measurement</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default TapTempoPage;
