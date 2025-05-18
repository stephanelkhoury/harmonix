# Harmonix Authentication System

This document provides an overview of how authentication works in the Harmonix application.

## Architecture Overview

The authentication system consists of the following components:

1. **Server-side JWT Authentication**
   - User credentials are validated
   - JSON Web Tokens (JWT) are issued upon successful login or signup
   - Password hashing with bcrypt ensures secure storage
   - Token expiration is configurable via environment variables

2. **Frontend Authentication Utilities**
   - Centralized auth management via `authUtils.js`
   - Token storage in localStorage
   - Automatic token refresh when expired
   - Global Axios interceptors to handle authentication headers

3. **Protected Routes**
   - Authentication state is managed at the App level
   - React Router guards protect routes from unauthenticated access
   - User is redirected to login when necessary

## Authentication Flow

### Signup Process

1. User completes signup form with required fields
2. Client-side validation checks password requirements
3. Submission to `/signup` endpoint
4. Server validates input data
5. Server checks for duplicate usernames/emails
6. Password is hashed and stored
7. JWT token is generated and returned
8. User is automatically logged in
9. User is redirected to home page

### Login Process

1. User enters credentials
2. Submission to `/login` endpoint
3. Server validates username/password
4. JWT token is generated and returned
5. Token is stored in localStorage
6. User is redirected to home page

### Token Refresh

1. Axios interceptor detects 401 error with `token_expired` code
2. Original request is paused
3. Refresh token request is sent to `/refresh-token`
4. New token is received and stored
5. Original request is retried with new token
6. If refresh fails, user is redirected to login

### Logout Process

1. User clicks logout
2. Token is removed from localStorage
3. Auth state is reset
4. User is redirected to login page

## Security Features

- Passwords hashed using bcrypt with salt
- JWT tokens with configurable expiration
- HTTP-only cookies option (future enhancement)
- Secure token refresh mechanism
- Protection against common attacks:
  - CSRF (Cross-Site Request Forgery)
  - XSS (Cross-Site Scripting)
  - Session hijacking

## Session Management

### Token Expiration Display

1. A SessionTimer component displays the time remaining before the token expires
2. The component triggers a warning modal when the token is about to expire
3. User can choose to refresh the session or log out

### Multi-Session Management

1. Application tracks active user sessions across devices
2. Users can view all their active sessions in the Account Security page
3. Sessions can be individually terminated or all at once
4. All sessions are invalidated when a password is changed/reset

## Account Security Features

### Password Reset Workflow

1. User requests a password reset via the "Forgot Password" link
2. Server generates a time-limited reset token (1 hour expiration)
3. An email would be sent with a reset link (simulated in development mode)
4. User clicks the link and is taken to the reset password page
5. Token is validated to ensure it's still valid
6. User enters a new password that meets security requirements
7. Password is updated in the system
8. All existing sessions are invalidated for security
9. User is redirected to login with their new password

### Security Best Practices

1. Password requirements enforce strong credentials:
   - Minimum 6 characters
   - At least one number
   - At least one special character
2. Token refresh mechanism prevents session timeouts
3. Session tracking allows users to monitor account access
4. Automatic session cleanup after password changes

## Future Enhancements

1. **Persistent Storage**: Move from in-memory to database storage
2. **Social Authentication**: Add OAuth providers like Google, Facebook
3. **Two-Factor Authentication**: Add 2FA option for increased security
4. **Role-Based Access Control**: Implement user roles and permissions
5. **Account Verification**: Email verification for new accounts
6. **Biometric Authentication**: Support for fingerprint/face ID on mobile devices

## Configuration

Authentication settings can be configured through environment variables:

```
JWT_SECRET=your_secret_key
JWT_EXPIRY=1h
```

## Troubleshooting

Common issues:

1. **Token expires too quickly**
   - Adjust the JWT_EXPIRY environment variable

2. **Authentication state lost after page refresh**
   - Check localStorage persistence
   - Verify token is being correctly stored/retrieved

3. **Unable to access protected routes despite being logged in**
   - Check token validity
   - Verify authenticateToken middleware is working correctly
