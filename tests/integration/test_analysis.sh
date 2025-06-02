#!/bin/zsh
# Test script for Harmonix audio analysis functionality

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'
UNDERLINE='\033[4m'

# Get the directory where this script is located and navigate to project root
TESTS_DIR=$(cd "$(dirname "${0}")" && pwd)
HARMONIX_DIR=$(dirname "$TESTS_DIR")
cd "$HARMONIX_DIR"

echo "${BLUE}${BOLD}Harmonix Analysis Testing Tool${NC}"
echo "${BLUE}==============================${NC}"
echo

# Function to check and report success/failure
check() {
  if [ $? -eq 0 ]; then
    echo "${GREEN}✓ $1${NC}"
    return 0
  else
    echo "${RED}✗ $1${NC}"
    return 1
  fi
}

# Check if the Python service is running
echo "${UNDERLINE}Checking Services:${NC}"
echo -n "Python service: "
curl -s --connect-timeout 5 "http://localhost:8000/health" | grep -q "healthy"
check "Python service is running"

echo -n "Backend service: "
curl -s --connect-timeout 5 "http://localhost:5001/health" | grep -q "healthy"
check "Backend service is running"

echo
echo "${UNDERLINE}Testing MP3 Analysis:${NC}"
# Try to locate a test MP3 file
SAMPLES_DIR="$HARMONIX_DIR/samples"
TEST_MP3=""

# First check the samples directory
for file in $(find "$SAMPLES_DIR" -name "*.mp3" 2>/dev/null | head -1); do
  if [ -f "$file" ]; then
    TEST_MP3=$file
    break
  fi
done

# If not found in samples, search the workspace
if [ -z "$TEST_MP3" ]; then
  for file in $(find "$HARMONIX_DIR" -name "*.mp3" -not -path "*/node_modules/*" -not -path "*/venv/*" 2>/dev/null | head -1); do
    if [ -f "$file" ]; then
      TEST_MP3=$file
      break
    fi
  done
fi

# If still not found, create a test file
if [ -z "$TEST_MP3" ]; then
  echo "${YELLOW}No MP3 file found for testing. Creating a test file...${NC}"
  # Use ffmpeg to create a test tone if available
  if command -v ffmpeg &> /dev/null; then
    mkdir -p "$SAMPLES_DIR"
    ffmpeg -f lavfi -i "sine=frequency=440:duration=5" -c:a mp3 "$SAMPLES_DIR/test_tone.mp3" -y &> /dev/null
    TEST_MP3="$SAMPLES_DIR/test_tone.mp3"
    echo "${GREEN}Created test tone at $TEST_MP3${NC}"
  else
    echo "${RED}ffmpeg not found. Cannot create test MP3. Please place an MP3 file in the samples directory.${NC}"
    exit 1
  fi
fi

echo "Testing MP3 analysis with file: $TEST_MP3"
# Test direct Python service analysis
response=$(curl -s -F "file=@$TEST_MP3" http://localhost:8000/analyze)
if echo "$response" | grep -q "chords"; then
  echo "${GREEN}✓ Python service analysis successful${NC}"
  echo "  First few detected chords:"
  echo "$response" | grep -o '"chord":"[^"]*"' | head -3
else
  echo "${RED}✗ Python service analysis failed${NC}"
  echo "$response"
fi

# Test backend analysis
echo
response=$(curl -s -F "audio=@$TEST_MP3" http://localhost:5001/api/analyze-chords)
if echo "$response" | grep -q "chords"; then
  echo "${GREEN}✓ Backend service analysis successful${NC}"
  echo "  First few detected chords:"
  echo "$response" | grep -o '"chord":"[^"]*"' | head -3
else
  echo "${RED}✗ Backend service analysis failed${NC}"
  echo "$response"
fi

echo
echo "${UNDERLINE}Testing YouTube Analysis:${NC}"
# Use a short, public domain music video for testing
TEST_YOUTUBE_URL="https://www.youtube.com/watch?v=AUFwk1Ibwkc"  # Bach's Minuet in G
echo "Testing YouTube analysis with URL: $TEST_YOUTUBE_URL"

# Test Python service YouTube analysis
response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"url\":\"$TEST_YOUTUBE_URL\"}" http://localhost:8000/analyze-youtube)
if echo "$response" | grep -q "chords"; then
  echo "${GREEN}✓ Python service YouTube analysis successful${NC}"
  echo "  First few detected chords:"
  echo "$response" | grep -o '"chord":"[^"]*"' | head -3
else
  echo "${RED}✗ Python service YouTube analysis failed${NC}"
  echo "$response"
fi

# Test backend YouTube analysis
echo
response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"url\":\"$TEST_YOUTUBE_URL\"}" http://localhost:5001/api/analyze-youtube)
if echo "$response" | grep -q "chords"; then
  echo "${GREEN}✓ Backend service YouTube analysis successful${NC}"
  echo "  First few detected chords:"
  echo "$response" | grep -o '"chord":"[^"]*"' | head -3
else
  echo "${RED}✗ Backend service YouTube analysis failed${NC}"
  echo "$response"
fi

# Check for chord analysis JSON files in SongChords folder
echo
echo "${UNDERLINE}Checking SongChords JSON Files:${NC}"
SONG_CHORDS_DIR="$HARMONIX_DIR/SongChords"

# Wait a moment for file operations to complete
sleep 2

# Check if any JSON files were created in the SongChords directory
json_files=($(find "$SONG_CHORDS_DIR" -name "*.json" -type f -newermt "1 minute ago" | sort))
if [ ${#json_files[@]} -gt 0 ]; then
  echo "${GREEN}✓ Found ${#json_files[@]} chord analysis JSON files saved in the SongChords directory${NC}"
  
  # Check the most recent file
  latest_json="${json_files[-1]}"
  echo "Examining latest file: $(basename $latest_json)"
  
  # Check for key elements in the JSON
  if grep -q '"key":' "$latest_json" && grep -q '"tempo":' "$latest_json" && grep -q '"chords":' "$latest_json"; then
    echo "${GREEN}✓ JSON contains key, tempo, and chord data${NC}"
    
    # Display some information from the file
    key=$(grep -o '"key":[[:space:]]*"[^"]*"' "$latest_json" | head -1 | sed 's/.*"key":[[:space:]]*"\([^"]*\)".*/\1/')
    tempo=$(grep -o '"tempo":[[:space:]]*[0-9.]*' "$latest_json" | head -1 | sed 's/.*"tempo":[[:space:]]*\([0-9.]*\).*/\1/')
    chords_count=$(grep -o '"chord":[[:space:]]*"[^"]*"' "$latest_json" | wc -l | tr -d ' ')
    
    echo "  Song key: $key"
    echo "  Tempo: $tempo BPM"
    echo "  Chord resolution: Every second"
    echo "  Total chords detected: $chords_count"
  else
    echo "${RED}✗ JSON is missing key, tempo, or chord data${NC}"
  fi
else
  echo "${RED}✗ No chord analysis JSON files found in the SongChords directory${NC}"
  echo "Please check permissions and path: $SONG_CHORDS_DIR"
fi

# Summary
echo
echo "${BLUE}${BOLD}Analysis Test Summary${NC}"
echo "${BLUE}====================${NC}"
echo "MP3 analysis features: ${GREEN}TESTED${NC}"
echo "YouTube link analysis: ${GREEN}TESTED${NC}"
echo "JSON file storage: ${GREEN}CHECKED${NC}"
echo
echo "You can now use these features in the Harmonix web interface at:"
echo "${YELLOW}http://localhost:3000${NC}"
echo
echo "Chord analysis files are saved in:"
echo "${YELLOW}$SONG_CHORDS_DIR${NC}"

# Clean up test file if we created one
if [ "$TEST_MP3" = "./test_tone.mp3" ]; then
  rm -f "$TEST_MP3"
fi
