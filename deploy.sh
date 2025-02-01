#!/bin/bash

set -e  # Exit on error

# Function for error handling
error_exit() {
    echo "Error: $1" >&2
    exit 1
}

# Verify git config
if ! git config user.name > /dev/null || ! git config user.email > /dev/null; then
    error_exit "Git user.name or user.email not configured"
fi

# Create backup
echo "Creating backup..."
cp -r docs/ docs_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

echo "Starting deployment process..."

# Clean up
echo "Cleaning up old files..."
rm -rf docs/ .cache/ node_modules/ dist/ || error_exit "Failed to clean up files"

# Install and build
echo "Installing dependencies..."
npm install || error_exit "npm install failed"

echo "Building project..."
npm run build || error_exit "Build failed"

# Verify build artifacts
if [ ! -d "docs" ] || [ ! -f "docs/index.html" ]; then
    error_exit "Build artifacts not found"
fi

# Git operations
echo "Committing new build..."
git add docs/ || error_exit "Failed to stage files"
git commit -m "build: Update production build" || error_exit "Failed to commit"
git push origin main || error_exit "Failed to push to remote"

echo "Deployment complete! Wait a few minutes for GitHub Pages to update."