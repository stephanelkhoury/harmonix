import React, { useState } from 'react';
import './FAQSection.css';

function FAQSection() {
  // Track which FAQ items are expanded
  const [expandedItems, setExpandedItems] = useState({});

  const faqItems = [
    {
      id: 1,
      question: "How accurate is Harmonix's chord detection?",
      answer: "Harmonix uses advanced machine learning algorithms to provide highly accurate chord detection. Our system has been trained on thousands of songs and audio samples to recognize a wide variety of chord types with precision. For clean recordings, accuracy rates typically exceed 95%. Complex recordings with multiple instruments or background noise may have slightly lower accuracy, but our system continuously improves through machine learning."
    },
    {
      id: 2,
      question: "What audio file formats are supported?",
      answer: "Harmonix supports most common audio formats including MP3, WAV, M4A, AAC, FLAC, and OGG. Files should ideally be under 25MB for optimal performance, though larger files will work but may take longer to process."
    },
    {
      id: 3,
      question: "Can I use Harmonix with live audio from my instrument?",
      answer: "Yes! Harmonix's recording feature allows you to analyze chords in real-time. Simply press the record button, play your instrument, and our system will identify the chord progression. For best results, ensure your microphone is positioned close to the audio source and background noise is minimized."
    },
    {
      id: 4,
      question: "Does Harmonix work with all instruments?",
      answer: "Harmonix is optimized for harmonic instruments like guitar, piano, keyboard, and other string or chord-playing instruments. It works with individual instruments as well as full band or orchestral recordings. While it can detect chords from various sources, clearer recordings of chord-playing instruments will yield the best results."
    },
    {
      id: 5,
      question: "How do I save my chord analyses?",
      answer: "After analyzing your audio, you'll have the option to save your chord progression. If you have an account and are logged in, your analyses will be saved to your profile for future reference. You can also export your chord progressions in various formats including text, PDF, or as MIDI data for use in your DAW or other music software."
    },
    {
      id: 6,
      question: "Is Harmonix free to use?",
      answer: "Harmonix offers both free and premium tiers. The free version allows a limited number of analyses per month with basic features. Our premium subscription provides unlimited analyses, advanced chord detection, export options, and additional features like tempo detection and song structure analysis."
    },
    {
      id: 7,
      question: "What types of chords can Harmonix detect?",
      answer: "Harmonix can detect a wide range of chord types including major, minor, diminished, augmented, suspended, extended chords (7th, 9th, 11th, 13th), altered chords, and various inversions. Our system is constantly being trained to recognize even the most complex chord structures."
    }
  ];

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="faq-section">
      <div className="faq-header">
        <img 
          src={`${process.env.PUBLIC_URL}/assets/images/welcome/faq-icon.svg`}
          alt="FAQ" 
          className="faq-icon" 
        />
        <h2 className="section-title">Frequently Asked <span className="highlight">Questions</span></h2>
      </div>

      <div className="faq-container">
        {faqItems.map((item) => (
          <div 
            key={item.id} 
            className={`faq-item ${expandedItems[item.id] ? 'expanded' : ''}`}
          >
            <div 
              className="faq-question"
              onClick={() => toggleItem(item.id)}
            >
              <h3>{item.question}</h3>
              <div className="faq-toggle">
                {expandedItems[item.id] ? '−' : '+'}
              </div>
            </div>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQSection;
