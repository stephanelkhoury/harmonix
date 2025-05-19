// Add this to the useEffect hook in Contact.js
useEffect(() => {
  // ... existing code ...
  
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
    // ... existing cleanup code ...
    
    // Cleanup ripple effect
    cleanupRipple();
    
    // ... rest of existing cleanup code ...
  };
}, []);
