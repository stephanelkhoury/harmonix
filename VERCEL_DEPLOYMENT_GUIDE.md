# Harmonix Vercel Deployment Guide

## Overview
This guide will help you deploy your Harmonix application to Vercel. Note that Vercel is optimized for frontend and serverless functions, so we'll deploy the React frontend and Node.js backend services, while the Python service will need to be hosted separately.

## Pre-Deployment Checklist

### ✅ Files Ready
- `vercel.json` - ✓ Configured
- `frontend/package.json` - ✓ Updated with vercel-build script
- `backend/server.js` - ✓ Ready for serverless
- `server/index.js` - ✓ Ready for serverless

### 🔧 What Will Be Deployed
- **Frontend**: React app (Static Site)
- **Backend**: Node.js server (Serverless Functions) 
- **Server**: Node.js server (Serverless Functions)
- **Python Service**: ⚠️ Needs separate hosting (see alternatives below)

## Step-by-Step Deployment

### 1. Install Vercel CLI (Already Done)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Project Root
```bash
cd /Users/stephanelkhoury/Documents/GitHub/harmonix
vercel
```

### 4. Configuration During Deployment
When prompted:
- **Set up and deploy**: Yes
- **Which scope**: Select your account
- **Link to existing project**: No (for first deployment)
- **Project name**: harmonix
- **Directory**: . (current directory)
- **Override settings**: No (use vercel.json)

### 5. Set Environment Variables
After deployment, go to your Vercel dashboard and add these environment variables:

#### Required Environment Variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PYTHON_SERVICE_URL=your_python_service_url
NODE_ENV=production
```

#### React Environment Variables:
```
REACT_APP_BACKEND_URL=https://your-app.vercel.app/api
REACT_APP_SERVER_URL=https://your-app.vercel.app/api/server  
REACT_APP_PYTHON_SERVICE_URL=your_python_service_url
```

## Python Service Alternatives

Since Vercel doesn't support Python backends, you'll need to deploy the Python service separately:

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy just the Python service
railway login
railway init
railway up
```

### Option 2: Render.com
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `cd python_service && pip install -r requirements.txt`
5. Set start command: `cd python_service && uvicorn main:app --host 0.0.0.0 --port $PORT`

### Option 3: Heroku
```bash
# Create a separate Heroku app for Python service
heroku create harmonix-python
git subtree push --prefix=python_service heroku main
```

## Quick Deploy Commands

### Deploy to Vercel Now:
```bash
cd /Users/stephanelkhoury/Documents/GitHub/harmonix
vercel --prod
```

### Redeploy After Changes:
```bash
vercel --prod
```

## Post-Deployment Testing

### 1. Test Frontend
Visit your Vercel URL (e.g., `https://harmonix-abc123.vercel.app`)

### 2. Test API Endpoints
```bash
# Test backend API
curl https://your-app.vercel.app/api/health

# Test server API  
curl https://your-app.vercel.app/api/server/health
```

### 3. Run Health Check
```bash
REACT_APP_FRONTEND_URL=https://your-app.vercel.app \
REACT_APP_BACKEND_URL=https://your-app.vercel.app/api \
REACT_APP_SERVER_URL=https://your-app.vercel.app/api/server \
REACT_APP_PYTHON_SERVICE_URL=your-python-service-url \
node health-check.js
```

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check `vercel.json` configuration
   - Ensure all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

2. **API Routes Not Working**
   - Verify route configuration in `vercel.json`
   - Check function timeout settings
   - Test API endpoints individually

3. **Environment Variables Missing**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add all required variables for Production environment
   - Redeploy after adding variables

4. **MongoDB Connection Issues**
   - Ensure MongoDB Atlas allows connections from 0.0.0.0/0
   - Check connection string format
   - Test connection string locally first

## Domain Configuration

### Custom Domain (Optional):
1. Go to Vercel dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update environment variables with new domain

## Monitoring and Logs

### View Logs:
```bash
vercel logs
```

### Monitor Functions:
- Go to Vercel dashboard → Project → Functions
- View real-time logs and performance metrics

## Next Steps After Deployment

1. **Set up MongoDB Atlas** (if not already done)
2. **Deploy Python service** to your chosen platform
3. **Update environment variables** with actual URLs
4. **Test all functionality** end-to-end
5. **Set up custom domain** (optional)
6. **Configure monitoring** and alerts

## Support

If you encounter issues:
1. Check Vercel documentation: https://vercel.com/docs
2. Review build logs in Vercel dashboard
3. Test locally with `vercel dev` command
4. Check GitHub repository for latest configurations

---

**Ready to deploy? Run this command:**

```bash
cd /Users/stephanelkhoury/Documents/GitHub/harmonix && vercel --prod
```
