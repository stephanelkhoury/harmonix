#!/bin/bash
# Harmonix Split Terminal Launcher Script
# This script launches each Harmonix service in a separate named terminal window

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo "Harmonix Split Terminal Launcher Script"
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --help, -h       Show this help message"
  echo "  --no-browser     Don't open browser automatically"
  echo "  --skip-install   Skip npm/pip install steps (for faster startup)"
  echo ""
  echo "This script launches each Harmonix component in a separate terminal window"
  echo "with a title corresponding to the service it's running."
  exit 0
fi

# Parse other flags
NO_BROWSER=false
SKIP_INSTALL=false

for arg in "$@"; do
  case $arg in
    --no-browser)
      NO_BROWSER=true
      ;;
    --skip-install)
      SKIP_INSTALL=true
      ;;
  esac
done

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
PURPLE='\033[0;35m'

echo -e "${PURPLE}=======================================${NC}"
echo -e "${BLUE}Starting Harmonix in Separate Terminals${NC}"
echo -e "${PURPLE}=======================================${NC}"

# Get the directory where this script is located
REPO_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$REPO_DIR"

# Function to create terminal window based on OS
create_terminal() {
    local title="$1"
    local command="$2"
    local working_dir="$3"
    
    echo -e "${BLUE}Starting ${title}...${NC}"
    
    # Detect OS
    case "$(uname -s)" in
        Darwin*)
            # macOS: Check if iTerm2 is available, otherwise use Terminal.app
            if osascript -e 'tell application "System Events" to (name of processes) contains "iTerm2"' 2>/dev/null | grep -q "true"; then
                # Use iTerm2 which has better AppleScript support
                osascript <<END_SCRIPT
tell application "iTerm"
    create window with default profile
    tell current window
        tell current session
            write text "cd \"${working_dir}\" && clear && echo -e \"\\033[1;34m===== ${title} =====\\033[0m\\n\\n\" && ${command}"
            set name to "${title}"
        end tell
    end tell
end tell
END_SCRIPT
            else
                # Use Terminal.app with simpler script to avoid syntax issues
                # Use temp file approach which is more reliable
                TEMP_SCRIPT=$(mktemp)
                cat > "$TEMP_SCRIPT" <<END_SCRIPT
tell application "Terminal"
  do script "cd \"${working_dir}\" && clear && printf '\\\\033[1;34m===== ${title} =====\\\\033[0m\\\\n\\\\n' && ${command}"
end tell
END_SCRIPT
                osascript "$TEMP_SCRIPT"
                rm "$TEMP_SCRIPT"
                
                # Wait a moment for the window to appear before setting its title
                sleep 1
                osascript -e "tell application \"Terminal\" to set custom title of front window to \"${title}\""
            fi
            ;;
            
        Linux*)
            # Linux: Use x-terminal-emulator or gnome-terminal if available
            if command -v gnome-terminal &> /dev/null; then
                gnome-terminal --title="${title}" -- bash -c "cd \"${working_dir}\" && clear && echo -e \"\\033[1;34m===== ${title} =====\\033[0m\\n\\n\" && ${command}; echo -e \"\\033[0;31mPress Enter to close...\\033[0m\"; read"
            elif command -v x-terminal-emulator &> /dev/null; then
                x-terminal-emulator -T "${title}" -e "bash -c \"cd \\\"${working_dir}\\\" && clear && echo -e \\\"\\033[1;34m===== ${title} =====\\033[0m\\n\\n\\\" && ${command}; echo -e \\\"\\033[0;31mPress Enter to close...\\033[0m\\\"; read\""
            elif command -v xterm &> /dev/null; then
                xterm -title "${title}" -e "bash -c \"cd \\\"${working_dir}\\\" && clear && echo -e \\\"\\033[1;34m===== ${title} =====\\033[0m\\n\\n\\\" && ${command}; echo -e \\\"\\033[0;31mPress Enter to close...\\033[0m\\\"; read\""
            else
                echo -e "${RED}Cannot find a suitable terminal emulator. Please install gnome-terminal, x-terminal-emulator, or xterm.${NC}"
                exit 1
            fi
            ;;
            
        CYGWIN*|MINGW*|MSYS*)
            # Windows: Use start cmd.exe with proper title and working directory
            # Convert UNIX path to Windows path
            win_path=$(echo "${working_dir}" | sed -e 's/\//\\/g' -e 's/^\\//')
            
            # Create a temporary batch file for this command
            temp_batch_file=$(mktemp --suffix=.bat)
            cat > "$temp_batch_file" << EOL
@echo off
title ${title}
cd /d "${win_path}"
echo ===== ${title} =====
color 0B
${command}
EOL
            
            # Execute the batch file in a new window
            cmd.exe /c "start \"${title}\" cmd.exe /k \"${temp_batch_file}\""
            ;;
            
        *)
            echo -e "${RED}Unsupported operating system. Cannot create terminal window.${NC}"
            exit 1
            ;;
    esac
    
    # Give the system a moment to create the window
    sleep 1
}

# Check for required tools
echo -e "\n${BLUE}Checking required tools...${NC}"
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Python3 is required but not installed. Please install Python.${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Please install Node.js.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Please install npm.${NC}"; exit 1; }

echo -e "${GREEN}✓ All required tools are installed${NC}"

# Check if required ports are available
echo -e "\n${BLUE}Checking if required ports are available...${NC}"
check_port() {
    local port=$1
    local name=$2
    
    # Try to detect OS and use appropriate command
    case "$(uname -s)" in
        Darwin*|Linux*)
            if command -v nc &> /dev/null; then
                if nc -z localhost $port &>/dev/null; then
                    echo -e "${YELLOW}Warning: Port $port for $name is already in use.${NC}"
                    return 1
                fi
            elif command -v lsof &> /dev/null; then
                if lsof -i :$port &>/dev/null; then
                    echo -e "${YELLOW}Warning: Port $port for $name is already in use.${NC}"
                    return 1
                fi
            fi
            ;;
        CYGWIN*|MINGW*|MSYS*)
            # Windows netstat approach
            if netstat -an | grep -q ":$port"; then
                echo -e "${YELLOW}Warning: Port $port for $name is already in use.${NC}"
                return 1
            fi
            ;;
    esac
    
    echo -e "${GREEN}✓ Port $port for $name is available${NC}"
    return 0
}

check_port 8000 "Python Service"
check_port 5001 "Backend" 
check_port 4000 "Server"
check_port 3000 "Frontend"
check_port 3001 "Frontend Alternative"
check_port 27017 "MongoDB"
echo -e "${BLUE}Port check completed.${NC}"

# Create required directories if they don't exist
echo -e "\n${BLUE}Creating required directories...${NC}"
mkdir -p ./server/uploads
mkdir -p ./backend/uploads
mkdir -p ./data/db
echo -e "${GREEN}✓ Directories created${NC}"

# Environment files setup
if [ ! -f "$REPO_DIR/backend/.env" ]; then
  echo -e "${YELLOW}Creating backend/.env file...${NC}"
  cat > "$REPO_DIR/backend/.env" << EOL
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created backend/.env file${NC}"
fi

if [ ! -f "$REPO_DIR/server/.env" ]; then
  echo -e "${YELLOW}Creating server/.env file...${NC}"
  cat > "$REPO_DIR/server/.env" << EOL
# MongoDB connection string
MONGO_URL=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created server/.env file${NC}"
fi

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

# Prepare commands based on whether to skip installation
if [ "$SKIP_INSTALL" = true ]; then
  echo -e "${YELLOW}Skipping dependency installation as requested${NC}"
  PYTHON_CMD="cd \"$REPO_DIR/python_service\" && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"
  SERVER_CMD="cd \"$REPO_DIR/server\" && npm start"
  BACKEND_CMD="cd \"$REPO_DIR/backend\" && npm start"
  FRONTEND_CMD="cd \"$REPO_DIR/frontend\" && npm start"
  FRONTEND2_CMD="cd \"$REPO_DIR/frontend\" && PORT=3001 npm start"
else
  PYTHON_CMD="cd \"$REPO_DIR/python_service\" && pip install -r requirements.txt && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"
  SERVER_CMD="cd \"$REPO_DIR/server\" && npm install && npm start"
  BACKEND_CMD="cd \"$REPO_DIR/backend\" && npm install && npm start"
  FRONTEND_CMD="cd \"$REPO_DIR/frontend\" && npm install && npm start"
  FRONTEND2_CMD="cd \"$REPO_DIR/frontend\" && npm install && PORT=3001 npm start"
fi

# Start each service in a separate terminal
echo -e "\n${BLUE}Starting services in separate terminals...${NC}"

# Start Python service
create_terminal "Python Service" "$PYTHON_CMD" "$REPO_DIR/python_service"

# Start server
create_terminal "Server" "$SERVER_CMD" "$REPO_DIR/server"

# Start Backend
create_terminal "Backend" "$BACKEND_CMD" "$REPO_DIR/backend"

# Start Frontend on port 3000
create_terminal "Frontend Port 3000" "$FRONTEND_CMD" "$REPO_DIR/frontend"

# Start Frontend on port 3001
create_terminal "Frontend Port 3001" "$FRONTEND2_CMD" "$REPO_DIR/frontend"

# Health checks
echo -e "\n${BLUE}Waiting for services to start...${NC}"
sleep 10

# Check if services are running
echo -e "\n${BLUE}Running health checks...${NC}"

# Python Service health check
echo -e "${BLUE}Checking Python service health...${NC}"
if curl -s http://localhost:8000/health > /dev/null; then
  echo -e "${GREEN}✓ Python service is healthy${NC}"
else
  echo -e "${YELLOW}⚠ Python service may still be starting up${NC}"
fi

# Backend service health check
echo -e "${BLUE}Checking Backend service health...${NC}"
if curl -s http://localhost:5001/health > /dev/null; then
  echo -e "${GREEN}✓ Backend service is healthy${NC}"
else
  echo -e "${YELLOW}⚠ Backend service may still be starting up${NC}"
fi

# Server service health check (if it has a health endpoint)
echo -e "${BLUE}Checking Server service health...${NC}"
if curl -s http://localhost:4000/health > /dev/null; then
  echo -e "${GREEN}✓ Server service is healthy${NC}"
else
  echo -e "${YELLOW}⚠ Server service may still be starting up${NC}"
fi

# Open browser
echo -e "\n${GREEN}All services started in separate terminals!${NC}"
echo -e "${BLUE}Frontend URLs:${NC}"
echo -e "  * http://localhost:3000"
echo -e "  * http://localhost:3001"

# Open the app in a browser if possible and not disabled
if [ "$NO_BROWSER" = false ]; then
  echo -e "${BLUE}Opening application in browser...${NC}"
  if command -v open &> /dev/null; then
    open http://localhost:3000
  elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
  elif command -v start &> /dev/null; then
    start http://localhost:3000
  else
    echo -e "${YELLOW}Could not open browser automatically. Please visit:${NC}"
    echo -e "${BLUE}  http://localhost:3000${NC}"
  fi
else
  echo -e "${BLUE}Browser auto-open disabled. Access the application at:${NC}"
  echo -e "${BLUE}  http://localhost:3000${NC}"
  echo -e "${BLUE}  http://localhost:3001${NC}"
fi

echo -e "\n${GREEN}Done! You can now use the Harmonix application.${NC}"
echo -e "${YELLOW}To stop the services, close the individual terminal windows.${NC}"
