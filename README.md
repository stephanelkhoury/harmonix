# Harmonix - MP3 Chord Recognition

A web application that analyzes MP3 files to detect musical chords and keys using Python, Node.js, and React.

## Features
- MP3 file upload
- Waveform visualization
- Chord and key detection
- Audio playback control
- YouTube link analysis
- Cross-platform support (macOS, Linux, Windows)

## Running Locally

### Option 1: Using the Fixed Startup Script (Recommended)

We've created an updated startup script that ensures all services run on the correct ports:

```bash
# Make the script executable (only needed once)
chmod +x scripts/start_harmonix_fixed.sh

# Run the application with fixed port configuration
./scripts/start_harmonix_fixed.sh
```

This script properly configures the following services:
- Authentication Server: Port 5001
- Backend Server: Port 5002 
- Frontend: Port 3000
- Python Service: Port 8000 (if available)

### Option 2: Using the Split Terminal Launcher (for Development)

For development, the split terminal launcher creates separate terminal windows for each service, making debugging and monitoring easier:

```bash
# Make the script executable (only needed once)
chmod +x start_harmonix_split_terminals.sh

# Run Harmonix with each service in a separate, named terminal
./start_harmonix_split_terminals.sh
```

This script:
1. Creates separate, named terminal windows for each service:
   - Python Service (port 8000)
   - Server (port 4000)
   - Backend (port 5001)
   - Frontend (port 3000)
   - Frontend Alt (port 3001)
2. Shows real-time logs in each terminal window
3. Makes debugging individual services easier

**Command Line Options:**
```bash
# Show help and available options
./start_harmonix_split_terminals.sh --help

# Skip dependency installation for faster startup (after first run)
./start_harmonix_split_terminals.sh --skip-install

# Don't automatically open browser
./start_harmonix_split_terminals.sh --no-browser
```

**Note:** The script detects your OS (macOS, Linux, Windows) and uses the appropriate terminal commands. See [detailed documentation](docs/SPLIT_TERMINAL_SETUP.md) for more information.

**macOS Users:** For the best experience on macOS, use our optimized launcher:

```bash
# Make the script executable (only needed once)
chmod +x run_harmonix_mac.sh

# Run with optimal terminal settings for macOS
./run_harmonix_mac.sh
```

This automatically detects if you have iTerm2 installed (recommended) and uses the optimal terminal settings.

### Option 2: Using the Unified Startup Script

We've also created a unified startup script that detects your operating system and runs all services in a single window:

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
chmod +x scripts/harmonix-start.sh
./scripts/harmonix-start.sh
```

**For Windows:**
```
scripts/windows-start.bat
```

This script:
1. Checks prerequisites (Python, Node.js)
2. Installs dependencies for all services
3. Configures MongoDB (local or Atlas)
4. Sets up environment files and directories
5. Starts all services in the correct order
6. Performs health checks
7. Opens the application in your browser

## Network Access

To access Harmonix from other devices on your local network:

1. Use the fixed startup script which displays network access information:
   ```bash
   ./scripts/start_harmonix_fixed.sh
   ```

2. Access the application using your computer's IP address:
   ```
   http://192.168.1.107:3001  # Replace with your actual IP
   ```

3. For troubleshooting network connections, use our test tools:
   - Authentication Test: `/tests/auth_tester.html`
   - Network Connectivity Test: `/tests/network_test.html`

For detailed instructions, see [Network Access Guide](docs/NETWORK_ACCESS_GUIDE.md).

## Running with Docker

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

## Getting Started

Follow these steps for a quick setup:

1. **View Project Structure** (optional)
   ```bash
   # Display an overview of the project structure
   ./project_info.sh
   ```

2. **Initial Setup** (first time only)
   ```bash
   # Set up the application environment and install dependencies
   ./scripts/setup.sh
   # Or use the symlink:
   ./setup.sh
   ```

2. **Start the Application**
   ```bash
   # Start all services (Python, backend, server, frontend)
   ./scripts/start_harmonix.sh
   # Or use the symlink:
   ./start_harmonix.sh
   ```

3. **Test Your Environment**
   ```bash
   # Verify that all required components are properly configured
   ./tests/test_environment.sh
   # Or use the symlink:
   ./test_environment.sh
   ```

4. **Clean Up if Needed**
   ```bash
   # Clean temporary files or reset the application
   ./scripts/cleanup.sh
   ```

## Documentation

- [docs/QUICK_START.md](docs/QUICK_START.md) - Quick guide to get started
- [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) - Detailed local setup instructions
- [docs/MONGODB_ATLAS_SETUP.md](docs/MONGODB_ATLAS_SETUP.md) - MongoDB configuration options
- [docs/RUNNING_LOCALLY.md](docs/RUNNING_LOCALLY.md) - Guide for running without Docker
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Solutions to common issues
- [docs/USAGE_GUIDE.md](docs/USAGE_GUIDE.md) - Complete feature usage instructions
- [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md) - Verification checklist for your installation
- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Overview of project organization

## Testing

### Basic Functionality Testing

To verify that the application's core functionality is working correctly, run:

```bash
# Make the script executable (only needed once)
chmod +x tests/test_analysis.sh

# Test MP3 and YouTube analysis functionality
./tests/test_analysis.sh
```

This script will:
1. Test MP3 file analysis with a sample audio file
2. Test YouTube link analysis with a public domain music video
3. Verify that both the Python and backend services are processing audio correctly

### Integration Testing

For more comprehensive testing of the service integration, you can run:

```bash
# Make the script executable (only needed once)
chmod +x tests/run_integration_tests.sh

# Run integration tests
./tests/run_integration_tests.sh
```

This will perform a series of end-to-end tests to verify:
- Service health and connectivity
- MP3 file analysis through both direct Python service and backend
- YouTube link analysis functionality
- Proper communication between all services

## Development
- Run tests: `npm test` in respective directories
- Frontend uses Tailwind CSS for styling
- Backend includes Express and FastAPI services
- WaveSurfer.js for audio visualization

## Project Structure
```
harmonix/
├── backend/         # Node.js Express API
├── client/          # Legacy React frontend (deprecated)
├── config/          # Configuration templates
├── config.js        # Central configuration manager
├── docs/            # Documentation files
├── frontend/        # React frontend
├── logs/            # Log files
├── python_service/  # Python chord detection service
├── scripts/         # Utility and startup scripts
├── server/          # Node.js file upload server
└── tests/           # Test scripts and integration tests
```