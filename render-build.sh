#!/bin/bash
# Simple render deployment script

# Display environment information
echo "=== RENDER DEPLOYMENT ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "HOST: $HOST"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "=== INSTALLING DEPENDENCIES ==="
npm install
cd backend && npm install
cd ..

# Build the React frontend
echo "=== BUILDING FRONTEND ==="
npm run build

# Final setup message
echo "=== DEPLOYMENT COMPLETE ==="
echo "Ready to start server with: node backend/server.js"
