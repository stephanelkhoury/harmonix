#!/bin/zsh
# Test script for Harmonix environment

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'
UNDERLINE='\033[4m'

# Get the directory where this script is located and navigate to project root
TESTS_DIR=$(cd "$(dirname "${0}")" && pwd)
HARMONIX_DIR=$(dirname "$TESTS_DIR")
cd "$HARMONIX_DIR"

echo "${BLUE}${BOLD}Harmonix System Test${NC}"
echo "${BLUE}======================${NC}"
echo

# Function to check and report success/failure
check() {
  if [ $? -eq 0 ]; then
    echo "${GREEN}✓ $1${NC}"
    return 0
  else
    echo "${RED}✗ $1${NC}"
    return 1
  fi
}

# Function to test an HTTP endpoint
test_endpoint() {
  local url=$1
  local name=$2
  echo -n "Testing $name endpoint ($url): "
  curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" | grep -q "200\|20."
  check "$name API endpoint"
}

# Check for required tools
echo "${UNDERLINE}Required Tools:${NC}"
echo -n "Python: "
which python3 > /dev/null 2>&1 || which python > /dev/null 2>&1
check "Python installed"

echo -n "Node.js: "
which node > /dev/null 2>&1
check "Node.js installed"

echo -n "npm: "
which npm > /dev/null 2>&1
check "npm installed"

echo -n "MongoDB: "
which mongod > /dev/null 2>&1
if ! check "MongoDB installed"; then
  echo "${YELLOW}  MongoDB is not installed locally. You'll need to use MongoDB Atlas.${NC}"
fi

# Check required directories
echo
echo "${UNDERLINE}Directory Structure:${NC}"
echo -n "Server uploads directory: "
[ -d "$HARMONIX_DIR/server/uploads" ]
check "server/uploads exists"

echo -n "Backend uploads directory: "
[ -d "$HARMONIX_DIR/backend/uploads" ]
check "backend/uploads exists"

echo -n "Data directory: "
[ -d "$HARMONIX_DIR/data/db" ] || mkdir -p "$HARMONIX_DIR/data/db" > /dev/null 2>&1
check "data/db exists or created"

echo -n "Logs directory: "
[ -d "$HARMONIX_DIR/logs" ] || mkdir -p "$HARMONIX_DIR/logs" > /dev/null 2>&1
check "logs directory exists or created"

# Check .env files
echo
echo "${UNDERLINE}Environment Files:${NC}"
echo -n "Backend .env: "
[ -f "$HARMONIX_DIR/backend/.env" ]
check "backend/.env exists"

echo -n "Server .env: "
[ -f "$HARMONIX_DIR/server/.env" ]
check "server/.env exists"

echo -n "Frontend .env: "
[ -f "$HARMONIX_DIR/frontend/.env" ]
check "frontend/.env exists"

# Check package.json files
echo
echo "${UNDERLINE}Package Configuration:${NC}"
echo -n "Backend package.json: "
[ -f "$HARMONIX_DIR/backend/package.json" ] && grep -q '"start":' "$HARMONIX_DIR/backend/package.json"
check "backend/package.json has start script"

echo -n "Server package.json: "
[ -f "$HARMONIX_DIR/server/package.json" ] && grep -q '"start":' "$HARMONIX_DIR/server/package.json"
check "server/package.json has start script"

echo -n "Frontend package.json: "
[ -f "$HARMONIX_DIR/frontend/package.json" ] && grep -q '"start":' "$HARMONIX_DIR/frontend/package.json"
check "frontend/package.json has start script"

echo -n "Python requirements.txt: "
[ -f "$HARMONIX_DIR/python_service/requirements.txt" ]
check "python_service/requirements.txt exists"

# Check service connectivity only if requested
if [ "$1" == "--with-services" ] || [ "$1" == "-s" ]; then
  echo
  echo "${UNDERLINE}Service Connectivity:${NC}"
  echo "${YELLOW}Checking if services are running...${NC}"

  # Test Python service
  test_endpoint "http://localhost:8000/health" "Python service"

  # Test Backend service
  test_endpoint "http://localhost:5001/health" "Backend service"

  # Test Frontend
  test_endpoint "http://localhost:3000" "Frontend"
fi

# Summary
echo
echo "${BLUE}${BOLD}Test Summary${NC}"
echo "${BLUE}===========${NC}"
echo "Run './start_harmonix.sh' to start the Harmonix application."
echo "If you encounter any issues, please check the troubleshooting guide:"
echo "${YELLOW}TROUBLESHOOTING.md${NC}"
echo 
echo "For detailed logs, check the files in the logs directory:"
echo "${YELLOW}logs/python_service.log${NC}"
echo "${YELLOW}logs/server.log${NC}"
echo "${YELLOW}logs/backend.log${NC}"
echo "${YELLOW}logs/frontend.log${NC}"
