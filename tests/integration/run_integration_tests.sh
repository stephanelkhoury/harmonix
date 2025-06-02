#!/bin/zsh
# Run integration tests for Harmonix

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'

# Get the directory where this script is located and navigate to project root
TESTS_DIR=$(cd "$(dirname "${0}")" && pwd)
HARMONIX_DIR=$(dirname "$TESTS_DIR")
cd "$HARMONIX_DIR"

echo "${BLUE}${BOLD}Running Harmonix Integration Tests${NC}"
echo "${BLUE}================================${NC}"

# Check if services are running
echo -e "\n${YELLOW}Checking if services are running...${NC}"

python_health=$(curl -s --connect-timeout 3 "http://localhost:8000/health" 2>/dev/null)
backend_health=$(curl -s --connect-timeout 3 "http://localhost:5001/health" 2>/dev/null)

if [[ $python_health != *"healthy"* ]]; then
  echo "${RED}Python service is not running. Please start it first with ./start_harmonix.sh${NC}"
  exit 1
fi

if [[ $backend_health != *"healthy"* ]]; then
  echo "${RED}Backend service is not running. Please start it first with ./start_harmonix.sh${NC}"
  exit 1
fi

# Create samples directory and sample MP3 if needed
echo -e "\n${YELLOW}Setting up test environment...${NC}"
SAMPLES_DIR="$HARMONIX_DIR/samples"
mkdir -p "$SAMPLES_DIR"

# Check if test audio exists, and if not, try to create one if ffmpeg is available
if [ ! -f "$SAMPLES_DIR/test_audio.mp3" ]; then
  echo "${YELLOW}No test audio file found in samples directory.${NC}"
  if command -v ffmpeg &> /dev/null; then
    echo "${GREEN}Creating sample test audio with ffmpeg...${NC}"
    ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -c:a mp3 "$SAMPLES_DIR/test_audio.mp3" -y &> /dev/null
    echo "${GREEN}Created test audio file in $SAMPLES_DIR${NC}"
  else
    echo "${YELLOW}ffmpeg not found. Proceeding without test audio (some tests will be skipped).${NC}"
  fi
fi

# Run the integration test script
echo -e "\n${YELLOW}Running integration tests...${NC}"
node integration_test.js

# Check the exit code
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}${BOLD}Integration tests completed successfully!${NC}"
  echo -e "${GREEN}Your Harmonix installation is working properly.${NC}"
else
  echo -e "\n${RED}${BOLD}Integration tests failed.${NC}"
  echo -e "${YELLOW}Please check the error messages above and refer to TROUBLESHOOTING.md${NC}"
fi
