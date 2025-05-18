#!/bin/zsh

# Harmonix Fixer Script
# This script will fix common issues with the Harmonix setup, kill stale processes,
# verify environment files, and start services in the correct order

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
PURPLE='\033[0;35m'

echo -e "${PURPLE}=========================================${NC}"
echo -e "${BLUE}Harmonix Login Issue Fixer${NC}"
echo -e "${PURPLE}=========================================${NC}"

# Get the harmonix root directory
HARMONIX_ROOT=$(cd "$(dirname "$0")" && pwd)
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

# Clean up any processes that might interfere
echo -e "\n${BLUE}Cleaning up potential stale processes...${NC}"
echo -e "${BLUE}Checking ports 3000, 4000, 5001, 5002, and 8000...${NC}"
kill_process_on_port 3000
kill_process_on_port 4000
kill_process_on_port 5001
kill_process_on_port 5002
kill_process_on_port 8000

# Create required directories
echo -e "\n${BLUE}Creating required directories...${NC}"
mkdir -p ./server/uploads
mkdir -p ./backend/uploads
mkdir -p ./data/db
echo -e "${GREEN}✓ Directories created${NC}"

# Verify environment files
echo -e "\n${BLUE}Verifying environment files...${NC}"

# Backend environment file
if [ ! -f "$HARMONIX_ROOT/backend/.env" ]; then
  echo -e "${YELLOW}Creating backend/.env file...${NC}"
  cat > "$HARMONIX_ROOT/backend/.env" << EOL
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000

# Server port - different from server port
PORT=5002
NODE_ENV=development
EOL
  echo -e "${GREEN}✓ Created backend/.env file${NC}"
else
  # Update the existing backend/.env file to use a different port
  sed -i '' 's/PORT=5001/PORT=5002/' "$HARMONIX_ROOT/backend/.env"
  echo -e "${GREEN}✓ Updated backend/.env to use port 5002${NC}"
fi

# Server environment file
if [ ! -f "$HARMONIX_ROOT/server/.env" ]; then
  echo -e "${YELLOW}Creating server/.env file...${NC}"
  cat > "$HARMONIX_ROOT/server/.env" << EOL
# MongoDB connection string
MONGO_URL=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000

# Server port (this should be different from backend port)
PORT=4000
NODE_ENV=development
EOL
  echo -e "${GREEN}✓ Created server/.env file${NC}"
else
  echo -e "${GREEN}✓ server/.env exists${NC}"
fi

# Verify MongoDB is running
echo -e "\n${BLUE}Checking MongoDB...${NC}"
if command -v mongod &> /dev/null; then
  # Check if MongoDB is running
  if pgrep mongod &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is already running${NC}"
  else
    echo -e "${YELLOW}Starting MongoDB...${NC}"
    mongod --fork --logpath /tmp/mongodb.log --dbpath ./data/db
    if [ $? -ne 0 ]; then
      echo -e "${RED}Failed to start MongoDB. Using local connection.${NC}"
    else
      echo -e "${GREEN}✓ MongoDB started successfully${NC}"
    fi
  fi
else
  echo -e "${YELLOW}MongoDB not found. Using connection string from .env files.${NC}"
fi

# Install dependencies
echo -e "\n${BLUE}Installing Python dependencies...${NC}"
cd "$HARMONIX_ROOT/python_service"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some Python dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Python dependencies installed successfully${NC}"
fi
cd "$HARMONIX_ROOT"

echo -e "\n${BLUE}Installing server dependencies...${NC}"
cd "$HARMONIX_ROOT/server"
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some server dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Server dependencies installed successfully${NC}"
fi
cd "$HARMONIX_ROOT"

echo -e "\n${BLUE}Installing backend dependencies...${NC}"
cd "$HARMONIX_ROOT/backend"
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some backend dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Backend dependencies installed successfully${NC}"
fi
cd "$HARMONIX_ROOT"

echo -e "\n${BLUE}Installing frontend dependencies...${NC}"
cd "$HARMONIX_ROOT/frontend"
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some frontend dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
fi
cd "$HARMONIX_ROOT"

# Start services in the correct order
echo -e "\n${BLUE}Starting Python service...${NC}"
cd "$HARMONIX_ROOT/python_service"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > "$HARMONIX_ROOT/python_service.log" 2>&1 &
PYTHON_PID=$!
sleep 2
if ps -p $PYTHON_PID > /dev/null; then
  echo -e "${GREEN}✓ Python service started on port 8000 (PID: $PYTHON_PID)${NC}"
else
  echo -e "${RED}Failed to start Python service. Check python_service.log for details.${NC}"
  exit 1
fi
cd "$HARMONIX_ROOT"

# Start the server
echo -e "\n${BLUE}Starting server...${NC}"
if [ -d "$HARMONIX_ROOT/server" ]; then
  cd "$HARMONIX_ROOT/server"
  node index.js > "$HARMONIX_ROOT/server.log" 2>&1 &
  SERVER_PID=$!
  sleep 2
  if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
  else
    echo -e "${RED}Failed to start server. Check server.log for details.${NC}"
    exit 1
  fi
  cd "$HARMONIX_ROOT"
else
  echo -e "${RED}Error: server directory does not exist at $HARMONIX_ROOT/server${NC}"
  exit 1
fi

# Start the backend service
echo -e "\n${BLUE}Starting backend service...${NC}"
cd "$HARMONIX_ROOT/backend"
# Double-check if port 5002 is free
if lsof -i :5002 > /dev/null; then
  echo -e "${YELLOW}Port 5002 is still in use. Attempting to kill the process...${NC}"
  kill -9 $(lsof -i :5002 -t) 2>/dev/null || true
  sleep 2
fi

node server.js > "$HARMONIX_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 2
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Backend service started (PID: $BACKEND_PID)${NC}"
else
  echo -e "${RED}Failed to start backend service. Check backend.log for details.${NC}"
  exit 1
fi
cd "$HARMONIX_ROOT"

# Start the frontend
echo -e "\n${BLUE}Starting frontend service...${NC}"
cd "$HARMONIX_ROOT/frontend"
# Double-check if port 3000 is free
if lsof -i :3000 > /dev/null; then
  echo -e "${YELLOW}Port 3000 is still in use. Attempting to kill the process...${NC}"
  kill -9 $(lsof -i :3000 -t) 2>/dev/null || true
  sleep 2
fi

npm start > "$HARMONIX_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
sleep 5
if ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Frontend service started (PID: $FRONTEND_PID)${NC}"
else
  echo -e "${RED}Failed to start Frontend service. Check frontend.log for details.${NC}"
  exit 1
fi
cd "$HARMONIX_ROOT"
FRONTEND_PID=$!
sleep 2
if ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Frontend started on port 3000 (PID: $FRONTEND_PID)${NC}"
else
  echo -e "${RED}Failed to start Frontend service. Check frontend.log for details.${NC}"
  exit 1
fi
cd "$HARMONIX_ROOT"

# Run health checks
echo -e "\n${BLUE}Running health checks...${NC}"
sleep 5

echo -e "${BLUE}Checking Python service health...${NC}"
if curl -s http://localhost:8000/health > /dev/null; then
  echo -e "${GREEN}✓ Python service is healthy${NC}"
else
  echo -e "${RED}Warning: Python service health check failed${NC}"
fi

echo -e "${BLUE}Checking Server health...${NC}"
if curl -s http://localhost:5001/health > /dev/null; then
  echo -e "${GREEN}✓ Server is healthy${NC}"
else
  echo -e "${RED}Warning: Server health check failed${NC}"
fi

echo -e "${BLUE}Checking Backend service health...${NC}"
if curl -s http://localhost:5002/health > /dev/null; then
  echo -e "${GREEN}✓ Backend service is healthy${NC}"
else
  echo -e "${RED}Warning: Backend service health check failed${NC}"
fi

# Verify configuration consistency
echo -e "\n${BLUE}Verifying configuration consistency...${NC}"
FRONTEND_BACKEND_URL=$(grep 'REACT_APP_BACKEND_URL' "$HARMONIX_ROOT/frontend/.env" | cut -d'=' -f2)
AUTH_UTILS_URL=$(grep 'SERVER_URL.*=' "$HARMONIX_ROOT/frontend/src/utils/authUtils.js" | sed "s/.*'http:\/\/localhost:\([0-9]*\)'.*/\1/")

echo -e "${BLUE}Frontend .env BACKEND_URL:${NC} $FRONTEND_BACKEND_URL"
echo -e "${BLUE}authUtils.js SERVER_URL:${NC} http://localhost:$AUTH_UTILS_URL"

if [[ "$FRONTEND_BACKEND_URL" == *"5002"* && "$AUTH_UTILS_URL" == "5002" ]]; then
  echo -e "${GREEN}✓ Configuration is consistent${NC}"
else
  echo -e "${RED}Warning: Configuration mismatch between frontend .env and authUtils.js${NC}"
  echo -e "${YELLOW}The frontend may not connect to the backend correctly${NC}"
fi

# Save all PIDs for easy cleanup later
echo "$PYTHON_PID $SERVER_PID $BACKEND_PID $FRONTEND_PID" > "$HARMONIX_ROOT/harmonix_pids.txt"

echo -e "\n${GREEN}All services started! The application should now be accessible at:${NC}"
echo -e "${BLUE}Frontend URL: ${NC}http://localhost:3000"
echo -e "${BLUE}Server URL: ${NC}http://localhost:4000"
echo -e "${BLUE}Backend URL: ${NC}http://localhost:5002"
echo -e "${BLUE}Python Service URL: ${NC}http://localhost:8000"
echo -e "\n${GREEN}To stop all services, run:${NC} ./harmonix_cleanup.sh"

# Open in browser
if command -v open &> /dev/null; then
  echo -e "\n${BLUE}Opening in browser...${NC}"
  open http://localhost:3000
fi

echo -e "\n${YELLOW}Services are running with these PIDs:${NC}"
echo -e "Python service: $PYTHON_PID"
echo -e "Server: $SERVER_PID"
echo -e "Backend: $BACKEND_PID"
echo -e "Frontend: $FRONTEND_PID"

echo -e "\n${GREEN}To stop all services later, run:${NC}"
echo -e "kill -9 $PYTHON_PID $SERVER_PID $BACKEND_PID $FRONTEND_PID"

# Save PIDs to a file for easy cleanup later
echo "$PYTHON_PID $SERVER_PID $BACKEND_PID $FRONTEND_PID" > "$HARMONIX_ROOT/harmonix_pids.txt"
echo -e "\n${GREEN}PIDs saved to harmonix_pids.txt for easy cleanup${NC}"
