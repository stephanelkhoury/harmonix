#!/bin/zsh
# Harmonix startup script for macOS

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

HARMONIX_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HARMONIX_ROOT" || exit 1

# Log directory
LOGS_DIR="$HARMONIX_ROOT/logs"
mkdir -p "$LOGS_DIR"

# Function to free up ports and kill existing processes
free_ports() {
  echo -e "${BLUE}Stopping any processes using required ports...${NC}"
  
  # Free up port 8000 (Python service)
  echo -e "${YELLOW}Freeing up port 8000...${NC}"
  lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "Port 8000 is free"
  
  # Free up port 5001 (Node.js server)
  echo -e "${YELLOW}Freeing up port 5001...${NC}"
  lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "Port 5001 is free"
  
  # Free up port 3000 (React frontend)
  echo -e "${YELLOW}Freeing up port 3000...${NC}"
  lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 is free"
  
  # Also kill processes by name to be thorough
  echo -e "${YELLOW}Stopping any existing Harmonix processes...${NC}"
  pkill -f "python.*main.py" 2>/dev/null || echo "No Python service running"
  pkill -f "node.*index.js" 2>/dev/null || echo "No Node.js server running"
  pkill -f "npm start" 2>/dev/null || echo "No npm processes running"
  
  echo -e "${GREEN}All necessary ports have been freed.${NC}"
  
  # Small delay to ensure ports are properly released
  sleep 2
}

# Function to start a component
start_component() {
  local component="$1"
  local log_file="$LOGS_DIR/${component}.log"
  
  echo -e "${BLUE}Starting $component...${NC}"
  
  case "$component" in
    python)
      echo -e "${GREEN}Starting Python service...${NC}"
      cd "$HARMONIX_ROOT/python_service" || exit 1
      nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$log_file" 2>&1 &
      echo $! > "$HARMONIX_ROOT/.${component}.pid"
      echo -e "${GREEN}Python service started! (PID: $(cat "$HARMONIX_ROOT/.${component}.pid"))${NC}"
      echo -e "Logs available at: $log_file"
      ;;

    server)
      echo -e "${GREEN}Starting Node.js server...${NC}"
      cd "$HARMONIX_ROOT/server" || exit 1
      nohup npm start > "$log_file" 2>&1 &
      echo $! > "$HARMONIX_ROOT/.${component}.pid"
      echo -e "${GREEN}Server started! (PID: $(cat "$HARMONIX_ROOT/.${component}.pid"))${NC}"
      echo -e "Logs available at: $log_file"
      ;;

    frontend)
      echo -e "${GREEN}Starting React frontend...${NC}"
      cd "$HARMONIX_ROOT/frontend" || exit 1
      nohup npm start > "$log_file" 2>&1 &
      echo $! > "$HARMONIX_ROOT/.${component}.pid"
      echo -e "${GREEN}Frontend started! (PID: $(cat "$HARMONIX_ROOT/.${component}.pid"))${NC}"
      echo -e "Logs available at: $log_file"
      ;;
      
    all)
      start_component "python"
      sleep 2
      start_component "server"
      sleep 2
      start_component "frontend"
      ;;
      
    *)
      echo -e "${RED}Unknown component: $component${NC}"
      echo "Available components: python, server, frontend, all"
      exit 1
      ;;
  esac
}

# Check if a component was specified
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Starting all Harmonix components...${NC}"
  free_ports
  start_component "all"
else
  # Free ports and start specified component
  free_ports
  start_component "$1"
fi

echo -e "${GREEN}Done!${NC}"
