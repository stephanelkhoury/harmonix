@echo off
REM Harmonix Windows Startup Script
REM This script will start all necessary services for the Harmonix application on Windows

echo =======================================
echo Harmonix Application Startup (Windows)
echo =======================================

REM Check for required tools
echo.
echo Checking required tools...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is required but not installed.
    echo Please install Python and try again.
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is required but not installed.
    echo Please install Node.js and try again.
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo npm is required but not installed.
    echo Please install npm and try again.
    exit /b 1
)

echo All required tools are installed

REM Create required directories
echo.
echo Creating required directories...
mkdir server\uploads 2>nul
mkdir backend\uploads 2>nul
mkdir data\db 2>nul
mkdir logs 2>nul

REM Check MongoDB
echo.
echo Checking MongoDB...
where mongod >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo MongoDB is installed. Checking if it's running...
    tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe" >NUL
    if %ERRORLEVEL% NEQ 0 (
        echo Starting MongoDB...
        start "MongoDB" mongod --dbpath .\data\db
        timeout /t 5
        echo MongoDB started successfully.
    ) else (
        echo MongoDB is already running.
    )
) else (
    echo MongoDB not found. Using connection string from .env files.
)

REM Create environment files if they don't exist
echo.
echo Setting up environment files...

if not exist "backend\.env" (
    echo Creating backend/.env file...
    echo # MongoDB connection string > backend\.env
    echo MONGODB_URI=mongodb://localhost:27017/harmonix >> backend\.env
    echo. >> backend\.env
    echo # Python service URL >> backend\.env
    echo PYTHON_SERVICE_URL=http://localhost:8000 >> backend\.env
    echo Created backend/.env file
)

if not exist "server\.env" (
    echo Creating server/.env file...
    echo # MongoDB connection string > server\.env
    echo MONGO_URL=mongodb://localhost:27017/harmonix >> server\.env
    echo. >> server\.env
    echo # Python service URL >> server\.env
    echo PYTHON_SERVICE_URL=http://localhost:8000 >> server\.env
    echo Created server/.env file
)

if not exist "frontend\.env" (
    echo Creating frontend/.env file...
    echo REACT_APP_BACKEND_URL=http://localhost:5001 > frontend\.env
    echo REACT_APP_PYTHON_SERVICE_URL=http://localhost:8000 >> frontend\.env
    echo Created frontend/.env file
)

REM Install dependencies for all services
echo.
echo Installing Python dependencies...
cd python_service
python -m pip install -r requirements.txt
cd ..

echo.
echo Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

REM Start all services
echo.
echo Starting Python service...
start "Python Service" cmd /c "cd python_service && python -m uvicorn main:app --host 0.0.0.0 --port 8000 > ..\logs\python_service.log 2>&1"
timeout /t 3

echo.
echo Starting server...
start "Server" cmd /c "cd server && node index.js > ..\logs\server.log 2>&1"
timeout /t 3

echo.
echo Starting backend...
start "Backend" cmd /c "cd backend && node server.js > ..\logs\backend.log 2>&1"
timeout /t 3

echo.
echo Starting frontend...
start "Frontend" cmd /c "cd frontend && npm run start:win > ..\logs\frontend.log 2>&1"
timeout /t 5

REM Run health checks
echo.
echo Running health checks...
echo Checking Python service health...
curl -s http://localhost:8000/health >nul
if %ERRORLEVEL% EQU 0 (
    echo Python service is healthy
) else (
    echo Warning: Python service health check failed. Check logs\python_service.log for details.
)

echo Checking Backend service health...
curl -s http://localhost:5001/health >nul
if %ERRORLEVEL% EQU 0 (
    echo Backend service is healthy
) else (
    echo Warning: Backend service health check failed. Check logs\backend.log for details.
)

echo.
echo Services started! Opening application in browser...
echo Frontend URL: http://localhost:3000
echo Backend API: http://localhost:5001
echo Python service: http://localhost:8000

echo.
echo Service logs are available in the logs directory:
echo   - logs\python_service.log
echo   - logs\server.log
echo   - logs\backend.log
echo   - logs\frontend.log

start "" http://localhost:3000

echo.
echo Press any key to stop all services...
pause

REM Stop all services
taskkill /FI "WINDOWTITLE eq Python Service*" /F
taskkill /FI "WINDOWTITLE eq Server*" /F
taskkill /FI "WINDOWTITLE eq Backend*" /F
taskkill /FI "WINDOWTITLE eq Frontend*" /F

echo All services stopped.
