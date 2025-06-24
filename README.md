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

## Deployment on Render

This application can be deployed to Render.com in three different ways:

#### Option 1: Separate Frontend and Backend (Original)
This option uses two separate services on Render - one for the frontend and one for the backend.

1. Run the preparation script:
   ```
   # On Windows
   .\prepare-for-free-tier.bat
   
   # On Linux/Mac
   ./prepare-for-free-tier.sh
   ```
2. Push to your GitHub repository
3. Create two services on Render using the `render.yaml` configuration

#### Option 2: Combined Deployment (Recommended)
This option deploys a single service that serves both the backend and the frontend.

1. Run the preparation script:
   ```
   # On Windows
   .\prepare-for-combined.bat
   
   # On Linux/Mac
   ./prepare-for-combined.sh
   ```
2. Push to your GitHub repository
3. Create a web service on Render using the `render.yaml` configuration

##### Why use the combined deployment?
- Simplified deployment process with a single service
- Reduced costs by only running one service
- No CORS issues between frontend and backend
- Better for free tier usage

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
