import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { FaMusic, FaLightbulb, FaChartLine, FaUsers, FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import './style/About.css';
import '../components/style/HomePage.css';
import ScrollAnimation from '../components/ScrollAnimation';
import OpacityFixer from '../components/OpacityFixer';

const NewAbout = () => {
    return (
        <div className="about-page">
            <ScrollAnimation />
            <OpacityFixer />
            {/* 1. Hero Section */}
            <section className="hero-section">
                <Container>
                    <Row className="align-items-center">
                        <Col md={12} className="text-center">
                            <h1>Revolutionizing Music Intelligence</h1>
                            <p className="lead">
                                Empowering musicians with AI-powered chord detection and analysis tools
                            </p>
                            <a href="#our-story" className="btn btn-primary btn-lg mt-3">
                                Our Story
                            </a>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 2. Mission Statement */}
            <section className="mission-section">
                <Container>
                    <Row className="justify-content-center">
                        <Col md={8} className="text-center">
                            <h2>Our Mission</h2>
                            <div className="mission-box">
                                <p>
                                    At Harmonix, our mission is to bridge the gap between technology and music creativity. 
                                    We're dedicated to providing musicians, educators, and enthusiasts with powerful yet 
                                    intuitive tools that enhance music understanding, accelerate learning, and inspire new 
                                    creative possibilities.
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 3. Vision Statement */}
            <section className="vision-section">
                <Container>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h2>Our Vision</h2>
                            <p>
                                We envision a future where technology removes barriers to musical expression and understanding.
                                Harmonix strives to become the leading platform for music intelligence, where musicians of all 
                                skill levels can instantly analyze, understand, and visualize musical elements that traditionally 
                                took years to master.
                            </p>
                            <p>
                                Our long-term goal is to build an ecosystem where musicians, educators, and AI collaborate 
                                seamlessly, pushing the boundaries of what's possible in music creation, analysis, and education.
                            </p>
                        </Col>
                        <Col md={6} className="vision-image">
                            {/* This will be styled via CSS with a background image */}
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 4. Our Story */}
            <section id="our-story" className="story-section">
                <Container>
                    <Row>
                        <Col md={12} className="text-center mb-5">
                            <h2>Our Story</h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="story-image">
                            {/* This will be styled via CSS with a background image */}
                        </Col>
                        <Col md={6}>
                            <div className="story-content">
                                <p>
                                    Harmonix was born from a simple frustration: the disconnect between what we hear and what we 
                                    understand about music. Our founder, a musician and technologist, struggled with identifying 
                                    complex chords by ear – a common challenge many musicians face.
                                </p>
                                <p>
                                    While teaching music theory, he noticed students investing countless hours trying to train their 
                                    ears to recognize chord progressions. This inspired a question: What if technology could instantly 
                                    bridge this gap in musical understanding?
                                </p>
                                <p>
                                    Established in 2023, Harmonix began as an experimental project combining audio processing algorithms 
                                    with machine learning. After months of development and collaboration with professional musicians and 
                                    educators, our platform evolved into the intuitive, powerful tool it is today – empowering users to 
                                    instantly visualize and understand the harmonic structures of any piece of music.
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 5. What We Do */}
            <section className="what-we-do-section">
                <Container>
                    <Row>
                        <Col md={12} className="text-center mb-5">
                            <h2>What We Do</h2>
                            <p className="lead">
                                Harmonix offers cutting-edge solutions for music analysis and learning
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3} sm={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Body className="text-center">
                                    <div className="service-icon">
                                        <FaMusic />
                                    </div>
                                    <Card.Title>Real-Time Chord Detection</Card.Title>
                                    <Card.Text>
                                        Instantly identify chords from any audio source with industry-leading accuracy using our advanced AI algorithms.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Body className="text-center">
                                    <div className="service-icon">
                                        <FaChartLine />
                                    </div>
                                    <Card.Title>Visual Audio Analysis</Card.Title>
                                    <Card.Text>
                                        See music in a new way with rich visualizations of harmonic structures, progressions, and patterns.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Body className="text-center">
                                    <div className="service-icon">
                                        <FaLightbulb />
                                    </div>
                                    <Card.Title>AI-Powered Insights</Card.Title>
                                    <Card.Text>
                                        Get intelligent suggestions for chord substitutions, progression analysis, and harmonic enhancements.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-4">
                            <Card className="service-card h-100">
                                <Card.Body className="text-center">
                                    <div className="service-icon">
                                        <FaUsers />
                                    </div>
                                    <Card.Title>Educational Tools</Card.Title>
                                    <Card.Text>
                                        Accelerate your learning with interactive tools designed for musicians, students, and educators.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col className="text-center">
                            <p>
                                Available across desktop and mobile platforms, Harmonix is designed to fit seamlessly into your 
                                musical workflow, whether you're in the studio, classroom, or on stage.
                            </p>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 6. Core Values */}
            <section className="values-section">
                <Container>
                    <Row>
                        <Col md={12} className="text-center mb-5">
                            <h2>Our Core Values</h2>
                            <p className="lead">The principles that guide everything we do</p>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} lg={3} className="mb-4">
                            <div className="value-card">
                                <h3>Innovation</h3>
                                <p>
                                    We constantly push the boundaries of what's possible with AI and audio analysis, 
                                    staying at the forefront of music technology.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={3} className="mb-4">
                            <div className="value-card">
                                <h3>Empowerment</h3>
                                <p>
                                    We believe in democratizing music understanding, making sophisticated analysis 
                                    accessible to musicians of all skill levels.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={3} className="mb-4">
                            <div className="value-card">
                                <h3>User-Centricity</h3>
                                <p>
                                    We design our tools with the musician's needs at the center, ensuring an 
                                    intuitive experience that enhances creativity.
                                </p>
                            </div>
                        </Col>
                        <Col md={6} lg={3} className="mb-4">
                            <div className="value-card">
                                <h3>Accuracy</h3>
                                <p>
                                    We're committed to providing the most precise and reliable music analysis tools, 
                                    continuously refining our algorithms for better results.
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 7. Timeline/Milestones */}
            <section className="timeline-section">
                <Container>
                    <Row>
                        <Col md={12} className="text-center mb-5">
                            <h2>Our Journey</h2>
                            <p className="lead">Key milestones in the Harmonix development</p>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
                            <div className="timeline">
                                <div className="timeline-item">
                                    <div className="timeline-point"></div>
                                    <div className="timeline-content">
                                        <h4>2023 - Concept Development</h4>
                                        <p>Initial prototyping of audio analysis algorithms and user interface concepts</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-point"></div>
                                    <div className="timeline-content">
                                        <h4>2024 - Beta Launch</h4>
                                        <p>Release of our first beta version to selected musicians and educators for testing and feedback</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-point"></div>
                                    <div className="timeline-content">
                                        <h4>2024 - Full Launch</h4>
                                        <p>Official launch of Harmonix with core chord detection and analysis features</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-point"></div>
                                    <div className="timeline-content">
                                        <h4>2025 - Enhanced Features</h4>
                                        <p>Introduction of advanced visualization tools and educational resources</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-point"></div>
                                    <div className="timeline-content">
                                        <h4>2025 - Mobile Expansion</h4>
                                        <p>Release of iOS and Android applications</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-point"></div>
                                    <div className="timeline-content">
                                        <h4>Future - Integration Ecosystem</h4>
                                        <p>Planned integration with major DAWs and music education platforms</p>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 8. Testimonials */}
            <section className="testimonials-section">
                <Container>
                    <Row>
                        <Col md={12} className="text-center mb-5">
                            <h2>What Musicians Say</h2>
                        </Col>
                    </Row>
                    <Row className="justify-content-center">
                        <Col md={4} className="mb-4">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <p>"Harmonix has completely transformed how I transcribe music. What used to take hours now takes minutes."</p>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="testimonial-avatar">
                                        <img src={require('../assets/images/avatar/avatar-4.jpg')} alt="Sarah J." />
                                    </div>
                                    <div className="testimonial-author">
                                        <strong>Sarah J.</strong><br />
                                        Music Educator
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col md={4} className="mb-4">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <p>"The chord detection accuracy is impressive. I use it constantly while learning new songs and analyzing compositions."</p>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="testimonial-avatar">
                                        <img src={require('../assets/images/avatar/avatar-5.jpg')} alt="Michael T." />
                                    </div>
                                    <div className="testimonial-author">
                                        <strong>Michael T.</strong><br />
                                        Professional Guitarist
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col md={4} className="mb-4">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <p>"As a music theory instructor, Harmonix has become an indispensable teaching tool for demonstrating harmonic concepts to students."</p>
                                </div>
                                <div className="d-flex align-items-center">
                                    <div className="testimonial-avatar">
                                        <img src={require('../assets/images/avatar/avatar-1.jpg')} alt="David R." />
                                    </div>
                                    <div className="testimonial-author">
                                        <strong>David R.</strong><br />
                                        University Professor
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* 9. Call to Action */}
            <section className="cta-section">
                <Container>
                    <Row className="justify-content-center text-center">
                        <Col md={8}>
                            <h2>Ready to Transform Your Musical Journey?</h2>
                            <p className="lead">
                                Join thousands of musicians who are already discovering the power of AI-enhanced music analysis.
                            </p>
                            <Button variant="primary" size="lg" className="mt-3">
                                Get Started with Harmonix
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </section>
        </div>
    );
};

export default NewAbout;
