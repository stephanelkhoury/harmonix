#!/bin/zsh
# Project structure overview script for Harmonix

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get the directory where this script is located and navigate to project root
SCRIPTS_DIR=$(cd "$(dirname "${0}")" && pwd)
HARMONIX_DIR=$(dirname "$SCRIPTS_DIR")
cd "$HARMONIX_DIR"

echo "${BLUE}${BOLD}Harmonix Project Structure${NC}"
echo "${BLUE}========================${NC}"
echo

echo "${BOLD}Main Components:${NC}"
echo "${YELLOW}├── backend/${NC}         - Express API server (Node.js)"
echo "${YELLOW}├── frontend/${NC}        - React frontend application"
echo "${YELLOW}├── python_service/${NC}  - FastAPI service for audio analysis"
echo "${YELLOW}└── server/${NC}          - File upload server"
echo 

echo "${BOLD}Support Directories:${NC}"
echo "${YELLOW}├── config/${NC}          - Configuration templates"
echo "${YELLOW}├── docs/${NC}            - Documentation files"
echo "${YELLOW}├── logs/${NC}            - Application log files"
echo "${YELLOW}├── samples/${NC}         - Sample MP3 files for testing"
echo "${YELLOW}├── scripts/${NC}         - Utility and startup scripts"
echo "${YELLOW}├── tests/${NC}           - Test scripts"
echo "${YELLOW}└── uploads/${NC}         - Temporary file storage"
echo 

echo "${BOLD}Key Files:${NC}"
echo "${YELLOW}├── start_harmonix.sh${NC}    - Symlink to main startup script"
echo "${YELLOW}├── setup.sh${NC}             - Symlink to environment setup script" 
echo "${YELLOW}├── test_environment.sh${NC}  - Symlink to environment test script"
echo "${YELLOW}└── README.md${NC}            - Main documentation file"
echo 

echo "${BLUE}${BOLD}Getting Started:${NC}"
echo "1. Run ${YELLOW}./setup.sh${NC} for first-time setup"
echo "2. Run ${YELLOW}./start_harmonix.sh${NC} to start the application"
echo "3. Open ${YELLOW}http://localhost:3000${NC} in your browser"
