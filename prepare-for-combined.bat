@echo off
REM Script to prepare the Waqf Scraper for Render combined deployment

echo Preparing Waqf Scraper for Render combined deployment...

REM Check if render.yaml exists
if exist "render.yaml" (
    echo Backing up existing render.yaml to render-original.yaml
    copy render.yaml render-original.yaml
)

REM Use the combined configuration
if exist "render-combined.yaml" (
    echo Copying render-combined.yaml to render.yaml
    copy render-combined.yaml render.yaml
    echo Ready for combined deployment!
) else (
    echo Error: render-combined.yaml not found
    exit /b 1
)
