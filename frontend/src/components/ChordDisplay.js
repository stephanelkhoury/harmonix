import React from 'react';
import './style/ChordDisplay.css';

function ChordDisplay({ chords = [] }) {
    if (!chords || chords.length === 0) {
        return <div style={{textAlign: 'center', color: '#888'}}>No chords detected yet.</div>;
    }
    return (
        <div className="chord-timeline">
            {chords.map((chord, idx) => (
                <div className="chord-card" key={idx}>
                    <span className="chord-label">{typeof chord === 'string' ? chord : chord.name}</span>
                    {chord.time && <span className="chord-time">{chord.time}s</span>}
                </div>
            ))}
        </div>
    );
}

export default ChordDisplay;