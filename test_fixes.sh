#!/bin/bash

# Test script for verifying both YouTube analysis and Admin access fixes
# Created on May 20, 2025

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}====================================${RESET}"
echo -e "${BOLD}${BLUE}   Harmonix Fix Verification Tool   ${RESET}"
echo -e "${BOLD}${BLUE}====================================${RESET}\n"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a process is running
is_process_running() {
  pgrep -f "$1" >/dev/null
}

# Function to show a section header
section() {
  echo -e "\n${BOLD}${YELLOW}$1${RESET}"
  echo -e "${YELLOW}$(printf '=%.0s' $(seq 1 ${#1}))${RESET}\n"
}

# Function to show a status message
status() {
  if [ "$2" == "success" ]; then
    echo -e "  ${GREEN}✓${RESET} $1"
  elif [ "$2" == "warning" ]; then
    echo -e "  ${YELLOW}!${RESET} $1"
  elif [ "$2" == "error" ]; then
    echo -e "  ${RED}✗${RESET} $1"
  else
    echo -e "  ${BLUE}•${RESET} $1"
  fi
}

# ===== Environment Check =====
section "Environment Check"

# Check if running on macOS
if [[ "$(uname)" == "Darwin" ]]; then
  status "Running on macOS" "success"
else
  status "Not running on macOS - some tests might not work correctly" "warning"
fi

# Check if ffmpeg is installed (required for YouTube analysis)
if command_exists ffmpeg; then
  FFMPEG_VERSION=$(ffmpeg -version | head -n1)
  status "ffmpeg is installed: ${FFMPEG_VERSION}" "success"
else
  status "ffmpeg is NOT installed - YouTube analysis will fail" "error"
  status "Install ffmpeg with: brew install ffmpeg" "info"
fi

# ===== Process Check =====
section "Process Check"

# Check if Node.js server is running
if is_process_running "node.*index.js"; then
  status "Node.js server is running" "success"
else
  status "Node.js server is NOT running" "error"
  status "Start the server with: cd server && node index.js" "info"
fi

# Check if Python service is running
if is_process_running "python.*main.py"; then
  status "Python service is running" "success"
else
  status "Python service is NOT running" "error"
  status "Start the Python service with: cd python_service && python main.py" "info"
fi

# ===== Test YouTube Analysis =====
section "YouTube Analysis Test"

status "Testing YouTube analysis endpoint..." "info"
YOUTUBE_TEST=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=AUFwk1Ibwkc"}' \
  http://localhost:5001/api/analyze-youtube)

if echo "$YOUTUBE_TEST" | grep -q "error"; then
  ERROR_MSG=$(echo "$YOUTUBE_TEST" | grep -o '"error":"[^"]*"' | sed 's/"error":"//;s/"//')
  status "YouTube analysis FAILED: $ERROR_MSG" "error"
else
  status "YouTube analysis successful!" "success"
  
  # Check if chord data is present
  if echo "$YOUTUBE_TEST" | grep -q "chords"; then
    CHORD_COUNT=$(echo "$YOUTUBE_TEST" | grep -o '"chords":\[[^]]*\]' | grep -o '{' | wc -l | tr -d ' ')
    status "Found $CHORD_COUNT chord segments in the analysis" "success"
  fi
fi

# ===== Test Admin Access =====
section "Admin Access Test"

# Test the debug login first to get a token
status "Getting admin token via debug login..." "info"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin"}' \
  http://localhost:5001/debug-login)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
  STATUS="success"
  TOKEN_STATUS="Obtained admin token successfully"
else
  STATUS="error"
  TOKEN_STATUS="Failed to get admin token"
  AUTH_TOKEN=""
fi
status "$TOKEN_STATUS" "$STATUS"

if [[ ! -z "$AUTH_TOKEN" ]]; then
  # Test auth-check endpoint
  status "Testing auth-check endpoint..." "info"
  AUTH_CHECK=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    http://localhost:5001/auth-check)
  
  if echo "$AUTH_CHECK" | grep -q "authenticated"; then
    status "Authentication check successful!" "success"
    IS_ADMIN=$(echo "$AUTH_CHECK" | grep -o '"isAdmin":[^,}]*' | tail -1 | sed 's/"isAdmin"://')
    
    if [[ "$IS_ADMIN" == "true" ]]; then
      status "User has admin privileges" "success"
    else
      status "User does NOT have admin privileges" "error"
    fi
  else
    status "Authentication check failed" "error"
  fi
  
  # Test admin API access
  status "Testing admin API access..." "info"
  ADMIN_API_TEST=$(curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    http://localhost:5001/api/admin/users)
  
  if echo "$ADMIN_API_TEST" | grep -q "error"; then
    ERROR_MSG=$(echo "$ADMIN_API_TEST" | grep -o '"error":"[^"]*"' | sed 's/"error":"//;s/"//')
    status "Admin API access FAILED: $ERROR_MSG" "error"
  else
    status "Admin API access successful!" "success"
    USER_COUNT=$(echo "$ADMIN_API_TEST" | grep -o '{' | wc -l | tr -d ' ')
    status "Retrieved $USER_COUNT users from admin API" "success"
  fi
fi

# ===== Summary =====
section "Test Summary"
echo -e "${BOLD}The test script has completed checking the following fixes:${RESET}"
echo -e "  1. YouTube Analysis - Requires ffmpeg to be installed"
echo -e "  2. Admin API Access - Server middleware fix implemented"
echo ""
echo -e "${BOLD}If any tests failed, please check:${RESET}"
echo -e "  • Server and Python service are running"
echo -e "  • ffmpeg is installed for YouTube analysis"
echo -e "  • Server has the admin access middleware fix"
echo ""
echo -e "${BOLD}Additional test tools:${RESET}"
echo -e "  • ${BLUE}./admin/run_fix_tester.sh${RESET} - Interactive admin access tester"
echo -e "  • ${BLUE}./admin/test_admin_api.sh${RESET} - More detailed admin API tests"
echo ""
