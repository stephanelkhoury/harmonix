#!/bin/bash
# Script to check if dependencies are properly installed

# Run the dependency check
if command -v node &> /dev/null; then
  node check_dependencies.js
else
  echo "Node.js is not installed. Please install Node.js 14 or higher."
fi
