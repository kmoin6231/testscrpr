#!/bin/bash

# Script to prepare the Waqf Scraper for Render combined deployment

echo "Preparing Waqf Scraper for Render combined deployment..."

# Check if render.yaml exists
if [ -f "render.yaml" ]; then
    echo "Backing up existing render.yaml to render-original.yaml"
    cp render.yaml render-original.yaml
fi

# Use the combined configuration
if [ -f "render-combined.yaml" ]; then
    echo "Copying render-combined.yaml to render.yaml"
    cp render-combined.yaml render.yaml
    echo "Ready for combined deployment!"
else
    echo "Error: render-combined.yaml not found"
    exit 1
fi
