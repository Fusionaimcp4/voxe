#!/bin/bash

# Voxe Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="localboxs"
APP_DIR="/opt/localboxs-site"
BACKUP_DIR="/opt/backups/localboxs"

echo "🚀 Starting Voxe deployment for $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please install it first: npm install -g pm2"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create logs directory
mkdir -p $APP_DIR/logs

print_status "Creating backup of current deployment..."
if [ -d "$APP_DIR" ]; then
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_FILE" -C "$APP_DIR" . 2>/dev/null || print_warning "Could not create backup (directory might be empty)"
    print_status "Backup created: $BACKUP_FILE"
fi

print_status "Navigating to application directory..."
cd $APP_DIR

print_status "Pulling latest changes from repository..."
git pull origin main

print_status "Installing dependencies..."
npm install --production

print_status "Running type check..."
npm run type-check || print_warning "Type check failed, continuing with deployment..."

print_status "Building application..."
npm run build

print_status "Stopping current PM2 processes..."
pm2 stop $APP_NAME 2>/dev/null || print_warning "No existing PM2 process found"

print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env $ENVIRONMENT

print_status "Saving PM2 configuration..."
pm2 save

print_status "Checking application status..."
sleep 5
pm2 status

print_status "Testing application health..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Application is responding successfully!"
else
    print_error "❌ Application health check failed!"
    print_status "Checking PM2 logs..."
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

print_status "Cleaning up old backups (keeping last 5)..."
cd $BACKUP_DIR
ls -t | tail -n +6 | xargs -r rm -f

print_status "🎉 Deployment completed successfully!"
print_status "Application is running at: http://localhost:3000"
print_status "PM2 status: pm2 status"
print_status "PM2 logs: pm2 logs $APP_NAME"
print_status "PM2 monitor: pm2 monit"

# Optional: Send notification (uncomment and configure as needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"Voxe deployment completed successfully!"}' \
#     YOUR_SLACK_WEBHOOK_URL
