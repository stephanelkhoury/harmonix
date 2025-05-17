#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
PURPLE='\033[0;35m'

# Get the directory where this script is located
HARMONIX_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$HARMONIX_DIR"

echo -e "${PURPLE}=======================================${NC}"
echo -e "${BLUE}Starting Harmonix Application Components${NC}"
echo -e "${PURPLE}=======================================${NC}"

# Check for required tools
echo -e "\n${BLUE}Checking required tools...${NC}"
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Python3 is required but not installed. Please install Python.${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Please install Node.js.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Please install npm.${NC}"; exit 1; }

echo -e "${GREEN}✓ All required tools are installed${NC}"

# Create required directories if they don't exist
echo -e "\n${BLUE}Creating required directories...${NC}"
mkdir -p ./server/uploads
mkdir -p ./backend/uploads
mkdir -p ./data/db
echo -e "${GREEN}✓ Directories created${NC}"

# Check if MongoDB is installed and start it if needed
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

# Environment files setup
if [ ! -f "$HARMONIX_DIR/backend/.env" ]; then
  echo -e "${YELLOW}Creating backend/.env file...${NC}"
  cat > "$HARMONIX_DIR/backend/.env" << EOL
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created backend/.env file${NC}"
fi

if [ ! -f "$HARMONIX_DIR/server/.env" ]; then
  echo -e "${YELLOW}Creating server/.env file...${NC}"
  cat > "$HARMONIX_DIR/server/.env" << EOL
# MongoDB connection string
MONGO_URL=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created server/.env file${NC}"
fi

# Install server dependencies
echo -e "\n${BLUE}Installing server dependencies...${NC}"
cd ./server
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some server dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Server dependencies installed successfully${NC}"
fi
cd "$HARMONIX_DIR"

# Install Python dependencies
echo -e "\n${BLUE}Installing Python dependencies...${NC}"
cd ./python_service
python3 -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some Python dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Python dependencies installed successfully${NC}"
fi

# Start the Python service
echo -e "\n${BLUE}Starting Python service...${NC}"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ../python_service.log 2>&1 &
PYTHON_PID=$!
sleep 2
if ps -p $PYTHON_PID > /dev/null; then
  echo -e "${GREEN}✓ Python service started on port 8000 (PID: $PYTHON_PID)${NC}"
else
  echo -e "${RED}Failed to start Python service. Check python_service.log for details.${NC}"
fi
cd "$HARMONIX_DIR"

# Install backend dependencies
echo -e "\n${BLUE}Installing backend dependencies...${NC}"
cd ./backend
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some backend dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Backend dependencies installed successfully${NC}"
fi

# Start the backend service
echo -e "\n${BLUE}Starting backend service...${NC}"
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
sleep 2
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Backend service started on port 5001 (PID: $BACKEND_PID)${NC}"
else
  echo -e "${RED}Failed to start Backend service. Check backend.log for details.${NC}"
fi
cd "$HARMONIX_DIR"

# Install frontend dependencies
echo -e "\n${BLUE}Installing frontend dependencies...${NC}"
cd ./frontend
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some frontend dependencies might not be installed correctly.${NC}"
else
  echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
fi

# Start the frontend
echo -e "\n${BLUE}Starting frontend service...${NC}"
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2
if ps -p $FRONTEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Frontend started on port 3000 (PID: $FRONTEND_PID)${NC}"
else
  echo -e "${RED}Failed to start Frontend service. Check frontend.log for details.${NC}"
fi
cd "$HARMONIX_DIR"

# Setup trap to kill all processes on script termination
trap 'kill $PYTHON_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e "${YELLOW}Stopping all services...${NC}"' EXIT

# Run health checks
echo -e "\n${BLUE}Running health checks...${NC}"

# Give services time to start
sleep 5

# Check Python service health
echo -e "${BLUE}Checking Python service health...${NC}"
if curl -s http://localhost:8000/health > /dev/null; then
  echo -e "${GREEN}✓ Python service is healthy${NC}"
else
  echo -e "${YELLOW}Warning: Python service health check failed. Checking logs...${NC}"
  echo -e "${YELLOW}--- Last 10 lines of python_service.log: ---${NC}"
  tail -n 10 python_service.log
fi

# Check Backend service health
echo -e "${BLUE}Checking Backend service health...${NC}"
if curl -s http://localhost:5001/health > /dev/null; then
  echo -e "${GREEN}✓ Backend service is healthy${NC}"
else
  echo -e "${YELLOW}Warning: Backend service health check failed. Checking logs...${NC}"
  echo -e "${YELLOW}--- Last 10 lines of backend.log: ---${NC}"
  tail -n 10 backend.log
fi

echo -e "\n${GREEN}Services started! Opening application in browser...${NC}"
echo -e "${BLUE}Frontend URL: ${NC}http://localhost:3000"

# Open the app in a browser if possible
if command -v open &> /dev/null; then
  open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
  xdg-open http://localhost:3000
elif command -v start &> /dev/null; then
  start http://localhost:3000
fi

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for Ctrl+C
wait
