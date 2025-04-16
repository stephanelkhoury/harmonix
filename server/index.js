const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meyda = require('meyda');
const { AudioContext } = require('web-audio-api');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow CORS so that your client (likely running on a different port) can communicate with the server.
app.use(cors());

// Set up multer to handle file uploads. Files are temporarily stored in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define our analysis endpoint.
app.post('/api/analyze-chords', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded.' });
  }

  try {
    const audioBuffer = req.file.buffer;
    const audioContext = new AudioContext();

    // Decode the audio data
    const decodedAudio = await audioContext.decodeAudioData(audioBuffer);

    // Extract features using Meyda
    const features = Meyda.extract('chroma', decodedAudio.getChannelData(0));

    // Placeholder for converting features to chords
    const chords = features ? ['Cmaj', 'Gmaj', 'Amin', 'Fmaj'] : [];

    res.json({ chords });
  } catch (error) {
    console.error('Error processing audio:', error);
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
    const response = await axios.post('http://localhost:8000/analyze', form, {
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

// Start the server.
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});