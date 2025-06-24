# Waqf Scraper Backend

This is the backend server for the Waqf Document Scraper application. It handles web scraping, PDF generation, and ZIP file creation.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

## API Endpoints

- `POST /scrape` - Start the scraping process
- `POST /abort` - Abort the scraping process
- `POST /create-zip` - Create a ZIP file from a folder
- `GET /stream` - Server-sent events endpoint for real-time logging

## Requirements

- Node.js (v14 or higher)
- Chrome browser
- ChromeDriver (compatible with your Chrome version)

## Deployment to Render

This application has been configured for deployment to Render.com.

### Free Tier Deployment

To deploy on Render's free tier:

1. Push this repository to GitHub
2. Sign up for a Render account at https://render.com if you don't have one
3. In Render dashboard, select "New Web Service"
4. Connect your GitHub account and select this repository
5. Configure the service:
   - Name: `waqf-scraper-backend` (or your preferred name)
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Select "Free" plan
   - Under Advanced, add these environment variables:
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
   - Click "Create Web Service"

6. For the frontend:
   - Go back to dashboard and select "New Static Site"
   - Connect to the same GitHub repository
   - Configure:
     - Name: `waqf-scraper-frontend` (or preferred name)
     - Build Command: `npm install && npm run build`
     - Publish Directory: `build`
     - Add environment variable:
       - `REACT_APP_API_URL`: URL of your backend service (e.g., `https://waqf-scraper-backend.onrender.com`)
   - Click "Create Static Site"

### Free Tier Limitations

When using Render's free tier:

1. **No Persistent Storage**: Files will be temporary and deleted when the service restarts
2. **Service Spin Down**: Free services spin down after 15 minutes of inactivity
3. **Limited Compute**: May experience slower performance with resource-intensive operations

### Recommended Free Tier Modifications

To better work with free tier limitations:

1. Keep scraping sessions shorter
2. Download ZIP files immediately after creation
3. Expect longer cold starts when the service has been inactive

## Optimizing for Render Free Tier

For the best experience on Render's free tier, consider these optimizations:

### 1. Storage Management

Since the free tier doesn't include persistent storage, implement these practices:

- Download PDFs and ZIP files immediately after creation
- Consider modifying the application to use a temporary storage service like AWS S3 (would require code changes)
- Keep scraping sessions shorter and more focused
- Implement automatic cleanup of old files

### 2. Performance Optimization

Free tier has limited resources:

- Use smaller batches when scraping multiple documents
- Optimize Chrome settings for minimal resource usage
- Implement efficient error handling to prevent crashes

### 3. Handling Service Spin-down

Free tier services spin down after 15 minutes of inactivity:

- Expect longer initial load times after periods of inactivity
- Consider implementing a scheduled ping to keep the service active during peak usage hours
- Add user-friendly messages about potential cold starts

### 4. Alternative Deployment Files

This repository includes two Render configuration files:
- `render.yaml` - For paid tier with persistent disk
- `render-free.yaml` - For free tier without persistent disk

To use the free tier configuration, either:
1. Rename `render-free.yaml` to `render.yaml` before deploying, or
2. Use manual deployment as described in the "Free Tier Deployment" section

### Paid Tier Deployment

For production use with persistent storage and better performance:

1. Follow the same steps but select a paid plan instead of "Free"
2. Add a persistent disk in the service configuration
3. Set disk path to `/opt/render/project/src/backend/pdf_output`

### Environment Variables

The following environment variables are used:

- `NODE_ENV` - Set to "production" in the Render environment
- `PORT` - The port on which the backend server runs
- `REACT_APP_API_URL` - URL of the backend API (set in frontend build)
