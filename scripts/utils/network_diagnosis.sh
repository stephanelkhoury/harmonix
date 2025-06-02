#!/bin/bash
# Harmonix Network Diagnosis Tool
# Created May 21, 2025
# This script helps diagnose network connectivity issues with Harmonix

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Harmonix Network Diagnosis Tool ===${NC}"
echo "This tool helps diagnose network connectivity issues."

# Function to check if a port is open
check_port() {
  local host=$1
  local port=$2
  local service=$3
  
  echo -e "\n${YELLOW}Checking $service on $host:$port...${NC}"
  
  # Try to connect to the port
  if nc -z -w 2 $host $port; then
    echo -e "${GREEN}✓ $service is running on $host:$port${NC}"
    return 0
  else
    echo -e "${RED}✗ Cannot connect to $service on $host:$port${NC}"
    return 1
  fi
}

# Function to make a HTTP request
check_http() {
  local url=$1
  local service=$2
  
  echo -e "\n${YELLOW}Testing HTTP connection to $service at $url...${NC}"
  
  # Try to make a HTTP request
  local response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 $url)
  
  if [ "$response" != "000" ]; then
    echo -e "${GREEN}✓ $service responded with HTTP $response${NC}"
    return 0
  else
    echo -e "${RED}✗ Cannot connect to $service at $url${NC}"
    return 1
  fi
}

# Get local IP address
get_local_ip() {
  local ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
  if [ -z "$ip" ]; then
    echo "Could not determine local IP address"
    return 1
  else
    echo $ip
    return 0
  fi
}

# Get the local IP address
LOCAL_IP=$(get_local_ip)
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Could not determine local IP address. Some tests may fail.${NC}"
  LOCAL_IP="192.168.1.107" # Fallback to the IP mentioned in the user's issue
fi

echo -e "Local IP address: ${BLUE}$LOCAL_IP${NC}"

# Detect if services are running locally
echo -e "\n${YELLOW}Checking for running services...${NC}"

AUTH_SERVER_RUNNING=false
BACKEND_SERVER_RUNNING=false
FRONTEND_RUNNING=false

# Check if auth server is running
if lsof -i:5001 &>/dev/null; then
  echo -e "${GREEN}✓ Authentication server is running on port 5001${NC}"
  AUTH_SERVER_RUNNING=true
else
  echo -e "${RED}✗ Authentication server is not running on port 5001${NC}"
fi

# Check if backend server is running
if lsof -i:5002 &>/dev/null; then
  echo -e "${GREEN}✓ Backend server is running on port 5002${NC}"
  BACKEND_SERVER_RUNNING=true
else
  echo -e "${RED}✗ Backend server is not running on port 5002${NC}"
fi

# Check if frontend is running
if lsof -i:3000 &>/dev/null; then
  echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
  FRONTEND_RUNNING=true
elif lsof -i:3001 &>/dev/null; then
  echo -e "${GREEN}✓ Frontend is running on port 3001${NC}"
  FRONTEND_PORT=3001
  FRONTEND_RUNNING=true
else
  echo -e "${RED}✗ Frontend is not running on ports 3000 or 3001${NC}"
fi

# Test local connectivity
echo -e "\n${BLUE}=== Testing Local Connectivity ===${NC}"

if $AUTH_SERVER_RUNNING; then
  check_http "http://localhost:5001/health" "Authentication Server"
fi

if $BACKEND_SERVER_RUNNING; then
  check_http "http://localhost:5002/health" "Backend Server"
fi

if $FRONTEND_RUNNING; then
  if lsof -i:3000 &>/dev/null; then
    check_http "http://localhost:3000" "Frontend"
  else
    check_http "http://localhost:3001" "Frontend"
  fi
fi

# Test network connectivity
echo -e "\n${BLUE}=== Testing Network Connectivity ===${NC}"

if $AUTH_SERVER_RUNNING; then
  check_port "$LOCAL_IP" 5001 "Authentication Server"
  check_http "http://$LOCAL_IP:5001/health" "Authentication Server"
fi

if $BACKEND_SERVER_RUNNING; then
  check_port "$LOCAL_IP" 5002 "Backend Server"
  check_http "http://$LOCAL_IP:5002/health" "Backend Server"
fi

if $FRONTEND_RUNNING; then
  if lsof -i:3000 &>/dev/null; then
    check_port "$LOCAL_IP" 3000 "Frontend"
    check_http "http://$LOCAL_IP:3000" "Frontend"
  else
    check_port "$LOCAL_IP" 3001 "Frontend"
    check_http "http://$LOCAL_IP:3001" "Frontend"
  fi
fi

# Test login functionality
echo -e "\n${BLUE}=== Testing Login Functionality ===${NC}"

if $AUTH_SERVER_RUNNING; then
  echo -e "\n${YELLOW}Testing login with admin credentials...${NC}"
  
  LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123"}' \
    http://localhost:5001/login)
  
  if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Login successful with admin credentials${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "JWT Token: ${BLUE}${TOKEN:0:20}...${NC}"
  else
    echo -e "${RED}✗ Login failed with admin credentials${NC}"
    echo "Response: $LOGIN_RESPONSE"
  fi
  
  echo -e "\n${YELLOW}Testing login from network IP...${NC}"
  
  NETWORK_LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123"}' \
    http://$LOCAL_IP:5001/login)
  
  if echo "$NETWORK_LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ Network login successful with admin credentials${NC}"
  else
    echo -e "${RED}✗ Network login failed with admin credentials${NC}"
    echo "Response: $NETWORK_LOGIN_RESPONSE"
  fi
fi

echo -e "\n${BLUE}=== CORS Configuration Check ===${NC}"

# Check CORS configuration in the auth server
echo -e "\n${YELLOW}Checking CORS configuration in authentication server...${NC}"

PROJECT_ROOT="/Users/stephanelkhoury/Documents/GitHub/harmonix"
AUTH_SERVER_FILE="$PROJECT_ROOT/server/index.js"

if grep -A 10 "cors" "$AUTH_SERVER_FILE" | grep -q "192.168.1.107"; then
  echo -e "${GREEN}✓ Authentication server has CORS configured for 192.168.1.107${NC}"
else
  echo -e "${RED}✗ Authentication server doesn't have CORS configured for 192.168.1.107${NC}"
  echo "Current CORS configuration:"
  grep -A 10 "cors" "$AUTH_SERVER_FILE"
fi

# Check authUtils.js for network handling
echo -e "\n${YELLOW}Checking frontend authUtils.js for network support...${NC}"

AUTH_UTILS_FILE="$PROJECT_ROOT/frontend/src/utils/authUtils.js"

if grep -q "determineServerUrl" "$AUTH_UTILS_FILE"; then
  echo -e "${GREEN}✓ Frontend authUtils.js has network support${NC}"
else
  echo -e "${RED}✗ Frontend authUtils.js doesn't have dynamic network support${NC}"
  echo "Current SERVER_URL configuration:"
  grep -A 5 "SERVER_URL" "$AUTH_UTILS_FILE"
fi

# Final recommendations
echo -e "\n${BLUE}=== Recommendations ===${NC}"

if ! $AUTH_SERVER_RUNNING; then
  echo -e "${YELLOW}• Start the authentication server:${NC}"
  echo "  cd $PROJECT_ROOT/server && node index.js"
fi

if ! $BACKEND_SERVER_RUNNING; then
  echo -e "${YELLOW}• Start the backend server:${NC}"
  echo "  cd $PROJECT_ROOT/backend && node server.js"
fi

if ! $FRONTEND_RUNNING; then
  echo -e "${YELLOW}• Start the frontend:${NC}"
  echo "  cd $PROJECT_ROOT/frontend && npm start"
fi

if ! grep -A 10 "cors" "$AUTH_SERVER_FILE" | grep -q "192.168.1.107"; then
  echo -e "${YELLOW}• Update CORS configuration in the authentication server:${NC}"
  echo "  Edit $AUTH_SERVER_FILE and add 'http://192.168.1.107:3000', 'http://192.168.1.107:3001' to the origin array"
fi

if ! grep -q "determineServerUrl" "$AUTH_UTILS_FILE"; then
  echo -e "${YELLOW}• Update frontend authUtils.js with network support:${NC}"
  echo "  Edit $AUTH_UTILS_FILE to dynamically determine server URL based on hostname"
fi

echo -e "\n${BLUE}=== Network Test Tools ===${NC}"
echo -e "${YELLOW}• Use the authentication tester:${NC}"
echo "  file://$PROJECT_ROOT/tests/auth_tester.html"
echo -e "${YELLOW}• Use the network test tool:${NC}"
echo "  file://$PROJECT_ROOT/tests/network_test.html"

echo -e "\n${BLUE}=== Diagnosis Complete ===${NC}"
