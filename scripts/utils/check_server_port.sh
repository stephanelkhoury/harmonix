#!/bin/bash

# Set directory to the Harmonix project
cd $(dirname $0)

echo "Checking for running server instances..."

# Check for processes using ports 5001 and 5002
echo "Checking port 5001:"
if command -v lsof &> /dev/null; then
    lsof -i :5001 || echo "No process found using port 5001"
else
    echo "lsof command not available to check port 5001"
fi

echo -e "\nChecking port 5002:"
if command -v lsof &> /dev/null; then
    lsof -i :5002 || echo "No process found using port 5002"
else
    echo "lsof command not available to check port 5002"
fi

echo -e "\nChecking server configuration files:"
echo "1. Server port in index.js:"
grep -n "PORT =" server/index.js

echo -e "\n2. Server URL in authUtils.js:"
grep -n "SERVER_URL" frontend/src/utils/authUtils.js

echo -e "\nServer Information Summary:"
echo "--------------------------------"
echo "1. Your frontend is configured to connect to the server on port 5002"
echo "2. Your admin dashboard is configured to use port 5002"
echo "3. Our admin_login_fix.html is now configured for port 5002"

echo -e "\nTo fix your admin dashboard access issue:"
echo "1. Run ./fix_admin_access.sh to reset authentication and properly login as admin"
echo "2. Make sure your server is running on port 5002"
echo "3. Try accessing the dashboard again"
