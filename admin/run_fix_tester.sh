#!/bin/bash
# Script to run the admin fix tester

echo "Starting admin fix tester server..."

# Find an available port (default to 8080)
PORT=8080
while netstat -tuln | grep -q ":$PORT "; do
  echo "Port $PORT is in use, trying another one..."
  PORT=$((PORT+1))
done

# Use Python to serve the HTML file
echo "Launching server on port $PORT..."
cd "$(dirname "$0")"

# Start a simple HTTP server with Python in the background
python3 -m http.server $PORT &
SERVER_PID=$!

# Wait briefly to ensure server starts
sleep 1

# Open the HTML file in the default browser
echo "Opening admin_fix_tester.html in your browser..."
open "http://localhost:$PORT/admin_fix_tester.html"

# Explain how to stop the server
echo ""
echo "Test server running on port $PORT (PID: $SERVER_PID)"
echo "Press Ctrl+C when you're finished to stop the server"
echo ""

# Wait for user to press Ctrl+C
wait $SERVER_PID
