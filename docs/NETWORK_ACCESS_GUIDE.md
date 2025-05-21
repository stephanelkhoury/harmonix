# Network Access Guide for Harmonix

This guide explains how to properly set up and access the Harmonix application from different devices on your local network.

## Overview

By default, Harmonix services run on various ports on your local machine:
- Frontend: Port 3000/3001
- Authentication Server: Port 5001
- Backend Server: Port 5002
- Python Service: Port 8000 (if available)

When accessing from another device on the network, you'll need to:
1. Ensure the servers accept cross-origin requests from network devices
2. Use the correct IP address to connect to the services
3. Make sure any firewall settings allow the connections

## Configuration for Network Access

### 1. Authentication Server (server/index.js)

The authentication server has been configured to accept requests from both localhost and network IP addresses:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://192.168.1.107:3000', 
    'http://192.168.1.107:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### 2. Frontend Configuration (frontend/src/utils/authUtils.js)

The frontend has been updated to automatically detect whether it's being accessed via localhost or a network IP address, and adjust its server connection accordingly:

```javascript
// Determine server URL based on current hostname
const determineServerUrl = () => {
  // For development environment
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // For network access (when not on localhost)
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5001`;
  }
  
  // Default to localhost
  return 'http://localhost:5001';
};
```

## Accessing from Network Devices

### Step 1: Start Harmonix Services

Use the updated startup script that detects your network IP:

```bash
cd /Users/stephanelkhoury/Documents/GitHub/harmonix
./scripts/start_harmonix_fixed.sh
```

The script will display your local IP address and the URLs to access the services.

### Step 2: Access from Other Devices

On another device on the same network:

1. **Frontend**: Open a browser and navigate to `http://192.168.1.107:3001` (replace with your actual IP address)

2. **Testing Connection**: Use the network test tool:
   - On your development machine, open: `file:///Users/stephanelkhoury/Documents/GitHub/harmonix/tests/network_test.html`
   - This will help verify that connections to the different services are working properly

3. **Authentication Testing**: Use the auth tester tool:
   - On your development machine, open: `file:///Users/stephanelkhoury/Documents/GitHub/harmonix/tests/auth_tester.html`
   - Select "192.168.1.107:5001" from the Server URL dropdown

### Step 3: Login with Test Credentials

Use one of the following test accounts:
- Admin: username=`admin`, password=`Admin@123`
- User: username=`stephanelkhoury`, password=`S@1234`

## Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Check that your actual IP address is included in the CORS configuration in `server/index.js`
2. Restart the authentication server after making changes
3. Verify that the server is running with `lsof -i :5001`

### Connection Refused

If connections are refused:

1. Ensure all services are running
2. Check for any firewall blocking the connection
3. Verify you're using the correct IP address

## Advanced Configuration

For more permanent configuration:

1. Set environment variables for server URLs:
   ```
   REACT_APP_BACKEND_URL=http://your-ip:5001
   ```

2. Use your network hostname instead of IP address for more convenient access:
   ```
   sudo nano /etc/hosts
   # Add: 192.168.1.107 harmonix.local
   ```
   Then access via `http://harmonix.local:3001`
