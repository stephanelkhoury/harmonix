// ScrollAnimation.js
// This component adds scroll-based animations and touch interactions to the About page elements

import { useEffect } from 'react';

const ScrollAnimation = () => {
  useEffect(() => {
    // Function to check if an element is in viewport
    const isInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      // Adjust threshold based on device height for better mobile experience
      const threshold = window.innerHeight < 700 ? 0.9 : 0.8;
      return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * threshold &&
        rect.bottom >= 0
      );
    };

    // Function to handle scroll and add 'visible' class to elements
    const handleVisibilityCheck = () => {
      // Performance optimization: Use requestAnimationFrame
      requestAnimationFrame(() => {
        // Elements to animate with their CSS selectors
        const elementSelectors = [
          '.about-page h2',
          '.mission-box',
          '.vision-image',
          '.story-image',
          '.service-card',
          '.value-card',
          '.timeline-item',
          '.testimonial-card'
        ];

        // Process each type of element
        elementSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach((element, index) => {
            if (isInViewport(element) && !element.classList.contains('visible')) {
              // Apply staggered delay based on element type and index
              let delay = 0;
              
              if (selector === '.service-card' || selector === '.value-card') {
                delay = 100 * index;
              } else if (selector === '.timeline-item' || selector === '.testimonial-card') {
                delay = 150 * index;
              }
              
              if (delay > 0) {
                setTimeout(() => {
                  element.classList.add('visible');
                }, delay);
              } else {
                element.classList.add('visible');
              }
            }
          });
        });
      });
    };

    // Handle touch interactions for mobile devices
    const addTouchInteractions = () => {
      // Add touch feedback to cards and buttons
      const interactiveElements = document.querySelectorAll(
        '.service-card, .value-card, .testimonial-card, .btn, .timeline-content'
      );
      
      interactiveElements.forEach(element => {
        // Touch start effect
        element.addEventListener('touchstart', function() {
          this.style.transition = 'transform 0.2s ease-out';
          this.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        // Touch end effect
        element.addEventListener('touchend', function() {
          this.style.transition = 'transform 0.3s ease-out';
          this.style.transform = '';
        }, { passive: true });
        
        // Cancel touch effect if moved (for scrolling)
        element.addEventListener('touchmove', function() {
          this.style.transition = 'transform 0.3s ease-out';
          this.style.transform = '';
        }, { passive: true });
      });
    };

    // Add initial loading animation
    const addInitialLoadingAnimation = () => {
      // Hide all animated elements initially
      document.querySelectorAll('.mission-box, .vision-image, .story-image, .service-card, .value-card, .timeline-item, .testimonial-card')
        .forEach(element => {
          element.style.opacity = '0';
        });
      
      // Show the elements that are visible on initial load with a small delay
      setTimeout(() => {
        handleVisibilityCheck();
      }, 300);
    };
    
    // Add scroll event listener with throttling for performance
    let scrollTimeout;
    const handleScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleVisibilityCheck();
          scrollTimeout = null;
        }, 100); // Throttle to run at most every 100ms
      }
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleVisibilityCheck, { passive: true });
    
    // For mobile devices
    window.addEventListener('touchmove', handleScroll, { passive: true });
    
    // Initialize
    addTouchInteractions();
    addInitialLoadingAnimation();
    
    // Clean up the event listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleVisibilityCheck);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ScrollAnimation;
