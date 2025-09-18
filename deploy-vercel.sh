#!/bin/bash

# Vercel Deployment Script for Restaurant Admin Dashboard
# This script automates the deployment process to Vercel

set -e

echo "🚀 Restaurant Admin Dashboard - Vercel Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
        print_status "Please create a .env file with your environment variables."
        print_status "You can use the DEPLOYMENT_CONFIG.md as a reference."
        print_error "Deployment cannot continue without .env file."
        exit 1
    else
        print_success ".env file found"
    fi
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found!"
        print_status "Installing Vercel CLI..."
        npm install -g vercel
        print_success "Vercel CLI installed successfully"
    else
        print_success "Vercel CLI found"
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
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_status "Please login to Vercel..."
        vercel login
    fi
    
    # Deploy to Vercel
    vercel --prod
    
    print_success "Deployed to Vercel successfully! 🎉"
    print_status "Your app is now live on Vercel!"
}

# Main deployment function
deploy_all() {
    print_status "Starting Vercel deployment process..."
    
    check_env_file
    check_vercel_cli
    install_dependencies
    run_lint
    build_project
    deploy_vercel
    
    print_success "Vercel deployment completed successfully! 🎉"
    print_status "Check your Vercel dashboard for the deployment URL."
}

# Show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  build       Build the project for production"
    echo "  lint        Run ESLint"
    echo "  deploy      Deploy to Vercel"
    echo "  all         Run full deployment process (recommended)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 deploy"
    echo "  $0 all"
    echo ""
    echo "Prerequisites:"
    echo "  - .env file with environment variables"
    echo "  - Vercel CLI installed (will install automatically)"
    echo "  - Vercel account and login"
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
    "deploy")
        check_env_file
        check_vercel_cli
        install_dependencies
        build_project
        deploy_vercel
        ;;
    "all")
        deploy_all
        ;;
    "help"|*)
        show_help
        ;;
esac
