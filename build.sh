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

# Create necessary directories if they don't exist
echo "Creating output directories..."
mkdir -p backend/pdf_output
mkdir -p backend/pdf_output/jl
mkdir -p backend/pdf_output/test_district
mkdir -p backend/pdf_output/wamsi_data

# Copy test files if environment variable is set
if [ "$INCLUDE_TEST_FILES" = "true" ]; then
  echo "Setting up test files..."
  node create-test-pdfs.js
fi

echo "Build completed successfully!"
cd backend
npm install pdfkit --save
cd ..

# Done!
echo "Build process completed!"
