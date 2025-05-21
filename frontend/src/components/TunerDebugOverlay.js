import React from 'react';
import './TunerDebugOverlay.css';

const TunerDebugOverlay = ({ 
  visible,
  audioState = {}, 
  signalStrength = 0,
  detectionState = {},
  workletState = {},
  onClose
}) => {
  if (!visible) return null;
  
  return (
    <div className="tuner-debug-overlay">
      <div className="debug-header">
        <h3>Tuner Debug Information</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="debug-section">
        <h4>Audio Processing</h4>
        <div className="debug-info">
          <div className="debug-item">
            <span>Audio Context:</span> 
            <span className={`status ${audioState.contextReady ? 'good' : 'bad'}`}>
              {audioState.contextReady ? 'Ready' : 'Not Ready'}
            </span>
          </div>
          <div className="debug-item">
            <span>Sample Rate:</span> 
            <span>{audioState.sampleRate || 'Unknown'} Hz</span>
          </div>
          <div className="debug-item">
            <span>Microphone:</span> 
            <span className={`status ${audioState.microphoneReady ? 'good' : 'bad'}`}>
              {audioState.microphoneReady ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="debug-section">
        <h4>Signal Detection</h4>
        <div className="debug-info">
          <div className="debug-item">
            <span>Signal Strength:</span> 
            <span className={`status ${signalStrength > 10 ? 'good' : 'bad'}`}>
              {signalStrength}%
            </span>
          </div>
          <div className="debug-item">
            <span>Raw Level:</span> 
            <span>{detectionState.rawLevel?.toFixed(6) || '0.000000'}</span>
          </div>
          <div className="debug-item">
            <span>Detection Active:</span> 
            <span className={`status ${detectionState.detectionActive ? 'good' : 'bad'}`}>
              {detectionState.detectionActive ? 'Yes' : 'No'}
              <span className={`signal-indicator ${detectionState.detectionActive ? 'active' : 'inactive'}`}></span>
            </span>
          </div>
          {detectionState.signalPresent !== undefined && (
            <div className="debug-item">
              <span>Signal Present:</span>
              <span className={`status ${detectionState.signalPresent ? 'good' : 'bad'}`}>
                {detectionState.signalPresent ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="debug-section">
        <h4>AudioWorklet</h4>
        <div className="debug-info">
          <div className="debug-item">
            <span>AudioWorklet Support:</span> 
            <span className={`status ${workletState.supported ? 'good' : 'bad'}`}>
              {workletState.supported ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          <div className="debug-item">
            <span>Worklet Ready:</span> 
            <span className={`status ${workletState.ready ? 'good' : 'bad'}`}>
              {workletState.ready ? 'Ready' : 'Not Ready'}
            </span>
          </div>
          <div className="debug-item">
            <span>Last Worklet Message:</span> 
            <span>{workletState.lastMessage || 'None'}</span>
          </div>
        </div>
      </div>
      
      <div className="debug-section">
        <h4>Last Detected Note</h4>
        <div className="debug-info">
          <div className="debug-item">
            <span>Note:</span> 
            <span>{detectionState.note || 'None'}</span>
          </div>
          <div className="debug-item">
            <span>Frequency:</span> 
            <span>{detectionState.frequency ? `${detectionState.frequency} Hz` : 'None'}</span>
          </div>
          <div className="debug-item">
            <span>Tuning:</span> 
            <span className={`status ${
              detectionState.tuningStatus === 'in-tune' ? 'good' : 
              detectionState.tuningStatus === 'waiting' ? 'neutral' : 'warning'}`}>
              {detectionState.tuningStatus === 'in-tune' ? 'In Tune' :
               detectionState.tuningStatus === 'too-high' ? 'Too High' :
               detectionState.tuningStatus === 'too-low' ? 'Too Low' : 'Waiting'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="debug-section">
        <h4>Actions</h4>
        <div className="debug-actions">
          <button 
            className="debug-button"
            onClick={() => {
              if (window.debugLog) {
                console.log('Debug log:', window.debugLog);
                alert('Recent debug logs printed to console');
              } else {
                alert('No debug logs available');
              }
            }}
          >
            Show Recent Logs
          </button>
          <button 
            className="debug-button"
            onClick={() => {
              // Reset all processing
              if (workletState.workletNode?.port) {
                workletState.workletNode.port.postMessage({ type: 'reset' });
                alert('AudioWorklet processor reset');
              } else {
                alert('AudioWorklet not available to reset');
              }
            }}
          >
            Reset Processor
          </button>
        </div>
      </div>
    </div>
  );
};

export default TunerDebugOverlay;
