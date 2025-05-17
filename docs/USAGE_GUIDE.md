# Harmonix Usage Guide

This guide provides detailed instructions on how to use the Harmonix application's features.

## Table of Contents
- [Getting Started](#getting-started)
- [Analyzing MP3 Files](#analyzing-mp3-files)
- [Analyzing YouTube Links](#analyzing-youtube-links)
- [Understanding Chord Analysis Results](#understanding-chord-analysis-results)
- [Audio Playback Controls](#audio-playback-controls)
- [Troubleshooting](#troubleshooting)

## Getting Started

1. **Start the application** using one of the start scripts:
   ```bash
   ./start_harmonix.sh
   ```

2. Once all services are running, open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. The homepage provides navigation to the main features of the application.

## Analyzing MP3 Files

To analyze chords in an MP3 file:

1. Navigate to the **Analyze** page from the main menu.
2. You'll see two options:
   - Direct file upload
   - Recording audio (if your browser supports it)

### Direct File Upload

1. Click the "Choose File" button.
2. Select an MP3 file from your computer.
3. The file will be automatically uploaded and analyzed.
4. Wait for the analysis to complete - you'll see a loading spinner during this time.
5. Once complete, the chord progression will be displayed.

### Recording Audio (if supported)

1. Click the "Record" button.
2. Grant permission to use your microphone if prompted.
3. Record your audio sample.
4. Click "Stop" when finished.
5. Click "Analyze" to process the recording.
6. Once complete, the chord progression will be displayed.

## Analyzing YouTube Links

To analyze chords from a YouTube music video:

1. Navigate to the **Analyze** page from the main menu.
2. In the "Paste YouTube link here" field, enter a valid YouTube URL.
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click the "Analyze YouTube" button.
4. Wait for the analysis to complete - this may take longer than MP3 analysis as the audio must be downloaded first.
5. Once complete, the chord progression will be displayed.

> **Note**: Only publicly available YouTube videos can be analyzed. The analysis works best with clear, high-quality recordings where the musical instruments are well-defined.

## Understanding Chord Analysis Results

The chord analysis results are presented in two formats:

1. **Timeline View**: Shows chords plotted against the time they occur in the audio.
2. **Chord List**: A sequential list of detected chords and their timestamps.

Each chord entry shows:
- The detected chord name (e.g., "C major" or "A minor")
- The confidence level of the detection
- The timestamp in the audio where the chord occurs

The system detects both major and minor chords in all 12 keys of Western music.

## Audio Playback Controls

When analyzing an uploaded MP3 file, you can control playback using:

- **Play**: Start or resume playback
- **Pause**: Pause the audio
- **Loop**: Toggle looping of the audio file
- **Progress Bar**: Click anywhere to jump to that position in the audio

As the audio plays, the currently playing chord will be highlighted in the visualization.

## Troubleshooting

If you encounter issues:

1. **Analysis Fails**: Ensure your audio file is a valid MP3. Try with a different file.
2. **YouTube Analysis Fails**: Verify the YouTube link is correct and the video is publicly accessible.
3. **Poor Analysis Results**: The quality of analysis depends on the clarity of the audio. Solo piano or guitar often works best.
4. **Service Connection Errors**: Run the test script to verify all services are running:
   ```bash
   ./test_environment.sh --with-services
   ```

5. **Test Analysis Feature**: You can run a dedicated test script to verify analysis functionality:
   ```bash
   chmod +x test_analysis.sh
   ./test_analysis.sh
   ```

For more troubleshooting information, refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
