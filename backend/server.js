import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Meyda from 'meyda';
import http from 'http';
import { Server } from 'socket.io';
import WaveSurfer from 'wavesurfer.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 5001;

// Middleware for parsing JSON
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/harmonix', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

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

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).send({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).send({ error: 'Error registering user' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, 'secret_key', { expiresIn: '1h' });
        res.status(200).send({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).send({ error: 'Error logging in' });
    }
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
