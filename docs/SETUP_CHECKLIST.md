# Harmonix Setup Checklist

Use this checklist to ensure that your Harmonix setup is complete and working correctly.

## Prerequisites

- [ ] Python 3.9+ installed
- [ ] Node.js 14+ installed
- [ ] npm 6+ installed
- [ ] MongoDB installed locally or MongoDB Atlas account set up

## Setup Steps

### 1. Initial Environment Setup

- [ ] Repository cloned
- [ ] `setup.sh` script executed successfully
- [ ] All dependencies installed
- [ ] Environment (.env) files properly configured
- [ ] Directory structure verified with `test_environment.sh`

### 2. MongoDB Configuration

- [ ] MongoDB running locally
  - OR -
- [ ] MongoDB Atlas connection configured

### 3. Service Startup

- [ ] Python service started and healthy (port 8000)
- [ ] Backend service started and healthy (port 5001)
- [ ] Server started and healthy (port 3001)
- [ ] Frontend web interface accessible (port 3000)

### 4. Functionality Testing

- [ ] Basic service health checks pass (`test_environment.sh --with-services`)
- [ ] MP3 analysis functions correctly (`test_analysis.sh`)
- [ ] YouTube link analysis functions correctly (`test_analysis.sh`)
- [ ] Integration tests pass (`run_integration_tests.sh`)

### 5. Web Interface Testing

- [ ] Web interface loads properly at http://localhost:3000
- [ ] Navigation between pages works
- [ ] MP3 upload and analysis works in the browser
- [ ] YouTube link analysis works in the browser
- [ ] Audio playback controls function correctly
- [ ] Chord visualization displays properly

## Troubleshooting Common Issues

If you encounter issues, check these common problems:

### Services Not Starting

- [ ] Check port conflicts (8000, 5001, 3001, 3000)
- [ ] Verify correct NodeJS and Python versions
- [ ] Check logs for specific error messages in the `logs/` directory

### Database Connection Issues

- [ ] Verify MongoDB is running (locally) or accessible (Atlas)
- [ ] Check connection strings in `.env` files
- [ ] Verify network connectivity for Atlas configurations

### Analysis Issues

- [ ] Verify Python dependencies are correctly installed
- [ ] Check permissions on upload directories
- [ ] Validate MP3 files with another player
- [ ] Ensure YouTube URL is publicly accessible

## Final Verification

Run the complete test suite to verify your installation:

```bash
# Environment check
./test_environment.sh --with-services

# Functionality test
./test_analysis.sh

# Integration test
./run_integration_tests.sh
```

If all tests pass, your Harmonix installation is complete and functioning correctly!

## Need More Help?

Refer to these documentation files:
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - In-depth troubleshooting
- [USAGE_GUIDE.md](USAGE_GUIDE.md) - How to use Harmonix features
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - Cloud database configuration
