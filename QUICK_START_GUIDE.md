# 🎵 Harmonix Quick Start Guide

## ⚙️ Environment Setup
Before starting the services, ensure you have the correct environment configuration:

```bash
# Copy environment templates (if not already done)
cp config/frontend.env.template frontend/.env
cp config/server.env.template server/.env
cp config/backend.env.template backend/.env

# Frontend .env should contain:
# REACT_APP_BACKEND_URL=http://localhost:5001
# REACT_APP_SERVER_URL=http://localhost:3001
# PORT=3000
```

## 🚀 Start All Services
```bash
# Option 1: Use the startup script (recommended)
./scripts/setup/harmonix-start.sh

# Option 2: Manual startup
# Terminal 1 - Python Service
cd python_service && python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 - Main Server
cd server && node index.js

# Terminal 3 - Backend
cd backend && node server.js

# Terminal 4 - Frontend
cd frontend && npm start
```

## 🌐 Service URLs
- **Frontend (React)**: http://localhost:3000
- **Main Server (Auth/Lyrics)**: http://localhost:5001
- **Backend (API)**: http://localhost:5002
- **Python Service (AI/ML)**: http://localhost:8000
- **MongoDB**: localhost:27017

## 🔍 Health Checks
```bash
# Check all services
curl http://localhost:8000/health  # Python
curl http://localhost:5001/health  # Main Server
curl http://localhost:5002/health  # Backend
curl http://localhost:3000         # Frontend
```

## 🔧 Common Commands
```bash
# Check running services
ps aux | grep -E "(python|node|mongod)" | grep -v grep

# Check ports in use
lsof -i :3000,5001,5002,8000,27017

# View logs
tail -f logs/*.log

# Security audit
npm audit --audit-level moderate
```

## ✅ Current Status
- **Security**: 25+ critical vulnerabilities fixed
- **Services**: All operational and communicating
- **Git**: All branches consolidated to main
- **Dependencies**: Updated with security patches

---
*Last updated: June 12, 2025*
