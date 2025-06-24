# Waqf Document Scraper

A modern web application for scraping Waqf document data, generating PDFs, and creating ZIP archives.

## Features

- Document scraping from multiple URLs
- PDF generation and download
- ZIP file creation
- Real-time logging with color-coded messages
- Dark mode toggle
- Responsive design

## Project Structure

- **Frontend**: React application
- **Backend**: Express server with Selenium for web scraping

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Chrome browser
- ChromeDriver (compatible with your Chrome version)

### Installation

1. Install frontend dependencies:
   ```
   npm install
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. In a separate terminal, start the frontend:
   ```
   npm start
   ```

3. Access the application at http://localhost:3000

## Environment Configuration

The application uses environment variables for configuration:

- Frontend: `REACT_APP_API_URL` - URL of the backend API
- Backend: `PORT` - Port number for the server, `NODE_ENV` - Environment setting

## Deployment to Render

This application can be deployed to Render.com using either free or paid tiers.

### Free Tier Deployment

To deploy on Render's free tier without using the Blueprint:

1. Push this repository to GitHub
2. Sign up for a Render account at https://render.com if you don't have one

3. **Deploy the Backend:**
   - In Render dashboard, select "New Web Service"
   - Connect your GitHub account and select this repository
   - Configure the service:
     - Name: `waqf-scraper-backend` (or your preferred name)
     - Environment: `Node`
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`
     - Select "Free" plan
     - Under Advanced, add these environment variables:
       - `NODE_ENV`: `production`
       - `PORT`: `10000`
   - Click "Create Web Service"

4. **Deploy the Frontend:**
   - Go back to dashboard and select "New Static Site"
   - Connect to the same GitHub repository
   - Configure:
     - Name: `waqf-scraper-frontend` (or preferred name)
     - Build Command: `npm install && npm run build`
     - Publish Directory: `build`
     - Add environment variable:
       - `REACT_APP_API_URL`: URL of your backend service (e.g., `https://waqf-scraper-backend.onrender.com`)
   - Click "Create Static Site"

5. **Free Tier Limitations:**
   - No persistent storage (files will be temporary and deleted when the service restarts)
   - Services spin down after 15 minutes of inactivity (cold starts when you access after inactivity)
   - Limited compute resources

### Paid Tier Deployment (Blueprint Method)

For production deployment with persistent storage:

1. Push this repository to GitHub
2. Connect your GitHub account to Render
3. Create a new "Blueprint" on Render and select the repository
4. Render will automatically create the frontend and backend services using the `render.yaml` configuration

## Development

### Building for Production

```
npm run build
```

### Running Tests

```
npm test
```
# scrappingwithreact
