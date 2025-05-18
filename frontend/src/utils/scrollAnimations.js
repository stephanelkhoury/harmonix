// Utility for scroll-triggered animations using Intersection Observer
export const setupScrollAnimations = () => {
  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.15 // trigger when at least 15% of the element is visible
  };

  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // If element is in view
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        // Only animate once
        animateOnScroll.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with the 'scroll-animation' class
  document.querySelectorAll('.scroll-animation').forEach(element => {
    animateOnScroll.observe(element);
  });

  return animateOnScroll;
};

// Add blur effect on scroll
export const setupScrollBlurEffects = () => {
  let lastScrollTop = 0;
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
    
    // Elements with blur-on-scroll class
    document.querySelectorAll('.blur-on-scroll').forEach(elem => {
      const boundingRect = elem.getBoundingClientRect();
      const elementCenter = boundingRect.top + boundingRect.height / 2;
      const viewportHeight = window.innerHeight;
      
      // Calculate blur based on position in viewport
      let blurAmount = 0;
      if (elementCenter > 0 && elementCenter < viewportHeight) {
        // Element is in viewport
        const distanceFromCenter = Math.abs(viewportHeight / 2 - elementCenter);
        const maxDistance = viewportHeight / 2;
        blurAmount = (distanceFromCenter / maxDistance) * 5; // Max 5px blur
      } else {
        blurAmount = 5; // Max blur when out of viewport
      }
      
      elem.style.filter = `blur(${blurAmount}px)`;
    });
    
    lastScrollTop = scrollTop;
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
};
