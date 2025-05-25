import React, { useState, useEffect } from 'react';
import axios from 'axios';

const IntelligentSuggestions = ({ chords, currentChordIndex, songKey, tempo }) => {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Use environment variables or default to localhost
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

    const fetchIntelligentSuggestions = async () => {
        if (!chords || chords.length === 0 || !songKey) return;

        setLoading(true);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/analyze-intelligence`, {
                chords: chords,
                key: songKey,
                tempo: tempo || 120,
                duration: chords.length
            });

            if (response.data && !response.data.error) {
                setSuggestions(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch intelligent suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentChordSuggestions = () => {
        if (!suggestions || !suggestions.progression_analysis || currentChordIndex < 0) {
            return null;
        }

        const currentChord = chords[currentChordIndex];
        if (!currentChord) return null;

        // Get chord substitutions from the analysis
        const substitutions = suggestions.progression_analysis.suggested_substitutions || [];
        const relevantSubstitutions = substitutions.filter(sub => 
            sub.original_chord && currentChord.chord && 
            sub.original_chord.toLowerCase().includes(currentChord.chord.toLowerCase().split(' ')[0])
        );

        return {
            currentChord: currentChord.chord,
            substitutions: relevantSubstitutions.slice(0, 3), // Show top 3 suggestions
            complexity: suggestions.progression_analysis.complexity_score,
            mood: suggestions.progression_analysis.mood_indicators
        };
    };

    const getNextChordPredictions = () => {
        if (!suggestions || !chords || currentChordIndex < 0) return null;

        // Simple next chord prediction based on common patterns
        const currentChord = chords[currentChordIndex];
        if (!currentChord) return null;

        // This is a simplified prediction - in a real app you'd use more sophisticated ML
        const commonProgressions = {
            'C major': ['F major', 'G major', 'A minor'],
            'G major': ['C major', 'D major', 'E minor'],
            'A minor': ['F major', 'C major', 'G major'],
            'F major': ['C major', 'G major', 'D minor']
        };

        const currentChordName = currentChord.chord || '';
        const predictions = commonProgressions[currentChordName] || [];

        return predictions.slice(0, 3);
    };

    return (
        <div className="intelligent-suggestions">
            <button 
                onClick={() => {
                    if (!suggestions) {
                        fetchIntelligentSuggestions();
                    }
                    setShowSuggestions(!showSuggestions);
                }}
                className="suggestions-toggle"
                disabled={loading}
            >
                {loading ? '🤖 Analyzing...' : '🤖 Smart Suggestions'}
            </button>

            {showSuggestions && suggestions && (
                <div className="suggestions-panel">
                    <h4>🎵 Real-time Analysis</h4>
                    
                    {/* Current Chord Analysis */}
                    {getCurrentChordSuggestions() && (
                        <div className="current-chord-analysis">
                            <h5>Current Chord: {getCurrentChordSuggestions().currentChord}</h5>
                            
                            {getCurrentChordSuggestions().substitutions.length > 0 && (
                                <div className="chord-substitutions">
                                    <strong>Try these substitutions:</strong>
                                    <div className="substitution-list">
                                        {getCurrentChordSuggestions().substitutions.map((sub, idx) => (
                                            <span key={idx} className="substitution-chord">
                                                {sub.suggested_chord} 
                                                <span className="substitution-reason">({sub.reason})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Next Chord Predictions */}
                    {getNextChordPredictions() && getNextChordPredictions().length > 0 && (
                        <div className="next-chord-predictions">
                            <strong>Likely next chords:</strong>
                            <div className="prediction-list">
                                {getNextChordPredictions().map((chord, idx) => (
                                    <span key={idx} className="predicted-chord">{chord}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Practice Tips */}
                    {suggestions.practice_suggestions && (
                        <div className="practice-tips">
                            <strong>💡 Practice Tip:</strong>
                            {suggestions.practice_suggestions.difficulty_tips && 
                             suggestions.practice_suggestions.difficulty_tips.length > 0 && (
                                <p>{suggestions.practice_suggestions.difficulty_tips[0]}</p>
                            )}
                        </div>
                    )}

                    {/* Mood Indicator */}
                    {suggestions.progression_analysis && 
                     suggestions.progression_analysis.mood_indicators && 
                     suggestions.progression_analysis.mood_indicators.length > 0 && (
                        <div className="mood-indicator">
                            <strong>🎭 Current Mood:</strong>
                            <div className="mood-tags-small">
                                {suggestions.progression_analysis.mood_indicators.slice(0, 3).map((mood, idx) => (
                                    <span key={idx} className="mood-tag-small">{mood}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IntelligentSuggestions;
