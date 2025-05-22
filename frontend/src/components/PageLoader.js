// PageLoader.js
// This component creates a loading animation for the initial page load and route transitions
// with advanced SVG animations and performance optimizations

import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import './style/PageLoader.css';

const PageLoader = ({ isLoading: externalLoading }) => {
  // Use external loading state if provided, otherwise manage internally
  const [internalLoading, setInternalLoading] = useState(true);
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const [progress, setProgress] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [useSimpleLoader, setUseSimpleLoader] = useState(false);
  const prevLoadingState = useRef(true);
  
  // Check browser compatibility for advanced features
  useEffect(() => {
    // Function to detect older browsers or IE
    const detectBrowserSupport = () => {
      // Check for IE (no support for CSS Grid or modern animations)
      const isIE = !!document.documentMode;
      // Check for Edge Legacy
      const isEdgeLegacy = !isIE && !!window.StyleMedia;
      // Check for very old browsers (approximate)
      const isOldBrowser = typeof window.CSS === 'undefined' || 
                          !window.CSS.supports || 
                          !window.CSS.supports('display', 'flex');
                          
      return isIE || isEdgeLegacy || isOldBrowser;
    };
    
    // Use simple loader for browsers with poor support
    setUseSimpleLoader(detectBrowserSupport());
  }, []);
  
  // Track if this is the initial page load or a subsequent navigation
  useEffect(() => {
    if (!isLoading && isFirstLoad) {
      setIsFirstLoad(false);
    }
    
    // Track loading state changes for animations
    prevLoadingState.current = isLoading;
  }, [isLoading, isFirstLoad]);
  
  // Monitor resource loading for more accurate progress tracking
  useEffect(() => {
    // Only activate this for the first page load
    if (!isFirstLoad) return;
    
    // Function to update progress based on document loading
    const updateResourceProgress = () => {
      if (document.readyState === 'interactive') {
        setProgress(prev => Math.max(prev, 60)); // DOM content loaded
      } else if (document.readyState === 'complete') {
        setProgress(100); // All resources loaded
      }
    };
    
    // Track CSS and font loading
    const trackAssetLoading = () => {
      let loadedFonts = 0;
      
      // Check if fonts are loaded
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          setProgress(prev => Math.max(prev, 80));
        });
      }
      
      // Track when stylesheets are loaded
      Array.from(document.querySelectorAll('link[rel="stylesheet"]')).forEach(stylesheet => {
        // If already loaded
        if (stylesheet.sheet) {
          setProgress(prev => Math.max(prev, 70));
        }
      });
    };
    
    document.addEventListener('readystatechange', updateResourceProgress);
    window.addEventListener('load', trackAssetLoading);
    
    // Update based on current state
    updateResourceProgress();
    trackAssetLoading();
    
    return () => {
      document.removeEventListener('readystatechange', updateResourceProgress);
      window.removeEventListener('load', trackAssetLoading);
    };
  }, [isFirstLoad]);

  // Progress tracking logic varies based on whether this is first load or a navigation
  const trackNavigationProgress = useCallback(() => {
    // Navigation animations should be faster than initial load
    // Start progress at a higher value for page transitions
    let currentProgress = 40;
    setProgress(currentProgress);
    
    const progressInterval = setInterval(() => {
      currentProgress += (95 - currentProgress) * 0.2; // Faster progression for navigation
      
      if (currentProgress > 90) {
        clearInterval(progressInterval);
      } else {
        setProgress(Math.round(currentProgress));
      }
    }, 100); // Faster interval for navigation
    
    return progressInterval;
  }, []);
  
  useEffect(() => {
    // Only track progress internally if external loading state isn't provided
    if (externalLoading !== undefined) {
      let progressInterval;
      
      if (externalLoading) {
        // If we're loading and it's not the first load, trigger faster animation
        if (!isFirstLoad) {
          progressInterval = trackNavigationProgress();
        } else {
          // Initial page load - slower progress animation
          let currentProgress = 10;
          setProgress(currentProgress);
          
          // Increment progress at intervals to simulate loading progress
          progressInterval = setInterval(() => {
            // Advance progress, but slow down as we get closer to 90%
            currentProgress += (95 - currentProgress) * 0.1;
            
            if (currentProgress > 90) {
              clearInterval(progressInterval);
            } else {
              setProgress(Math.round(currentProgress));
            }
          }, 150);
        }
      } else {
        setProgress(100);
      }
      
      return () => {
        if (progressInterval) clearInterval(progressInterval);
      };
    }
    
    // Original initial page load code for when no external loading state is provided
    const trackProgress = () => {
      // Start with an initial progress of 10%
      let currentProgress = 10;
      setProgress(currentProgress);
      
      // Increment progress at intervals to simulate loading progress
      const progressInterval = setInterval(() => {
        // Advance progress, but slow down as we get closer to 90%
        currentProgress += (95 - currentProgress) * 0.1;
        
        if (currentProgress > 90) {
          clearInterval(progressInterval);
        } else {
          setProgress(Math.round(currentProgress));
        }
      }, 150);

      // Handle document fully loaded
      window.addEventListener('load', () => {
        clearInterval(progressInterval);
        setProgress(100);
        
        // Add a small delay after reaching 100% before hiding loader
        setTimeout(() => {
          setInternalLoading(false);
        }, 300);
      });
      
      // Fallback timer in case 'load' event doesn't fire
      const fallbackTimer = setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        setInternalLoading(false);
      }, 3000);
      
      return () => {
        clearInterval(progressInterval);
        clearTimeout(fallbackTimer);
        window.removeEventListener('load', () => {});
      };
    };
    
    // Start tracking progress
    trackProgress();
  }, [externalLoading, progress]);
  
  // Optimize rendering of particles with memoization
  const renderParticles = React.useMemo(() => {
    return [...Array(6)].map((_, i) => (
      <circle 
        key={i}
        className={`loader-particle particle-${i+1}`}
        cx={25 + Math.random() * 50}
        cy={25 + Math.random() * 50}
        r={1 + Math.random() * 2}
        fill="#8C94F1"
        opacity={0.6 + Math.random() * 0.4}
      />
    ));
  }, []);

  // Choose the appropriate animation mode based on whether it's first load or navigation
  const loaderClass = isLoading 
    ? isFirstLoad ? 'loading' : 'loading-navigation' 
    : 'loaded';

  // SVG music icon for decoration around the loader
  const renderMusicIcons = React.useMemo(() => {
    // Create an array of musical note icons at different positions
    const icons = [
      { icon: 'M24,6 L24,24 C24,27.314 21.314,30 18,30 S12,27.314 12,24 S14.686,18 18,18 C19.105,18 20.1,18.295 21,18.816 V6 H32 V12 H24', size: 36, x: 15, y: 15, delay: 0.5 },
      { icon: 'M24,6 L24,24 C24,27.314 21.314,30 18,30 S12,27.314 12,24 S14.686,18 18,18 C19.105,18 20.1,18.295 21,18.816 V6 H32 V12 H24', size: 24, x: 75, y: 20, delay: 1.2 },
      { icon: 'M15,30 L15,10 L30,13 L30,33 M15,15 L30,18', size: 30, x: 60, y: 70, delay: 0.8 },
      { icon: 'M15,30 L15,10 L30,13 L30,33 M15,15 L30,18', size: 20, x: 25, y: 65, delay: 1.5 },
    ];

    return icons.map((item, index) => (
      <svg 
        key={index}
        className="loader-music-icon"
        width={item.size} 
        height={item.size}
        viewBox="0 0 44 44"
        style={{
          position: 'absolute',
          top: `${item.y}%`,
          left: `${item.x}%`,
          opacity: 0,
          animationDelay: `${item.delay}s`
        }}
      >
        <path 
          d={item.icon}
          fill="none"
          stroke="rgba(140, 148, 241, 0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ));
  }, []);

  // Simple loader fallback for older browsers
  if (useSimpleLoader) {
    return (
      <div className={`page-loader simple-loader ${isLoading ? 'loading' : 'loaded'}`}>
        <div className="loader-content simple">
          <div className="simple-loader-spinner"></div>
          <div className="loader-text">Harmonix</div>
          <div className="loader-progress">
            <div className="loader-bar" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Modern browser experience
  return (
    <div className={`page-loader ${loaderClass}`}>
      <div className="loader-content">
        <div className="loader-logo">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0DA1C0" />
                <stop offset="50%" stopColor="#3b7dad" />
                <stop offset="100%" stopColor="#8C94F1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle className="loader-circle" cx="50" cy="50" r="40" />
            <path className="loader-wave" d="M20,50 Q35,40 50,50 Q65,60 80,50" />
            <g className="loader-particles" filter="url(#glow)">
              {renderParticles}
            </g>
          </svg>
          
          {/* Musical note icons floating around - only show during navigation, not initial load */}
          {!isFirstLoad && renderMusicIcons}
        </div>
        <div className="loader-text">Harmonix</div>
        <div className="loader-progress">
          <div className="loader-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="loader-status">{progress}%</div>
      </div>
    </div>
  );
};

// Export as memoized component to prevent unnecessary re-renders
export default memo(PageLoader);
