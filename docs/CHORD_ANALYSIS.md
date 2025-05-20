# Harmonix Chord Analysis System

## Overview
Harmonix's chord analysis system now includes advanced capabilities to analyze music files and YouTube videos, extracting chord progressions, key signatures, and tempo information. The analyzed data is saved to a JSON file in the `SongChords` directory for future reference.

## Features

1. **MP3 Analysis**
   - Extract chords at one-second intervals (higher resolution)
   - Detect song key
   - Calculate tempo (BPM)
   - Save complete analysis as JSON

2. **YouTube Analysis**
   - Download and analyze audio from YouTube links
   - Extract chords, key, and tempo
   - Save results to JSON files

3. **Persistent Storage**
   - All analyses are saved in the SongChords directory
   - Files are named with timestamps and song identifiers
   - JSON format makes data easily accessible for other applications

## Technical Implementation

### File Structure
Each JSON file contains:
- `chords`: Array of chord objects with time markers (every 1 second)
- `key`: Overall key signature of the song
- `tempo`: Beats per minute
- `duration`: Length of the audio in seconds
- `filename` or `youtube_url`: Source identifier
- `timestamp`: When the analysis was performed

### Example JSON Output
```json
{
  "chords": [
    {"time": 0, "chord": "C major"},
    {"time": 1, "chord": "C major"},
    {"time": 2, "chord": "G major"},
    ...
  ],
  "key": "C major",
  "tempo": 120.5,
  "duration": 240.75,
  "filename": "my_song.mp3",
  "timestamp": "2025-05-20 02:15:32.456789"
}
```

## Usage

1. **From the Frontend**
   - Upload an MP3 file on the Analyze page
   - Or paste a YouTube URL and click "Analyze YouTube"
   - View the chords, key, and tempo in the interface
   - All analyses are automatically saved to the SongChords folder

2. **Via API**
   - POST to `/api/analyze-chords` with an audio file
   - POST to `/api/analyze-youtube` with a YouTube URL in JSON body
   - Both endpoints return complete analysis data

## Testing
Use the `test_analysis.sh` script in the tests directory to verify that:
- The Python service is running and responding
- MP3 analysis works correctly
- YouTube analysis works correctly 
- JSON files are being saved properly with all required data
