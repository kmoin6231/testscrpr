#!/bin/bash
# Simplified deploy script for Render

echo "=== RENDER DEPLOYMENT ==="
echo "Current directory: $(pwd)"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Copy simplified files
cp render-package.json package.json
cp render-server.js server.js

# Install only the required dependencies
npm install --production

# Display final setup
echo "=== DEPLOYMENT READY ==="
echo "Using Node.js version: $(node -v)"
echo "Using npm version: $(npm -v)"
echo "Startup command: node server.js"
