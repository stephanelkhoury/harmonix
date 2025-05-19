#!/bin/zsh
# Quick server restart script for the Harmonix application

# Get the directory where this script is located
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Run the server manager with restart command
"$SCRIPT_DIR/scripts/server_manager.sh" restart
