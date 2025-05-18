/**
 * Server health check script for Harmonix
 * 
 * This script verifies the server is running correctly and validates
 * that all expected API endpoints are working properly
 */

const http = require('http');

// Configuration
const SERVER_URL = 'http://localhost:5001';
const ENDPOINTS_TO_CHECK = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/health' },
  { method: 'HEAD', path: '/login' },
  { method: 'HEAD', path: '/signup' }
];

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

/**
 * Make a simple HTTP request to check if an endpoint exists
 */
function checkEndpoint(method, path) {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${path}`;
    const options = {
      method: method
    };

    const req = http.request(url, options, (res) => {
      // For HEAD requests, we only care if we get a response
      // For GET requests, 200 is preferred but any non-404 is acceptable
      if (res.statusCode !== 404) {
        resolve({
          path,
          method,
          status: res.statusCode,
          ok: true
        });
      } else {
        resolve({
          path,
          method,
          status: res.statusCode,
          ok: false
        });
      }
    });

    req.on('error', (error) => {
      resolve({
        path,
        method,
        error: error.message,
        ok: false
      });
    });

    req.end();
  });
}

/**
 * Main function to check server health
 */
async function checkServer() {
  console.log(`\nChecking Harmonix server health at ${SERVER_URL}...`);
  
  try {
    // Check if server is running at all
    const baseCheckResult = await checkEndpoint('GET', '/health');
    
    if (!baseCheckResult.ok) {
      console.log(`${RED}✗ Server is not responding at ${SERVER_URL}${RESET}`);
      console.log(`${YELLOW}Tip: Make sure the server is running using 'npm start' in server directory${RESET}`);
      process.exit(1);
    }
    
    console.log(`${GREEN}✓ Server is running at ${SERVER_URL}${RESET}`);
    
    // Check all critical endpoints
    const results = await Promise.all(ENDPOINTS_TO_CHECK.map(endpoint => 
      checkEndpoint(endpoint.method, endpoint.path)
    ));
    
    let allEndpointsOk = true;
    
    results.forEach(result => {
      if (result.ok) {
        console.log(`${GREEN}✓ ${result.method} ${result.path} - OK (${result.status})${RESET}`);
      } else {
        allEndpointsOk = false;
        console.log(`${RED}✗ ${result.method} ${result.path} - Not Found (${result.status || result.error})${RESET}`);
      }
    });
    
    // Special checks for authentication endpoints
    const authResults = await Promise.all([
      checkEndpoint('HEAD', '/login'),
      checkEndpoint('HEAD', '/signup')
    ]);
    
    const authOk = authResults.every(r => r.ok);
    
    if (!authOk) {
      console.log(`${YELLOW}⚠ Authentication endpoints may not be fully configured${RESET}`);
      console.log(`${YELLOW}Tip: Check server/index.js to ensure login and signup endpoints are properly defined${RESET}`);
      allEndpointsOk = false;
    }
    
    if (allEndpointsOk) {
      console.log(`\n${GREEN}✓ All server endpoints are configured correctly${RESET}`);
      process.exit(0);
    } else {
      console.log(`\n${YELLOW}⚠ Some endpoints may not be configured correctly${RESET}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`${RED}Error checking server health: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Run the check
checkServer();
