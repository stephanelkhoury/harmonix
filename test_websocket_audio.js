// Test WebSocket audio processing
const WebSocket = require('ws');

console.log('Testing WebSocket audio processing...');

const ws = new WebSocket('ws://localhost:8000/api/ws/real-time-chords');

ws.on('open', function open() {
    console.log('✅ WebSocket connected successfully!');
    
    // Create a simple test audio chunk (silent audio)
    const sampleRate = 44100;
    const duration = 0.5; // 500ms
    const samples = Math.floor(sampleRate * duration);
    
    // Create silent int16 audio data
    const int16Array = new Int16Array(samples);
    // Fill with some test sine wave data for C major chord simulation
    for (let i = 0; i < samples; i++) {
        // Simple sine wave at ~261.6 Hz (C4)
        const time = i / sampleRate;
        const frequency = 261.6; // C4
        const amplitude = 0.3 * 32767;
        int16Array[i] = Math.floor(amplitude * Math.sin(2 * Math.PI * frequency * time));
    }
    
    // Convert to base64
    const buffer = int16Array.buffer;
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    const base64Audio = btoa(binary);
    
    const audioMessage = {
        type: 'audio_chunk',
        data: {
            audio_data: base64Audio,
            sample_rate: sampleRate,
            chunk_duration: duration
        }
    };
    
    console.log('📤 Sending audio chunk:', {
        type: audioMessage.type,
        sample_rate: audioMessage.data.sample_rate,
        chunk_duration: audioMessage.data.chunk_duration,
        audio_data_length: audioMessage.data.audio_data.length
    });
    
    ws.send(JSON.stringify(audioMessage));
    
    // Close after receiving response or timeout
    setTimeout(() => {
        console.log('🔌 Closing connection...');
        ws.close();
    }, 5000);
});

ws.on('message', function message(data) {
    console.log('📥 Received response:', JSON.parse(data.toString()));
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
    process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('⏰ Connection timeout');
    process.exit(1);
}, 10000);
