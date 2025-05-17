# Running Harmonix Application Locally (No Docker)

We've migrated the application to run natively without Docker containers. This guide will help you set up and run Harmonix on your local machine.

## Step-by-Step Instructions

1. **Prerequisites Check**
   - Ensure Python 3.8+ is installed
   - Ensure Node.js and npm are installed
   - (Optional) Install MongoDB locally or use MongoDB Atlas cloud service

2. **Clone the Repository** (if you haven't already)
   ```bash
   git clone https://github.com/yourusername/harmonix.git
   cd harmonix
   ```

3. **Run the Setup Script**
   ```bash
   chmod +x start_local.sh  # Make it executable (only needed once)
   ./start_local.sh
   ```
   
   The script will:
   - Check for required dependencies
   - Install necessary packages for all components
   - Configure database connections
   - Start all services in the correct order
   - Run health checks

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001
   - Python service: http://localhost:8000

## Database Options

You can use either:

1. **Local MongoDB** (default configuration)
   - The script will attempt to use or start a local MongoDB instance
   - Data will be stored in ./data/db directory

2. **MongoDB Atlas** (cloud-based)
   - Follow instructions in [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)
   - Update connection strings in .env files

## Manual Component Start

If you need to run components individually:

1. **Python Service**
   ```bash
   cd python_service
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Backend Service**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Server** (if needed separately)
   ```bash
   cd server
   npm install
   node index.js
   ```

## Troubleshooting

- If any component fails to start, check the respective log file:
  - python_service.log
  - backend.log
  - frontend.log

- For MongoDB connection issues:
  - Verify MongoDB is running locally: `ps aux | grep mongod`
  - Or check MongoDB Atlas connection details in .env files

## Need Help?

For additional support or questions, please refer to:
- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Detailed setup instructions
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - Database configuration details
