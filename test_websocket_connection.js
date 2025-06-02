// Test WebSocket connection to Python service
const WebSocket = require('ws');

console.log('Testing WebSocket connection to Python service...');

const ws = new WebSocket('ws://localhost:8000/api/ws/real-time-chords');

ws.on('open', function open() {
    console.log('✅ WebSocket connected successfully!');
    
    // Send a test message
    const testMessage = {
        type: 'test',
        data: { message: 'Connection test' }
    };
    
    console.log('📤 Sending test message:', testMessage);
    ws.send(JSON.stringify(testMessage));
    
    // Close after a moment
    setTimeout(() => {
        console.log('🔌 Closing connection...');
        ws.close();
    }, 2000);
});

ws.on('message', function message(data) {
    console.log('📥 Received message:', data.toString());
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('🔌 WebSocket connection closed');
    process.exit(0);
});

// Timeout after 5 seconds
setTimeout(() => {
    console.log('⏰ Connection timeout');
    process.exit(1);
}, 5000);
