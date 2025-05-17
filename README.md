# Harmonix - MP3 Chord Recognition

A web application that analyzes MP3 files to detect musical chords and keys using Python, Node.js, and React.

## Features
- MP3 file upload
- Waveform visualization
- Chord and key detection
- Audio playback control

## Running Locally

### Option 1: Using the Unified Startup Script (Recommended)

We've created a unified startup script that detects your operating system and runs the appropriate version:

```bash
# Make the script executable (only needed once)
chmod +x start_harmonix.sh

# Run the Harmonix application on any platform
./start_harmonix.sh
```

#### Platform-Specific Scripts

If the unified script doesn't work for you, you can use these platform-specific scripts directly:

**For macOS/Linux:**
```bash
chmod +x harmonix-start.sh
./harmonix-start.sh
```

**For Windows:**
```
windows-start.bat
```

This script:
1. Checks prerequisites (Python, Node.js)
2. Installs dependencies for all services
3. Configures MongoDB (local or Atlas)
4. Sets up environment files and directories
5. Starts all services in the correct order
6. Performs health checks
7. Opens the application in your browser

### Option 2: Using Docker

If you prefer Docker (note: this option is currently experiencing issues):

```bash
docker-compose up
```

### Option 3: Manual Setup

If you prefer to start services individually:

#### Python Service
```bash
cd python_service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Server
```bash
cd server
npm install
node index.js
```

#### Node.js Backend
```bash
cd backend
npm install
npm start
```

#### React Frontend
```bash
cd frontend
npm install
npm start
```

## Documentation

- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Detailed local setup instructions
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - MongoDB configuration options
- [RUNNING_LOCALLY.md](RUNNING_LOCALLY.md) - Guide for running without Docker
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solutions to common issues
```

## Development
- Run tests: `npm test` in respective directories
- Frontend uses Tailwind CSS for styling
- Backend includes Express and FastAPI services
- WaveSurfer.js for audio visualization

## Project Structure
```
harmonix/
├── client/          # React frontend
├── server/          # Node.js backend
└── python_service/  # Python chord detection
```