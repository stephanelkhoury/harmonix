# Harmonix Server Management

This document provides information about the Harmonix server setup and how to manage it.

## Server Architecture

Harmonix has two server implementations:

1. **Primary Server** (`/server/index.js`): This is a Node.js Express server using CommonJS modules that handles most API endpoints including user authentication, file uploads, and API forwarding to the Python service.

2. **Backend Server** (`/backend/server.js`): This is an alternative server implementation using ES modules that provides similar functionality. Currently, only one server should be running at a time.

## Managing the Server

We've created a server management script to help ensure the server is running correctly and to prevent issues like duplicate server instances or missing API endpoints.

### Using the Server Manager

The server manager script is located at `/scripts/server_manager.sh` and provides the following commands:

```bash
# Start the server (stopping any existing instance first)
./scripts/server_manager.sh start

# Stop the server
./scripts/server_manager.sh stop

# Restart the server
./scripts/server_manager.sh restart

# Validate that the server is running and has all expected endpoints
./scripts/server_manager.sh validate
```

### Troubleshooting Server Issues

If you encounter issues with the server:

1. **Check logs**: Server logs are stored in `server.log` in the project root

2. **Verify port availability**: Make sure nothing else is using port 5001
   ```bash
   lsof -i :5001
   ```

3. **Restart the server**: Use the server manager to restart
   ```bash
   ./scripts/server_manager.sh restart
   ```

4. **Check endpoint access**: If the frontend reports 404 errors, validate the server endpoints
   ```bash
   ./scripts/server_manager.sh validate
   ```

## Server API Documentation

### Authentication Endpoints

- **POST /login**
  - Description: Authenticates a user and returns a JWT token
  - Request Body: `{ "username": "user", "password": "pass" }`
  - Responses:
    - `200 OK`: `{ "token": "jwt-token", "user": { "id": 1, "username": "user", "email": "user@example.com" } }`
    - `401 Unauthorized`: `{ "error": "Invalid username or password" }`

- **POST /signup**
  - Description: Registers a new user
  - Request Body: `{ "username": "newuser", "password": "pass", "email": "user@example.com", ... }`
  - Responses:
    - `201 Created`: `{ "message": "User created successfully", "token": "jwt-token", "user": { ... } }`
    - `400 Bad Request`: `{ "error": "Error message" }`
    - `409 Conflict`: `{ "error": "Username/email already exists" }`

### Other Key Endpoints

- **GET /health**: Server health check endpoint
- **POST /analyze**: Submit audio for chord analysis
- **GET /user/profile**: Get user profile info (requires authentication)

## Frontend Integration

The frontend is configured to connect to the server at `http://localhost:5001` via the `authUtils.js` file.
