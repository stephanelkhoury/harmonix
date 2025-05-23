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
import 'dotenv/config';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5002;

// Middleware for parsing JSON
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy', 
        service: 'backend',
        uptime: process.uptime(),
        timestamp: new Date()
    });
});

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
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: 'General' },
    message: { type: String, required: true },
    attachment: { type: String }, // File path/URL if implemented
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

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

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).send({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const verified = jwt.verify(token, 'secret_key');
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).send({ error: 'Invalid token' });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).send({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Admin route to get all users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).send(users);
    } catch (err) {
        res.status(500).send({ error: 'Error fetching users' });
    }
});

// Dashboard route to verify authentication
app.get('/dashboard', authenticateToken, (req, res) => {
    res.status(200).send({ message: 'Welcome to the admin dashboard!' });
});

// Message submission endpoint
app.post('/api/messages', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).send({ error: 'Name, email, and message are required' });
        }
        
        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send({ error: 'Invalid email format' });
        }
        
        // Create and save new message
        const newMessage = new Message({ name, email, subject, message });
        await newMessage.save();
        
        res.status(201).send({ message: 'Message sent successfully' });
    } catch (err) {
        console.error('Error saving message:', err);
        res.status(500).send({ error: 'Error saving your message' });
    }
});

// Admin message retrieval endpoint
app.get('/api/admin/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Get all messages, sorted by newest first
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).send(messages);
    } catch (err) {
        console.error('Error retrieving messages:', err);
        res.status(500).send({ error: 'Error retrieving messages' });
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
