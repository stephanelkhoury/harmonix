import React from 'react';
import './style/ChordTimeline.css';

/**
 * ChordTimeline component displays the upcoming chords in a horizontal timeline
 */
const ChordTimeline = ({ chords, currentTime, duration, currentChordIndex, onChordClick }) => {
  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate visible time window (next 30 seconds)
  const timeWindowStart = currentTime;
  const timeWindowEnd = Math.min(currentTime + 30, duration);
  
  // Filter chords that fall within the visible time window
  const visibleChords = chords.filter(
    chord => chord.time >= timeWindowStart && chord.time <= timeWindowEnd
  );
  
  // Function to calculate position along the timeline
  const getPositionPercentage = (time) => {
    const windowDuration = timeWindowEnd - timeWindowStart;
    return windowDuration > 0 ? ((time - timeWindowStart) / windowDuration) * 100 : 0;
  };

  // Generate time markers for the timeline
  const generateTimeMarkers = () => {
    const markers = [];
    // Create a marker every 5 seconds
    const interval = 5;
    const startMarker = Math.ceil(timeWindowStart / interval) * interval;
    
    for (let time = startMarker; time <= timeWindowEnd; time += interval) {
      markers.push(
        <div 
          key={`marker-${time}`}
          className="timeline-time-marker"
          style={{ left: `${getPositionPercentage(time)}%` }}
          data-time={formatTime(time)}
        />
      );
    }
    
    return markers;
  };

  // Helper for showing tooltips on chord hover
  const getTooltipText = (chord) => {
    return `${chord.chord} at ${formatTime(chord.time)}. Click to jump to this chord, or right-click for details.`;
  };

  return (
    <div className="chord-timeline-container">
      <div className="timeline-header">
        <h3>Upcoming Chords</h3>
        <div className="timeline-range">
          {formatTime(timeWindowStart)} - {formatTime(timeWindowEnd)}
          <span className="timeline-help">
            <span className="help-icon">?</span>
            <span className="help-text">
              Click on any chord to jump to its position in the video.
              Right-click or Ctrl+click for detailed chord information.
              {!chords[currentChordIndex] ? " (Player loading, some features may be limited)" : ""}
            </span>
          </span>
        </div>
      </div>
      <div className="chord-timeline">
        <div 
          className="timeline-progress-bar"
          style={{ left: '0%' }} // Always at the left representing current time
        ></div>
        
        {/* Render the visible chords on the timeline */}
        {visibleChords.map((chord, index) => {
          // Find the actual index in the full chords array
          const chordIndex = chords.findIndex(c => c === chord);
          return (
            <div
              key={`timeline-chord-${index}`}
              className={`timeline-chord ${chord === chords[currentChordIndex] ? 'active' : ''}`}
              style={{ 
                left: `${getPositionPercentage(chord.time)}%`,
                width: `${Math.max(5, getPositionPercentage(chord.time + 2) - getPositionPercentage(chord.time))}%` // Ensure minimum width
              }}
              onClick={(e) => {
                try {
                  if (chordIndex !== -1) {
                    onChordClick(chordIndex, e);
                  }
                } catch (error) {
                  console.warn("Error handling chord click:", error);
                  // Fallback to just showing the chord time
                  alert(`Chord: ${chord.chord} at time ${formatTime(chord.time)}`);
                }
              }}
              onContextMenu={(e) => {
                try {
                  if (chordIndex !== -1) {
                    onChordClick(chordIndex, e);
                  }
                } catch (error) {
                  console.warn("Error handling chord context menu:", error);
                }
              }}
              title={getTooltipText(chord)}
            >
              <div className="timeline-chord-name">{chord.chord.split(' ')[0]}</div>
              <div className="timeline-chord-time">{formatTime(chord.time)}</div>
            </div>
          );
        })}
        
        {/* Time markers */}
        <div className="timeline-markers">
          {generateTimeMarkers()}
        </div>
      </div>
    </div>
  );
};

export default ChordTimeline;
