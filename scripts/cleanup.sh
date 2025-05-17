#!/bin/zsh
# Cleanup script for Harmonix

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'

# Get the directory where this script is located
HARMONIX_DIR=$(cd "$(dirname "${0}")" && pwd)
cd "$HARMONIX_DIR"

echo "${BLUE}${BOLD}Harmonix Cleanup Utility${NC}"
echo "${BLUE}========================${NC}"
echo

# Function to confirm action
confirm() {
  echo -n "${YELLOW}$1 (y/n): ${NC}"
  read response
  if [[ $response =~ ^[Yy]$ ]]; then
    return 0
  else
    return 1
  fi
}

# Check for processes and stop them if needed
echo "${BLUE}Checking for running Harmonix processes...${NC}"
python_pids=$(pgrep -f "uvicorn main:app")
node_pids=$(pgrep -f "node.*server.js\|node.*index.js")
npm_pids=$(pgrep -f "npm start")

if [ ! -z "$python_pids" ] || [ ! -z "$node_pids" ] || [ ! -z "$npm_pids" ]; then
  echo "${YELLOW}Found running processes:${NC}"
  
  if [ ! -z "$python_pids" ]; then
    echo "Python service: $python_pids"
  fi
  
  if [ ! -z "$node_pids" ]; then
    echo "Node servers: $node_pids"
  fi
  
  if [ ! -z "$npm_pids" ]; then
    echo "npm processes: $npm_pids"
  fi
  
  if confirm "Stop all running processes?"; then
    # Kill running processes
    if [ ! -z "$python_pids" ]; then
      kill $python_pids
      echo "${GREEN}✓ Python processes terminated${NC}"
    fi
    
    if [ ! -z "$node_pids" ]; then
      kill $node_pids
      echo "${GREEN}✓ Node.js processes terminated${NC}"
    fi
    
    if [ ! -z "$npm_pids" ]; then
      kill $npm_pids
      echo "${GREEN}✓ npm processes terminated${NC}"
    fi
  fi
else
  echo "${GREEN}No running Harmonix processes found.${NC}"
fi

# Cleanup options
echo
echo "${BLUE}Select cleanup options:${NC}"
echo

# Clean logs
if confirm "Clear log files?"; then
  rm -rf logs/*.log
  echo "${GREEN}✓ Log files cleared${NC}"
fi

# Clean uploads
if confirm "Clear uploaded files?"; then
  rm -rf server/uploads/*
  rm -rf backend/uploads/*
  echo "${GREEN}✓ Upload directories cleared${NC}"
fi

# Clean node_modules
if confirm "Clear node_modules (will require reinstalling dependencies)?"; then
  rm -rf server/node_modules
  rm -rf backend/node_modules
  rm -rf frontend/node_modules
  echo "${GREEN}✓ node_modules directories removed${NC}"
fi

# Clean MongoDB data
if confirm "Clear MongoDB data (this will delete all database content)?"; then
  rm -rf data/db/*
  echo "${GREEN}✓ MongoDB data cleared${NC}"
fi

# Clean environment files
if confirm "Reset environment files (.env)?"; then
  # Backup old files
  mkdir -p backup
  cp backend/.env backup/backend.env.bak 2>/dev/null
  cp server/.env backup/server.env.bak 2>/dev/null
  cp frontend/.env backup/frontend.env.bak 2>/dev/null
  
  # Create new files
  cat > "backend/.env" << EOL
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  
  cat > "server/.env" << EOL
# MongoDB connection string
MONGO_URL=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  
  cat > "frontend/.env" << EOL
REACT_APP_BACKEND_URL=http://localhost:5001
REACT_APP_PYTHON_SERVICE_URL=http://localhost:8000
EOL
  
  echo "${GREEN}✓ Environment files reset (backups saved to backup/ directory)${NC}"
fi

echo
echo "${BLUE}${BOLD}Cleanup Complete!${NC}"
echo
echo "To restart the application, run: ${YELLOW}./start_harmonix.sh${NC}"
echo "If you cleared node_modules, run: ${YELLOW}./setup.sh${NC} first"
