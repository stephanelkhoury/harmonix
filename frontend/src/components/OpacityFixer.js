// OpacityFixer.js
// A component that fixes any inline opacity:0 styles directly in the DOM

import { useEffect } from 'react';

const OpacityFixer = () => {
  useEffect(() => {
    // Run immediately to fix any inline opacity issues
    const fixInlineOpacity = () => {
      // Specific selectors mentioned in the prompt
      const selectors = [
        '.story-image',
        '.service-card',
        '.value-card',
        '.timeline-item',
        '.testimonial-card',
        '.mission-box'
      ];
      
      // Target all elements with the specified selectors
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          // Remove inline opacity:0 style if present
          if (element.style.opacity === '0') {
            element.style.removeProperty('opacity');
          }
        });
      });
    };

    // Run the fix immediately
    fixInlineOpacity();
    
    // Also set an interval to catch any dynamically added elements
    const intervalId = setInterval(fixInlineOpacity, 1000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return null; // This component doesn't render anything
};

export default OpacityFixer;
