#!/bin/bash

# Script to prepare the Waqf Scraper for Render free tier deployment

echo "Preparing Waqf Scraper for Render free tier deployment..."

# Check if render.yaml exists
if [ -f "render.yaml" ]; then
    echo "Backing up existing render.yaml to render-paid.yaml"
    cp render.yaml render-paid.yaml
fi

# Use the free tier configuration
if [ -f "render-free.yaml" ]; then
    echo "Copying render-free.yaml to render.yaml"
    cp render-free.yaml render.yaml
    echo "Ready for free tier deployment!"
else
    echo "Error: render-free.yaml not found"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Push this repository to GitHub"
echo "2. Connect your GitHub account to Render"
echo "3. Create a new Blueprint on Render and select the repository"
echo "4. Render will automatically create the frontend and backend services"
echo ""
echo "Note: To switch back to paid tier configuration, rename render-paid.yaml to render.yaml"
