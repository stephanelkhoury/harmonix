const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meyda = require('meyda');
const { AudioContext } = require('web-audio-api');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Get Python service URL from environment variables or use default
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
console.log(`Python service URL: ${PYTHON_SERVICE_URL}`);

const app = express();
const PORT = process.env.PORT || 5001; // Change to a different port

// Allow CORS so that your client (likely running on a different port) can communicate with the server.
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json()); // For parsing application/json

// Set up multer to handle file uploads. Files are temporarily stored in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Secret key for JWT
const SECRET_KEY = 'your_secret_key';

// Hardcoded user credentials
const USERNAME = 'stephanelkhoury';
const PASSWORD = 'S@1234';

// In-memory storage for user activity
const userActivity = [];

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === USERNAME && password === PASSWORD) {
    // Generate a JWT token
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

    // Track user login activity
    userActivity.push({ username, action: 'login', timestamp: new Date() });

    return res.json({ token });
  }

  res.status(401).json({ error: 'Invalid username or password' });
});

// Middleware to protect routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Protected dashboard route
app.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: `Welcome to the dashboard, ${req.user.username}!` });
});

// Endpoint to get user activity
app.get('/users', authenticateToken, (req, res) => {
  res.json(userActivity);
});

// Define our analysis endpoint.
app.post('/api/analyze-chords', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }
  try {
    // Save the uploaded file to a temporary file
    const tempPath = path.join(__dirname, 'uploads', `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);

    // Forward the file to the Python service
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath), req.file.originalname);
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Clean up the temp file
    fs.unlinkSync(tempPath);
    res.json(response.data);
  } catch (error) {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error('Error forwarding audio to Python service:', error);
    res.status(500).json({ error: 'Failed to process audio.' });
  }
});

const uploadDest = multer({ dest: 'uploads/' });

app.post('/upload', uploadDest.single('mp3'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    res.json(response.data);
  } catch (err) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Chord analysis failed', details: err.message });
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
    console.error('Error analyzing YouTube link:', error);
    res.status(500).json({ error: 'Failed to analyze YouTube link.' });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Harmonix Backend!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'server',
    pythonServiceUrl: PYTHON_SERVICE_URL
  });
});

// Start the server.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});