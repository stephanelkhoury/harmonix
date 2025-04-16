const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meyda = require('meyda');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 5000;

// Middleware for parsing JSON
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Endpoint for audio file upload
app.post('/upload', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(__dirname, req.file.path);

    // Simulate audio processing
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(500).send('Error reading audio file.');
        }

        // Placeholder for Meyda feature extraction
        const audioFeatures = Meyda.extract('chroma', data); // Example feature
        const chords = ['C', 'G', 'Am', 'F']; // Placeholder chord recognition

        res.status(200).send({
            message: 'File processed successfully',
            features: audioFeatures,
            chords: chords,
        });

        // Clean up uploaded file
        fs.unlink(filePath, () => {});
    });
});

// WebSocket connection for real-time audio processing
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('audio-stream', (audioChunk) => {
        // Placeholder for real-time audio processing logic
        console.log('Received audio chunk');
        const chords = ['C', 'G', 'Am', 'F']; // Example chords
        socket.emit('chords-update', chords);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
