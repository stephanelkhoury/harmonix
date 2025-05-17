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
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import cors from 'cors';
import FormData from 'form-data';

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'], // Frontend URLs
    methods: ['GET', 'POST'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5001;

// Get Python service URL from environment variables or use default
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
console.log(`Python service URL: ${PYTHON_SERVICE_URL}`);

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:3000'], // Frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true, // Allow cookies and authentication headers
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware for parsing JSON
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB Atlas or fallback to local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harmonix';
console.log(`Connecting to MongoDB at ${MONGODB_URI.split('@').length > 1 ? MONGODB_URI.split('@')[0].substring(0, 15) + '...' : MONGODB_URI}`);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB successfully');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Health check endpoint for monitoring and startup verification
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'healthy',
        service: 'backend',
        mongodb: dbStatus
    });
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Endpoint for audio file upload
app.post('/upload', upload.single('mp3'), (req, res) => {
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
        // Return user data without password
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        };
        res.status(200).send({ message: 'Login successful', token, user: userData });
    } catch (err) {
        res.status(500).send({ error: 'Error logging in' });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).send({ error: 'No token provided!' });
    }
    
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, 'secret_key', (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        next();
    });
};

// API endpoint for user profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('-password'); // Exclude password from the result
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).send({ error: 'Failed to fetch user profile' });
    }
});

// API endpoint for admin to get all users
app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        // In a real application, you would check if the user is an admin
        const users = await User.find().select('-password'); // Exclude passwords
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send({ error: 'Failed to fetch users' });
    }
});

// API endpoint to delete a user (admin only)
app.delete('/api/admin/users/:userId', verifyToken, async (req, res) => {
    try {
        // In a real application, you would check if the user is an admin
        const userId = req.params.userId;
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).send({ error: 'User not found' });
        }
        
        res.status(200).send({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send({ error: 'Failed to delete user' });
    }
});

// Dashboard endpoint
app.get('/dashboard', verifyToken, (req, res) => {
    res.status(200).send({ message: 'Welcome to the admin dashboard!' });
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

// Endpoint to proxy requests to Python service for chord analysis
app.post('/api/analyze-chords', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded.' });
    }
    
    try {
        // Save the file to a temporary location
        const filePath = path.join(__dirname, req.file.path);
        
        // Create a form data object to send to the Python service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), req.file.originalname);
        
        // Send the file to the Python service
        const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        
        // Clean up the temp file
        fs.unlinkSync(filePath);
        
        // Return the response from the Python service
        res.json(response.data);
    } catch (error) {
        console.error('Error forwarding to Python service:', error.message);
        res.status(500).json({ error: 'Failed to process audio file', details: error.message });
    }
});

// Endpoint to analyze YouTube links
app.post('/api/analyze-youtube', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'No YouTube URL provided.' });
    }
    
    try {
        const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze-youtube`, { url });
        res.json(response.data);
    } catch (error) {
        console.error('Error analyzing YouTube link:', error.message);
        res.status(500).json({ error: 'Failed to analyze YouTube link', details: error.message });
    }
});

// Health check endpoint for the backend service
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        pythonService: PYTHON_SERVICE_URL,
        mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
