#!/bin/zsh

# Harmonix Backend Server Starter
# This script focuses only on the backend server which handles authentication

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

echo -e "${BLUE}Starting Harmonix Backend Server Only${NC}"

# Get the harmonix root directory
HARMONIX_ROOT=$(dirname "$0")
cd "$HARMONIX_ROOT"

# Function to kill processes on specific ports
kill_process_on_port() {
  local port=$1
  local pid=$(lsof -i :$port -t 2>/dev/null)
  
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}Found process $pid using port $port. Killing...${NC}"
    kill -9 $pid 2>/dev/null
    sleep 1
    echo -e "${GREEN}✓ Process killed${NC}"
  else
    echo -e "${GREEN}✓ No process found on port $port${NC}"
  fi
}

# Clean up any processes that might be on port 5001
echo -e "\n${BLUE}Checking port 5001...${NC}"
kill_process_on_port 5001

# Create or update backend .env file
echo -e "\n${BLUE}Creating backend/.env file...${NC}"
cat > "$HARMONIX_ROOT/backend/.env" << EOL
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000

# Port setting
PORT=5001
NODE_ENV=development
EOL
echo -e "${GREEN}✓ Created backend/.env file${NC}"

# Start the backend service
echo -e "\n${BLUE}Starting backend service...${NC}"
cd ./backend
node server.js
