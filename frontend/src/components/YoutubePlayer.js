// Youtube Player component with synchronized chord visualization
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaForward, FaBackward, FaGuitar, FaInfoCircle } from 'react-icons/fa';
import ChordDiagram from './ChordDiagram';
import ChordDetailModal from './ChordDetailModal';
import ChordTimeline from './ChordTimeline';
import './style/YoutubePlayer.css';

const YoutubePlayer = ({ videoId, chords, songKey, tempo }) => {
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [selectedChord, setSelectedChord] = useState(null);
  const [showChordModal, setShowChordModal] = useState(false);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const timelineRef = useRef(null);

  // Initialize YouTube player when component mounts
  useEffect(() => {
    console.log("YoutubePlayer component mounted, videoId:", videoId);
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

        // Set up API ready callback
        window.onYouTubeIframeAPIReady = () => {
          console.log("YouTube API is ready");
          if (videoId) {
            loadPlayer();
          }
        };
        
        // Set up a timeout in case the API never loads
        setTimeout(() => {
          if (!window.YT || !window.YT.Player) {
            console.error("YouTube API failed to load after timeout");
            setPlayerStatus('error');
            setErrorMessage('YouTube player failed to load. Try refreshing the page.');
          }
        }, 10000); // 10 seconds timeout
      } else {
        console.log("YouTube API already loaded");
        loadPlayer();
      }
    };
    
    // Call the loader after a small delay to ensure DOM is ready
    if (videoId) {
      setTimeout(loadYTAPI, 300); // Increased delay for better reliability
    } else {
      console.warn("No videoId provided to YoutubePlayer component");
      setPlayerStatus('error');
      setErrorMessage('No YouTube video ID provided');
    }

    // Clean up when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Clean up player if it exists
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (e) {
          console.warn("Error destroying player on unmount:", e);
        }
      }
    };
  }, [videoId]);

  // Load the YouTube player
  const loadPlayer = () => {
    if (playerRef.current && window.YT) {
      try {
        console.log("Initializing YouTube player for video ID:", videoId);
        
        // Clear any previous player instance
        if (player) {
          try {
            player.destroy();
          } catch (e) {
            console.warn("Error destroying previous player:", e);
          }
        }
        
        // First clear the container to avoid issues
        if (playerRef.current) {
          playerRef.current.innerHTML = '';
        }
        
        // Create a new player instance with more options for better compatibility
        const ytPlayer = new window.YT.Player(playerRef.current, {
          videoId: videoId,
          height: '360',
          width: '640',
          playerVars: {
            autoplay: 1, // Try autoplaying
            controls: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin, // Important for CORS
            enablejsapi: 1,
            playsinline: 1, // Important for mobile
            fs: 1, // Allow fullscreen
            iv_load_policy: 3 // Hide annotations
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: (e) => {
              console.error("YouTube player error:", e.data);
              // Show user-friendly error based on error code
              let errorMessage = "Unknown error";
              switch (e.data) {
                case 2:
                  errorMessage = "Invalid video ID. Please check the YouTube URL.";
                  break;
                case 5:
                  errorMessage = "HTML5 player error. Please try a different browser.";
                  break;
                case 100:
                  errorMessage = "Video not found or removed from YouTube.";
                  break;
                case 101:
                case 150:
                  errorMessage = "Video owner does not allow embedding. Try a different video.";
                  break;
              }
              console.error(errorMessage);
              
              // Update player status
              setPlayerStatus('error');
              setErrorMessage(errorMessage);
              
              // Notify the user with more details
              if (playerRef.current) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'youtube-error-overlay';
                errorDiv.innerHTML = `
                  <div class="youtube-error-content">
                    <h3>Video Error</h3>
                    <p>${errorMessage}</p>
                    <p>Error code: ${e.data}</p>
                  </div>
                `;
                
                // Clean up any existing error messages
                const existingError = playerRef.current.querySelector('.youtube-error-overlay');
                if (existingError) {
                  existingError.remove();
                }
                
                // Append only if the player element exists
                if (playerRef.current.parentNode) {
                  playerRef.current.parentNode.appendChild(errorDiv);
                }
              }
            }
          },
        });
        
        // Don't setPlayer here, as it might not be fully initialized
        // We'll set it in the onPlayerReady event instead
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    } else {
      console.error("YouTube API or player reference not available");
      
      // If reference is missing, try recreating the element
      if (playerRef.current) {
        playerRef.current.innerHTML = `
          <div style="color:white; text-align:center; padding: 20px;">
            <p>Error loading YouTube player. Please make sure:</p>
            <ol>
              <li>You have a stable internet connection</li>
              <li>You're not blocking YouTube</li>
              <li>The video is available and can be embedded</li>
            </ol>
            <button id="retry-youtube" style="padding: 8px 16px; background: #2a75e0; color: white; border: none; border-radius: 4px;">
              Retry Loading
            </button>
          </div>
        `;
        
        // Add event listener to retry button
        const retryBtn = document.getElementById('retry-youtube');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            playerRef.current.innerHTML = '';
            setTimeout(loadYTAPI, 100);
          });
        }
      }
    }
  };

  const onPlayerReady = (event) => {
    // Make sure we have a valid player object
    if (event.target && typeof event.target.getDuration === 'function') {
      try {
        const duration = event.target.getDuration();
        setDuration(duration);
        setVolume(event.target.getVolume());

        // Save the player directly from the event
        // This ensures we have the fully initialized player with all methods
        setPlayer(event.target);
        console.log("YouTube player successfully initialized with all methods available");
        
        // Update player status
        setPlayerStatus('ready');
        setErrorMessage('');
        
        // Start the player's time update interval
        startTimeUpdateInterval();
        
        // Try to play the video automatically if possible
        try {
          event.target.playVideo();
          console.log("Auto-play initiated");
        } catch (err) {
          console.warn("Could not auto-play video:", err);
        }
        
        if (duration <= 0) {
          console.warn("Video duration is 0 or not available, might indicate an issue with the video");
        }
      } catch (error) {
        console.error("Error in onPlayerReady:", error);
        setPlayerStatus('error');
        setErrorMessage('Error initializing video player');
      }
    } else {
      console.error("YouTube player ready event called but player object is not fully initialized");
      setPlayerStatus('error');
      setErrorMessage('YouTube player failed to initialize');
    }
  };

  const onPlayerStateChange = (event) => {
    try {
      console.log("YouTube player state changed:", event.data);
      
      // YouTube Player States:
      // -1: unstarted
      // 0: ended
      // 1: playing
      // 2: paused
      // 3: buffering
      // 5: video cued
      
      // Update playing state based on player state
      setIsPlaying(event.data === 1);
      
      switch(event.data) {
        case -1:
          console.log("Video unstarted");
          // This is normal at first, but if it persists, might indicate a problem
          // We'll only show loading state if we're not already in a ready state
          if (playerStatus !== 'ready') {
            setPlayerStatus('loading');
          }
          break;
        case 0:
          console.log("Video ended");
          stopTimeUpdateInterval();
          break;
        case 1:
          console.log("Video playing");
          // Video is definitely working if we got here
          setPlayerStatus('ready');
          startTimeUpdateInterval();
          break;
        case 2:
          console.log("Video paused");
          stopTimeUpdateInterval();
          break;
        case 3:
          console.log("Video buffering");
          // Video is at least partially working if it's buffering
          if (playerStatus === 'error') {
            setPlayerStatus('loading');
          }
          break;
        case 5:
          console.log("Video cued - ready to play");
          // Video is loaded and ready
          setPlayerStatus('ready');
          break;
        default:
          console.log("Unknown player state:", event.data);
      }
    } catch (error) {
      console.error("Error in onPlayerStateChange:", error);
      setPlayerStatus('error');
      setErrorMessage('Error during video playback');
    }
  };
  
  // Start time update interval
  const startTimeUpdateInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      try {
        if (player && typeof player.getCurrentTime === 'function') {
          const currentTime = player.getCurrentTime();
          setCurrentTime(currentTime);
          updateCurrentChord(currentTime);
        }
      } catch (error) {
        console.error("Error updating time:", error);
      }
    }, 100); // Check 10 times per second for smoother transitions
  };
  
  // Stop time update interval
  const stopTimeUpdateInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Update the current chord based on playback time
  const updateCurrentChord = (time) => {
    if (!chords || chords.length === 0) return;
    
    for (let i = chords.length - 1; i >= 0; i--) {
      if (time >= chords[i].time) {
        setCurrentChordIndex(i);
        break;
      }
    }
  };

  // Seek to specific chord
  const seekToChord = (index) => {
    if (player && chords && chords[index]) {
      try {
        if (typeof player.seekTo === 'function') {
          player.seekTo(chords[index].time, true);
          setCurrentChordIndex(index); // Update current chord index
        } else {
          console.warn("YouTube player seekTo method not available yet. Player state:", player);
        }
      } catch (error) {
        console.error("Error seeking to chord:", error);
      }
    }
  };
  
  // Open chord detail modal
  const handleChordClick = (index, event) => {
    try {
      // Make sure we have valid chord data
      if (!chords || !chords[index]) {
        console.warn("Invalid chord index:", index);
        return;
      }
      
      // If right-click or with modifier key, show chord details
      if (event.ctrlKey || event.metaKey || event.button === 2) {
        event.preventDefault();
        setSelectedChord(chords[index]);
        setShowChordModal(true);
      } else {
        // Regular click - seek to chord time
        console.log(`Seeking to chord at index ${index}, time: ${chords[index].time}`);
        
        // Check if the player is ready before seeking
        if (!player || typeof player.seekTo !== 'function') {
          console.warn("YouTube player not ready yet, can't seek");
          // Still update the currentChordIndex to highlight the selected chord
          setCurrentChordIndex(index);
        } else {
          seekToChord(index);
        }
      }
    } catch (error) {
      console.error("Error in handleChordClick:", error);
    }
  };
  
  // Close chord modal
  const closeChordModal = () => {
    setShowChordModal(false);
    setSelectedChord(null);
  };

  // Handle timeline click to seek
  const handleTimelineClick = (e) => {
    if (player && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const position = (e.clientX - rect.left) / rect.width;
      const seekTime = duration * position;
      player.seekTo(seekTime, true);
    }
  };

  // Control functions
  const togglePlay = () => {
    if (player) {
      try {
        if (isPlaying) {
          player.pauseVideo();
        } else {
          // Try to play and handle any potential errors
          const playPromise = player.playVideo();
          
          // Some browsers return a promise from play()
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Error playing video:", error);
              
              // Create a visual message for the user
              const playerElement = playerRef.current?.parentNode;
              if (playerElement) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'player-message';
                messageDiv.textContent = 'Video playback was blocked. Click to play.';
                messageDiv.style.position = 'absolute';
                messageDiv.style.top = '50%';
                messageDiv.style.left = '50%';
                messageDiv.style.transform = 'translate(-50%, -50%)';
                messageDiv.style.background = 'rgba(0,0,0,0.7)';
                messageDiv.style.color = 'white';
                messageDiv.style.padding = '10px 20px';
                messageDiv.style.borderRadius = '4px';
                messageDiv.style.cursor = 'pointer';
                messageDiv.style.zIndex = '10';
                
                playerElement.appendChild(messageDiv);
                
                // Remove the message when clicked
                messageDiv.addEventListener('click', () => {
                  player.playVideo();
                  messageDiv.remove();
                });
                
                // Auto-remove after 5 seconds
                setTimeout(() => messageDiv.remove(), 5000);
              }
            });
          }
        }
      } catch (error) {
        console.error("Error toggling play state:", error);
      }
    } else {
      console.warn("Player not initialized yet, can't toggle play state");
      
      // Try reinitializing the player
      if (window.YT && playerRef.current) {
        console.log("Attempting to reinitialize player...");
        loadPlayer();
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    if (player) {
      player.setVolume(newVolume);
      setVolume(newVolume);
      
      // If changing volume from 0 or to 0, handle mute state
      if (newVolume === 0 && !isMuted) {
        setIsMuted(true);
      } else if (newVolume > 0 && isMuted) {
        player.unMute();
        setIsMuted(false);
      }
    }
  };

  const goForward = () => {
    if (player) {
      const newTime = Math.min(currentTime + 10, duration);
      player.seekTo(newTime, true);
    }
  };

  const goBackward = () => {
    if (player) {
      const newTime = Math.max(currentTime - 10, 0);
      player.seekTo(newTime, true);
    }
  };

  const nextChord = () => {
    if (currentChordIndex < chords.length - 1) {
      seekToChord(currentChordIndex + 1);
    }
  };

  const previousChord = () => {
    if (currentChordIndex > 0) {
      seekToChord(currentChordIndex - 1);
    }
  };

  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate beat positions based on tempo
  const calculateBeatPositions = () => {
    if (!tempo || tempo <= 0 || !duration) return [];

    const beatInterval = 60 / tempo; // seconds between beats
    const beats = [];
    let currentBeat = 0;

    while (currentBeat < duration) {
      beats.push(currentBeat);
      currentBeat += beatInterval;
    }

    return beats;
  };

  // Generate chord diagram data
  const getChordDiagramData = (chordName) => {
    // This is a simplified chord diagram generator
    // In a real implementation, you would have a comprehensive chord dictionary
    const basicChords = {
      'C': [{string: 0, fret: 3}, {string: 1, fret: 2}, {string: 2, fret: 0}, {string: 3, fret: 0}, {string: 4, fret: 0}],
      'D': [{string: 0, fret: 2}, {string: 1, fret: 0}, {string: 2, fret: 0}, {string: 3, fret: 2}, {string: 4, fret: 3}],
      'E': [{string: 0, fret: 0}, {string: 1, fret: 0}, {string: 2, fret: 1}, {string: 3, fret: 2}, {string: 4, fret: 2}, {string: 5, fret: 0}],
      'F': [{string: 0, fret: 1}, {string: 1, fret: 1}, {string: 2, fret: 2}, {string: 3, fret: 3}, {string: 4, fret: 3}, {string: 5, fret: 1}],
      'G': [{string: 0, fret: 3}, {string: 1, fret: 2}, {string: 2, fret: 0}, {string: 3, fret: 0}, {string: 4, fret: 0}, {string: 5, fret: 3}],
      'A': [{string: 0, fret: 0}, {string: 1, fret: 2}, {string: 2, fret: 2}, {string: 3, fret: 2}, {string: 4, fret: 0}],
      'B': [{string: 0, fret: 2}, {string: 1, fret: 4}, {string: 2, fret: 4}, {string: 3, fret: 4}, {string: 4, fret: 2}],
      'Am': [{string: 0, fret: 0}, {string: 1, fret: 1}, {string: 2, fret: 2}, {string: 3, fret: 2}, {string: 4, fret: 0}],
      'Em': [{string: 0, fret: 0}, {string: 1, fret: 0}, {string: 2, fret: 0}, {string: 3, fret: 2}, {string: 4, fret: 2}, {string: 5, fret: 0}],
      'Dm': [{string: 0, fret: 1}, {string: 1, fret: 0}, {string: 2, fret: 0}, {string: 3, fret: 2}, {string: 4, fret: 3}],
    };
    
    // Extract root note, ignoring modifiers after the first character
    const root = chordName.charAt(0);
    const isMinor = chordName.toLowerCase().includes('m') || chordName.toLowerCase().includes('min');
    
    const chordKey = root + (isMinor ? 'm' : '');
    return basicChords[chordKey] || [];
  };

  const beats = calculateBeatPositions();

  // Track player status
  const [playerStatus, setPlayerStatus] = useState('loading'); // 'loading', 'ready', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  // Additional helper for player status
  const displayPlayerStatus = () => {
    if (playerStatus === 'loading' && !player) {
      return (
        <div className="player-status-overlay">
          <div className="player-status-icon">
            <FaPlay />
          </div>
          <div className="player-status-message">
            Loading YouTube player and video...
          </div>
        </div>
      );
    } else if (playerStatus === 'error') {
      return (
        <div className="player-status-overlay">
          <div className="player-status-icon">⚠️</div>
          <div className="player-status-message">
            {errorMessage || 'Error loading video. The video might be unavailable or cannot be embedded.'}
          </div>
          <button
            className="player-retry-button"
            onClick={() => {
              setPlayerStatus('loading');
              loadPlayer();
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="youtube-player-container">
      <div className="player-wrapper">
        <div ref={playerRef} className="yt-player"></div>
        {displayPlayerStatus()}
      </div>

      <div className="player-controls">
        <button className="control-button" onClick={previousChord}><FaBackward /></button>
        <button className="control-button" onClick={togglePlay}>
          {isPlaying ? <FaPause /> : <FaPlay />} {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="control-button" onClick={nextChord}><FaForward /></button>
        
        <div className="volume-control">
          <button className="control-button" onClick={toggleMute}>
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume} 
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
        
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div 
        className="timeline" 
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        <div className="time-progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
        {beats.map((beat, index) => (
          <div 
            key={`beat-${index}`}
            className="beat-marker"
            style={{ left: `${(beat / duration) * 100}%` }}
          />
        ))}
      </div>
      
      {/* ChordTimeline component */}
      {chords && chords.length > 0 && duration > 0 && (
        <ChordTimeline 
          chords={chords}
          currentTime={currentTime}
          duration={duration}
          currentChordIndex={currentChordIndex}
          onChordClick={handleChordClick}
        />
      )}
      
      <div className="chords-display">
        <div className="song-info">
          <div className="song-key">Key: {songKey}</div>
          <div className="song-tempo">Tempo: {Math.round(tempo)} BPM</div>
        </div>
        
        <div className="chord-progression">
          {chords && chords.map((chord, index) => {
            const diagramDots = getChordDiagramData(chord.chord.split(' ')[0]);
            
            return (
              <div 
                key={`chord-${index}`}
                className={`chord ${currentChordIndex === index ? 'current-chord' : ''}`}
                onClick={(e) => handleChordClick(index, e)}
                onContextMenu={(e) => handleChordClick(index, e)}
              >
                <div className="chord-name">{chord.chord.split(' ')[0]}</div>
                <div className="chord-type">{chord.chord.includes('minor') ? 'm' : ''}</div>
                <div className="chord-info-icon"><FaInfoCircle /></div>
                
                <div className="chord-diagram">
                  <ChordDiagram chordName={chord.chord.split(' ')[0]} />
                </div>
                
                <div className="chord-time">{formatTime(chord.time)}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Chord Detail Modal */}
      {showChordModal && selectedChord && (
        <ChordDetailModal 
          isOpen={showChordModal}
          onClose={closeChordModal}
          chord={selectedChord}
          time={selectedChord.time}
        />
      )}
    </div>
  );
};

export default YoutubePlayer;
