#!/bin/bash

set -e  # Exit on error

# Function for error handling
error_exit() {
    echo "Error: $1" >&2
    exit 1
}

# Verify source files exist
if [ ! -f "index.html" ] || [ ! -f "script.js" ] || [ ! -f "vue_app.js" ] || [ ! -f "state.js" ]; then
    error_exit "Required source files missing"
fi

echo "Starting deployment process..."

# Clean up
echo "Cleaning up old files..."
rm -rf docs/ .cache/ node_modules/ dist/ || error_exit "Failed to clean up files"

# Install and build
echo "Installing dependencies..."
PARCEL_WORKERS=1 npm install || error_exit "npm install failed"

echo "Building project..."
PARCEL_WORKERS=1 npm run build || error_exit "Build failed"

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