## 🚀 Quick Deploy Your Harmonix App

### Ready to Deploy? Use the Deploy Script!

The easiest way to get started:

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the interactive deployment helper
./deploy.sh
```

This script will:
- Check your git status
- Create environment templates
- Guide you through platform-specific setup
- Provide next steps for your chosen platform

### Test Your Deployment

After deploying, test your application:

```bash
# Install axios for health check (if not already installed)
npm install axios chalk

# Run health check with your production URLs
FRONTEND_URL=https://your-app.com \
BACKEND_URL=https://your-backend.com \
PYTHON_SERVICE_URL=https://your-python-service.com \
node health-check.js
```

---

# Harmonix Deployment Guide

This guide covers multiple options for deploying your Harmonix application online from GitHub.

## Quick Start - Choose Your Platform

### 🚀 Option 1: Vercel (Easiest for Serverless)

1. **Connect GitHub to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account
   - Import your harmonix repository

2. **Configure Environment Variables:**
   ```env
   MONGO_URL=your_mongodb_atlas_connection_string
   PYTHON_SERVICE_URL=your_python_service_url
   ```

3. **Deploy:**
   - Vercel will automatically detect the `vercel.json` configuration
   - Each push to main branch will trigger automatic deployment

**Pros:** Easy setup, automatic deployments, great for React apps
**Cons:** Limited for Python services, may need separate hosting for backend

---

### 🚂 Option 2: Railway (Best for Full-Stack)

1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway will detect the `railway.yml` configuration

2. **Set up MongoDB:**
   - Add MongoDB plugin in Railway dashboard
   - Connection string will be automatically provided

3. **Deploy:**
   - All services deploy automatically
   - Each service gets its own subdomain

**Pros:** Handles all services, database included, simple setup
**Cons:** Limited free tier

---

### 🎨 Option 3: Render (Great Free Tier)

1. **Connect GitHub to Render:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Create services from the `render.yaml` blueprint

2. **Set up Database:**
   - Create a PostgreSQL database (free tier)
   - Or use MongoDB Atlas for cloud MongoDB

3. **Configure Services:**
   - Frontend: Static site from `/frontend/build`
   - Backend: Node.js service
   - Python Service: Python web service

**Pros:** Generous free tier, handles multiple services
**Cons:** Slower cold starts on free tier

---

### 🐳 Option 4: Docker + Cloud Provider

Deploy using Docker to any cloud provider:

#### DigitalOcean App Platform:
1. Push your code to GitHub
2. Create new app in DigitalOcean
3. Connect GitHub repository
4. Use the updated `docker-compose.yml`

#### AWS/Google Cloud/Azure:
1. Set up container registry
2. Build and push Docker images
3. Deploy using container services

**Pros:** Full control, portable, can scale
**Cons:** More complex setup, requires Docker knowledge

---

## Database Setup

### MongoDB Atlas (Recommended)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Update environment variables in your deployment platform

### Connection String Format:
```
mongodb+srv://username:password@cluster.mongodb.net/harmonix?retryWrites=true&w=majority
```

---

## Environment Variables Needed

### For all deployments, set these environment variables:

**Backend/Server:**
```env
MONGODB_URI=your_mongodb_connection_string
PYTHON_SERVICE_URL=your_python_service_url
PORT=5001
NODE_ENV=production
```

**Frontend:**
```env
REACT_APP_BACKEND_URL=your_backend_url
REACT_APP_PYTHON_SERVICE_URL=your_python_service_url
```

**Python Service:**
```env
PORT=8000
```

---

## Step-by-Step: Railway Deployment (Recommended)

### 1. Prepare Your Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your harmonix repository
5. Railway will automatically detect services from `railway.yml`

### 3. Set up MongoDB
1. In Railway dashboard, click "Add Service"
2. Select "Database" → "MongoDB"
3. MongoDB will be automatically linked to your services

### 4. Check Deployment
- Frontend will be available at: `https://your-app.railway.app`
- Each service gets its own URL
- Check logs for any deployment issues

### 5. Configure Custom Domain (Optional)
1. In Railway dashboard, go to your frontend service
2. Click "Settings" → "Domains"
3. Add your custom domain

---

## Troubleshooting Common Issues

### Build Failures
- **Node.js version:** Ensure you're using Node 18+
- **Python version:** Ensure Python 3.9+
- **Dependencies:** Check all package.json and requirements.txt are up to date

### Database Connection
- Verify MongoDB connection string
- Check network access in MongoDB Atlas
- Ensure environment variables are set correctly

### File Uploads
- Configure persistent storage for uploads
- Update file size limits for production
- Ensure upload directories exist

### CORS Issues
- Update CORS origins in server files
- Add production URLs to allowed origins
- Check environment-specific configurations

---

## Performance Optimization

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Optimize bundle size

### Backend
- Set up proper logging
- Configure rate limiting
- Use connection pooling for database

### Python Service
- Optimize audio processing
- Use caching for repeated operations
- Consider using Redis for session storage

---

## Monitoring and Maintenance

### Set up monitoring:
- Use platform-specific monitoring tools
- Set up error tracking (e.g., Sentry)
- Monitor database performance

### Regular maintenance:
- Update dependencies regularly
- Monitor resource usage
- Backup database regularly

---

## Next Steps

1. Choose your preferred deployment platform
2. Set up MongoDB Atlas account
3. Configure environment variables
4. Deploy and test
5. Set up monitoring and backups

For platform-specific help, check the documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)

Need help? Check the logs first, then consult the platform-specific troubleshooting guides.
