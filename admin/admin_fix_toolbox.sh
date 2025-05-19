#!/bin/bash

# Set directory to the Harmonix project
cd $(dirname $0)

echo "========================================"
echo "🛠️  Harmonix Admin Access Fix Toolbox 🛠️"
echo "========================================"
echo ""

# Function to display menu
show_menu() {
  echo "Choose a fix tool to run:"
  echo "  1. Direct Fix Tool (simple, one-click fix)"
  echo "  2. All-in-One Fix (100% self-contained)"
  echo "  3. Advanced Fix Tool (detailed diagnostics)"
  echo "  4. Reset Auth Data (clear saved credentials)"
  echo "  5. Verify Admin Access (check admin status)"
  echo "  0. Exit"
  echo ""
  read -p "Enter your choice [0-5]: " choice
}

# Function to check http-server
check_http_server() {
  if ! command -v http-server &> /dev/null; then
    echo "http-server not found, installing..."
    npm install -g http-server
    if [ $? -ne 0 ]; then
      echo "Failed to install http-server. Please install it manually with 'npm install -g http-server'"
      exit 1
    fi
  fi
}

# Function to start http-server
start_server() {
  local port=$1
  local file=$2
  check_http_server
  
  echo "Starting server on port $port..."
  http-server -p $port --silent &
  
  # Store the process ID
  HTTP_SERVER_PID=$!
  
  # Open the file in the default browser
  if [[ "$OSTYPE" == "darwin"* ]]; then
      open http://localhost:$port/$file
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      xdg-open http://localhost:$port/$file
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
      start http://localhost:$port/$file
  fi
  
  echo "Press Enter to stop the server and return to menu"
  read
  
  # Kill the http-server process
  kill $HTTP_SERVER_PID
  echo "Server stopped."
}

# Main loop
while true; do
  show_menu

  case $choice in
    1)
      echo "Running Direct Fix Tool..."
      start_server 8080 direct_admin_fix.html
      ;;
    2)
      echo "Running All-in-One Fix Tool..."
      start_server 8081 all_in_one_fix.html
      ;;
    3)
      echo "Running Advanced Fix Tool..."
      start_server 8082 advanced_admin_fix.html
      ;;
    4)
      echo "Running Reset Auth Tool..."
      start_server 8083 reset_auth.html
      ;;
    5)
      echo "Running Verify Admin Access Tool..."
      start_server 8084 verify_admin_access.html
      ;;
    0)
      echo "Exiting Harmonix Admin Fix Toolbox."
      exit 0
      ;;
    *)
      echo "Invalid choice. Please try again."
      ;;
  esac
  
  echo ""
  echo "========================================"
  echo ""
done
