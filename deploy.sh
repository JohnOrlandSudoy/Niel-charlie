#!/bin/bash

# Restaurant Admin Dashboard Deployment Script
# This script helps deploy your application to various platforms

set -e

echo "🚀 Restaurant Admin Dashboard Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found!"
        print_status "Creating .env file from template..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success ".env file created from .env.example"
            print_warning "Please update .env file with your actual values before deploying!"
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success ".env file found"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
}

# Build the project
build_project() {
    print_status "Building project for production..."
    npm run build
    
    if [ -d "dist" ]; then
        print_success "Build completed successfully"
        print_status "Build size: $(du -sh dist | cut -f1)"
    else
        print_error "Build failed - dist directory not found"
        exit 1
    fi
}

# Run linting
run_lint() {
    print_status "Running ESLint..."
    npm run lint
    print_success "Linting completed successfully"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if command -v vercel &> /dev/null; then
        vercel --prod
        print_success "Deployed to Vercel successfully"
    else
        print_error "Vercel CLI not found. Please install it first: npm i -g vercel"
        exit 1
    fi
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if command -v netlify &> /dev/null; then
        netlify deploy --prod --dir=dist
        print_success "Deployed to Netlify successfully"
    else
        print_error "Netlify CLI not found. Please install it first: npm i -g netlify-cli"
        exit 1
    fi
}

# Deploy to AWS S3
deploy_s3() {
    print_status "Deploying to AWS S3..."
    
    if [ -z "$S3_BUCKET" ]; then
        print_error "S3_BUCKET environment variable not set"
        print_status "Usage: S3_BUCKET=your-bucket-name ./deploy.sh s3"
        exit 1
    fi
    
    if command -v aws &> /dev/null; then
        aws s3 sync dist/ s3://$S3_BUCKET --delete
        print_success "Deployed to AWS S3 successfully"
    else
        print_error "AWS CLI not found. Please install it first"
        exit 1
    fi
}

# Preview the build
preview_build() {
    print_status "Starting preview server..."
    npm run preview
}

# Show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  build       Build the project for production"
    echo "  lint        Run ESLint"
    echo "  vercel      Deploy to Vercel"
    echo "  netlify     Deploy to Netlify"
    echo "  s3          Deploy to AWS S3 (requires S3_BUCKET env var)"
    echo "  preview     Preview the production build"
    echo "  all         Run build, lint, and deploy to Vercel"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 vercel"
    echo "  S3_BUCKET=my-bucket $0 s3"
    echo "  $0 all"
}

# Main deployment function
deploy_all() {
    print_status "Starting full deployment process..."
    
    check_env_file
    install_dependencies
    run_lint
    build_project
    deploy_vercel
    
    print_success "Full deployment completed successfully! 🎉"
}

# Main script logic
case "${1:-help}" in
    "build")
        check_env_file
        install_dependencies
        build_project
        ;;
    "lint")
        run_lint
        ;;
    "vercel")
        check_env_file
        install_dependencies
        build_project
        deploy_vercel
        ;;
    "netlify")
        check_env_file
        install_dependencies
        build_project
        deploy_netlify
        ;;
    "s3")
        check_env_file
        install_dependencies
        build_project
        deploy_s3
        ;;
    "preview")
        check_env_file
        install_dependencies
        build_project
        preview_build
        ;;
    "all")
        deploy_all
        ;;
    "help"|*)
        show_help
        ;;
esac
