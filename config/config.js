/**
 * Central configuration handler for Harmonix
 * This file handles environment variable loading and provides a unified
 * configuration interface for all services
 */

// Load environment from .env file based on running environment
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Get the project root directory
const projectRoot = path.resolve(__dirname);

// Function to load environment from the correct path
function loadEnvironment(serviceName) {
  // Default search path - traditional location
  let envPath = path.join(projectRoot, serviceName, '.env');
  
  // If service-specific .env doesn't exist in the service directory, 
  // try to find it in config directory
  if (!fs.existsSync(envPath)) {
    envPath = path.join(projectRoot, 'config', `${serviceName}.env`);
    
    // If still not found, look for template file
    if (!fs.existsSync(envPath)) {
      const templatePath = path.join(projectRoot, 'config', `${serviceName}.env.template`);
      if (fs.existsSync(templatePath)) {
        console.log(`No .env found for ${serviceName}, using template from: ${templatePath}`);
        // Copy template to service directory
        fs.copyFileSync(templatePath, path.join(projectRoot, serviceName, '.env'));
        envPath = path.join(projectRoot, serviceName, '.env');
      }
    }
  }

  // Load the environment file if found
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.warn(`No environment file found for ${serviceName}`);
  }
}

// Export configuration functions
module.exports = {
  loadEnvironment,
  projectRoot
};
