# Harmonix Login Fix Documentation

## Problem
The Harmonix application was experiencing login issues due to:
1. Port conflicts between server and backend services (both trying to use port 5001)
2. Configuration issues with server URLs in different components
3. Stale processes blocking required ports
4. Incorrect module import in frontend code
5. Misdirected API requests to the wrong service port
6. CORS configuration preventing communication between frontend (port 3001) and server (port 5001)

## Solution
We've implemented the following fixes:

1. **Port configuration**:
   - Changed the backend service to use port 5002 instead of 5001
   - Updated frontend's authUtils.js to point to port 5002
   - Left server service on port 5001
   - Ensured no port conflicts between services

2. **Environment file updates**:
   - Updated backend/.env to use port 5002
   - Updated frontend/.env to communicate with the server on port 5001 for authentication
   - Ensured Python Service URL is correctly configured at port 8000

3. **Code fixes**:
   - Fixed the import statement in Login.js from `import authUtils from '../utils/authUtils'` to `import { authUtils } from '../utils/authUtils'`
   - Updated authUtils.js to ensure proper server URL configuration
   - Improved error handling in the login process
   - Updated server CORS configuration to allow requests from both ports 3000 and 3001
   
3. **Fixed code-level issues**:
   - Modified backend/server.js to use environment variables for port definition
   - Ensured proper MongoDB connection configuration
   
4. **Created automation scripts**:
   - `harmonix_fixer.sh`: A comprehensive script to set up, configure and start all Harmonix services properly
   - `harmonix_cleanup.sh`: A script to cleanly shut down all services

## Usage

### Starting Harmonix
```bash
cd /Users/stephanelkhoury/Documents/GitHub/harmonix
./harmonix_fixer.sh
```
This will:
- Kill any stale processes on required ports
- Configure all environment files correctly 
- Start all required services in the correct order
- Open the application in the browser

### Stopping Harmonix
```bash
cd /Users/stephanelkhoury/Documents/GitHub/harmonix
./harmonix_cleanup.sh
```
This will properly terminate all running Harmonix services.

## Services
When running properly, these services should be available:
- Frontend UI: http://localhost:3000
- Server: http://localhost:5001
- Backend service: http://localhost:5002 
- Python service: http://localhost:8000

## Troubleshooting
If you still experience issues:
1. Check logs in the project root directory: backend.log, server.log, frontend.log, and python_service.log
2. Verify that all environment files (.env) have the correct port configurations
3. Ensure MongoDB is running properly
4. Make sure no other applications are using the required ports

## Manual Troubleshooting

If you are still having issues with login, follow these steps:

1. **Check service health:**
```bash
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:8000/health
```

2. **Verify frontend configuration:**
```bash
cat frontend/.env
# Should contain: REACT_APP_BACKEND_URL=http://localhost:5001
```

3. **Test login endpoint directly:**
```bash
curl -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin@123"}' \
  http://localhost:5001/login
```

4. **Restart services individually if needed:**
```bash
./manage_harmonix.sh restart server
./manage_harmonix.sh restart frontend
```

---

Problem originally resolved by Harmonix Support on May 18, 2025
Updated with additional fixes on May 20, 2025
