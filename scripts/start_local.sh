#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
PURPLE='\033[0;35m'

HARMONIX_DIR=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")
cd "$HARMONIX_DIR"

echo -e "${PURPLE}=======================================${NC}"
echo -e "${BLUE}Starting Harmonix Application Components${NC}"
echo -e "${PURPLE}=======================================${NC}"

# Check for required tools
echo -e "\n${BLUE}Checking required tools...${NC}"
command -v python >/dev/null 2>&1 || { echo -e "${RED}Python is required but not installed. Please install Python.${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Please install Node.js.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Please install npm.${NC}"; exit 1; }

echo -e "${GREEN}✓ All required tools are installed${NC}"

# Function to check if MongoDB Atlas connection string is set
check_mongo_connection() {
  if grep -q "mongodb+srv://username:password" "$1"; then
    echo -e "${RED}Warning: Default MongoDB Atlas connection string detected in $1.${NC}"
    echo -e "${YELLOW}Please update with your actual MongoDB Atlas connection string.${NC}"
    echo -e "${YELLOW}See MONGODB_ATLAS_SETUP.md for instructions.${NC}"
    return 1
  elif grep -q "mongodb://localhost:27017" "$1"; then
    echo -e "${YELLOW}Using local MongoDB connection in $1.${NC}"
    echo -e "${YELLOW}Make sure MongoDB is running locally or set up MongoDB Atlas.${NC}"
    return 0
  fi
  return 0
}

# Check MongoDB Atlas connection strings
echo -e "\n${BLUE}Checking MongoDB configuration...${NC}"
mongo_config_ok=true
BACKEND_ENV_FILE="$HARMONIX_DIR/backend/.env"
SERVER_ENV_FILE="$HARMONIX_DIR/server/.env"

if [ -f "$BACKEND_ENV_FILE" ]; then
  check_mongo_connection "$BACKEND_ENV_FILE" || mongo_config_ok=false
else
  echo -e "${RED}Missing backend/.env file! Creating one with default settings...${NC}"
  cat > "$BACKEND_ENV_FILE" << EOL
# MongoDB Atlas connection string
# Replace this with your actual MongoDB Atlas connection string after setup
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created backend/.env file with local MongoDB configuration${NC}"
fi

if [ -f "$SERVER_ENV_FILE" ]; then
  check_mongo_connection "$SERVER_ENV_FILE" || mongo_config_ok=false
else
  echo -e "${RED}Missing server/.env file! Creating one with default settings...${NC}"
  cat > "$SERVER_ENV_FILE" << EOL
# MongoDB Atlas connection string
# Replace this with your actual MongoDB Atlas connection string after setup
MONGO_URL=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created server/.env file with local MongoDB configuration${NC}"
fi

# Check if using local MongoDB and if it's running
if grep -q "mongodb://localhost:27017" "./backend/.env" || grep -q "mongodb://localhost:27017" "./server/.env"; then
  echo -e "\n${BLUE}Checking local MongoDB...${NC}"
  # Simple check if MongoDB is running locally
  nc -z localhost 27017 &>/dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Warning: Local MongoDB doesn't appear to be running on port 27017.${NC}"
    echo -e "${YELLOW}Do you want to start local MongoDB? (y/n)${NC}"
    read -r start_mongo
    if [ "$start_mongo" = "y" ]; then
      echo -e "${BLUE}Starting MongoDB locally...${NC}"
      if command -v mongod &>/dev/null; then
        mongod --fork --logpath /tmp/mongodb.log --dbpath ./data/db
        if [ $? -ne 0 ]; then
          echo -e "${RED}Failed to start MongoDB. Make sure MongoDB is installed.${NC}"
          echo -e "${YELLOW}You can install MongoDB with: brew install mongodb-community${NC}"
        else
          echo -e "${GREEN}MongoDB started successfully.${NC}"
          # Create data directory if it doesn't exist
          mkdir -p ./data/db
        fi
      else
        echo -e "${RED}MongoDB is not installed. Please install it or use MongoDB Atlas.${NC}"
      fi
    fi
  else
    echo -e "${GREEN}✓ Local MongoDB is running${NC}"
  fi
fi

if [ "$mongo_config_ok" = false ]; then
  echo -e "${YELLOW}Please set up MongoDB Atlas first or use local MongoDB. See MONGODB_ATLAS_SETUP.md${NC}"
  echo -e "${YELLOW}Continue anyway? (y/n)${NC}"
  read -r continue_anyway
  if [ "$continue_anyway" != "y" ]; then
    echo -e "${RED}Exiting. Please configure MongoDB first.${NC}"
    exit 1
  fi
fi

# Install server dependencies first
echo -e "\n${BLUE}Installing server dependencies...${NC}"
cd ./server
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some server dependencies might not be installed correctly.${NC}"
  echo -e "${YELLOW}If you encounter issues, try running 'npm install' manually.${NC}"
else
  echo -e "${GREEN}✓ Server dependencies installed successfully${NC}"
fi
cd ..

# Create required directories if they don't exist
echo -e "\n${BLUE}Creating required directories...${NC}"
mkdir -p ./server/uploads
mkdir -p ./backend/uploads
mkdir -p ./data/db
echo -e "${GREEN}✓ Directories created${NC}"

# Install Python dependencies
echo -e "\n${BLUE}Installing Python dependencies...${NC}"
cd ./python_service
python -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some Python dependencies might not be installed correctly.${NC}"
  echo -e "${YELLOW}If you encounter issues, try running 'pip install -r requirements.txt' manually.${NC}"
else
  echo -e "${GREEN}✓ Python dependencies installed successfully${NC}"
fi

# Start the Python service
echo -e "\n${BLUE}Starting Python service...${NC}"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 > ../python_service.log 2>&1 &
PYTHON_PID=$!
echo -e "${GREEN}✓ Python service started on port 8000 (PID: $PYTHON_PID)${NC}"
cd ..

# Start the backend service
echo -e "\n${BLUE}Installing backend dependencies...${NC}"
cd ./backend
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some backend dependencies might not be installed correctly.${NC}"
  echo -e "${YELLOW}If you encounter issues, try running 'npm install' manually.${NC}"
else
  echo -e "${GREEN}✓ Backend dependencies installed successfully${NC}"
fi

echo -e "\n${BLUE}Starting backend service...${NC}"
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend service started on port 5001 (PID: $BACKEND_PID)${NC}"
cd ..

# Start the frontend
echo -e "\n${BLUE}Installing frontend dependencies...${NC}"
cd ./frontend
npm install
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Some frontend dependencies might not be installed correctly.${NC}"
  echo -e "${YELLOW}If you encounter issues, try running 'npm install' manually.${NC}"
else
  echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
fi

echo -e "\n${BLUE}Starting frontend service...${NC}"
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started on port 3000 (PID: $FRONTEND_PID)${NC}"
cd ..

echo -e "\n${PURPLE}=======================================${NC}"
echo -e "${GREEN}All Harmonix components started:${NC}"
echo -e "${BLUE}- Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}- Backend:${NC} http://localhost:5001"
echo -e "${BLUE}- Python:${NC} http://localhost:8000"
echo -e "${YELLOW}Service logs are being written to:${NC}"
echo -e "  - ./python_service.log"
echo -e "  - ./backend.log"
echo -e "  - ./frontend.log"
echo -e "${PURPLE}=======================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Setup trap to kill all processes on script termination
trap 'kill $PYTHON_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT

# Run health checks
echo -e "\n${BLUE}Running health checks...${NC}"

# Give services time to start
sleep 5

# Check Python service health
echo -e "${BLUE}Checking Python service health...${NC}"
curl -s http://localhost:8000/health > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Python service health check failed. Check python_service.log for details.${NC}"
else
  echo -e "${GREEN}✓ Python service is healthy${NC}"
fi

# Check Backend service health
echo -e "${BLUE}Checking Backend service health...${NC}"
curl -s http://localhost:5001/health > /dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Backend service health check failed. Check backend.log for details.${NC}"
else
  echo -e "${GREEN}✓ Backend service is healthy${NC}"
fi

echo -e "\n${GREEN}All services started! The application is now running.${NC}"
echo -e "${BLUE}Access the frontend at:${NC} http://localhost:3000"

# Wait for Ctrl+C
wait
