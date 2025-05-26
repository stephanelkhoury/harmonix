// Test component to verify chord consolidation functionality
import React from 'react';

const ChordTimelineTest = () => {
  // Test data with consecutive identical chords
  const testChords = [
    { time: 0, chord: "C major" },
    { time: 1, chord: "C major" },
    { time: 2, chord: "C major" },
    { time: 3, chord: "F major" },
    { time: 4, chord: "G major" },
    { time: 5, chord: "G major" },
    { time: 6, chord: "A minor" },
    { time: 8, chord: "A minor" }, // 2-second gap, should still group
    { time: 10, chord: "D minor" }, // Should not group due to >2s gap
    { time: 11, chord: "D minor" },
    { time: 12, chord: "C major" }
  ];

  // Group consecutive identical chords (copy of the function from ChordTimeline)
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const groupedChords = groupConsecutiveChords(testChords);

  return (
    <div style={{ padding: '20px', backgroundColor: '#2c2c2c', color: 'white', margin: '20px', borderRadius: '8px' }}>
      <h3>Chord Consolidation Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Original Chords ({testChords.length}):</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {testChords.map((chord, index) => (
            <div key={index} style={{ 
              padding: '5px 10px', 
              backgroundColor: '#444', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {chord.chord} at {formatTime(chord.time)}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4>Grouped Chords ({groupedChords.length}):</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {groupedChords.map((group, index) => (
            <div key={index} style={{ 
              padding: '10px 15px', 
              backgroundColor: '#0066cc', 
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              <div>{group.chord}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {group.startTime === group.endTime 
                  ? formatTime(group.startTime)
                  : `${formatTime(group.startTime)} - ${formatTime(group.endTime)}`
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
        <p><strong>Expected Results:</strong></p>
        <ul>
          <li>C major should be grouped from 0:00 - 0:02 (3 consecutive chords)</li>
          <li>F major should appear alone at 0:03</li>
          <li>G major should be grouped from 0:04 - 0:05 (2 consecutive chords)</li>
          <li>A minor should be grouped from 0:06 - 0:08 (within 2-second gap)</li>
          <li>D minor should appear separately at 0:10 and 0:11 (gap too large)</li>
          <li>C major should appear alone at 0:12</li>
        </ul>
      </div>
    </div>
  );
};

export default ChordTimelineTest;
