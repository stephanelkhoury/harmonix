#!/bin/zsh
# Deploy Harmonix to various cloud platforms

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'

echo "${BLUE}${BOLD}Harmonix Deployment Helper${NC}"
echo "${BLUE}===========================${NC}"
echo

# Function to check if git repo is clean
check_git_status() {
    if [[ -n $(git status --porcelain) ]]; then
        echo "${YELLOW}Warning: You have uncommitted changes.${NC}"
        echo "${YELLOW}Commit your changes before deploying:${NC}"
        echo "  git add ."
        echo "  git commit -m 'Prepare for deployment'"
        echo "  git push origin main"
        echo
        read -r "continue_anyway?Continue anyway? (y/n): "
        if [[ "$continue_anyway" != "y" ]]; then
            echo "${RED}Deployment cancelled.${NC}"
            exit 1
        fi
    fi
}

# Function to create environment file template
create_env_template() {
    echo "${BLUE}Creating production environment template...${NC}"
    
    cat > .env.production.template << EOL
# Production Environment Variables Template
# Copy this file to .env.production and fill in your actual values

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/harmonix?retryWrites=true&w=majority

# Backend URLs (update with your actual deployment URLs)
REACT_APP_BACKEND_URL=https://your-backend-url.com
REACT_APP_PYTHON_SERVICE_URL=https://your-python-service-url.com

# Server Configuration
PORT=\${PORT:-4000}
NODE_ENV=production

# Security (generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRY=1h

# Optional: File Upload Limits
MAX_FILE_SIZE=50MB
UPLOAD_TIMEOUT=300000
EOL

    echo "${GREEN}✓ Created .env.production.template${NC}"
}

# Function to display deployment options
show_deployment_options() {
    echo "${BOLD}Choose your deployment platform:${NC}"
    echo
    echo "1) ${GREEN}Railway${NC} - Best for full-stack apps (recommended)"
    echo "2) ${BLUE}Render${NC} - Great free tier"
    echo "3) ${YELLOW}Vercel${NC} - Excellent for frontend + serverless"
    echo "4) ${CYAN}Docker${NC} - Deploy to any cloud provider"
    echo "5) ${PURPLE}GitHub Actions${NC} - Set up CI/CD pipeline"
    echo "6) ${WHITE}Manual Setup${NC} - Get deployment instructions"
    echo
    read -r "choice?Enter your choice (1-6): "
}

# Function for Railway deployment
deploy_railway() {
    echo "${GREEN}Setting up Railway deployment...${NC}"
    echo
    echo "1. Go to https://railway.app"
    echo "2. Sign up with your GitHub account"
    echo "3. Click 'New Project' -> 'Deploy from GitHub repo'"
    echo "4. Select your harmonix repository"
    echo "5. Railway will automatically detect the railway.yml configuration"
    echo
    echo "${YELLOW}Important:${NC} Add these environment variables in Railway dashboard:"
    echo "  - MONGODB_URI (get from MongoDB Atlas)"
    echo "  - JWT_SECRET (generate a secure random string)"
    echo
    echo "Your app will be available at: https://your-app.up.railway.app"
}

# Function for Render deployment
deploy_render() {
    echo "${BLUE}Setting up Render deployment...${NC}"
    echo
    echo "1. Go to https://render.com"
    echo "2. Connect your GitHub account"
    echo "3. Click 'New' -> 'Blueprint'"
    echo "4. Connect your repository and use render.yaml"
    echo "5. Configure environment variables"
    echo
    echo "${YELLOW}Set up MongoDB Atlas:${NC}"
    echo "1. Go to https://mongodb.com/cloud/atlas"
    echo "2. Create a free cluster"
    echo "3. Get connection string"
    echo "4. Add to Render environment variables"
}

# Function for Vercel deployment
deploy_vercel() {
    echo "${YELLOW}Setting up Vercel deployment...${NC}"
    echo
    echo "1. Go to https://vercel.com"
    echo "2. Import your GitHub repository"
    echo "3. Vercel will detect the vercel.json configuration"
    echo "4. Set environment variables in Vercel dashboard"
    echo
    echo "${YELLOW}Note:${NC} You'll need separate hosting for:"
    echo "  - Python service (try Railway/Render)"
    echo "  - MongoDB (use MongoDB Atlas)"
}

# Function for Docker deployment
deploy_docker() {
    echo "${CYAN}Setting up Docker deployment...${NC}"
    echo
    echo "You can deploy the Docker containers to:"
    echo "1. ${BOLD}DigitalOcean App Platform:${NC}"
    echo "   - Push code to GitHub"
    echo "   - Create app from GitHub repo"
    echo "   - Uses docker-compose.yml automatically"
    echo
    echo "2. ${BOLD}AWS ECS/Fargate:${NC}"
    echo "   - Build and push images to ECR"
    echo "   - Create ECS service"
    echo
    echo "3. ${BOLD}Google Cloud Run:${NC}"
    echo "   - Build images with Cloud Build"
    echo "   - Deploy to Cloud Run"
    echo
    echo "To test locally:"
    echo "  cd config && docker-compose up"
}

# Function to set up GitHub Actions
setup_github_actions() {
    echo "${PURPLE}GitHub Actions CI/CD is already configured!${NC}"
    echo
    echo "The workflow file is at: .github/workflows/deploy.yml"
    echo
    echo "To enable it:"
    echo "1. Go to your GitHub repository"
    echo "2. Click 'Settings' -> 'Secrets and variables' -> 'Actions'"
    echo "3. Add these secrets:"
    echo "   - RENDER_SERVICE_ID (if using Render)"
    echo "   - RENDER_API_KEY"
    echo "   - VERCEL_TOKEN (if using Vercel)"
    echo "   - ORG_ID, PROJECT_ID"
    echo
    echo "The workflow will run on every push to main branch."
}

# Function for manual setup instructions
manual_setup() {
    echo "${WHITE}Manual Deployment Instructions${NC}"
    echo
    echo "1. ${BOLD}Set up MongoDB Atlas:${NC}"
    echo "   - Create account at mongodb.com/cloud/atlas"
    echo "   - Create free cluster"
    echo "   - Get connection string"
    echo
    echo "2. ${BOLD}Choose hosting platform and deploy services:${NC}"
    echo "   - Frontend: Static hosting (Netlify, Vercel, etc.)"
    echo "   - Backend: Node.js hosting (Heroku, Railway, Render)"
    echo "   - Python Service: Python hosting (Railway, Render, PythonAnywhere)"
    echo
    echo "3. ${BOLD}Configure environment variables on each platform${NC}"
    echo
    echo "4. ${BOLD}Update CORS settings in server files${NC}"
    echo "   - Add production URLs to allowed origins"
    echo
    echo "For detailed instructions, see: DEPLOYMENT_GUIDE.md"
}

# Main deployment flow
main() {
    check_git_status
    create_env_template
    
    show_deployment_options
    
    case $choice in
        1)
            deploy_railway
            ;;
        2)
            deploy_render
            ;;
        3)
            deploy_vercel
            ;;
        4)
            deploy_docker
            ;;
        5)
            setup_github_actions
            ;;
        6)
            manual_setup
            ;;
        *)
            echo "${RED}Invalid choice. Please run the script again.${NC}"
            exit 1
            ;;
    esac
    
    echo
    echo "${GREEN}${BOLD}Next Steps:${NC}"
    echo "1. Set up your chosen platform account"
    echo "2. Configure environment variables"
    echo "3. Deploy and test your application"
    echo "4. Monitor logs for any issues"
    echo
    echo "Need help? Check DEPLOYMENT_GUIDE.md for detailed instructions."
}

# Run main function
main
