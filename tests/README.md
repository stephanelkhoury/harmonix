# Tests Directory

This directory contains all test files for the Harmonix project, organized by type and functionality.

## Directory Structure

```
tests/
├── html/               # HTML-based tests and UI testing
├── js/                 # JavaScript unit and integration tests
├── integration/        # Full system integration tests
└── test_websocket_server.py  # Python WebSocket testing
```

## Test Categories

### HTML Tests (`html/`)
Browser-based tests and UI components:
- `auth_tester.html` - Authentication system testing
- `cors_test.html` - CORS configuration testing
- `login_test.html` - Login functionality testing
- `network_test.html` - Network connectivity testing
- `test_audio_capture.html` - Audio input testing
- `test_chord_display.html` - Chord visualization testing
- `test_realtime_chord_detection.html` - Real-time chord analysis testing

### JavaScript Tests (`js/`)
Client-side JavaScript testing:
- `integration_test.js` - Frontend integration tests
- `test_login.js` - Login system unit tests
- `test_websocket_audio.js` - WebSocket audio streaming tests
- `test_websocket_connection.js` - WebSocket connectivity tests
- `test_youtube_extraction.js` - YouTube data extraction tests
- `verify_chord_fixes.js` - Chord recognition validation
- `verify_enhanced_fretboard.js` - Enhanced fretboard testing

### Integration Tests (`integration/`)
Full system and end-to-end testing:
- `run_integration_tests.sh` - Main integration test runner
- `test_analysis.sh` - Audio analysis system testing
- `test_environment.sh` - Environment validation testing

### Python Tests
- `test_websocket_server.py` - Python WebSocket server testing

## Running Tests

### HTML Tests
Open in browser or use automated testing:
```bash
# Open in browser
open tests/html/test_audio_capture.html

# Or use browser automation tools
```

### JavaScript Tests
```bash
# Run with Node.js
node tests/js/integration_test.js

# Or include in npm test script
npm test
```

### Integration Tests
```bash
# Run all integration tests
./tests/integration/run_integration_tests.sh

# Run specific test
./tests/integration/test_environment.sh
```

### Python Tests
```bash
# Run Python WebSocket tests
python tests/test_websocket_server.py
```

## Test Data and Fixtures

Test files may reference:
- Sample audio files in `/samples/`
- Mock data in test files
- Configuration from `/config/`
- Temporary files in `/uploads/`

## Testing Guidelines

### HTML Tests
- Use semantic HTML for accessibility testing
- Include visual feedback for test results
- Test across different browsers
- Validate responsive design

### JavaScript Tests
- Use descriptive test names
- Include setup and teardown
- Mock external dependencies
- Test both success and error cases

### Integration Tests
- Test complete user workflows
- Validate API endpoints
- Check database interactions
- Test authentication flows

### Performance Tests
- Monitor memory usage
- Check response times
- Test concurrent users
- Validate resource cleanup

## Test Environment Setup

### Prerequisites
```bash
# Install test dependencies
npm install --dev

# Setup test database
npm run test:setup

# Start test servers
npm run test:server
```

### Environment Variables
Set test-specific environment variables:
```bash
export NODE_ENV=test
export TEST_DB_URL=mongodb://localhost:27017/harmonix_test
export TEST_PORT=3001
```

### Browser Testing
For HTML tests, ensure browsers support:
- Web Audio API
- WebSocket connections
- ES6+ JavaScript features
- LocalStorage/SessionStorage

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

### GitHub Actions
```yaml
- name: Run Tests
  run: |
    npm test
    ./tests/integration/run_integration_tests.sh
```

### Local CI Testing
```bash
# Run all tests locally
npm run test:all

# Run with coverage
npm run test:coverage
```

## Test Coverage

Aim for:
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical user paths
- **E2E Tests**: Main application workflows
- **Performance Tests**: Key bottlenecks

## Debugging Tests

### Failed Tests
1. Check test logs in `/logs/`
2. Verify test environment setup
3. Check network connectivity
4. Validate test data integrity

### Browser Issues
1. Open browser developer tools
2. Check console for errors
3. Verify WebSocket connections
4. Test audio permissions

### Server Issues
1. Check server logs
2. Verify port availability
3. Test API endpoints manually
4. Validate database connections

## Adding New Tests

When adding new tests:

1. **Choose appropriate directory** based on test type
2. **Follow naming conventions**: `test_*.html`, `test_*.js`, `*_test.py`
3. **Include documentation** at file top
4. **Add to test runners** if applicable
5. **Update this README** for new test categories

## Test Dependencies

Tests may require:
- **Node.js** 18+ for JavaScript tests
- **Python** 3.9+ for Python tests
- **Modern browsers** for HTML tests
- **Audio hardware** for audio tests
- **Network access** for integration tests

## Mocking and Fixtures

### Audio Mocking
```javascript
// Mock Web Audio API
const mockAudioContext = {
    createAnalyser: () => ({}),
    createGain: () => ({})
};
```

### API Mocking
```javascript
// Mock fetch requests
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ status: 'ok' })
    })
);
```

### WebSocket Mocking
```javascript
// Mock WebSocket connections
class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = WebSocket.CONNECTING;
    }
}
```
