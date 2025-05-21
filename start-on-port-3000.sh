#!/bin/bash

# Start Harmonix on port 3000
# This script starts the client on port 3000 instead of the default 3001

# Set directory to the Harmonix project
cd "$(dirname "$0")"

# Check if server is running, start it if it's not
if ! lsof -i :5001 > /dev/null 2>&1; then
  echo "Starting server on port 5001..."
  cd server
  npm start &
  SERVER_PID=$!
  cd ..
  
  # Wait for server to start
  echo "Waiting for server to start..."
  sleep 3
fi

# Start client on port 3000
echo "Starting client on port 3000..."
cd client
npm run start:3000

# Clean up when script is terminated
trap 'kill $SERVER_PID 2>/dev/null' EXIT
