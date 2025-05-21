// Custom AudioWorklet processor for tuning analysis
// This helps with Safari and iOS compatibility
// AudioWorklet must be loaded in a special way with the proper scope available

// Make sure we're in the correct context with proper global objects
(() => {
  // This ensures we're in the AudioWorkletGlobalScope where AudioWorkletProcessor is defined
  try {
    console.log("AudioWorkletProcessor availability:", typeof AudioWorkletProcessor);
    class TunerProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      
      this.bufferSize = 4096;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
      this.lastUpdate = 0;
      
      this.port.onmessage = this.handleMessage.bind(this);
      
      // Send a ready message to the main thread
      this.port.postMessage({
        type: 'ready',
        message: 'TunerProcessor initialized successfully'
      });
    }
    
    handleMessage(event) {
      if (event.data.type === 'reset') {
        this.bufferIndex = 0;
        // Clear any accumulated state
        this.lastUpdate = Date.now();
        
        // Confirm reset and send status update
        this.port.postMessage({
          type: 'status',
          status: 'reset',
          message: 'Processor buffer reset successfully',
          timestamp: Date.now()
        });
      } else if (event.data.type === 'ping') {
        // Respond to ping requests to confirm the processor is alive
        this.port.postMessage({
          type: 'pong',
          timestamp: Date.now(),
          forceUpdate: event.data.forceUpdate || false
        });
      } else if (event.data.type === 'configure') {
        // Allow dynamic configuration changes
        if (event.data.bufferSize && event.data.bufferSize >= 1024) {
          this.bufferSize = event.data.bufferSize;
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }
        
        // Confirm configuration update
        this.port.postMessage({
          type: 'status',
          status: 'configured',
          message: `Configuration updated: bufferSize=${this.bufferSize}`,
          timestamp: Date.now()
        });
      }
    }
    
    // Helper method to detect if a signal has meaningful audio content
    _hasSignificantAudio(channel) {
      // Quick check using RMS and zero crossings to determine if this is likely noise or a musical signal
      let sumSquared = 0;
      let zeroCrossings = 0;
      let prevSample = 0;
      
      for (let i = 0; i < channel.length; i++) {
        sumSquared += channel[i] * channel[i];
        
        // Count zero crossings (sign changes) which indicate frequency content
        if (i > 0 && ((channel[i] >= 0 && prevSample < 0) || (channel[i] < 0 && prevSample >= 0))) {
          zeroCrossings++;
        }
        
        prevSample = channel[i];
      }
      
      const rms = Math.sqrt(sumSquared / channel.length);
      const zeroCrossingRate = zeroCrossings / channel.length;
      
      // Musical signals tend to have moderate zero crossing rates and sufficient amplitude
      return {
        rms: rms,
        zeroCrossingRate: zeroCrossingRate,
        isSignificant: rms > 0.0003 && zeroCrossingRate > 0.01 && zeroCrossingRate < 0.3
      };
    }
    
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      
      // Skip processing if we don't have input data
      if (!input || !input[0] || input[0].length === 0) {
        return true;
      }
      
      const channel = input[0];
      
      // Calculate simple signal strength for monitoring with enhanced peak detection
      let sumSquared = 0;
      let peak = 0;
      let silenceCount = 0;
      const silenceThreshold = 0.0001;
      
      for (let i = 0; i < channel.length; i++) {
        const abs = Math.abs(channel[i]);
        sumSquared += channel[i] * channel[i];
        if (abs > peak) peak = abs;
        
        // Count near-silence samples for improved detection
        if (abs < silenceThreshold) {
          silenceCount++;
        }
      }
      
      const rms = Math.sqrt(sumSquared / channel.length);
      const silenceRatio = silenceCount / channel.length;
      
      // Calculate and track signal quality metrics
      const signalPresent = rms > 0.0003;  // Lower threshold for presence detection
      const signalStrong = rms > 0.001;    // Threshold for strong signal
      const mostlySilence = silenceRatio > 0.85;
      
      // Send regular signal level updates even if buffer isn't full
      // This helps debug signal detection issues and ensures UI stays responsive
      if (!this.lastUpdate || Date.now() - this.lastUpdate > 100) { // Send level updates every 100ms
        this.port.postMessage({
          type: 'level',
          level: rms,
          peak: peak,
          timestamp: Date.now(),
          signalPresent: signalPresent,
          signalStrong: signalStrong,
          silenceRatio: silenceRatio,
          forceSend: signalStrong // Force processing for stronger signals
        });
        this.lastUpdate = Date.now();
      }
      
      // Fill our analysis buffer with enhanced processing
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.bufferIndex++] = channel[i];
        
        // When buffer is full, send it for analysis and reset
        if (this.bufferIndex >= this.bufferSize) {
          // Calculate zero-crossing rate (ZCR) for improved pitch detection
          let zeroCrossings = 0;
          for (let j = 1; j < this.bufferSize; j++) {
            if ((this.buffer[j] >= 0 && this.buffer[j-1] < 0) || 
                (this.buffer[j] < 0 && this.buffer[j-1] >= 0)) {
              zeroCrossings++;
            }
          }
          const zcr = zeroCrossings / this.bufferSize;
          
          // Clone the buffer to avoid data races
          const bufferCopy = this.buffer.slice();
          
          // Apply gentle noise gate when needed
          let shouldProcess = true;
          let signalQuality = 'normal';
          
          if (rms < 0.0003) {
            signalQuality = 'weak';
            shouldProcess = false; // Skip very weak signals
          } else if (rms > 0.01) {
            signalQuality = 'strong';
          }
          
          // Send buffer with enhanced metadata
          this.port.postMessage({
            type: 'buffer',
            buffer: bufferCopy,
            level: rms,
            peak: peak,
            timestamp: Date.now(),
            forceSend: rms > 0.001, // Force processing for stronger signals
            shouldProcess: shouldProcess,
            signalQuality: signalQuality,
            zeroCrossingRate: zcr,
            silenceRatio: silenceRatio
          });
          
          // Reset buffer position
          this.bufferIndex = 0;
        }
      }
      
      // Return true to keep processor alive
      return true;
    }
  }
  
  // Register the processor properly
  try {
    registerProcessor('tuner-processor', TunerProcessor);
    console.log("Successfully registered 'tuner-processor'");
  } catch (err) {
    console.error("Error registering processor:", err);
  }
  } catch (err) {
    console.error("Error in tunerProcessor.js:", err.message);
    // Attempt to report the error to the main thread if possible
    if (typeof globalThis.postMessage === 'function') {
      globalThis.postMessage({
        type: 'error',
        message: 'Failed to initialize AudioWorklet: ' + err.message
      });
    }
  }
})();
