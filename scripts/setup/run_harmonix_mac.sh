#!/bin/zsh
# Harmonix Terminal Launcher - macOS Recommended Setup
# This script detects your terminal and launches the appropriate script

echo -e "\033[0;35m======================================\033[0m"
echo -e "\033[0;34mHarmonix Development Environment Setup\033[0m"
echo -e "\033[0;35m======================================\033[0m"

# Get script directory
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

# Check if iTerm2 is installed 
if osascript -e 'tell application "System Events" to (name of processes) contains "iTerm2"' 2>/dev/null | grep -q "true"; then
  echo -e "\033[0;32m✓ iTerm2 detected, using optimal setup\033[0m"
  HAS_ITERM=true
else
  echo -e "\033[0;33m► Using Terminal.app (iTerm2 recommended for better experience)\033[0m"
  HAS_ITERM=false
fi

# Make sure terminal scripts are executable
chmod +x "$SCRIPT_DIR/start_harmonix_split_terminals.sh"
chmod +x "$SCRIPT_DIR/start_harmonix_macos.sh"

# Parse command line arguments
SKIP_INSTALL=''
NO_BROWSER=''
for arg in "$@"; do
  case $arg in
    --skip-install)
      SKIP_INSTALL='--skip-install'
      ;;
    --no-browser)
      NO_BROWSER='--no-browser'
      ;;
    --help|-h)
      "$SCRIPT_DIR/start_harmonix_split_terminals.sh" --help
      exit 0
      ;;
  esac
done

# Choose the best script based on environment
if [ "$HAS_ITERM" = true ]; then
  echo -e "\033[0;34mLaunching services in iTerm2...\033[0m"
  "$SCRIPT_DIR/start_harmonix_split_terminals.sh" $SKIP_INSTALL $NO_BROWSER
else
  echo -e "\033[0;34mLaunching services with macOS-optimized script...\033[0m"
  "$SCRIPT_DIR/start_harmonix_macos.sh" $SKIP_INSTALL $NO_BROWSER
fi
