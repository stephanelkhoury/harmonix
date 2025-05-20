import React from 'react';
import { FaPlay, FaPause, FaRedo, FaDownload, FaStepBackward, FaStepForward, FaFastForward, FaFastBackward } from 'react-icons/fa';
import './style/ControlPanel.css';

function ControlPanel({ 
    onPlay, 
    onPause, 
    onLoop, 
    onDownload, 
    onPrevious, 
    onNext, 
    isPlaying, 
    isLooped,
    currentTime,
    duration,
    playbackRate = 1.0,
    onChangePlaybackRate
}) {
    // Format time in mm:ss format
    const formatTime = (time) => {
        if (time === undefined || isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="control-panel">
            {currentTime !== undefined && duration !== undefined && (
                <div className="time-info">
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <span className="time-divider">/</span>
                    <span className="duration">{formatTime(duration)}</span>
                </div>
            )}
            <div className="control-buttons">
                {onPrevious && (
                    <button 
                        onClick={onPrevious} 
                        className="control-btn prev-btn"
                        title="Previous Chord"
                    >
                        <FaStepBackward />
                    </button>
                )}
                <button 
                    onClick={isPlaying ? onPause : onPlay} 
                    className="control-btn play-btn"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                {onNext && (
                    <button 
                        onClick={onNext} 
                        className="control-btn next-btn"
                        title="Next Chord"
                    >
                        <FaStepForward />
                    </button>
                )}
                <button 
                    onClick={onLoop} 
                    className={`control-btn loop-btn ${isLooped ? 'active' : ''}`}
                    title="Toggle Loop"
                >
                    <FaRedo />
                </button>
                {onDownload && (
                    <button 
                        onClick={onDownload} 
                        className="control-btn download-btn"
                        title="Download JSON"
                    >
                        <FaDownload />
                    </button>
                )}
                {onChangePlaybackRate && (
                    <div className="playback-rate-controls">
                        <button 
                            onClick={() => onChangePlaybackRate(Math.max(0.25, playbackRate - 0.25))}
                            className="control-btn speed-btn"
                            title="Slow Down"
                            disabled={playbackRate <= 0.25}
                        >
                            <FaFastBackward />
                        </button>
                        <span className="playback-rate-display">{playbackRate.toFixed(2)}x</span>
                        <button 
                            onClick={() => onChangePlaybackRate(Math.min(2.0, playbackRate + 0.25))}
                            className="control-btn speed-btn"
                            title="Speed Up"
                            disabled={playbackRate >= 2.0}
                        >
                            <FaFastForward />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ControlPanel;