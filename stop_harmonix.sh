#!/bin/bash

echo "Stopping Harmonix services..."

# Kill Python service
echo "Stopping Python Service..."
pkill -f "python.*main.py" || echo "No Python service running"

# Kill Node.js processes for server and frontend
echo "Stopping Node.js services..."
pkill -f "node.*index.js" || echo "No Node.js server running"
pkill -f "npm start" || echo "No npm processes running"

echo "All Harmonix services stopped."
