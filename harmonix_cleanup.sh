#!/bin/zsh

# Harmonix Clean Up Script
# This script kills all Harmonix services

echo "Stopping Harmonix services..."

if [ -f "./harmonix_pids.txt" ]; then
    PIDS=$(cat ./harmonix_pids.txt)
    kill -9 $PIDS 2>/dev/null
    rm ./harmonix_pids.txt
    echo "Services stopped successfully."
else
    echo "Stopping any services on Harmonix ports..."
    kill -9 $(lsof -i :3000 -i :4000 -i :5001 -i :5002 -i :8000 -t) 2>/dev/null || true
    echo "Attempted to stop all services on Harmonix ports."
fi

echo "Done!"
