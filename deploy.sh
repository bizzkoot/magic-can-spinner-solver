#!/bin/bash

# Print steps
echo "Starting deployment process..."

# Clean up
echo "Cleaning up old files..."
git rm -rf docs/ 2>/dev/null || true
rm -rf docs/
rm -rf node_modules/
rm -rf .cache/

# Install and build
echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

# Git operations
echo "Committing new build..."
git add docs/
git commit -m "build: Update production build"

echo "Pushing to GitHub..."
git push origin main

echo "Deployment complete! Wait a few minutes for GitHub Pages to update."
