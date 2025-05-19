/**
 * This code adds a proper ripple effect implementation to the Contact.js file
 * To be added to the useEffect hook in Contact.js
 */

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
  
  // Return cleanup function
  return () => {
    buttons.forEach(button => {
      button.removeEventListener('click', createRipple);
    });
  };
};

// Add this to your CSS
const rippleCSS = `
/* Ripple effect for buttons */
.send-button, .cta-button, .social-links a {
  position: relative;
  overflow: hidden;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;
