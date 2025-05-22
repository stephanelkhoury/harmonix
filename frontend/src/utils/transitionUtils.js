/**
 * transitionUtils.js
 * Utilities for handling page transitions and animations
 */

/**
 * Takes a snapshot of the current page content to use during transitions
 * This helps with smooth transitions between pages
 */
export const takePageSnapshot = (callback) => {
  try {
    // Check if html2canvas is available (would need to be installed)
    if (typeof html2canvas !== 'undefined') {
      const mainContent = document.querySelector('.flex-grow-1');
      if (!mainContent) return;
      
      html2canvas(mainContent, {
        backgroundColor: null,
        logging: false,
        scale: window.devicePixelRatio * 0.5, // Lower resolution for performance
        allowTaint: true,
        useCORS: true,
      }).then(canvas => {
        // Convert canvas to data URL
        const imageUrl = canvas.toDataURL('image/jpeg', 0.5);
        
        if (callback && typeof callback === 'function') {
          callback(imageUrl);
        }
        return imageUrl;
      });
    }
  } catch (error) {
    console.log('Transition snapshot unavailable');
    return null;
  }
};

/**
 * Preloads necessary resources for a page before navigating
 * @param {string} path - The path to navigate to
 * @returns {Promise} - Resolves when resources are preloaded
 */
export const preloadPageResources = (path) => {
  return new Promise((resolve) => {
    // Only preload certain paths that have heavy resources
    const shouldPreload = [
      '/about',
      '/dashboard',
      '/analyze',
      '/tuner',
    ].some(route => path.includes(route));
    
    if (!shouldPreload) {
      resolve();
      return;
    }
    
    // Determine which resources to preload based on path
    let resourcesToPreload = [];
    
    if (path.includes('about')) {
      resourcesToPreload = [
        '/static/media/about-hero.jpg',
        '/static/media/team.jpg'
      ];
    } else if (path.includes('dashboard')) {
      resourcesToPreload = [
        '/static/media/dashboard-bg.jpg'
      ];
    }
    
    // Preload resources
    let loadedCount = 0;
    const totalToLoad = resourcesToPreload.length;
    
    if (totalToLoad === 0) {
      resolve();
      return;
    }
    
    resourcesToPreload.forEach(resource => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount >= totalToLoad) {
          resolve();
        }
      };
      img.src = resource;
    });
    
    // Fallback if images take too long
    setTimeout(resolve, 1000);
  });
};

export default {
  takePageSnapshot,
  preloadPageResources
};
