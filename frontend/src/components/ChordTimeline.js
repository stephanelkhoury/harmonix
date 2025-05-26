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
  
  // Group consecutive identical chords
  const groupConsecutiveChords = (chordList) => {
    if (!chordList || chordList.length === 0) return [];
    
    const grouped = [];
    let currentGroup = {
      chord: chordList[0].chord,
      startTime: chordList[0].time,
      endTime: chordList[0].time,
      originalIndex: 0
    };
    
    for (let i = 1; i < chordList.length; i++) {
      const currentChord = chordList[i];
      const prevChord = chordList[i - 1];
      
      // If same chord and consecutive time (within 2 seconds gap)
      if (currentChord.chord === currentGroup.chord && 
          currentChord.time - prevChord.time <= 2) {
        currentGroup.endTime = currentChord.time;
      } else {
        // Finalize current group and start new one
        grouped.push(currentGroup);
        currentGroup = {
          chord: currentChord.chord,
          startTime: currentChord.time,
          endTime: currentChord.time,
          originalIndex: i
        };
      }
    }
    
    // Add the last group
    grouped.push(currentGroup);
    return grouped;
  };

  // Filter chords that fall within the visible time window
  const windowChords = chords.filter(
    chord => chord.time >= timeWindowStart && chord.time <= timeWindowEnd
  );
  
  // Group consecutive identical chords
  const groupedChords = groupConsecutiveChords(windowChords);
  
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
        
        {/* Render the grouped chords on the timeline */}
        {groupedChords.map((chordGroup, index) => {
          // Find the actual index in the full chords array for the start of this group
          const chordIndex = chords.findIndex(c => c.time === chordGroup.startTime && c.chord === chordGroup.chord);
          const isActive = currentTime >= chordGroup.startTime && currentTime <= chordGroup.endTime + 1;
          const groupWidth = Math.max(5, getPositionPercentage(chordGroup.endTime + 1) - getPositionPercentage(chordGroup.startTime));
          
          return (
            <div
              key={`timeline-chord-group-${index}`}
              className={`timeline-chord ${isActive ? 'active' : ''}`}
              style={{ 
                left: `${getPositionPercentage(chordGroup.startTime)}%`,
                width: `${groupWidth}%`
              }}
              onClick={(e) => {
                try {
                  if (chordIndex !== -1) {
                    onChordClick(chordIndex, e);
                  }
                } catch (error) {
                  console.warn("Error handling chord click:", error);
                  // Fallback to just showing the chord time
                  alert(`Chord: ${chordGroup.chord} at time ${formatTime(chordGroup.startTime)}`);
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
              title={`${chordGroup.chord} from ${formatTime(chordGroup.startTime)} to ${formatTime(chordGroup.endTime)}. Click to jump to this chord.`}
            >
              <div className="timeline-chord-name">{chordGroup.chord.split(' ')[0]}</div>
              <div className="timeline-chord-time">
                {chordGroup.startTime === chordGroup.endTime 
                  ? formatTime(chordGroup.startTime)
                  : `${formatTime(chordGroup.startTime)} - ${formatTime(chordGroup.endTime)}`
                }
              </div>
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
