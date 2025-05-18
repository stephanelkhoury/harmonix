#!/bin/zsh

# Harmonix Server Management Script
# This script handles starting, stopping, and validating the Harmonix server

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Get the harmonix root directory (assuming this script is in the scripts directory)
HARMONIX_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Server port
SERVER_PORT=5001

# Check if a process is running on the server port
check_server_port() {
  if lsof -i :$SERVER_PORT -t >/dev/null 2>&1; then
    return 0 # Port is in use
  else
    return 1 # Port is not in use
  fi
}

# Stop any existing server process
stop_server() {
  echo -e "${BLUE}Checking for existing server process on port $SERVER_PORT...${NC}"
  
  local SERVER_PID=$(lsof -i :$SERVER_PORT -t 2>/dev/null)
  
  if [ -n "$SERVER_PID" ]; then
    echo -e "${YELLOW}Found server process running with PID $SERVER_PID${NC}"
    echo -e "${BLUE}Stopping existing server process...${NC}"
    kill $SERVER_PID 2>/dev/null
    sleep 2
    
    # Check if it's still running and force kill if needed
    if lsof -i :$SERVER_PORT -t >/dev/null 2>&1; then
      echo -e "${YELLOW}Server didn't stop gracefully, forcing termination...${NC}"
      kill -9 $SERVER_PID 2>/dev/null
      sleep 1
    fi
    
    if ! lsof -i :$SERVER_PORT -t >/dev/null 2>&1; then
      echo -e "${GREEN}✓ Server successfully stopped${NC}"
      return 0
    else
      echo -e "${RED}Failed to stop server. Port $SERVER_PORT is still in use.${NC}"
      return 1
    fi
  else
    echo -e "${GREEN}✓ No server process found on port $SERVER_PORT${NC}"
    return 0
  fi
}

# Start the server from the server directory
start_server() {
  echo -e "${BLUE}Starting Harmonix server...${NC}"
  
  # Check which server implementation to use
  if [ -f "$HARMONIX_ROOT/server/index.js" ]; then
    cd "$HARMONIX_ROOT/server"
    echo -e "${BLUE}Using server implementation at server/index.js${NC}"
    npm start > "$HARMONIX_ROOT/server.log" 2>&1 &
    SERVER_PID=$!
  elif [ -f "$HARMONIX_ROOT/backend/server.js" ]; then
    cd "$HARMONIX_ROOT/backend"
    echo -e "${BLUE}Using server implementation at backend/server.js${NC}"
    npm start > "$HARMONIX_ROOT/server.log" 2>&1 &
    SERVER_PID=$!
  else
    echo -e "${RED}No server implementation found!${NC}"
    echo -e "${YELLOW}Make sure either server/index.js or backend/server.js exists.${NC}"
    return 1
  fi
  
  # Wait a moment for the server to start
  echo -e "${BLUE}Waiting for server to start...${NC}"
  sleep 3
  
  # Check if the server started successfully
  if ps -p $SERVER_PID > /dev/null && check_server_port; then
    echo -e "${GREEN}✓ Server started successfully on port $SERVER_PORT (PID: $SERVER_PID)${NC}"
    return 0
  else
    echo -e "${RED}Server failed to start!${NC}"
    echo -e "${YELLOW}Check server.log for details.${NC}"
    return 1
  fi
}

# Validate the server endpoints
validate_server() {
  echo -e "${BLUE}Validating server endpoints...${NC}"
  
  node "$HARMONIX_ROOT/scripts/check_server.js"
  local VALIDATION_STATUS=$?
  
  if [ $VALIDATION_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Server validation passed${NC}"
    return 0
  else
    echo -e "${RED}Server validation failed!${NC}"
    return 1
  fi
}

# Main function to handle the requested action
main() {
  local ACTION=$1
  
  case "$ACTION" in
    "start")
      if check_server_port; then
        echo -e "${YELLOW}Server is already running on port $SERVER_PORT${NC}"
        echo -e "${BLUE}Stopping existing server first...${NC}"
        stop_server
      fi
      start_server
      validate_server
      ;;
      
    "stop")
      stop_server
      ;;
      
    "restart")
      stop_server && start_server && validate_server
      ;;
      
    "validate")
      validate_server
      ;;
      
    *)
      echo -e "${BLUE}Harmonix Server Management${NC}"
      echo -e "Usage: $0 {start|stop|restart|validate}"
      echo -e "  start    - Start the server"
      echo -e "  stop     - Stop the server"
      echo -e "  restart  - Restart the server"
      echo -e "  validate - Validate the server endpoints"
      ;;
  esac
}

# Run the main function with the provided argument
main "$1"
