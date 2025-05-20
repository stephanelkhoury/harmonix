import React from 'react';
import ChordDiagram from './ChordDiagram';
import './style/ChordDetailModal.css';

/**
 * Modal component to show detailed chord information
 */
const ChordDetailModal = ({ isOpen, onClose, chord, time }) => {
  if (!isOpen) return null;

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Extract chord name without modifiers
  const chordName = chord.chord.split(' ')[0];
  
  // Get chord type (major, minor, etc)
  const getChordType = (chordText) => {
    if (chordText.includes('minor')) return 'Minor';
    if (chordText.includes('major')) return 'Major';
    if (chordText.includes('7')) return '7th';
    if (chordText.includes('dim')) return 'Diminished';
    if (chordText.includes('aug')) return 'Augmented';
    return 'Major'; // Default to major
  };
  
  const chordType = getChordType(chord.chord);

  // Chord voicing descriptions
  const getChordDescription = (name, type) => {
    const root = name.charAt(0);
    if (type === 'Minor') {
      return `${root} Minor chord is made up of the notes: ${root}, ${root}♭3, ${root}5`;
    } else if (type === '7th') {
      return `${root}7 chord is made up of the notes: ${root}, ${root}3, ${root}5, ${root}♭7`;
    } else {
      return `${root} Major chord is made up of the notes: ${root}, ${root}3, ${root}5`;
    }
  };

  // Get chord strumming pattern suggestion
  const getSuggestionPattern = () => {
    return 'D DU UDU (Down, Down-Up, Up-Down-Up)';
  };

  return (
    <div className="modal-backdrop">
      <div className="chord-detail-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>{chordName} <span className="chord-type">{chordType}</span></h2>
          <div className="time-tag">at {formatTime(chord.time)}</div>
        </div>
        
        <div className="modal-content">
          <div className="diagram-section">
            <ChordDiagram chordName={chordName} showFull={true} />
          </div>
          
          <div className="details-section">
            <div className="chord-description">
              <h3>Chord Structure</h3>
              <p>{getChordDescription(chordName, chordType)}</p>
            </div>
            
            <div className="playing-tips">
              <h3>Playing Tips</h3>
              <ul>
                <li>Make sure all strings ring clearly</li>
                <li>Keep your wrist relaxed</li>
                <li>Place fingers close to the fret</li>
              </ul>
            </div>
            
            <div className="strumming-pattern">
              <h3>Suggested Strumming</h3>
              <div className="pattern">{getSuggestionPattern()}</div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="action-button" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
};

export default ChordDetailModal;
