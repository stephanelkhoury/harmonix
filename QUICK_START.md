# Harmonix - Quick Start Guide

This guide provides the fastest way to get the Harmonix application running on your local machine.

## Prerequisites

- Python 3.8 or newer
- Node.js 14 or newer
- npm 6 or newer

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/harmonix.git
cd harmonix
```

## Step 2: Run the Startup Script

### All Platforms (Recommended)
```bash
# Make the script executable
chmod +x start_harmonix.sh

# Run the application (works on macOS, Linux, and Windows with WSL)
./start_harmonix.sh
```

### Windows-Specific
```
# Double-click on windows-start.bat in File Explorer
# Or run from Command Prompt:
windows-start.bat
```

The script will:
- Install all necessary dependencies
- Configure the application
- Start all required services
- Open the application in your web browser

## Step 3: Use the Application

1. **Upload an MP3 File**:
   - Click the upload button on the homepage
   - Select an MP3 file from your computer
   - The application will analyze the file for chords

2. **Analyze a YouTube Link**:
   - Navigate to the Analyze page
   - Paste a YouTube URL in the input field
   - Click "Analyze YouTube"
   - Wait for the analysis to complete

## Troubleshooting

If you encounter any issues:

1. Check the log files in the `logs` directory
2. Refer to the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) guide
3. Make sure all the ports (3000, 5000, 5001, 8000) are available

## Stopping the Application

To stop all services, press `Ctrl+C` in the terminal where you ran the start script.

## Next Steps

For more detailed information, see:
- [README.md](README.md) - Complete documentation
- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Detailed local setup instructions
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - Database configuration options
