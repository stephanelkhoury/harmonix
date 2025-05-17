#!/bin/zsh
# First-time setup script for Harmonix

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'

# Get the directory where this script is located and navigate to project root
SCRIPTS_DIR=$(cd "$(dirname "${0}")" && pwd)
HARMONIX_DIR=$(dirname "$SCRIPTS_DIR")
cd "$HARMONIX_DIR"

echo "${BLUE}${BOLD}Harmonix First-Time Setup${NC}"
echo "${BLUE}========================${NC}"
echo

# Create required directories
echo "${BLUE}Creating required directories...${NC}"
mkdir -p server/uploads
mkdir -p backend/uploads
mkdir -p data/db
mkdir -p logs
echo "${GREEN}✓ Directories created${NC}"

# Create environment files if they don't exist
echo 
echo "${BLUE}Creating environment files...${NC}"

# Backend .env
if [ ! -f "backend/.env" ]; then
    cp "$HARMONIX_DIR/config/backend.env.template" "backend/.env"
    echo "${GREEN}✓ Created backend/.env file from template${NC}"
else
    echo "${YELLOW}backend/.env already exists, skipping.${NC}"
fi

# Server .env
if [ ! -f "server/.env" ]; then
    cp "$HARMONIX_DIR/config/server.env.template" "server/.env"
    echo "${GREEN}✓ Created server/.env file from template${NC}"
else
    echo "${YELLOW}server/.env already exists, skipping.${NC}"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cp "$HARMONIX_DIR/config/frontend.env.template" "frontend/.env"
    echo "${GREEN}✓ Created frontend/.env file from template${NC}"
else
    echo "${YELLOW}frontend/.env already exists, skipping.${NC}"
fi

# Install dependencies
echo
echo "${BLUE}Installing dependencies...${NC}"
echo "This may take a few minutes."

# Python service dependencies
echo "${BLUE}Installing Python dependencies...${NC}"
cd python_service
python3 -m pip install -r requirements.txt || python -m pip install -r requirements.txt
python_result=$?
cd "$HARMONIX_DIR"

# Node.js dependencies
echo "${BLUE}Installing Node.js dependencies...${NC}"

echo "${BLUE}1. Server dependencies${NC}"
cd server
npm install
server_result=$?
cd "$HARMONIX_DIR"

echo "${BLUE}2. Backend dependencies${NC}"
cd backend
npm install
backend_result=$?
cd "$HARMONIX_DIR"

echo "${BLUE}3. Frontend dependencies${NC}"
cd frontend
npm install
frontend_result=$?
cd "$HARMONIX_DIR"

echo
echo "${BLUE}${BOLD}Setup Summary:${NC}"
echo "${BLUE}=============${NC}"

# Check and report results
if [ $python_result -eq 0 ]; then
    echo "${GREEN}✓ Python dependencies installed successfully${NC}"
else
    echo "${RED}✗ Python dependencies installation had issues${NC}"
    echo "${YELLOW}  Please run 'cd python_service && python3 -m pip install -r requirements.txt' manually${NC}"
fi

if [ $server_result -eq 0 ]; then
    echo "${GREEN}✓ Server dependencies installed successfully${NC}"
else
    echo "${RED}✗ Server dependencies installation had issues${NC}"
    echo "${YELLOW}  Please run 'cd server && npm install' manually${NC}"
fi

if [ $backend_result -eq 0 ]; then
    echo "${GREEN}✓ Backend dependencies installed successfully${NC}"
else
    echo "${RED}✗ Backend dependencies installation had issues${NC}"
    echo "${YELLOW}  Please run 'cd backend && npm install' manually${NC}"
fi

if [ $frontend_result -eq 0 ]; then
    echo "${GREEN}✓ Frontend dependencies installed successfully${NC}"
else
    echo "${RED}✗ Frontend dependencies installation had issues${NC}"
    echo "${YELLOW}  Please run 'cd frontend && npm install' manually${NC}"
fi

# Final instructions
echo
echo "${BLUE}${BOLD}Next Steps:${NC}"
echo "${BLUE}===========${NC}"
echo "1. Run the test script to verify your environment: ${YELLOW}./test_environment.sh${NC}"
echo "2. Start the Harmonix application:                 ${YELLOW}./start_harmonix.sh${NC}"
echo
echo "For troubleshooting, please refer to:              ${YELLOW}TROUBLESHOOTING.md${NC}"
echo "For more information, please refer to:             ${YELLOW}README.md${NC}"
