// Update the useEffect hook in Contact.js to include the ripple effect functionality
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
