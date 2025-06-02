#!/bin/zsh
# MacOS-specific Harmonix launcher script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

echo -e "${PURPLE}========================================${NC}"
echo -e "${BLUE}Starting Harmonix in Separate Terminals${NC}"
echo -e "${PURPLE}========================================${NC}"

# Parse command line arguments
SKIP_INSTALL=false
NO_BROWSER=false

for arg in "$@"; do
  case $arg in
    --skip-install)
      SKIP_INSTALL=true
      ;;
    --no-browser)
      NO_BROWSER=true
      ;;
    --help|-h)
      echo "Harmonix MacOS Terminal Launcher"
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --help, -h       Show this help message"
      echo "  --no-browser     Don't open browser automatically"
      echo "  --skip-install   Skip npm/pip install steps (for faster startup)"
      exit 0
      ;;
  esac
done

# Check required tools
echo -e "\n${BLUE}Checking required tools...${NC}"
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}Python3 is required but not installed. Please install Python.${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Please install Node.js.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed. Please install npm.${NC}"; exit 1; }

echo -e "${GREEN}✓ All required tools are installed${NC}"

# Create required directories
echo -e "\n${BLUE}Creating required directories...${NC}"
mkdir -p ./server/uploads
mkdir -p ./backend/uploads
mkdir -p ./data/db
echo -e "${GREEN}✓ Directories created${NC}"

# Setup env files if needed
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
  echo -e "${YELLOW}Creating backend/.env file...${NC}"
  cat > "$SCRIPT_DIR/backend/.env" << EOL
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created backend/.env file${NC}"
fi

if [ ! -f "$SCRIPT_DIR/server/.env" ]; then
  echo -e "${YELLOW}Creating server/.env file...${NC}"
  cat > "$SCRIPT_DIR/server/.env" << EOL
# MongoDB connection string
MONGO_URL=mongodb://localhost:27017/harmonix

# Python service URL
PYTHON_SERVICE_URL=http://localhost:8000
EOL
  echo -e "${GREEN}✓ Created server/.env file${NC}"
fi

# Check MongoDB
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

# Function to create a new terminal window
create_mac_terminal() {
    local title="$1"
    local command="$2"
    local working_dir="$3"
    
    echo -e "${BLUE}Starting ${title}...${NC}"
    
    # Check if iTerm2 is available, otherwise use Terminal.app
    if osascript -e 'tell application "System Events" to (name of processes) contains "iTerm2"' 2>/dev/null | grep -q "true"; then
        # Use iTerm2 which has better AppleScript support
        osascript <<EOF
tell application "iTerm"
    create window with default profile
    tell current window
        tell current session
            write text "cd \"${working_dir}\" && clear && echo -e \"\\033[1;34m===== ${title} =====\\033[0m\\n\\n\" && ${command}"
            set name to "${title}"
        end tell
    end tell
end tell
EOF
    else
        # Use Terminal.app with a more reliable approach
        # Create a temporary script file to avoid heredoc syntax issues
        TEMP_SCRIPT=$(mktemp)
        cat > "$TEMP_SCRIPT" <<EOF
tell application "Terminal"
  do script "cd \"${working_dir}\" && clear && printf '\\\\033[1;34m===== ${title} =====\\\\033[0m\\\\n\\\\n' && ${command}"
end tell
EOF
        osascript "$TEMP_SCRIPT"
        rm "$TEMP_SCRIPT"
        
        # Wait a moment for the window to appear before setting its title
        sleep 1
        osascript -e "tell application \"Terminal\" to set custom title of front window to \"${title}\""
    fi
    
    sleep 1
}

# Prepare commands based on skip flag
if [ "$SKIP_INSTALL" = true ]; then
  echo -e "${YELLOW}Skipping dependency installation as requested${NC}"
  PYTHON_CMD="python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"
  SERVER_CMD="npm start"
  BACKEND_CMD="npm start"
  FRONTEND_CMD="npm start"
  FRONTEND2_CMD="PORT=3001 npm start"
else
  PYTHON_CMD="pip install -r requirements.txt && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"
  SERVER_CMD="npm install && npm start"
  BACKEND_CMD="npm install && npm start"
  FRONTEND_CMD="npm install && npm start"
  FRONTEND2_CMD="npm install && PORT=3001 npm start"
fi

# Start services in separate terminals
echo -e "\n${BLUE}Starting services in separate terminals...${NC}"

create_mac_terminal "Python Service" "$PYTHON_CMD" "$SCRIPT_DIR/python_service"
create_mac_terminal "Server" "$SERVER_CMD" "$SCRIPT_DIR/server"
create_mac_terminal "Backend" "$BACKEND_CMD" "$SCRIPT_DIR/backend"
create_mac_terminal "Frontend Port 3000" "$FRONTEND_CMD" "$SCRIPT_DIR/frontend"
create_mac_terminal "Frontend Port 3001" "$FRONTEND2_CMD" "$SCRIPT_DIR/frontend"

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

# Server service health check
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
  open http://localhost:3000
else
  echo -e "${BLUE}Browser auto-open disabled. Access the application at:${NC}"
  echo -e "${BLUE}  http://localhost:3000${NC}"
fi

echo -e "\n${GREEN}Done! You can now use the Harmonix application.${NC}"
echo -e "${YELLOW}To stop the services, close the individual terminal windows.${NC}"
