# Harmonix Network Login Quick Fix Guide

If you're experiencing issues with logging in from another device on your network, follow these steps:

## Quick Fix Steps

1. **Check if servers are running**
   ```bash
   lsof -i :5001  # Auth server
   lsof -i :5002  # Backend server
   lsof -i :3000  # or 3001 for Frontend
   ```

2. **Update CORS configuration**
   
   Edit `/server/index.js` to include your network IP:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:3000', 
       'http://localhost:3001',
       'http://YOUR_IP:3000',  // Replace YOUR_IP with your actual IP
       'http://YOUR_IP:3001'   // Replace YOUR_IP with your actual IP
     ],
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true
   }));
   ```

3. **Restart the authentication server**
   ```bash
   # Stop the existing server
   pkill -f "node.*server/index.js"
   
   # Start it again
   cd /Users/stephanelkhoury/Documents/GitHub/harmonix/server && node index.js
   ```

4. **Test network connectivity**
   ```bash
   # Run the network diagnosis script
   ./scripts/network_diagnosis.sh
   
   # Or test manually
   curl -X GET http://YOUR_IP:5001/health
   ```

5. **Try the network test tools**
   - Open `/tests/network_test.html` in your browser
   - Open `/tests/auth_tester.html` in your browser

## Common Issues and Solutions

### "Access-Control-Allow-Origin" Error
This is a CORS issue. Make sure your IP address is included in the CORS configuration.

### Connection Refused
Check if the server is running and if there's any firewall blocking access.

### Authentication Failed
Try using the known working credentials:
- Admin: username="admin", password="Admin@123"
- User: username="stephanelkhoury", password="S@1234"

## Need More Help?

Run the full network diagnosis tool:
```bash
./scripts/network_diagnosis.sh
```

See the detailed documentation:
- [Network Access Guide](./docs/NETWORK_ACCESS_GUIDE.md)
- [Login Fix Report](./docs/NETWORK_LOGIN_FIX.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
