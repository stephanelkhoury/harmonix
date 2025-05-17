# Harmonix - Troubleshooting Guide

This guide provides solutions to common issues that might occur when running the Harmonix application locally.

## 1. Application Not Starting

### Issue: One or more services fail to start

**Check log files:**
```bash
cat logs/python_service.log
cat logs/server.log
cat logs/backend.log  
cat logs/frontend.log
```

**Solutions:**
- **Port conflicts**: Check if ports 3000, 5000, 5001, and 8000 are already in use
  ```bash
  lsof -i :3000
  lsof -i :5000
  lsof -i :5001
  lsof -i :8000
  ```
  Kill the processes using these ports if needed:
  ```bash
  kill -9 <PID>
  ```

- **Dependencies**: Make sure all dependencies are properly installed
  ```bash
  cd python_service && python3 -m pip install -r requirements.txt
  cd backend && npm install
  cd server && npm install
  cd frontend && npm install
  ```

## 2. MongoDB Issues

### Issue: Can't connect to MongoDB

**Solutions:**
1. Check if MongoDB is running:
   ```bash
   pgrep mongod
   ```

2. Start MongoDB manually:
   ```bash
   mongod --dbpath ./data/db
   ```

3. Use MongoDB Atlas as an alternative:
   - Follow the instructions in [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)
   - Update your .env files with the MongoDB Atlas connection string

## 3. Python Service Issues

### Issue: ImportError or ModuleNotFoundError

**Solutions:**
1. Install missing Python packages:
   ```bash
   cd python_service
   python3 -m pip install -r requirements.txt
   ```
   
   For Windows users:
   ```bash
   cd python_service
   python -m pip install -r requirements.txt
   ```

2. Check for compatibility issues:
   ```bash
   python3 --version  # Should be 3.8+ for best compatibility
   # or for Windows
   python --version
   ```

3. Create and use a virtual environment:
   ```bash
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Then install dependencies
   pip install -r requirements.txt
   ```

### Issue: Audio processing fails

**Solutions:**
1. Check if librosa is installed correctly:
   ```bash
   python3 -c "import librosa; print(librosa.__version__)"
   ```

2. Ensure ffmpeg is installed (required for audio processing):
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   
   # Windows
   # Download from https://www.gyan.dev/ffmpeg/builds/ and add to PATH
   # Or use Chocolatey
   choco install ffmpeg
   ```

3. Numpy version issues:
   ```bash
   pip install numpy==1.22.0
   pip install --upgrade librosa
   ```

## 4. Frontend Issues

### Issue: "Failed to compile" errors

**Solutions:**
1. Check for Node.js version compatibility:
   ```bash
   node --version  # Should be 14+ 
   ```

2. Clear npm cache and reinstall dependencies:
   ```bash
   cd frontend
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Issue: API connection problems

**Solutions:**
1. Verify the backend URL in frontend/.env:
   ```
   REACT_APP_BACKEND_URL=http://localhost:5001
   ```

2. Check if the backend is running and accessible:
   ```bash
   curl http://localhost:5001/health
   ```

## 5. Backend/Server Communication Issues

### Issue: Backend can't connect to Python service

**Solutions:**
1. Check if Python service is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Verify environment variables in backend/.env and server/.env:
   ```
   PYTHON_SERVICE_URL=http://localhost:8000
   ```

## 6. File Upload Issues

### Issue: File uploads fail or timeouts occur

**Solutions:**
1. Check upload directory permissions:
   ```bash
   chmod -R 755 server/uploads backend/uploads
   ```

2. Increase timeout settings in your browser's network tools

3. Check server logs for specific errors

## 7. Cross-Platform Issues

### Issue: Script execution errors on Windows

**Solutions:**
1. Run the application using separate command prompts/terminals for each service:
   ```bash
   # Terminal 1 - Python service
   cd python_service
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Server
   cd server
   node index.js
   
   # Terminal 3 - Backend
   cd backend
   node server.js
   
   # Terminal 4 - Frontend
   cd frontend
   npm run start:win
   ```

2. Use WSL (Windows Subsystem for Linux) for a better experience

3. Update the frontend script to work with Windows:
   ```bash
   # Edit package.json and add this script
   "scripts": {
     "start:win": "set PORT=3000 && react-scripts start"
   }
   ```

### Issue: Python path issues

**Solutions:**
1. Ensure Python is in your PATH environment variable
2. Try using `python` instead of `python3` on Windows
3. Create a virtual environment to isolate dependencies

## Need More Help?

If the above solutions don't resolve your issue:

1. Run individual services manually to see detailed logs:
   ```bash
   # Python service
   cd python_service
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
   
   # Backend
   cd backend
   node server.js
   
   # Server
   cd server
   node index.js
   
   # Frontend
   cd frontend
   npm start
   ```

2. Check the health of each service:
   ```bash
   curl http://localhost:8000/health  # Python service
   curl http://localhost:5001/health  # Backend/Server
   # Or for Windows PowerShell
   Invoke-WebRequest -Uri http://localhost:8000/health
   ```

3. Join our community forum or issue tracker for more help
