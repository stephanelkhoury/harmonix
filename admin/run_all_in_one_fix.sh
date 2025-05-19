#!/bin/bash

# Set directory to the Harmonix project
cd $(dirname $0)

# Check if http-server is installed globally
if ! command -v http-server &> /dev/null
then
    echo "http-server not found, installing..."
    npm install -g http-server
fi

# Start http-server to serve the all-in-one fix HTML file
echo "Starting server for all-in-one admin fix tool..."
echo "This version is 100% self-contained and has no external dependencies"
echo "Open http://localhost:8084/all_in_one_fix.html in your browser"
http-server -p 8084 --silent &

# Store the process ID
HTTP_SERVER_PID=$!

# Open the file in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8084/all_in_one_fix.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:8084/all_in_one_fix.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    start http://localhost:8084/all_in_one_fix.html
fi

# Wait for user to press Enter
echo "Press Enter to stop the server and exit"
read

# Kill the http-server process
kill $HTTP_SERVER_PID
echo "Server stopped."
