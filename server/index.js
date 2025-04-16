const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meyda = require('meyda');
const { AudioContext } = require('web-audio-api');

const app = express();
const PORT = 5000;

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

// Start the server.
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});