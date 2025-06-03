#!/usr/bin/env node
/**
 * Production Health Check Script for Harmonix
 * Tests all service endpoints and reports status
 */

const axios = require('axios');
const chalk = require('chalk');

// Configuration - update these URLs with your deployed endpoints
const CONFIG = {
  frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
  backend: process.env.BACKEND_URL || 'http://localhost:5001',
  server: process.env.SERVER_URL || 'http://localhost:4000',
  pythonService: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
  database: process.env.MONGODB_URI || 'mongodb://localhost:27017/harmonix'
};

// Health check functions
async function checkEndpoint(name, url, path = '/health') {
  try {
    console.log(chalk.blue(`Checking ${name}...`));
    const response = await axios.get(`${url}${path}`, { timeout: 10000 });
    
    if (response.status === 200) {
      console.log(chalk.green(`✓ ${name} is healthy`));
      if (response.data) {
        console.log(chalk.gray(`  Status: ${JSON.stringify(response.data, null, 2)}`));
      }
      return true;
    } else {
      console.log(chalk.yellow(`⚠ ${name} returned status ${response.status}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`✗ ${name} is not responding`));
    console.log(chalk.gray(`  Error: ${error.message}`));
    return false;
  }
}

async function checkFrontend() {
  try {
    console.log(chalk.blue('Checking Frontend...'));
    const response = await axios.get(CONFIG.frontend, { timeout: 10000 });
    
    if (response.status === 200 && response.data.includes('Harmonix')) {
      console.log(chalk.green('✓ Frontend is serving correctly'));
      return true;
    } else {
      console.log(chalk.yellow('⚠ Frontend is responding but may not be serving Harmonix'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗ Frontend is not accessible'));
    console.log(chalk.gray(`  Error: ${error.message}`));
    return false;
  }
}

async function checkDatabase() {
  if (!CONFIG.database.includes('mongodb')) {
    console.log(chalk.yellow('⚠ Database URL not configured for health check'));
    return false;
  }
  
  try {
    console.log(chalk.blue('Checking Database connectivity via Backend...'));
    const response = await axios.get(`${CONFIG.backend}/health`, { timeout: 10000 });
    
    if (response.data && response.data.database) {
      console.log(chalk.green('✓ Database is accessible'));
      return true;
    } else {
      console.log(chalk.yellow('⚠ Database status unknown'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗ Cannot verify database connectivity'));
    console.log(chalk.gray(`  Error: ${error.message}`));
    return false;
  }
}

async function checkCORS() {
  try {
    console.log(chalk.blue('Checking CORS configuration...'));
    
    const frontendResponse = await axios.get(CONFIG.frontend);
    const frontendOrigin = new URL(CONFIG.frontend).origin;
    
    const backendResponse = await axios.get(`${CONFIG.backend}/health`, {
      headers: { 'Origin': frontendOrigin }
    });
    
    if (backendResponse.headers['access-control-allow-origin']) {
      console.log(chalk.green('✓ CORS is configured'));
      return true;
    } else {
      console.log(chalk.yellow('⚠ CORS headers not detected'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗ CORS check failed'));
    console.log(chalk.gray(`  Error: ${error.message}`));
    return false;
  }
}

// Main health check function
async function runHealthCheck() {
  console.log(chalk.bold.blue('🔍 Harmonix Production Health Check'));
  console.log(chalk.blue('====================================='));
  console.log();
  
  const results = {
    frontend: await checkFrontend(),
    backend: await checkEndpoint('Backend API', CONFIG.backend),
    server: await checkEndpoint('Server', CONFIG.server),
    pythonService: await checkEndpoint('Python Service', CONFIG.pythonService),
    database: await checkDatabase(),
    cors: await checkCORS()
  };
  
  console.log();
  console.log(chalk.bold('📊 Health Check Summary:'));
  console.log('========================');
  
  const healthy = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([service, status]) => {
    const icon = status ? '✓' : '✗';
    const color = status ? chalk.green : chalk.red;
    console.log(color(`${icon} ${service}`));
  });
  
  console.log();
  console.log(`Overall Health: ${healthy}/${total} services healthy`);
  
  if (healthy === total) {
    console.log(chalk.green.bold('🎉 All services are healthy!'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('⚠️  Some services need attention'));
    console.log();
    console.log(chalk.yellow('Troubleshooting tips:'));
    console.log('1. Check service logs for errors');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Ensure all services are deployed and running');
    console.log('4. Check network connectivity between services');
    process.exit(1);
  }
}

// Environment check
function checkEnvironment() {
  console.log(chalk.bold('🔧 Environment Configuration:'));
  console.log('============================');
  
  Object.entries(CONFIG).forEach(([key, value]) => {
    const isDefault = value.includes('localhost');
    const color = isDefault ? chalk.yellow : chalk.green;
    console.log(color(`${key}: ${value}`));
  });
  
  console.log();
}

// Run the health check
if (require.main === module) {
  checkEnvironment();
  runHealthCheck().catch(error => {
    console.error(chalk.red('Health check failed:'), error);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, checkEndpoint, CONFIG };
