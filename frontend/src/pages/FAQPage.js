import React, { useState } from 'react';
import './FAQPage.css';

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const categories = {
    general: [
      { question: 'What is Harmonix?', answer: 'Harmonix is a real-time AI music platform that helps musicians find chords and structure faster than ever.' },
      { question: 'Who can use Harmonix?', answer: 'Harmonix is built for musicians, composers, producers, students, and anyone interested in music theory or performance.' },
    ],
    musicians: [
      { question: 'Can Harmonix detect chords in real time?', answer: 'Yes, with premium access, you can get live chord tracking while uploading or streaming a song.' },
      { question: 'Does Harmonix identify musical keys?', answer: 'Yes, our AI can detect the key, scale, and mode of any uploaded track.' },
    ],
    subscription: [
      { question: 'Is Harmonix free to use?', answer: 'Harmonix offers both a free tier with limited features and premium subscriptions for advanced capabilities.' },
      { question: 'What makes Harmonix different from other chord detection tools?', answer: 'Our AI combines machine learning and audio signal processing to offer unmatched accuracy, real-time feedback, and educational insights.' },
    ],
    technical: [
      { question: 'What file types does Harmonix support?', answer: 'Currently, Harmonix supports MP3, WAV, and AAC formats. More formats are coming soon.' },
      { question: 'Can I export the chords or sheet music?', answer: 'Yes! You can export transcriptions as PDF, image, or MIDI files.' },
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