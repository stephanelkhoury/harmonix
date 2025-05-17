#!/usr/bin/env node

// Check Node.js and npm versions for Harmonix compatibility

const { execSync } = require('child_process');
const chalk = require('chalk');

try {
  // Try to load chalk - if it fails, we'll install it
  require.resolve('chalk');
} catch (e) {
  console.log('Installing chalk package for colorful output...');
  execSync('npm install chalk@4.1.2', { stdio: 'inherit' });
}

// Get Node.js version
const nodeVersion = process.versions.node;
const nodeMajorVersion = parseInt(nodeVersion.split('.')[0], 10);

// Get npm version
let npmVersion;
try {
  npmVersion = execSync('npm --version').toString().trim();
} catch (err) {
  console.error(chalk.red('Error: npm not found. Please install npm.'));
  process.exit(1);
}

// Check Python version 
let pythonVersion;
try {
  // Try python3 first
  pythonVersion = execSync('python3 --version').toString().trim();
} catch (err) {
  try {
    // Fall back to python
    pythonVersion = execSync('python --version').toString().trim();
  } catch (err2) {
    console.error(chalk.red('Error: Python not found. Please install Python 3.8+.'));
    process.exit(1);
  }
}

// Extract version numbers
const npmMajorVersion = parseInt(npmVersion.split('.')[0], 10);
const pythonVersionMatch = pythonVersion.match(/\d+\.\d+\.\d+/);
const pythonVersionString = pythonVersionMatch ? pythonVersionMatch[0] : 'unknown';
const pythonMajorVersion = pythonVersionMatch ? parseInt(pythonVersionString.split('.')[0], 10) : 0;
const pythonMinorVersion = pythonVersionMatch ? parseInt(pythonVersionString.split('.')[1], 10) : 0;

console.log(chalk.blue('=================================='));
console.log(chalk.blue('Harmonix Dependency Version Check'));
console.log(chalk.blue('=================================='));
console.log();

// Check Node.js version
console.log(`Node.js version: ${chalk.green(nodeVersion)}`);
if (nodeMajorVersion >= 14) {
  console.log(chalk.green('✓ Node.js version is compatible'));
} else {
  console.log(chalk.red(`✗ Node.js version ${nodeMajorVersion} is not compatible. Please use Node.js 14 or higher.`));
}

// Check npm version
console.log(`npm version: ${chalk.green(npmVersion)}`);
if (npmMajorVersion >= 6) {
  console.log(chalk.green('✓ npm version is compatible'));
} else {
  console.log(chalk.red(`✗ npm version ${npmMajorVersion} is not compatible. Please use npm 6 or higher.`));
}

// Check Python version
console.log(`Python version: ${chalk.green(pythonVersionString)}`);
if (pythonMajorVersion >= 3 && pythonMinorVersion >= 8) {
  console.log(chalk.green('✓ Python version is compatible'));
} else {
  console.log(chalk.red(`✗ Python version ${pythonVersionString} is not compatible. Please use Python 3.8 or higher.`));
}

// Check MongoDB
console.log('\nChecking MongoDB installation...');
try {
  const mongoVersion = execSync('mongod --version').toString().trim().split('\n')[0];
  console.log(`MongoDB version: ${chalk.green(mongoVersion)}`);
  console.log(chalk.green('✓ MongoDB is installed'));
} catch (err) {
  console.log(chalk.yellow('⚠ MongoDB is not installed locally'));
  console.log(chalk.yellow('  You will need to use MongoDB Atlas or install MongoDB locally'));
}

// Summary
console.log('\nSummary:');
let allGood = true;
if (nodeMajorVersion < 14) {
  console.log(chalk.red('✗ Node.js needs to be updated'));
  allGood = false;
}
if (npmMajorVersion < 6) {
  console.log(chalk.red('✗ npm needs to be updated'));
  allGood = false;
}
if (pythonMajorVersion < 3 || (pythonMajorVersion === 3 && pythonMinorVersion < 8)) {
  console.log(chalk.red('✗ Python needs to be updated'));
  allGood = false;
}

if (allGood) {
  console.log(chalk.green('✓ All dependencies meet minimum requirements!'));
  console.log(chalk.blue('\nYou can now run the Harmonix application using:'));
  console.log(chalk.yellow('./start_harmonix.sh'));
} else {
  console.log(chalk.yellow('\nPlease install or update the required dependencies before running Harmonix.'));
}

console.log(chalk.blue('\n=================================='));
