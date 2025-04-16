# Harmonix - MP3 Chord Recognition

A web application that analyzes MP3 files to detect musical chords and keys using Python, Node.js, and React.

## Features
- MP3 file upload
- Waveform visualization
- Chord and key detection
- Audio playback control

## Running with Docker
```bash
docker-compose up
```
The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Python Service: http://localhost:8000

## Running Locally

### Python Service
```bash
cd python_service
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Node.js Backend
```bash
cd server
npm install
npm start
```

### React Frontend
```bash
cd client
npm install
npm start
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
├── python_service/  # Python chord detection
└── docker-compose.yml
```