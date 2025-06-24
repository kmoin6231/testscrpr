# Waqf Document Scraper

A modern web application for scraping Waqf document data, generating PDFs, and creating ZIP archives.

## Features

- Document scraping from multiple URLs
- PDF generation and download (with PDFKit for reliable PDF creation)
- ZIP file creation and download
- Real-time logging with color-coded messages
- Dark mode toggle
- Responsive design
- Robust error handling and recovery
- File validation and conversion tools

## Recent Updates

- **PDF Generation**: Integrated PDFKit for proper PDF generation instead of HTML-to-PDF conversion
- **Download Improvements**: Enhanced download functionality with proper MIME types and headers
- **Error Handling**: Added robust error handling for file downloads and scraping operations
- **Recovery Tools**: Added ability to reset stuck scraping operations
- **File Validation**: Added tools to verify and fix PDF files
- **Documentation**: Added troubleshooting guides and download instructions

## Project Structure

- **Frontend**: React application with component-based architecture
- **Backend**: Express server with Selenium for web scraping
- **Tools**: Scripts for testing, validation, and file conversion

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

## Using the Application

1. **Scraping Documents**:
   - Enter the login URL and table URLs
   - Specify the folder name for saving files
   - Set the start and end indices for pagination
   - Click "Start Scraping"
   - Monitor progress in the log window

2. **Downloading Files**:
   - Individual files can be downloaded after scraping completes
   - Create and download ZIP archives of all scraped files
   - See [DOWNLOAD-GUIDE.md](DOWNLOAD-GUIDE.md) for detailed instructions

3. **Troubleshooting**:
   - If you encounter issues, check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
   - Use the provided scripts to validate and fix PDF files

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

## Development and Testing

### Building for Production

```
npm run build
```

### Running Tests

```
npm test
```

### Test Scripts

The repository includes several test scripts:

- `create-test-pdfs.js`: Creates test PDF files using PDFKit
- `verify-pdf-files.js`: Validates PDF files to ensure they open correctly
- `convert-invalid-pdfs.js`: Converts invalid PDFs to valid ones
- `test-downloads.html`: Test page for verifying file downloads

### Utility Scripts

- `Download-Waqf-Files.ps1`: PowerShell script for downloading files to your Downloads folder
- `run-scrape.js`: Script for running a scraping operation via API

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and solutions.

## Download Guide

See [DOWNLOAD-GUIDE.md](DOWNLOAD-GUIDE.md) for detailed instructions on downloading files.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
