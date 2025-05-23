// Simplified YouTube Player component for Lyrics Identifier
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import './style/LyricsYoutubePlayer.css';

const LyricsYoutubePlayer = ({ videoId, height = "360" }) => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [playerStatus, setPlayerStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize YouTube player when component mounts
  useEffect(() => {
    console.log("LyricsYoutubePlayer component mounted, videoId:", videoId);
    setPlayerStatus('loading');
    
    // Clear the player reference element first
    if (playerRef.current) {
      playerRef.current.innerHTML = '';
    }
    
    // Helper function for API loading
    const loadYTAPI = () => {
      // Remove any existing YouTube iframe API scripts first
      const existingScripts = document.querySelectorAll('script[src*="youtube.com/iframe_api"]');
      existingScripts.forEach(script => script.remove());
      
      if (!window.YT || !window.YT.Player) {
        // Load YouTube API if not loaded
        console.log("Loading YouTube API...");
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        
        // Set up error handling for script loading
        tag.onerror = () => {
          console.error("Failed to load YouTube API");
          setPlayerStatus('error');
          setErrorMessage('Failed to load YouTube player. Please check your internet connection.');
        };
        
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Set up YouTube API callback
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API ready");
          initializePlayer();
        };
      } else {
        // API already loaded, initialize player directly
        console.log("YouTube API already loaded");
        initializePlayer();
      }
    };
    
    // Initialize the YouTube player
    const initializePlayer = () => {
      if (!playerRef.current) return;
      
      try {
        console.log("Initializing YouTube player with videoId:", videoId);
        const newPlayer = new window.YT.Player(playerRef.current, {
          height: height,
          width: '100%',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
          }
        });
        
        setPlayer(newPlayer);
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
        setPlayerStatus('error');
        setErrorMessage('Failed to initialize YouTube player. Please try again.');
      }
    };
    
    // Handler for when the player is ready
    const onPlayerReady = (event) => {
      console.log("YouTube player ready");
      setPlayerStatus('ready');
      setDuration(event.target.getDuration());
      setVolume(event.target.getVolume());
      startTimeTracking();
    };
    
    // Handler for player state changes
    const onPlayerStateChange = (event) => {
      // YT.PlayerState.PLAYING = 1, YT.PlayerState.PAUSED = 2
      if (event.data === 1) {
        setIsPlaying(true);
        startTimeTracking();
      } else if (event.data === 2) {
        setIsPlaying(false);
        stopTimeTracking();
      }
    };
    
    // Handler for player errors
    const onPlayerError = (event) => {
      console.error("YouTube player error:", event);
      setPlayerStatus('error');
      
      // Map error codes to user-friendly messages
      const errorMessages = {
        2: 'Invalid video ID',
        5: 'HTML5 player error',
        100: 'Video not found or removed',
        101: 'Video owner does not allow embedding',
        150: 'Video owner does not allow embedding'
      };
      
      setErrorMessage(errorMessages[event.data] || 'An error occurred with the YouTube player');
    };
    
    // Load the YouTube API
    loadYTAPI();
    
    // Clean up function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (player && player.destroy) {
        player.destroy();
      }
      if (window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = null;
      }
    };
  }, [videoId, height]);
  
  // Start tracking the current playback time
  const startTimeTracking = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (player && player.getCurrentTime) {
        setCurrentTime(player.getCurrentTime());
      }
    }, 500);
  };
  
  // Stop tracking the current playback time
  const stopTimeTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Play/pause toggle
  const togglePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };
  
  // Mute/unmute toggle
  const toggleMute = () => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };
  
  // Update volume
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };
  
  // Handle seeking in the video
  const handleSeek = (e) => {
    if (!player || !duration) return;
    
    const seekBar = e.currentTarget;
    const rect = seekBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / seekBar.offsetWidth) * duration;
    
    player.seekTo(seekTime, true);
  };
  
  // Format time (seconds) to MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="youtube-player">
      {/* Player container */}
      {playerStatus === 'loading' && (
        <div className="player-placeholder d-flex justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {playerStatus === 'error' && (
        <div className="player-placeholder d-flex justify-content-center align-items-center text-danger">
          <div>
            <i className="fas fa-exclamation-triangle mb-2"></i>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}
      
      <div ref={playerRef} className={playerStatus === 'ready' ? '' : 'd-none'}></div>
      
      {/* Player controls */}
      <div className="player-controls mt-2">
        <div className="d-flex justify-content-between align-items-center">
          {/* Play/pause button */}
          <button className="btn btn-sm btn-outline-secondary" onClick={togglePlay}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          
          {/* Time display */}
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          {/* Volume control */}
          <div className="volume-control d-flex align-items-center">
            <button className="btn btn-sm btn-outline-secondary" onClick={toggleMute}>
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={handleVolumeChange}
              className="form-range volume-slider ms-2"
            />
          </div>
        </div>
        
        {/* Progress bar */}
        <div 
          className="progress mt-2 seek-bar"
          onClick={handleSeek}
        >
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
            aria-valuenow={currentTime} 
            aria-valuemin="0" 
            aria-valuemax={duration}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LyricsYoutubePlayer;
