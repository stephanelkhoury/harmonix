#!/bin/zsh
# Production Environment Setup Checker for Harmonix

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'

echo "${BLUE}${BOLD}Harmonix Production Environment Checker${NC}"
echo "${BLUE}=======================================${NC}"
echo

# Check if we're ready for deployment
check_deployment_readiness() {
    local issues=0
    
    echo "${BOLD}Checking deployment readiness...${NC}"
    echo
    
    # Check git status
    if [[ -n $(git status --porcelain) ]]; then
        echo "${RED}✗ Uncommitted changes detected${NC}"
        echo "  Please commit and push your changes first"
        ((issues++))
    else
        echo "${GREEN}✓ Git repository is clean${NC}"
    fi
    
    # Check if on main branch
    local branch=$(git branch --show-current)
    if [[ "$branch" != "main" && "$branch" != "master" ]]; then
        echo "${YELLOW}⚠ Not on main/master branch (currently on: $branch)${NC}"
        echo "  Consider switching to main branch for deployment"
    else
        echo "${GREEN}✓ On main branch${NC}"
    fi
    
    # Check package.json files
    local package_files=("frontend/package.json" "backend/package.json" "server/package.json")
    for file in "${package_files[@]}"; do
        if [[ -f "$file" ]]; then
            echo "${GREEN}✓ $file exists${NC}"
        else
            echo "${RED}✗ $file missing${NC}"
            ((issues++))
        fi
    done
    
    # Check requirements.txt
    if [[ -f "python_service/requirements.txt" ]]; then
        echo "${GREEN}✓ Python requirements.txt exists${NC}"
    else
        echo "${RED}✗ python_service/requirements.txt missing${NC}"
        ((issues++))
    fi
    
    # Check Dockerfiles
    local dockerfiles=("frontend/Dockerfile" "backend/Dockerfile" "server/Dockerfile" "python_service/Dockerfile")
    for file in "${dockerfiles[@]}"; do
        if [[ -f "$file" ]]; then
            echo "${GREEN}✓ $file exists${NC}"
        else
            echo "${YELLOW}⚠ $file missing${NC}"
            echo "  Consider creating it for Docker deployments"
        fi
    done
    
    # Check deployment config files
    local config_files=("vercel.json" "railway.yml" "render.yaml" "netlify.toml")
    local config_found=0
    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            echo "${GREEN}✓ $file found${NC}"
            ((config_found++))
        fi
    done
    
    if [[ $config_found -eq 0 ]]; then
        echo "${YELLOW}⚠ No deployment config files found${NC}"
        echo "  Run ./deploy.sh to set up deployment configurations"
    fi
    
    echo
    if [[ $issues -eq 0 ]]; then
        echo "${GREEN}${BOLD}✓ Ready for deployment!${NC}"
        return 0
    else
        echo "${RED}${BOLD}✗ $issues issue(s) need to be resolved before deployment${NC}"
        return 1
    fi
}

# Check environment variables setup
check_environment_setup() {
    echo "${BOLD}Checking environment setup...${NC}"
    echo
    
    # Check if environment templates exist
    if [[ -f ".env.production.template" ]]; then
        echo "${GREEN}✓ Production environment template exists${NC}"
    else
        echo "${YELLOW}⚠ Production environment template missing${NC}"
        echo "  Run ./deploy.sh to create it"
    fi
    
    # Check for local environment files
    local env_files=("backend/.env" "server/.env" "frontend/.env")
    for file in "${env_files[@]}"; do
        if [[ -f "$file" ]]; then
            echo "${GREEN}✓ $file exists (for local development)${NC}"
        else
            echo "${YELLOW}⚠ $file missing${NC}"
            echo "  Create it for local development"
        fi
    done
    
    echo
    echo "${BLUE}Remember to set these environment variables in your deployment platform:${NC}"
    echo "  ${BOLD}MONGODB_URI${NC} - Your MongoDB connection string"
    echo "  ${BOLD}JWT_SECRET${NC} - Secure random string for JWT tokens"
    echo "  ${BOLD}NODE_ENV${NC} - Set to 'production'"
    echo "  ${BOLD}REACT_APP_BACKEND_URL${NC} - Your backend API URL"
    echo "  ${BOLD}REACT_APP_PYTHON_SERVICE_URL${NC} - Your Python service URL"
}

# Security checklist
security_checklist() {
    echo
    echo "${BOLD}Security Checklist:${NC}"
    echo
    
    # Check for sensitive data in files
    if grep -r "password\|secret\|key" --include="*.js" --include="*.json" --exclude-dir="node_modules" . | grep -v "JWT_SECRET\|password.*placeholder\|example"; then
        echo "${RED}⚠ Potential sensitive data found in source files${NC}"
        echo "  Review the above files and remove any hardcoded secrets"
    else
        echo "${GREEN}✓ No obvious sensitive data in source files${NC}"
    fi
    
    # Check for .env files in git
    if git ls-files | grep -E "\.env$|\.env\."; then
        echo "${RED}⚠ Environment files tracked in git${NC}"
        echo "  Consider adding them to .gitignore"
    else
        echo "${GREEN}✓ No environment files tracked in git${NC}"
    fi
    
    echo
    echo "${BLUE}Security recommendations:${NC}"
    echo "  • Use environment variables for all secrets"
    echo "  • Generate strong JWT secrets (32+ characters)"
    echo "  • Enable HTTPS on your deployment platform"
    echo "  • Regularly update dependencies"
    echo "  • Set up CORS properly for production domains"
}

# Performance recommendations
performance_recommendations() {
    echo
    echo "${BOLD}Performance Recommendations:${NC}"
    echo
    echo "  • Enable gzip compression on your hosting platform"
    echo "  • Use CDN for static assets"
    echo "  • Configure proper caching headers"
    echo "  • Monitor application performance and errors"
    echo "  • Set up database connection pooling"
    echo "  • Consider using Redis for session storage in production"
}

# Monitoring setup
monitoring_setup() {
    echo
    echo "${BOLD}Monitoring Setup:${NC}"
    echo
    echo "After deployment, set up monitoring:"
    echo "  • Application logs monitoring"
    echo "  • Error tracking (e.g., Sentry)"
    echo "  • Uptime monitoring"
    echo "  • Performance monitoring"
    echo "  • Database performance monitoring"
    echo
    echo "Test your deployed application:"
    echo "  ${YELLOW}node health-check.js${NC}"
}

# Main function
main() {
    if check_deployment_readiness; then
        check_environment_setup
        security_checklist
        performance_recommendations
        monitoring_setup
        
        echo
        echo "${GREEN}${BOLD}Ready to deploy!${NC}"
        echo
        echo "Next steps:"
        echo "1. Run ${YELLOW}./deploy.sh${NC} to choose your deployment platform"
        echo "2. Set up your MongoDB Atlas database"
        echo "3. Configure environment variables on your platform"
        echo "4. Deploy and test your application"
        echo "5. Set up monitoring and backups"
        
    else
        echo
        echo "${RED}Please resolve the issues above before deploying.${NC}"
        echo "Run this script again after making the necessary changes."
    fi
}

# Run the checker
main
