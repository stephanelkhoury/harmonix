#!/bin/bash

# Set directory to the Harmonix project
cd $(dirname $0)

# Check if http-server is installed globally
if ! command -v http-server &> /dev/null
then
    echo "http-server not found, installing..."
    npm install -g http-server
fi

# Start http-server to serve the direct fix HTML file
echo "Starting server for direct admin fix tool..."
echo "Note: The fix script is now embedded directly in the HTML file (no external files needed)"
echo "Open http://localhost:8083/direct_admin_fix.html in your browser"
http-server -p 8083 --silent &

# Store the process ID
HTTP_SERVER_PID=$!

# Open the file in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8083/direct_admin_fix.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:8083/direct_admin_fix.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    start http://localhost:8083/direct_admin_fix.html
fi

# Wait for user to press Enter
echo "Press Enter to stop the server and exit"
read

# Kill the http-server process
kill $HTTP_SERVER_PID
echo "Server stopped"
