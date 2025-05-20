#!/bin/bash

# manage_harmonix.sh - A utility script to manage Harmonix services
# Created on: May 20, 2025

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure SongChords directory exists with proper permissions
ensure_song_chords_dir() {
    SONG_CHORDS_DIR="$(pwd)/SongChords"
    if [ ! -d "$SONG_CHORDS_DIR" ]; then
        echo -e "${YELLOW}Creating SongChords directory for chord analysis storage...${NC}"
        mkdir -p "$SONG_CHORDS_DIR"
        chmod 755 "$SONG_CHORDS_DIR"
        echo -e "${GREEN}✓ Created SongChords directory${NC}"
    else
        echo -e "${GREEN}✓ SongChords directory exists${NC}"
    fi
}

check_services() {
    echo -e "${YELLOW}Checking Harmonix Services...${NC}"
    
    # Check Python Service
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✓ Python Service${NC} is running on port 8000"
    else
        echo -e "${RED}✗ Python Service${NC} is not running on port 8000"
    fi
    
    # Check Server
    if curl -s http://localhost:5001/health > /dev/null; then
        echo -e "${GREEN}✓ Server${NC} is running on port 5001"
    else
        echo -e "${RED}✗ Server${NC} is not running on port 5001"
    fi
    
    # Check Frontend (just check if port is open)
    if lsof -i :3000 > /dev/null; then
        echo -e "${GREEN}✓ Frontend${NC} is running on port 3000"
    else
        echo -e "${RED}✗ Frontend${NC} is not running on port 3000"
    fi
    
    # Check Backend
    if curl -s http://localhost:5002/health > /dev/null; then
        echo -e "${GREEN}✓ Backend${NC} is running on port 5002 (additional services)"
    else
        echo -e "${RED}✗ Backend${NC} is not running on port 5002 (or doesn't have /health endpoint)"
    fi
    
    # Check if login service is working
    if curl -s -X OPTIONS http://localhost:5001/login > /dev/null; then
        echo -e "${GREEN}✓ Authentication Service${NC} is available on port 5001"
    else
        echo -e "${RED}✗ Authentication Service${NC} is not available on port 5001"
    fi
}

start_service() {
    local service=$1
    
    case "$service" in
        "python")
            echo -e "${YELLOW}Starting Python Service...${NC}"
            # Ensure SongChords directory exists before starting the service
            ensure_song_chords_dir
            cd "$(dirname "$0")" && python -m python_service.main &
            echo "Python Service starting in background"
            ;;
        "server")
            echo -e "${YELLOW}Starting Server...${NC}"
            cd "$(dirname "$0")/server" && node index.js &
            echo "Server starting in background"
            ;;
        "backend")
            echo -e "${YELLOW}Starting Backend...${NC}"
            cd "$(dirname "$0")/backend" && node server.js &
            echo "Backend starting in background"
            ;;
        "frontend")
            echo -e "${YELLOW}Starting Frontend...${NC}"
            cd "$(dirname "$0")/frontend" && npm start &
            echo "Frontend starting in background"
            ;;
        *)
            echo -e "${RED}Unknown service: $service${NC}"
            echo "Available services: python, server, backend, frontend"
            ;;
    esac
}

stop_service() {
    local service=$1
    
    case "$service" in
        "python")
            echo -e "${YELLOW}Stopping Python Service...${NC}"
            pkill -f "python.*main.py" || echo "No Python service running"
            ;;
        "server")
            echo -e "${YELLOW}Stopping Server...${NC}"
            pkill -f "node.*server/index.js" || echo "No Server running"
            ;;
        "backend")
            echo -e "${YELLOW}Stopping Backend...${NC}"
            pkill -f "node.*backend/server.js" || echo "No Backend running"
            ;;
        "frontend")
            echo -e "${YELLOW}Stopping Frontend...${NC}"
            pkill -f "npm.*start" || echo "No Frontend running"
            ;;
        "all")
            echo -e "${YELLOW}Stopping all Harmonix services...${NC}"
            pkill -f "python.*main.py" || echo "No Python service running"
            pkill -f "node.*server/index.js" || echo "No Server running"
            pkill -f "node.*backend/server.js" || echo "No Backend running"
            pkill -f "npm.*start" || echo "No Frontend running"
            ;;
        *)
            echo -e "${RED}Unknown service: $service${NC}"
            echo "Available services: python, server, backend, frontend, all"
            ;;
    esac
}

restart_service() {
    local service=$1
    
    stop_service "$service"
    sleep 2
    start_service "$service"
}

test_chord_analyzer() {
    echo -e "${YELLOW}Testing Chord Analyzer...${NC}"
    
    # Test direct file analysis
    echo "Testing direct file analysis..."
    result=$(curl -s -F "audio=@$(dirname "$0")/samples/test_audio.mp3" http://localhost:5001/api/analyze-chords)
    
    if [[ $result == *"chords"* ]]; then
        echo -e "${GREEN}✓ Direct file analysis working${NC}"
    else
        echo -e "${RED}✗ Direct file analysis failed${NC}"
        echo "Response: $result"
    fi
    
    # Test YouTube analysis
    echo "Testing YouTube analysis..."
    result=$(curl -s -H "Content-Type: application/json" -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' http://localhost:5001/api/analyze-youtube)
    
    if [[ $result == *"chords"* ]]; then
        echo -e "${GREEN}✓ YouTube analysis working${NC}"
    else
        echo -e "${RED}✗ YouTube analysis failed${NC}"
        echo "Response: $result"
    fi
}

test_login() {
    echo -e "${YELLOW}Testing Login Functionality...${NC}"
    
    # Check if server is running
    if ! curl -s http://localhost:5001/health > /dev/null; then
        echo -e "${RED}✗ Server not running on port 5001. Please start it first.${NC}"
        return 1
    fi
    
    # Test login with test credentials
    echo "Attempting login with test credentials..."
    result=$(curl -s -X POST -H "Content-Type: application/json" \
        -d '{"username":"testuser","password":"password123"}' \
        http://localhost:5001/login)
    
    if [[ $result == *"token"* ]]; then
        echo -e "${GREEN}✓ Login functionality working${NC}"
    else
        if [[ $result == *"Invalid username or password"* ]]; then
            echo -e "${YELLOW}⚠ Login endpoint is responding correctly${NC} (credentials invalid but endpoint works)"
        else
            echo -e "${RED}✗ Login endpoint error${NC}"
        fi
        echo "Response: $result"
        
        # Test CORS headers
        echo "Checking CORS headers..."
        cors_result=$(curl -s -I -X OPTIONS -H "Origin: http://localhost:3001" \
            -H "Access-Control-Request-Method: POST" \
            http://localhost:5001/login)
        
        if [[ $cors_result == *"Access-Control-Allow-Origin: http://localhost:3001"* ]]; then
            echo -e "${GREEN}✓ CORS headers correctly set for port 3001${NC}"
        else
            echo -e "${RED}✗ CORS headers not properly configured for port 3001${NC}"
            echo "Headers: "
            echo "$cors_result"
        fi
    fi
}

open_app() {
    echo -e "${YELLOW}Opening Harmonix in browser...${NC}"
    open "http://localhost:3000"
}

list_chord_analyses() {
    echo -e "${YELLOW}Listing Saved Chord Analyses...${NC}"
    SONG_CHORDS_DIR="$(pwd)/SongChords"
    
    # Check if directory exists
    if [ ! -d "$SONG_CHORDS_DIR" ]; then
        echo -e "${RED}SongChords directory not found!${NC}"
        return 1
    fi
    
    # Count JSON files in the directory
    json_count=$(find "$SONG_CHORDS_DIR" -name "*.json" | wc -l | tr -d ' ')
    
    if [ "$json_count" -eq 0 ]; then
        echo -e "${YELLOW}No chord analyses found. Analyze a song first.${NC}"
        return 0
    fi
    
    echo -e "${GREEN}Found $json_count chord analysis files${NC}"
    echo
    echo -e "${YELLOW}Recent Analyses:${NC}"
    
    # List the most recent 5 analyses with details
    find "$SONG_CHORDS_DIR" -name "*.json" -type f -exec stat -f "%m %N" {} \; | sort -nr | head -5 | while read line; do
        timestamp=$(echo $line | cut -d' ' -f1)
        file=$(echo $line | cut -d' ' -f2-)
        filename=$(basename "$file")
        date_str=$(date -r $timestamp "+%Y-%m-%d %H:%M:%S")
        
        echo -e "${GREEN}→ $filename${NC}"
        echo -e "  Created: $date_str"
        
        # Extract key info from the JSON
        if [ -f "$file" ]; then
            # Extract song key if available
            if grep -q '"key":' "$file"; then
                key=$(grep -o '"key":[[:space:]]*"[^"]*"' "$file" | head -1 | sed 's/.*"key":[[:space:]]*"\([^"]*\)".*/\1/')
                echo -e "  Key: $key"
            fi
            
            # Extract tempo if available
            if grep -q '"tempo":' "$file"; then
                tempo=$(grep -o '"tempo":[[:space:]]*[0-9.]*' "$file" | head -1 | sed 's/.*"tempo":[[:space:]]*\([0-9.]*\).*/\1/')
                echo -e "  Tempo: $tempo BPM"
            fi
            
            # Extract chord count
            chord_count=$(grep -o '"chord":[[:space:]]*"[^"]*"' "$file" | wc -l | tr -d ' ')
            echo -e "  Chords: $chord_count detected"
            
            echo
        fi
    done
    
    echo -e "All analyses are stored in: ${YELLOW}$SONG_CHORDS_DIR${NC}"
}

show_usage() {
    echo "Usage: $0 [command] [service]"
    echo ""
    echo "Commands:"
    echo "  status        Check status of all services"
    echo "  start         Start a specific service"
    echo "  stop          Stop a specific service"
    echo "  restart       Restart a specific service"
    echo "  stop-all      Stop all services"
    echo "  test          Test chord analyzer functionality"
    echo "  test-login    Test login functionality"
    echo "  list-chords   List saved chord analyses"
    echo "  open          Open the application in a browser"
    echo ""
    echo "Services (for start/stop/restart):"
    echo "  python        Python Service (port 8000)"
    echo "  server        File Server (port 5001)"
    echo "  backend       Backend API (port 5002)"
    echo "  frontend      Frontend UI (port 3000)"
    echo ""
    echo "Examples:"
    echo "  $0 status              Check status of all services"
    echo "  $0 start python        Start the Python service"
    echo "  $0 stop server         Stop the server"
    echo "  $0 restart frontend    Restart the frontend"
    echo "  $0 stop-all            Stop all services"
    echo "  $0 test                Test chord analyzer functionality"
    echo "  $0 test-login          Test login functionality"
    echo "  $0 list-chords         List saved chord analyses"
    echo "  $0 open                Open the app in a browser"
}

# Main execution
case "$1" in
    "status")
        check_services
        ;;
    "start")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Missing service name${NC}"
            show_usage
            exit 1
        fi
        start_service "$2"
        ;;
    "stop")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Missing service name${NC}"
            show_usage
            exit 1
        fi
        stop_service "$2"
        ;;
    "restart")
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Missing service name${NC}"
            show_usage
            exit 1
        fi
        restart_service "$2"
        ;;
    "stop-all")
        stop_service "all"
        ;;
    "test")
        test_chord_analyzer
        ;;
    "test-login")
        test_login
        ;;
    "list-chords")
        list_chord_analyses
        ;;
    "open")
        open_app
        ;;
    *)
        show_usage
        ;;
esac
