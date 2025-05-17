#!/bin/bash
# Harmonix Unified Start Script
# This script detects your OS and runs the appropriate startup script

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Detect OS
echo -e "${BLUE}Detecting operating system...${NC}"

case "$(uname -s)" in
  Darwin*)
    echo -e "${GREEN}macOS detected.${NC} Using zsh script."
    # Check if zsh is available
    if command -v zsh &> /dev/null; then
      zsh ./scripts/harmonix-start.sh
    else
      bash ./scripts/harmonix-start.sh
    fi
    ;;
  Linux*)
    echo -e "${GREEN}Linux detected.${NC} Using bash script."
    bash ./scripts/harmonix-start.sh
    ;;
  CYGWIN*|MINGW*|MSYS*)
    echo -e "${GREEN}Windows detected.${NC} Using batch script."
    cmd.exe /c scripts/windows-start.bat
    ;;
  *)
    echo -e "${YELLOW}Unknown operating system.${NC}"
    echo -e "Please choose your operating system:"
    echo -e "1) macOS"
    echo -e "2) Linux"
    echo -e "3) Windows"
    read -p "Enter your choice (1-3): " os_choice
    
    case $os_choice in
      1)
        echo -e "${GREEN}Running macOS script...${NC}"
        if command -v zsh &> /dev/null; then
          zsh ./scripts/harmonix-start.sh
        else
          bash ./scripts/harmonix-start.sh
        fi
        ;;
      2)
        echo -e "${GREEN}Running Linux script...${NC}"
        bash ./scripts/harmonix-start.sh
        ;;
      3)
        echo -e "${GREEN}Running Windows script...${NC}"
        if command -v cmd.exe &> /dev/null; then
          cmd.exe /c scripts/windows-start.bat
        else
          echo -e "${RED}Cannot run Windows batch file. Please run windows-start.bat directly.${NC}"
        fi
        ;;
      *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
    esac
    ;;
esac
