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
const bcrypt = require('bcryptjs');
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'server',
    uptime: process.uptime(),
    timestamp: new Date(),
    pythonServiceURL: PYTHON_SERVICE_URL
  });
});

// Set up multer to handle file uploads. Files are temporarily stored in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Secret key for JWT from environment variable with fallback for development
const SECRET_KEY = process.env.JWT_SECRET || 'harmonix_development_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

// In-memory storage for users and activity
const users = [
  { 
    id: 1, 
    username: 'stephanelkhoury', 
    // Store hashed password - this is the hash of 'S@1234'
    password: '$2a$10$nzGj1xQQlACwJTvntWXw4OHm7Z.rxBn38KnRV5I5nEhUlJ2NOUtE.', 
    email: 'stephane@example.com', 
    createdAt: new Date() 
  }
];
const userActivity = [];

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Compare password with stored hash
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate a JWT token with better options
    const token = jwt.sign(
      { username: user.username, id: user.id }, 
      SECRET_KEY, 
      { 
        expiresIn: JWT_EXPIRY,
        issuer: 'harmonix-app',
        subject: user.id.toString()
      }
    );

    // Track user login activity
    userActivity.push({ username, action: 'login', timestamp: new Date(), ip: req.ip });

    return res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password, email, firstName, lastName, phone, address, dateOfBirth, gender, country } = req.body;
  
  try {
    console.log('Received signup data:', { ...req.body, password: '[REDACTED]' });
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Validate username format (alphanumeric only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers and underscores' });
    }
    
    // Enhanced password validation (at least 6 chars, must include number and special char)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    if (!/\d/.test(password)) {
      return res.status(400).json({ error: 'Password must include at least one number' });
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ error: 'Password must include at least one special character' });
    }
    
    // Validate email format if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if username already exists
    if (users.some(user => user.username === username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists (if provided)
    if (email && users.some(user => user.email === email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user with hashed password
    const newUser = {
      id: users.length + 1,
      username,
      password: hashedPassword,
      email: email || null,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      address: address || null, 
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      country: country || null,
      createdAt: new Date()
    };
    
    // Add user to our in-memory store
    users.push(newUser);
    
    // Track signup activity
    userActivity.push({ 
      username, 
      action: 'signup', 
      timestamp: new Date(),
      ip: req.ip 
    });
    
    // Generate token for immediate login with enhanced security
    const token = jwt.sign(
      { username: newUser.username, id: newUser.id }, 
      SECRET_KEY, 
      { 
        expiresIn: JWT_EXPIRY,
        issuer: 'harmonix-app',
        subject: newUser.id.toString()
      }
    );
    
    // Return success with token and user info
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});

// Middleware to protect routes
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, SECRET_KEY, { issuer: 'harmonix-app' }, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err.name);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired', code: 'token_expired' });
        }
        
        return res.status(403).json({ error: 'Invalid token', code: 'invalid_token' });
      }
      
      // Find the user to ensure they still exist in our system
      const user = users.find(u => u.id === parseInt(decoded.id));
      if (!user) {
        return res.status(403).json({ error: 'User no longer exists', code: 'user_not_found' });
      }
      
      // Add user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed due to server error' });
  }
}

// Token refresh endpoint
app.post('/refresh-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }
  
  // Verify the existing token
  jwt.verify(token, SECRET_KEY, { ignoreExpiration: true }, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token', code: 'invalid_token' });
    }
    
    // Find the user
    const user = users.find(u => u.id === parseInt(decoded.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'user_not_found' });
    }
    
    // Generate a new token
    const newToken = jwt.sign(
      { username: user.username, id: user.id }, 
      SECRET_KEY, 
      { 
        expiresIn: JWT_EXPIRY,
        issuer: 'harmonix-app',
        subject: user.id.toString()
      }
    );
    
    // Track token refresh activity
    userActivity.push({ 
      username: user.username, 
      action: 'token_refresh', 
      timestamp: new Date(),
      ip: req.ip 
    });
    
    res.json({ token: newToken });
  });
});

// Track active sessions
const activeSessions = [];

// Protected dashboard route
app.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: `Welcome to the dashboard, ${req.user.username}!` });
});

// Endpoint to get user activity
app.get('/users', authenticateToken, (req, res) => {
  res.json(userActivity);
});

// Endpoint to get user's active sessions
app.get('/user/sessions', authenticateToken, (req, res) => {
  const userId = parseInt(req.user.id);
  const userSessions = activeSessions.filter(session => session.userId === userId);
  
  res.json({ 
    sessions: userSessions.map(session => ({
      id: session.id,
      device: session.device,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive
    }))
  });
});

// Endpoint to track new session
app.post('/user/session', authenticateToken, (req, res) => {
  const userId = parseInt(req.user.id);
  const { device } = req.body;
  
  // Generate session ID
  const sessionId = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  // Add to active sessions
  activeSessions.push({
    id: sessionId,
    userId,
    device: device || 'Unknown device',
    ipAddress: req.ip,
    lastActive: new Date(),
    createdAt: new Date()
  });
  
  res.json({ 
    message: 'Session tracked successfully',
    sessionId 
  });
});

// Endpoint to invalidate a specific session
app.delete('/user/session/:sessionId', authenticateToken, (req, res) => {
  const userId = parseInt(req.user.id);
  const { sessionId } = req.params;
  
  const sessionIndex = activeSessions.findIndex(
    session => session.id === sessionId && session.userId === userId
  );
  
  if (sessionIndex === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Remove the session
  activeSessions.splice(sessionIndex, 1);
  
  res.json({ message: 'Session terminated successfully' });
});

// Endpoint to invalidate all sessions for a user except the current one
app.delete('/user/sessions/all-except-current', authenticateToken, (req, res) => {
  const userId = parseInt(req.user.id);
  const { currentSessionId } = req.body;
  
  if (!currentSessionId) {
    return res.status(400).json({ error: 'Current session ID is required' });
  }
  
  // Filter out all sessions for this user except the current one
  const initialCount = activeSessions.length;
  
  const remainingSessions = activeSessions.filter(
    session => !(session.userId === userId && session.id !== currentSessionId)
  );
  
  // Update the active sessions list
  activeSessions.length = 0;
  activeSessions.push(...remainingSessions);
  
  const terminatedCount = initialCount - activeSessions.length;
  
  res.json({ 
    message: 'All other sessions terminated successfully',
    terminatedCount 
  });
});

// Store password reset tokens
const passwordResetTokens = [];

// Endpoint to request password reset
app.post('/reset-password/request', async (req, res) => {
  const { email } = req.body;
  
  // Validate email
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  // Find user by email
  const user = users.find(u => u.email === email);
  if (!user) {
    // For security reasons, don't reveal if email exists or not
    return res.status(200).json({ message: 'If your email is in our system, you will receive reset instructions shortly.' });
  }
  
  // Generate a reset token
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  // Store the token with expiration (1 hour from now)
  passwordResetTokens.push({
    userId: user.id,
    token: resetToken,
    email: user.email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  });
  
  // In a real app, you would send an email with the reset link
  console.log(`[DEV] Password reset link: http://localhost:3000/reset-password/${resetToken}`);
  
  // For development, we'll include the token in the response
  res.status(200).json({ 
    message: 'If your email is in our system, you will receive reset instructions shortly.',
    // Only for development
    dev_info: {
      resetToken,
      resetLink: `http://localhost:3000/reset-password/${resetToken}`
    }
  });
});

// Endpoint to validate reset token
app.get('/reset-password/validate/:token', (req, res) => {
  const { token } = req.params;
  
  const resetRequest = passwordResetTokens.find(r => r.token === token);
  
  // Check if token exists and is not expired
  if (!resetRequest || new Date() > resetRequest.expiresAt) {
    return res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
  }
  
  res.json({ 
    valid: true, 
    email: resetRequest.email 
  });
});

// Endpoint to reset password with token
app.post('/reset-password/confirm', async (req, res) => {
  const { token, newPassword } = req.body;
  
  // Validate new password
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  if (!/\d/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must include at least one number' });
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must include at least one special character' });
  }
  
  // Find the reset request
  const resetIndex = passwordResetTokens.findIndex(r => r.token === token);
  
  if (resetIndex === -1 || new Date() > passwordResetTokens[resetIndex].expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
  
  const resetRequest = passwordResetTokens[resetIndex];
  
  // Find the user
  const userIndex = users.findIndex(u => u.id === resetRequest.userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    users[userIndex].password = hashedPassword;
    
    // Remove the used reset token
    passwordResetTokens.splice(resetIndex, 1);
    
    // Invalidate all user's sessions for security
    const removedSessions = activeSessions.filter(s => s.userId === resetRequest.userId).length;
    const remainingSessions = activeSessions.filter(s => s.userId !== resetRequest.userId);
    activeSessions.length = 0;
    activeSessions.push(...remainingSessions);
    
    // Track activity
    userActivity.push({
      username: users[userIndex].username,
      action: 'password_reset',
      timestamp: new Date(),
      ip: req.ip
    });
    
    res.json({ 
      message: 'Password reset successful. You can now log in with your new password.',
      sessionsTerminated: removedSessions
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'An error occurred during password reset' });
  }
});

// Define our analysis endpoints
// Supports both memory and disk storage approaches for file handling

// Memory-based approach (preferred for smaller files)
app.post('/api/analyze-chords', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }
  
  let tempPath;
  
  try {
    // Save the uploaded file to a temporary file
    tempPath = path.join(__dirname, 'uploads', `${Date.now()}-${req.file.originalname}`);
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

// Disk-based approach (legacy endpoint - kept for backward compatibility)
const uploadDest = multer({ dest: 'uploads/' });

app.post('/upload', uploadDest.single('mp3'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    console.log(`Processing file upload: ${req.file.originalname}`);
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
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error processing file upload:', err);
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

// Start the server.
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});