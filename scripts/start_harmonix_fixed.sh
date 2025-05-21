#!/bin/bash

# Harmonix Start Script (Corrected Port Configuration)
# Created after fixing login authentication issues
# May 21, 2025

echo "=== Harmonix Startup Script ==="
echo "This script will start all the required services for Harmonix"

# Directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Path to the project root
PROJECT_ROOT="$SCRIPT_DIR/.."

# Get local IP address
LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)

echo "Local IP address: ${LOCAL_IP:-Unknown}"

# Function to check if port is in use
port_in_use() {
  lsof -i:$1 -P -n | grep LISTEN > /dev/null
  return $?
}

# Function to start a service
start_service() {
  SERVICE_NAME=$1
  COMMAND=$2
  PORT=$3
  LOGFILE=$4

  echo "Starting $SERVICE_NAME..."
  
  # Check if service is already running
  if port_in_use $PORT; then
    echo "Service already running on port $PORT"
    return 0
  fi

  # Start service in background
  cd "$PROJECT_ROOT/$SERVICE_NAME" && ($COMMAND > "$PROJECT_ROOT/logs/$LOGFILE" 2>&1 &)
  
  # Wait for service to start
  echo "Waiting for $SERVICE_NAME to start on port $PORT..."
  for i in {1..10}; do
    if port_in_use $PORT; then
      echo "$SERVICE_NAME started successfully on port $PORT"
      return 0
    fi
    sleep 1
  done
  
  echo "Failed to start $SERVICE_NAME on port $PORT within timeout"
  return 1
}

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Start authentication server on port 5001
start_service "server" "node index.js" 5001 "server.log"

# Start backend server on port 5002
start_service "backend" "node server.js" 5002 "backend.log"

# Start Python service on port 8000
if [ -d "$PROJECT_ROOT/python_service" ]; then
  start_service "python_service" "python main.py" 8000 "python_service.log"
fi

# Start frontend on port 3000
start_service "frontend" "npm start" 3000 "frontend.log"

echo "=== All services started ==="
echo "Local access:"
echo "- Frontend: http://localhost:3000"
echo "- Auth Server: http://localhost:5001"
echo "- Backend Server: http://localhost:5002"
echo "- Python Service: http://localhost:8000 (if available)"
echo ""
if [ ! -z "$LOCAL_IP" ]; then
  echo "Network access:"
  echo "- Frontend: http://$LOCAL_IP:3000"
  echo "- Auth Server: http://$LOCAL_IP:5001"
  echo "- Backend Server: http://$LOCAL_IP:5002"
  echo "- Python Service: http://$LOCAL_IP:8000 (if available)"
  echo ""
fi
echo "To view logs:"
echo "- Auth Server: tail -f $PROJECT_ROOT/logs/server.log"
echo "- Backend Server: tail -f $PROJECT_ROOT/logs/backend.log"
echo "- Frontend: tail -f $PROJECT_ROOT/logs/frontend.log"
echo "- Python Service: tail -f $PROJECT_ROOT/logs/python_service.log (if available)"
echo ""
echo "To stop all services: bash $SCRIPT_DIR/stop_harmonix.sh"
