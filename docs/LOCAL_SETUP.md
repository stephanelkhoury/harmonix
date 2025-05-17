# Local Setup for Harmonix

This document provides instructions for setting up and running the Harmonix application locally without Docker.

## Prerequisites

- Python 3.8+ with pip
- Node.js (v14+) and npm
- MongoDB (optional if using MongoDB Atlas)

## Setup Options

You have two options for running the MongoDB database:

1. **MongoDB Atlas** (cloud-based, no local installation required)
2. **Local MongoDB** installation

## Setup Instructions

### Option 1: Using MongoDB Atlas

1. Follow the instructions in [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) to create and configure a MongoDB Atlas account.
2. Update the connection strings in the environment files:
   - `/backend/.env`
   - `/server/.env`

### Option 2: Using Local MongoDB

1. Install MongoDB Community Edition:
   ```bash
   # For macOS using Homebrew
   brew tap mongodb/brew
   brew install mongodb-community
   ```

2. Start MongoDB:
   ```bash
   # Start MongoDB as a service
   brew services start mongodb-community
   
   # Or start MongoDB manually
   mongod --dbpath ./data/db
   ```

3. Ensure the connection strings in the environment files are set to use the local MongoDB:
   - In `/backend/.env`: `MONGODB_URI=mongodb://localhost:27017/harmonix`
   - In `/server/.env`: `MONGO_URL=mongodb://localhost:27017/harmonix`

## Running the Application

### Using the Startup Script

We've created a convenient startup script that installs dependencies and starts all services:

```bash
chmod +x start_local.sh  # Make the script executable (only needed once)
./start_local.sh
```

The script:
1. Installs dependencies for all services
2. Creates necessary directories
3. Starts all services (Python, backend, frontend)
4. Performs health checks

### Manual Setup

If you prefer to start services individually:

1. **Python Service**
   ```bash
   cd python_service
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Backend Service**
   ```bash
   cd backend
   npm install
   npm start  # Runs on port 5001
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start  # Runs on port 3000
   ```

4. **Server**
   ```bash
   cd server
   npm install
   node index.js  # Note: This might be started automatically by the backend
   ```

## Verification

Once all services are running, you can access:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Python Service:** http://localhost:8000

To verify everything is working, upload an audio file on the frontend interface and check if chord analysis is performed successfully.

## Troubleshooting

### Python Service Issues
- Check `python_service.log` for errors
- Ensure all Python dependencies are installed
- Verify the service is running on port 8000

### Backend/Server Issues
- Check `backend.log` for errors
- Verify MongoDB connection (local or Atlas)
- Check if the service is running on expected port (5001)

### Frontend Issues
- Check `frontend.log` for errors
- Verify the application can connect to the backend API

### MongoDB Connection Issues
- For local MongoDB: ensure MongoDB service is running
- For MongoDB Atlas: verify connection string and network access settings
