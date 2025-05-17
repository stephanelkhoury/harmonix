# Harmonix Project Structure

This document provides an overview of the project structure and the purpose of each directory and key files.

## Project Overview

Harmonix is organized into the following key components:

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
├── samples/         # Sample MP3 files for testing
├── scripts/         # Utility and startup scripts
├── server/          # Node.js file upload server
├── tests/           # Test scripts and integration tests
└── uploads/         # Temporary file storage
```

## Directory Description

### Service Components

- **backend/** - Express API server (Node.js) for core functionality
- **frontend/** - React frontend application for the user interface
- **python_service/** - FastAPI service that handles audio analysis and chord detection
- **server/** - File upload server that processes MP3 files

### Support Directories

- **config/** - Contains configuration templates for each service
- **docs/** - Documentation files including setup guides and usage instructions
- **logs/** - Application log files generated during runtime
- **samples/** - Sample MP3 files used for testing
- **scripts/** - Utility and startup scripts for different platforms
- **tests/** - Test scripts and integration tests
- **uploads/** - Temporary storage for uploaded files

### Key Files

- **config.js** - Central configuration manager for handling environment variables
- **start_harmonix.sh** - Symlink to the main startup script (platform-aware)
- **setup.sh** - Symlink to the environment setup script
- **test_environment.sh** - Symlink to the environment test script
- **project_info.sh** - Displays an overview of the project structure
- **README.md** - Main documentation file

### Deprecated Components

- **client/** - Legacy React frontend (replaced by the frontend directory)

## Environment Files

The application uses .env files for configuration. Templates are stored in the config/ directory:

- **backend.env.template** - Template for backend service configuration
- **frontend.env.template** - Template for frontend application configuration
- **server.env.template** - Template for file upload server configuration

The setup script will automatically copy these templates to the appropriate locations and customize them based on your setup.

## Development Workflow

1. **Setup Environment**: Run `./setup.sh` to set up the development environment
2. **Start Services**: Run `./start_harmonix.sh` to start all services
3. **Testing**: Use the test scripts in the tests/ directory to verify functionality
4. **Development**:
   - Frontend changes: Edit files in frontend/src/
   - Backend changes: Edit files in backend/
   - Python service changes: Edit files in python_service/

## User Interface Components

The frontend is built with React and includes:

- **Pages**: Complete views like Home, Analyze, etc.
- **Components**: Reusable UI elements like ChordDisplay, ControlPanel, etc.
- **Assets**: Static resources like images, fonts, and styles
