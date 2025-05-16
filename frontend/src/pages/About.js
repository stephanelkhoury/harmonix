import React from 'react';
import './About.css';

const About = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="hero-section">
                <h1>Unleashing the Power of AI in Music</h1>
                <p>Real-time chord recognition for musicians, educators, and producers.</p>
                <a href="/demo" className="cta-button">Try Harmonix</a>
            </section>

            {/* Mission & Vision Section */}
            <section className="mission-vision-section">
                <div className="text-content">
                    <h2>Our Vision</h2>
                    <p>We believe that music is a universal language—and with the right tools, anyone can speak it fluently. Harmonix makes music theory accessible, interactive, and personalized.</p>

                    <h2>Our Mission</h2>
                    <p>To bridge the gap between musicians and technology by offering a platform that listens, learns, and adapts—just like a musician would.</p>
                </div>
                <div className="visual-content">
                    {/* Placeholder for Lottie animation or SVG */}
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2>How It Works</h2>
                <div className="feature-slider">
                    <div className="feature-slide">
                        <h3>🎧 Real-Time Chord Detection</h3>
                        <p>Upload an MP3 and get instant chord progressions, with major/minor identification.</p>
                    </div>
                    <div className="feature-slide">
                        <h3>🎼 Interactive Visualizer</h3>
                        <p>Watch a dynamic chord graph while the song plays in sync.</p>
                    </div>
                    <div className="feature-slide">
                        <h3>🎹 Playback Control</h3>
                        <p>Loop, slow down, or isolate sections to learn and practice easily.</p>
                    </div>
                    <div className="feature-slide">
                        <h3>📚 Lyric Sync (Coming Soon)</h3>
                        <p>Auto-display synced lyrics with chord overlays—perfect for singers and teachers.</p>
                    </div>
                    <div className="feature-slide">
                        <h3>🎛️ Key & Tempo Detection</h3>
                        <p>Instantly detect the key and BPM of any uploaded track.</p>
                    </div>
                </div>
            </section>

            {/* Who It's For Section */}
            <section className="use-case-section">
                <div className="use-case">
                    <h3>🎶 Musicians & Songwriters</h3>
                    <p>Discover new chord patterns or reverse-engineer your favorite tracks.</p>
                </div>
                <div className="use-case">
                    <h3>👩‍🏫 Music Teachers</h3>
                    <p>Use Harmonix as a live tool in class to teach structure, harmony, and ear training.</p>
                </div>
                <div className="use-case">
                    <h3>🎓 Students & Hobbyists</h3>
                    <p>Learn chords and structures just by listening—no theory background needed.</p>
                </div>
                <div className="use-case">
                    <h3>🎧 Producers & Engineers</h3>
                    <p>Accelerate production by referencing chord sheets or converting sections into MIDI.</p>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="tech-stack-section">
                <h2>Tech Stack</h2>
                <ul>
                    <li><strong>Frontend:</strong> React.js with SVG waveform visualization</li>
                    <li><strong>Backend:</strong> Python Flask (Node.js optional)</li>
                    <li><strong>AI Models:</strong> TensorFlow or PyTorch pre-trained networks</li>
                    <li><strong>Audio Processing:</strong> Librosa, Essentia, FFmpeg</li>
                    <li><strong>Database:</strong> PostgreSQL or MongoDB</li>
                    <li><strong>Deployment:</strong> Docker, NGINX, CI/CD pipeline</li>
                </ul>
            </section>

            {/* Why Harmonix Section */}
            <section className="why-harmonix-section">
                <h2>Why Harmonix</h2>
                <div className="features">
                    <div className="feature">
                        <h3>🎶 AI Precision</h3>
                        <p>Accurately detects chords even in layered arrangements.</p>
                    </div>
                    <div className="feature">
                        <h3>⚙️ Customizable Output</h3>
                        <p>Transpose chords, extract MIDI, or view slash chords.</p>
                    </div>
                    <div className="feature">
                        <h3>🌍 Multi-Genre Support</h3>
                        <p>Works with Pop, Jazz, Oriental, and Classical.</p>
                    </div>
                    <div className="feature">
                        <h3>💡 Intuitive Interface</h3>
                        <p>Built for clarity, speed, and creativity.</p>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="cta-section">
                <h2>Ready to Analyze Your Favorite Song?</h2>
                <p>Join thousands of musicians already discovering new chords with Harmonix.</p>
                <a href="/upload" className="cta-button">Upload MP3 Now</a>
            </section>
        </div>
    );
};

export default About;