// Simple YouTube Player for testing
import React, { useEffect, useRef } from 'react';
import './style/SimpleYoutubePlayer.css';

const SimpleYoutubePlayer = ({ videoId, onTimeUpdate }) => {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    // Load YouTube API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    // Initialize player when API is ready
    const initializePlayer = () => {
      if (playerRef.current && window.YT && window.YT.Player) {
        const player = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          height: '360',
          width: '100%',
          playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1
          },
          events: {
            'onStateChange': (event) => {
              // Start or stop time tracking based on player state
              if (event.data === window.YT.PlayerState.PLAYING) {
                startTimeTracking(event.target);
              } else {
                stopTimeTracking();
              }
            }
          }
        });
      }
    };
    
    // Start tracking the current playback time
    const startTimeTracking = (player) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (player && typeof player.getCurrentTime === 'function' && onTimeUpdate) {
          onTimeUpdate(player.getCurrentTime());
        }
      }, 200); // Update 5 times per second
    };
    
    // Stop tracking the current playback time
    const stopTimeTracking = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    // Handle YouTube API ready
    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else {
      window.onYouTubeIframeAPIReady = initializePlayer;
    }
    
    return () => {
      // Clean up on unmount
      stopTimeTracking();
      if (window.onYouTubeIframeAPIReady === initializePlayer) {
        window.onYouTubeIframeAPIReady = null;
      }
    };
  }, [videoId, onTimeUpdate]);

  return (
    <div className="simple-youtube-player">
      <div ref={playerRef}></div>
    </div>
  );
};

export default SimpleYoutubePlayer;
