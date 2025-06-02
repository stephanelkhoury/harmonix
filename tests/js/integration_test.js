// Integration test for Harmonix backend to Python service communication
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const TEST_YOUTUBE_URL = 'https://www.youtube.com/watch?v=AUFwk1Ibwkc'; // Bach's Minuet in G

// Determine project root path
const TESTS_DIR = __dirname;
const PROJECT_ROOT = path.resolve(TESTS_DIR, '..');
const SAMPLES_DIR = path.join(PROJECT_ROOT, 'samples');
const TEST_MP3_PATH = path.join(SAMPLES_DIR, 'test_audio.mp3');

// Helper function to check if test MP3 exists
async function ensureTestMp3Exists() {
  // Ensure samples directory exists
  if (!fs.existsSync(SAMPLES_DIR)) {
    fs.mkdirSync(SAMPLES_DIR, { recursive: true });
    console.log('Created samples directory at:', SAMPLES_DIR);
  }
  
  // Check if the test file exists
  if (!fs.existsSync(TEST_MP3_PATH)) {
    console.warn(`⚠️ Test file ${TEST_MP3_PATH} not found.`);
    console.warn('Please create an MP3 file in the samples directory for testing.');
    return false;
  }
  
  return true;
}

// Test health check endpoints
async function testHealthEndpoints() {
  console.log('\n🔍 Testing service health endpoints...');
  
  try {
    const pythonHealth = await axios.get(`${PYTHON_SERVICE_URL}/health`);
    console.log('✅ Python service health check: OK');
    console.log(`   Status: ${pythonHealth.data.status}`);
  } catch (error) {
    console.error('❌ Python service health check failed:', 
      error.response?.data || error.message);
    return false;
  }
  
  try {
    const backendHealth = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend service health check: OK');
    console.log(`   Status: ${backendHealth.data.status}`);
  } catch (error) {
    console.error('❌ Backend service health check failed:', 
      error.response?.data || error.message);
    return false;
  }
  
  return true;
}

// Test direct MP3 analysis to Python service
async function testPythonMp3Analysis() {
  console.log('\n🔍 Testing direct MP3 analysis with Python service...');
  
  if (!await ensureTestMp3Exists()) {
    console.log('⏩ Skipping MP3 analysis test');
    return false;
  }
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_MP3_PATH));
    
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    if (response.data && response.data.chords && response.data.chords.length > 0) {
      console.log('✅ Python service MP3 analysis: OK');
      console.log(`   Detected ${response.data.chords.length} chords`);
      console.log(`   First chord: ${JSON.stringify(response.data.chords[0])}`);
      return true;
    } else {
      console.error('❌ Python service returned empty chord analysis');
      return false;
    }
  } catch (error) {
    console.error('❌ Python service MP3 analysis failed:', 
      error.response?.data || error.message);
    return false;
  }
}

// Test MP3 analysis through backend
async function testBackendMp3Analysis() {
  console.log('\n🔍 Testing MP3 analysis through backend service...');
  
  if (!await ensureTestMp3Exists()) {
    console.log('⏩ Skipping backend MP3 analysis test');
    return false;
  }
  
  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(TEST_MP3_PATH));
    
    const response = await axios.post(`${BACKEND_URL}/api/analyze-chords`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    if (response.data && response.data.chords && response.data.chords.length > 0) {
      console.log('✅ Backend service MP3 analysis: OK');
      console.log(`   Detected ${response.data.chords.length} chords`);
      console.log(`   First chord: ${JSON.stringify(response.data.chords[0])}`);
      return true;
    } else {
      console.error('❌ Backend service returned empty chord analysis');
      return false;
    }
  } catch (error) {
    console.error('❌ Backend service MP3 analysis failed:', 
      error.response?.data || error.message);
    return false;
  }
}

// Test YouTube analysis
async function testYouTubeAnalysis() {
  console.log('\n🔍 Testing YouTube link analysis...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/analyze-youtube`, {
      url: TEST_YOUTUBE_URL
    });
    
    if (response.data && response.data.chords && response.data.chords.length > 0) {
      console.log('✅ YouTube link analysis: OK');
      console.log(`   Analyzed URL: ${TEST_YOUTUBE_URL}`);
      console.log(`   Detected ${response.data.chords.length} chords`);
      return true;
    } else {
      console.error('❌ YouTube analysis returned empty chord analysis');
      return false;
    }
  } catch (error) {
    console.error('❌ YouTube analysis failed:', 
      error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🎵 Harmonix Integration Tests 🎵');
  console.log('===============================');
  
  let passed = 0;
  let total = 4;
  
  if (await testHealthEndpoints()) passed++;
  if (await testPythonMp3Analysis()) passed++;
  if (await testBackendMp3Analysis()) passed++;
  if (await testYouTubeAnalysis()) passed++;
  
  console.log('\n📊 Test Results:');
  console.log(`   ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n✨ All tests passed! The system is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Execute the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
