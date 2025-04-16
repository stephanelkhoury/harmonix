import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';

const Mp3Upload = () => {
  const [file, setFile] = useState(null);
  const [chords, setChords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4a9eff',
      progressColor: '#1976d2',
      cursorColor: '#1976d2',
      height: 100,
      responsive: true,
    });

    wavesurferRef.current.on('finish', () => setIsPlaying(false));

    return () => wavesurferRef.current.destroy();
  }, []);

  const handleFileChange = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setChords([]);
      setError('');
      wavesurferRef.current.loadBlob(uploadedFile);
    }
  };

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('mp3', file);
    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setChords(res.data.chords || []);
    } catch (err) {
      setError('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="file"
            accept="audio/mp3"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className={`px-6 py-2 rounded-lg ${
              loading || !file
                ? 'bg-gray-400'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div ref={waveformRef} className="mb-4" />
        {file && (
          <button
            onClick={handlePlayPause}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      {chords.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Detected Chords:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {chords.map((c, i) => (
              <div
                key={i}
                className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <span className="font-mono text-gray-600">{c.time}s:</span>{' '}
                <span className="font-bold text-blue-600">{c.chord}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mp3Upload;
