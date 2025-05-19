import React, { useState } from 'react';
import './style/FAQPage.css';

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const categories = {
    general: [
      { question: 'What is Harmonix?', answer: 'Harmonix is a smart platform that uses AI to help musicians analyze, transcribe, and understand music—instantly converting MP3s into chords, lyrics, and more.' },
      { question: 'Who can use Harmonix?', answer: 'Harmonix is built for musicians, composers, producers, students, and anyone interested in music theory or performance.' },
      { question: 'Do I need to be a professional musician to use Harmonix?', answer: 'Not at all! Harmonix is beginner-friendly and offers tools tailored to all skill levels.' },
      { question: 'Is Harmonix free to use?', answer: 'Harmonix offers both a free tier with limited features and premium subscriptions for advanced capabilities.' },
      { question: 'What makes Harmonix different from other chord detection tools?', answer: 'Our AI combines machine learning and audio signal processing to offer unmatched accuracy, real-time feedback, and educational insights.' },
    ],
    musicians: [
      { question: 'What file types does Harmonix support?', answer: 'Currently, Harmonix supports MP3, WAV, and AAC formats. More formats are coming soon.' },
      { question: 'Can Harmonix detect chords in real time?', answer: 'Yes, with premium access, you can get live chord tracking while uploading or streaming a song.' },
      { question: 'How accurate are the chord predictions?', answer: 'Harmonix\'s AI achieves over 90% accuracy on common Western progressions and is continuously improving with user feedback.' },
      { question: 'Does Harmonix identify musical keys?', answer: 'Yes, our AI can detect the key, scale, and mode of any uploaded track.' },
      { question: 'Can I export the chords or sheet music?', answer: 'Yes! You can export transcriptions as PDF, image, or MIDI files.' },
      { question: 'Can Harmonix isolate instruments?', answer: 'Yes, the platform includes instrument separation (vocals, bass, drums, etc.) using advanced stem-splitting AI.' },
      { question: 'What is harmonic analysis?', answer: 'Harmonic analysis identifies chord progressions, key modulations, and tonal centers in music—Harmonix simplifies this automatically.' },
      { question: 'Does Harmonix support microtonal or Arabic maqamat?', answer: 'Support for maqamat and non-Western tuning systems is currently under development.' },
      { question: 'Can Harmonix help me learn music theory?', answer: 'Absolutely. We offer visualized theory guides, chord suggestions, and interval training.' },
    ],
    usage: [
      { question: 'Do I need to install any software?', answer: 'No, Harmonix is fully browser-based and mobile-responsive.' },
      { question: 'Can I use Harmonix on mobile or tablet?', answer: 'Yes, the platform works seamlessly across devices including iOS and Android.' },
      { question: 'Is there a limit to the number of files I can upload?', answer: 'Free users have a monthly upload limit; premium users enjoy unlimited access.' },
      { question: 'Can I slow down or loop sections of a song?', answer: 'Yes, our practice tool lets you loop, slow down, or isolate sections for targeted practice.' },
      { question: 'Can I share my analyses or chord sheets?', answer: 'You can download and share directly or publish public analyses in your user profile.' },
    ],
    ai: [
      { question: 'How does Harmonix learn from my input?', answer: 'Our AI improves over time based on anonymized user corrections and confirmations, making the system smarter for everyone.' },
      { question: 'Can I correct the AI\'s chord detection manually?', answer: 'Yes, you can edit chords and submit improvements, which also trains the model.' },
      { question: 'Does Harmonix store my music files?', answer: 'Files are processed and optionally stored based on your privacy settings.' },
      { question: 'Is my uploaded music private?', answer: 'Yes, your music is private by default unless you choose to share it.' },
      { question: 'Does Harmonix work offline?', answer: 'Currently, Harmonix requires an internet connection to process audio.' },
    ],
    education: [
      { question: 'Can teachers use Harmonix in music classes?', answer: 'Yes! We offer academic licenses and teacher dashboards for classroom use.' },
      { question: 'Can I use Harmonix to compose new music?', answer: 'Definitely. Harmonix helps you experiment with chords, analyze progressions, and build musical ideas faster.' },
      { question: 'Are there tutorials or help guides?', answer: 'Yes, our Help Center includes videos, walkthroughs, and theory explainers.' },
      { question: 'Is there a Harmonix community or forum?', answer: 'A Discord-based community and forum are launching soon for users to share progress, get feedback, and connect.' },
      { question: 'Does Harmonix support collaborations?', answer: 'Collaborative features are in beta, allowing users to co-edit or share tracks in real time.' },
      { question: 'Can I suggest new features or improvements?', answer: 'Yes, we welcome your ideas—submit feature requests directly through your dashboard.' },
    ],
  };

  return (
    <div className="faq-page">
      <section className="faq-hero">
        <h1>Got Questions?</h1>
        <p>We’ve got answers to help you jam better 🎹</p>
      </section>

      <nav className="faq-tabs">
        {Object.keys(categories).map((category) => (
          <button
            key={category}
            data-target={category}
            className={activeCategory === category ? 'active' : ''}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </nav>

      <div className="faq-container">
        {categories[activeCategory].map((item, index) => (
          <div key={index} className={`faq-item ${openFAQ === index ? 'open' : ''}`}>
            <button className="faq-question" onClick={() => toggleFAQ(index)}>
              {item.question}
            </button>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="faq-cta">
        <h2>Still can’t find what you're looking for?</h2>
        <a href="/contact" className="cta-button">Contact Us</a>
      </section>
    </div>
  );
};

export default FAQPage;