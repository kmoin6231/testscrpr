@echo off
REM Script to prepare the Waqf Scraper for Render free tier deployment

echo Preparing Waqf Scraper for Render free tier deployment...

REM Check if render.yaml exists
if exist "render.yaml" (
    echo Backing up existing render.yaml to render-paid.yaml
    copy render.yaml render-paid.yaml
)

REM Use the free tier configuration
if exist "render-free.yaml" (
    echo Copying render-free.yaml to render.yaml
    copy render-free.yaml render.yaml
    echo Ready for free tier deployment!
) else (
    echo Error: render-free.yaml not found
    exit /b 1
)

echo.
echo Next steps:
echo 1. Push this repository to GitHub
echo 2. Connect your GitHub account to Render
echo 3. Create a new Blueprint on Render and select the repository
echo 4. Render will automatically create the frontend and backend services
echo.
echo Note: To switch back to paid tier configuration, rename render-paid.yaml to render.yaml
