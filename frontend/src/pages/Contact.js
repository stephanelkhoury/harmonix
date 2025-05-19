import React, { useState, useEffect, useRef } from 'react';
import './style/Contact.css';
// Import hero image
import contactHeroImg from '../assets/images/contact-us-herp.png';
// Import necessary icons
import { 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock, 
  FaPaperPlane, 
  FaInstagram, 
  FaLinkedin, 
  FaWhatsapp, 
  FaYoutube, 
  FaHeadphones, 
  FaKeyboard, 
  FaLaptop,
  FaMusic,
  FaGuitar,
  FaDrum,
  FaMicrophone,
  FaVolumeUp,
  FaRecordVinyl
} from 'react-icons/fa';

const Contact = () => {
  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General',
    message: '',
    file: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Animation states
  const [inputFocus, setInputFocus] = useState({
    name: false,
    email: false,
    message: false
  });
  const [validFields, setValidFields] = useState({
    name: false,
    email: false,
    message: false
  });
  const [isVisible, setIsVisible] = useState(false);
  
  // Refs for animated elements
  const formRef = useRef(null);
  const heroRef = useRef(null);
  
  // Generate random music notes
  const [musicNotes, setMusicNotes] = useState([]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // Validate field on typing for real-time feedback
    validateField(name, value);
  };
  
  // Validate individual field
  const validateField = (name, value) => {
    let isValid = false;
    
    switch(name) {
      case 'name':
        isValid = value.trim().length > 0;
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'message':
        isValid = value.trim().length >= 10;
        break;
      default:
        isValid = false;
    }
    
    setValidFields(prev => ({
      ...prev,
      [name]: isValid
    }));
    
    return isValid;
  };
  
  // Handle input focus
  const handleFocus = (name) => {
    setInputFocus(prev => ({
      ...prev,
      [name]: true
    }));
  };
  
  // Handle input blur
  const handleBlur = (name) => {
    setInputFocus(prev => ({
      ...prev,
      [name]: false
    }));
  };
  
  // Handle file upload
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0]
    });
  };
  
  // Form validation
  const validateForm = () => {
    let errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message should be at least 10 characters';
    }
    
    return errors;
  };
  
  // Handle form submission with animation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      
      // Create additional music notes at form submission
      createMusicNotes(8);
      
      // Simulate form submission with a timeout
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          subject: 'General',
          message: '',
          file: null
        });
        
        // Reset valid fields
        setValidFields({
          name: false,
          email: false,
          message: false
        });
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }, 1500);
    } else {
      setFormErrors(errors);
      shakeForm(); // Add shake animation to form on error
    }
  };
  
  // Shake form on error
  const shakeForm = () => {
    if (formRef.current) {
      formRef.current.classList.add('shake-animation');
      setTimeout(() => {
        formRef.current.classList.remove('shake-animation');
      }, 500);
    }
  };
  
  // Generate random position for floating elements
  const getRandomPosition = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  // Create floating music notes
  const createMusicNotes = (count = 3) => {
    const notes = [];
    const musicIcons = [FaMusic, FaGuitar, FaDrum, FaMicrophone, FaVolumeUp, FaRecordVinyl];
    
    for (let i = 0; i < count; i++) {
      const randomLeft = getRandomPosition(5, 95);
      const randomDelay = getRandomPosition(0, 5);
      const randomDuration = getRandomPosition(8, 15);
      const randomIcon = musicIcons[Math.floor(Math.random() * musicIcons.length)];
      
      notes.push({
        id: `note-${Date.now()}-${i}`,
        icon: randomIcon,
        style: {
          left: `${randomLeft}%`,
          animationDelay: `${randomDelay}s`,
          animationDuration: `${randomDuration}s`
        }
      });
    }
    
    setMusicNotes(prev => [...prev, ...notes]);
    
    // Remove notes after they've animated
    setTimeout(() => {
      setMusicNotes(prev => prev.filter(note => !notes.includes(note)));
    }, 15000);
  };
  
  // Generate ambient background circles
  const ambientCircles = [1, 2, 3].map(index => (
    <div key={`ambient-${index}`} className={`ambient-circle ambient-circle-${index}`}></div>
  ));
  
  // Animations for floating icons
  useEffect(() => {
    const icons = document.querySelectorAll('.floating-icon');
    
    icons.forEach(icon => {
      setInterval(() => {
        icon.classList.toggle('pulse');
      }, Math.random() * 3000 + 2000);
    });
    
    // Initial music notes
    createMusicNotes(5);
    
    // Setup intersection observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    // Create music notes periodically
    const noteInterval = setInterval(() => {
      createMusicNotes(1);
    }, 8000);
    
    // Initialize custom cursor
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);
    
    // Move cursor with mouse
    const moveCursor = (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    
    // Scale cursor on interactive elements
    const handleCursorHover = () => {
      cursor.classList.add('active');
    };
    
    const handleCursorLeave = () => {
      cursor.classList.remove('active');
    };
    
    // Add music note to cursor on form elements
    const handleMusicNote = () => {
      cursor.classList.add('music-note');
    };
    
    const handleRemoveMusicNote = () => {
      cursor.classList.remove('music-note');
    };
    
    // Add event listeners
    document.addEventListener('mousemove', moveCursor);
    
    const interactiveElements = document.querySelectorAll('a, button, .info-item, .form-control');
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', handleCursorHover);
      element.addEventListener('mouseleave', handleCursorLeave);
    });
    
    const formElements = document.querySelectorAll('.form-control');
    formElements.forEach(element => {
      element.addEventListener('mouseenter', handleMusicNote);
      element.addEventListener('mouseleave', handleRemoveMusicNote);
    });
    
    // Add particles to ambient background
    const addParticles = () => {
      const ambientBg = document.querySelector('.ambient-bg');
      if (ambientBg) {
        for (let i = 0; i < 3; i++) {
          const particle = document.createElement('div');
          particle.classList.add('particle');
          ambientBg.appendChild(particle);
        }
      }
    };
    
    addParticles();
    
  // Add wave animation
  const addWaves = () => {
    const heroSection = document.querySelector('.contact-hero-section');
    if (heroSection) {
      const waveContainer = document.createElement('div');
      waveContainer.classList.add('wave-container');
      
      for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.classList.add('wave');
        waveContainer.appendChild(wave);
      }
      
      heroSection.appendChild(waveContainer);
    }
  };
  
  addWaves();
  
  // Add ripple effect to buttons and interactive elements
  const addRippleEffect = () => {
    const buttons = document.querySelectorAll('.send-button, .cta-button, .social-links a');
    
    const createRipple = (event) => {
      const button = event.currentTarget;
      
      // Remove any existing ripples
      const ripples = button.querySelectorAll('.ripple-effect');
      ripples.forEach(ripple => ripple.remove());
      
      // Create new ripple element
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      // Get the position of click relative to button
      const rect = button.getBoundingClientRect();
      const left = event.clientX - rect.left - radius;
      const top = event.clientY - rect.top - radius;
      
      // Apply styles to ripple
      circle.className = 'ripple-effect';
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${left}px`;
      circle.style.top = `${top}px`;
      
      // Add to button
      button.appendChild(circle);
      
      // Remove after animation completes
      setTimeout(() => {
        circle.remove();
      }, 600);
    };
    
    // Add event listeners
    buttons.forEach(button => {
      button.addEventListener('click', createRipple);
    });
    
    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', createRipple);
      });
    };
  };
  
  // Initialize ripple effect
  const cleanupRipple = addRippleEffect();
    
  return () => {
    // Clean up all event listeners and intervals
    clearInterval(noteInterval);
    observer.disconnect();
    
    document.removeEventListener('mousemove', moveCursor);
    
    interactiveElements.forEach(element => {
      element.removeEventListener('mouseenter', handleCursorHover);
      element.removeEventListener('mouseleave', handleCursorLeave);
    });
    
    formElements.forEach(element => {
      element.removeEventListener('mouseenter', handleMusicNote);
      element.removeEventListener('mouseleave', handleRemoveMusicNote);
    });
    
    // Cleanup ripple effect
    cleanupRipple();
    
    // Remove custom cursor element
    if (document.body.contains(cursor)) {
      document.body.removeChild(cursor);
    }
  };
  }, []);
  
  // Scrolling function for CTA button
  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form');
    formElement.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section with Parallax - 85vh height */}
      <section 
        className="contact-hero-section"
        style={{
          backgroundImage: `url(${contactHeroImg})`,
          height: 'auto',
        }}
        ref={heroRef}
      >
        {/* Ambient background */}
        <div className="ambient-bg">
          {ambientCircles}
        </div>
        
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <h1 className="typewriter">Let's Create Something Great Together</h1>
          <p className="fade-in">Whether it's a quick question, a collaboration idea, or just saying hello, we're all ears.</p>
          
          {/* Combined Contact Section Within Hero */}
          <div className="contact-combined-container">
            {/* Left side: Contact Info and Map */}
            <div className="contact-info-wrapper">
              <div className="contact-info">
                <h2>Let's Connect</h2>
                
                <div className="info-item">
                  <FaPhone className="info-icon" />
                  <div>
                    <h3>Phone</h3>
                    <p>+961 78 965 292</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaEnvelope className="info-icon" />
                  <div>
                    <h3>Email</h3>
                    <p>hello@harmonix.ai</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <div>
                    <h3>Address</h3>
                    <p>Beirut, Lebanon</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaClock className="info-icon" />
                  <div>
                    <h3>Hours</h3>
                    <p>Mon–Fri: 10AM–6PM</p>
                  </div>
                </div>
                
                <div className="social-links">
                  <a href="https://instagram.com/harmonix.ai" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <FaInstagram />
                  </a>
                  <a href="https://linkedin.com/company/harmonixai" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <FaLinkedin />
                  </a>
                  <a href="https://wa.me/96178965292" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <FaWhatsapp />
                  </a>
                  <a href="https://youtube.com/@harmonixai" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <FaYoutube />
                  </a>
                </div>
              </div>
              
              <div className="map-container">
                <iframe 
                  title="Harmonix Office Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53257.59170753624!2d35.47577419131835!3d33.88933391815056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151f17215880a78f%3A0x729182bae99836b4!2sBeirut%2C%20Lebanon!5e0!3m2!1sen!2sus!4v1621345678901!5m2!1sen!2sus" 
                  allowFullScreen="" 
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* Right side: Contact Form */}
            <div className="contact-form-wrapper" id="contact-form-section">
              {submitSuccess ? (
                <div className="success-message">
                  <div className="confetti-container">
                    <div className="confetti"></div>
                    <div className="confetti"></div>
                    <div className="confetti"></div>
                    <div className="confetti"></div>
                    <div className="confetti"></div>
                  </div>
                  <div className="success-icon">✅</div>
                  <h3>Thank you!</h3>
                  <p>Your message has been sent successfully. We'll reply shortly.</p>
                </div>
              ) : (
                <>
                  <h2>Send a Message</h2>
                  <form id="contact-form" ref={formRef} onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input 
                        type="text" 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-control ${formErrors.name ? 'error' : ''} ${validFields.name ? 'input-success' : ''}`}
                        required 
                        placeholder="Your name"
                        onFocus={() => handleFocus('name')}
                        onBlur={() => handleBlur('name')}
                      />
                      {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-control ${formErrors.email ? 'error' : ''} ${validFields.email ? 'input-success' : ''}`}
                        required 
                        placeholder="your.email@example.com"
                        onFocus={() => handleFocus('email')}
                        onBlur={() => handleBlur('email')}
                      />
                      {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <select 
                        id="subject" 
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="General">General</option>
                        <option value="Project">Project</option>
                        <option value="Music Collab">Music Collab</option>
                        <option value="Support">Support</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message *</label>
                      <textarea 
                        id="message" 
                        name="message" 
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        className={`form-control ${formErrors.message ? 'error' : ''} ${validFields.message ? 'input-success' : ''}`}
                        required
                        placeholder="Tell us what you need..."
                        onFocus={() => handleFocus('message')}
                        onBlur={() => handleBlur('message')}
                      ></textarea>
                      {formErrors.message && <span className="error-message">{formErrors.message}</span>}
                    </div>

                    <div className="form-group file-upload">
                      <label htmlFor="file">
                        <span>Attach File (optional)</span>
                      </label>
                      <input 
                        type="file" 
                        id="file" 
                        name="file"
                        onChange={handleFileChange}
                        className="form-control"
                      />
                      <p className="file-help">Max size: 5MB</p>
                    </div>

                    <button 
                      type="submit" 
                      className="send-button"
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                      <FaPaperPlane className={isSubmitting ? 'sending' : ''} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
  </>
);
};

export default Contact; 
   