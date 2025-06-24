#!/bin/bash
# This script installs dependencies and builds the application for Render deployment

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build the React app
echo "Building React app..."
npx react-scripts build

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Ensure PDFKit is properly installed
echo "Installing PDFKit and other PDF handling libraries..."
npm install pdfkit --save
cd backend
npm install pdfkit --save
cd ..

# Done!
echo "Build process completed!"
