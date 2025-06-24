const express = require('express');
const cors = require('cors');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { DateTime } = require('luxon');
const PDFDocument = require('pdfkit');

const app = express();
const port = process.env.PORT || 5001;

// Configure CORS options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://testscrpr-2.onrender.com', 'http://testscrpr-2.onrender.com', '*'] 
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,
  credentials: false // Set to false to avoid preflight issues
};

// Middleware
app.use(cors(corsOptions));

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});
app.use(express.json());

// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));
  console.log(`Serving static files from: ${buildPath}`);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Constants
const SAVE_DIR = path.join(__dirname, 'pdf_output');
fs.mkdirSync(SAVE_DIR, { recursive: true });

// Variables
let driver = null;
let isScrapingActive = false;
let logMessages = [];
let clients = [];
let downloadProgress = {}; // Track download progress for each file

// Utility function to get file size
function getFileSizeInBytes(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size: ${error.message}`);
    return 0;
  }
}

// Utility function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// File system watcher to monitor downloads
function watchDownloadFolder(folderPath) {
  logMessage(`Monitoring downloads in folder: ${folderPath}`, 'INFO');
  
  // Initial scan of existing files
  try {
    const files = fs.readdirSync(folderPath);
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      downloadProgress[file] = {
        path: filePath,
        size: getFileSizeInBytes(filePath),
        complete: true
      };
    });
  } catch (error) {
    logMessage(`Error scanning folder: ${error.message}`, 'ERROR');
  }
  
  // Watch for file changes
  fs.watch(folderPath, { persistent: true }, (eventType, filename) => {
    if (!filename) return;
    
    const filePath = path.join(folderPath, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        const fileSize = getFileSizeInBytes(filePath);
        const isComplete = eventType === 'rename' && fileSize > 0;
        
        downloadProgress[filename] = {
          path: filePath,
          size: fileSize,
          complete: isComplete
        };
        
        const formattedSize = formatFileSize(fileSize);
        const status = isComplete ? 'Downloaded' : 'Downloading';
        logMessage(`${status}: ${filename} (${formattedSize})`, isComplete ? 'SUCCESS' : 'INFO');
        
        // Broadcast progress to clients
        broadcastDownloadProgress();
      }
    } catch (error) {
      console.error(`Error watching file ${filename}: ${error.message}`);
    }
  });
}

// SSE endpoint for real-time logging
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Store client connection
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // Remove client when connection is closed
  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Helper function to send log messages to all connected clients
function logMessage(message, level = 'INFO') {
  let formattedMessage = message;
  
  // Add level prefix for warnings and errors
  if (level === 'WARNING' || level === 'ERROR') {
    formattedMessage = `[${level}] ${message}`;
  }
  
  // Store message for clients that connect later
  logMessages.push(formattedMessage);
  
  // Send to all connected clients
  clients.forEach(client => {
    client.res.write(`data: ${formattedMessage}\n\n`);
  });
  
  // Log to console as well
  console.log(formattedMessage);
}

// Broadcast download progress to clients
function broadcastDownloadProgress() {
  const progressData = {
    type: 'download_progress',
    data: downloadProgress
  };
  
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(progressData)}\n\n`);
  });
}

// Configure Chrome options
function getChromeOptions(saveLocation) {
  const options = new chrome.Options();
  
  // Required options for cloud deployment
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  
  // Add headless mode for production/Render environment
  if (process.env.NODE_ENV === 'production') {
    options.addArguments('--headless');
    options.addArguments('--disable-extensions');
    options.addArguments('--disable-setuid-sandbox');
    options.addArguments('--no-first-run');
    options.addArguments('--no-zygote');
    options.addArguments('--single-process');
  }
  
  // Set download preferences
  options.setUserPreferences({
    'download.default_directory': saveLocation,
    'download.prompt_for_download': false,
    'download.directory_upgrade': true,
    'safebrowsing.enabled': true
  });
  
  return options;
}

// Initialize driver
async function initializeDriver(saveDir) {
  try {
    const options = getChromeOptions(saveDir);
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    return driver;
  } catch (error) {
    logMessage(`Error initializing ChromeDriver: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Check if current time is within maintenance window (10:58 PM to 12:31 AM IST)
function isInMaintenanceWindow() {
  const ist = DateTime.now().setZone('Asia/Kolkata');
  
  // Set maintenance start time (10:58 PM)
  const startMaint = ist.set({ hour: 22, minute: 58, second: 0, millisecond: 0 });
  
  // Set maintenance end time (12:31 AM next day)
  let endMaint = ist.set({ hour: 0, minute: 31, second: 0, millisecond: 0 });
  if (ist.hour >= 22) {
    endMaint = endMaint.plus({ days: 1 });
  }
  
  // Check if current time is within maintenance window
  if (ist.hour >= 22) {
    return ist >= startMaint;
  } else if (ist.hour < 1) {
    return ist < endMaint;
  }
  
  return false;
}

// Route to start scraping
app.post('/scrape', async (req, res) => {
  // Check if already scraping
  if (isScrapingActive) {
    return res.status(400).json({ message: "A scraping operation is already in progress." });
  }
  
  // Check for maintenance window
  if (isInMaintenanceWindow()) {
    return res.status(503).json({ message: "Website under maintenance. Please try again after 12:31 AM IST." });
  }
  
  // Clear previous logs
  logMessages = [];
  isScrapingActive = true;
  
  const { loginUrl, urls, folderName, startIndex, lastIndex } = req.body;
  
  // Validate input
  if (!loginUrl || !urls || !folderName) {
    isScrapingActive = false;
    return res.status(400).json({ message: "Login URL, table URLs, and folder name are required." });
  }
    // Create folder for PDFs
  const saveDir = path.join(SAVE_DIR, folderName);
  try {
    fs.mkdirSync(saveDir, { recursive: true });
    logMessage(`PDFs will be saved to: ${saveDir}`, 'INFO');
    
    // Initialize download progress tracking
    downloadProgress = {}; // Reset download progress
    watchDownloadFolder(saveDir);
  } catch (error) {
    isScrapingActive = false;
    return res.status(400).json({ message: `Error creating save directory: ${error.message}` });
  }
  
  // Parse indexes
  const startIdx = startIndex && !isNaN(parseInt(startIndex)) ? Math.max(0, parseInt(startIndex) - 1) : 0;
  const lastIdx = lastIndex && !isNaN(parseInt(lastIndex)) ? parseInt(lastIndex) : null;
  
  // Start scraping in background
  (async () => {
    try {
      driver = await initializeDriver(saveDir);
      
      // Navigate to login page
      await driver.get(loginUrl);
      logMessage("Opened login page", 'INFO');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process each table URL
      for (let tableIdx = 0; tableIdx < urls.length; tableIdx++) {
        if (!isScrapingActive) break;
        
        logMessage(`Opening table URL ${tableIdx + 1}`, 'INFO');
        await driver.executeScript(`window.open('${urls[tableIdx]}', '_blank');`);
        
        // Switch to the new tab
        const handles = await driver.getAllWindowHandles();
        await driver.switchTo().window(handles[handles.length - 1]);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Find table rows
        let rows;
        try {
          rows = await driver.wait(
            until.elementsLocated(By.xpath('//tr[starts-with(@id, "R")]')),
            10000
          );
          logMessage(`Found ${rows.length} rows in table ${tableIdx + 1}`, 'INFO');
        } catch (error) {
          logMessage(`Table ${tableIdx + 1} took too long to load or has too much data. Skipping this table.`, 'WARNING');
          await driver.close();
          await driver.switchTo().window(handles[0]);
          continue;
        }
        
        // Calculate end index
        const endIdx = lastIdx ? Math.min(lastIdx, rows.length) : rows.length;
        
        // Process each row
        for (let index = startIdx; index < endIdx; index++) {
          if (!isScrapingActive) break;
          
          logMessage(`Processing row ${index + 1}`, 'INFO');
          rows = await driver.findElements(By.xpath('//tr[starts-with(@id, "R")]'));
          await driver.executeScript("arguments[0].click();", rows[index]);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check for errors
          const pageSource = await driver.getPageSource();
          const errorKeywords = [
            'no data', 'session expired', 'error', 'maintenance', 'not available', 
            'temporarily unavailable', 'try again later', 'invalid', 'unauthorized', 'forbidden',
            'user validation required to continue'
          ];
          
          if (errorKeywords.some(keyword => pageSource.toLowerCase().includes(keyword))) {
            logMessage(`Error: Unexpected content detected on row ${index + 1}. Stopping automation.`, 'ERROR');
            isScrapingActive = false;
            if (driver) {
              await driver.quit();
              driver = null;
            }
            return;
          }
          
          // Extract data from row
          let filename;
          try {
            const rowData = await rows[index].findElements(By.css('td'));
            const waqfId = rowData.length > 0 ? await rowData[0].getText() : "unknown";
            const propertyId = rowData.length > 1 ? await rowData[1].getText() : "unknown";
            const district = rowData.length > 2 ? await rowData[2].getText() : "unknown";
            
            // Create filename
            filename = `${waqfId}_${propertyId}_${district}.pdf`;
            // Clean filename
            filename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '');
          } catch (error) {
            logMessage(`Error extracting row data: ${error.message}`, 'ERROR');
            filename = `table${tableIdx+1}_row${index+1}.pdf`;
          }
          
          // Switch to new tab
          await driver.switchTo().window(handles[handles.length - 1]);
          await new Promise(resolve => setTimeout(resolve, 2000));
            // Generate proper PDF using PDFKit
          const html = await driver.executeScript('return document.documentElement.outerHTML');
          const title = await driver.getTitle();
          const pdfPath = path.join(saveDir, filename);
          
          // Create a new PDF document
          const doc = new PDFDocument();
          const stream = fs.createWriteStream(pdfPath);
          
          // Pipe the PDF to the file
          doc.pipe(stream);
          
          // Add content to the PDF
          doc.fontSize(16).text(title, { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
          doc.moveDown();
          
          // Add some content from the HTML (simplified for this example)
          // In a real implementation, you might want to use a HTML-to-PDF library
          doc.fontSize(10).text('Document content from web page:', { underline: true });
          doc.moveDown();
          
          // Extract text content from HTML
          const textContent = html.replace(/<[^>]*>/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
          
          // Add the content to the PDF (limited to avoid huge files)
          doc.text(textContent.substring(0, 2000) + '...');
          
          // Finalize the PDF and end the stream
          doc.end();
          
          // Wait for the stream to finish
          await new Promise((resolve, reject) => {
            stream.on('finish', () => {
              // Verify the file was created successfully
              if (fs.existsSync(pdfPath)) {
                const stats = fs.statSync(pdfPath);
                if (stats.size > 0) {
                  logMessage(` Saved: ${filename} as proper PDF (${stats.size} bytes)`, 'SUCCESS');
                  
                  // Add to download progress tracking
                  downloadProgress[filename] = {
                    path: pdfPath,
                    size: stats.size,
                    complete: true
                  };
                  
                  resolve();
                } else {
                  logMessage(` Warning: ${filename} was created but has 0 bytes`, 'WARNING');
                  reject(new Error('PDF file was created but has 0 bytes'));
                }
              } else {
                logMessage(` Error: ${filename} was not created`, 'ERROR');
                reject(new Error('PDF file was not created'));
              }
            });
            stream.on('error', (err) => {
              logMessage(` Error saving PDF: ${err.message}`, 'ERROR');
              reject(err);
            });
          });
          
          // Close current tab and switch back
          await driver.close();
          const newHandles = await driver.getAllWindowHandles();
          await driver.switchTo().window(newHandles[newHandles.length - 1]);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Close table tab and return to main tab
        await driver.close();
        const finalHandles = await driver.getAllWindowHandles();
        await driver.switchTo().window(finalHandles[0]);
      }
      
      logMessage(` Scraping completed. PDFs saved in 'pdf_output/${folderName}' folder.`, 'SUCCESS');
    } catch (error) {
      logMessage("Error: " + error.message, 'ERROR');
    } finally {
      isScrapingActive = false;
      if (driver) {
        try {
          await driver.quit();
          driver = null;
          logMessage("Browser closed", 'INFO');
        } catch (error) {
          logMessage(`Error closing browser: ${error.message}`, 'ERROR');
        }
      }
    }
  })();
  
  // Return immediate response
  return res.status(200).json({ message: "Scraping started. Check the logs for updates." });
});

// Route to abort scraping
app.post('/abort', async (req, res) => {
  isScrapingActive = false;
  
  if (driver) {
    try {
      await driver.quit();
      driver = null;
      logMessage("Browser closed due to abort request", 'INFO');
    } catch (error) {
      logMessage(`Error closing browser: ${error.message}`, 'ERROR');
    }
  }
  
  return res.json({ message: "Operation aborted" });
});

// Route to create ZIP file
app.post('/create-zip', (req, res) => {
  try {
    const { folderName } = req.body;
    
    if (!folderName) {
      logMessage("No folder name provided", 'ERROR');
      return res.status(400).json({ message: "Folder name is required" });
    }
    
    // Path to folder to zip
    const folderPath = path.join(SAVE_DIR, folderName);
    logMessage(`Checking folder path: ${folderPath}`, 'INFO');
    
    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      logMessage(`Folder not found: ${folderPath}`, 'ERROR');
      return res.status(404).json({ message: "Folder not found" });
    }
    
    // Check if it's a directory
    if (!fs.statSync(folderPath).isDirectory()) {
      logMessage(`Path exists but is not a directory: ${folderPath}`, 'ERROR');
      return res.status(400).json({ message: "Invalid folder path" });
    }
    
    // List contents
    const files = fs.readdirSync(folderPath);
    logMessage(`Found ${files.length} files in the folder`, 'INFO');
    
    // Create zip file path
    const zipPath = path.join(SAVE_DIR, `${folderName}.zip`);
    logMessage(`Creating zip at: ${zipPath}`, 'INFO');
    
    // Remove existing zip if it exists
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
        logMessage("Removed existing zip file", 'INFO');
      } catch (error) {
        logMessage(`Error removing existing zip: ${error.message}`, 'ERROR');
        return res.status(500).json({ message: `Error removing existing zip file: ${error.message}` });
      }
    }
    
    // Create zip file
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set up event listeners
    output.on('close', () => {
      logMessage("ZIP file created successfully", 'SUCCESS');
      return res.json({ message: `ZIP file created successfully at pdf_output/${folderName}.zip` });
    });
    
    archive.on('error', (err) => {
      logMessage(`Error during zip creation: ${err.message}`, 'ERROR');
      return res.status(500).json({ message: `Error creating ZIP file: ${err.message}` });
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add files from directory to the archive
    archive.directory(folderPath, false);
    
    // Finalize the archive
    archive.finalize();
    
  } catch (error) {
    logMessage(`Unexpected error creating ZIP file: ${error.message}`, 'ERROR');
    return res.status(500).json({ message: `Error creating ZIP file: ${error.message}` });
  }
});

// Route to download a specific file
app.get('/download-file', (req, res) => {
  try {
    const { folder, file } = req.query;
    
    if (!folder || !file) {
      logMessage(`Bad request: Missing folder or file parameter`, 'ERROR');
      return res.status(400).json({ 
        message: "Folder name and file name are required",
        details: "Both folder and file query parameters must be provided"
      });
    }
    
    // Construct the file path
    const filePath = path.join(SAVE_DIR, folder, file);
    logMessage(`Requested download for file: ${filePath}`, 'INFO');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logMessage(`File not found: ${filePath}`, 'ERROR');
      
      // Check if folder exists
      const folderPath = path.join(SAVE_DIR, folder);
      const folderExists = fs.existsSync(folderPath);
      
      // List available files in folder if it exists
      let availableFiles = [];
      if (folderExists) {
        try {
          availableFiles = fs.readdirSync(folderPath);
        } catch (err) {
          console.error(`Error reading directory: ${err.message}`);
        }
      }
      
      return res.status(404).json({ 
        message: "File not found",
        details: `The file "${file}" was not found in folder "${folder}"`,
        folderExists: folderExists,
        availableFiles: availableFiles
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Determine content type based on file extension
    const ext = path.extname(file).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.html' || ext === '.htm') {
      contentType = 'text/html';
    } else if (ext === '.txt') {
      contentType = 'text/plain';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }
    
    res.setHeader('Content-Type', contentType);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logMessage(`Error streaming file: ${error.message}`, 'ERROR');
      if (!res.headersSent) {
        res.status(500).json({ message: `Error streaming file: ${error.message}` });
      }
    });
    
  } catch (error) {
    logMessage(`Error processing download request: ${error.message}`, 'ERROR');
    if (!res.headersSent) {
      res.status(500).json({ message: `Error processing download request: ${error.message}` });
    }
  }
});

// Route to download a zip file
app.get('/download-zip', async (req, res) => {
  try {
    const { folder } = req.query;
    
    if (!folder) {
      return res.status(400).json({ message: "Folder name is required" });
    }
    
    // Path to folder to zip
    const folderPath = path.join(SAVE_DIR, folder);
    logMessage(`Requested ZIP download for folder: ${folderPath}`, 'INFO');
    
    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      logMessage(`Folder not found: ${folderPath}`, 'ERROR');
      return res.status(404).json({ message: "Folder not found" });
    }
    
    // Check if it's a directory
    if (!fs.statSync(folderPath).isDirectory()) {
      logMessage(`Path exists but is not a directory: ${folderPath}`, 'ERROR');
      return res.status(400).json({ message: "Invalid folder path" });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${folder}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    
    // Create zip archive stream
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Pipe archive data to the response
    archive.pipe(res);
    
    // Add files from directory to the archive
    archive.directory(folderPath, false);
    
    // Finalize the archive
    await archive.finalize();
    
    logMessage(`ZIP file created and streamed to client for folder: ${folder}`, 'SUCCESS');
    
  } catch (error) {
    logMessage(`Error processing ZIP download request: ${error.message}`, 'ERROR');
    if (!res.headersSent) {
      res.status(500).json({ message: `Error processing ZIP download request: ${error.message}` });
    }
  }
});

// Route to get download progress
app.get('/download-progress', (req, res) => {
  res.json({
    downloadProgress,
    totalFiles: Object.keys(downloadProgress).length,
    completedFiles: Object.values(downloadProgress).filter(file => file.complete).length,
    totalSize: Object.values(downloadProgress).reduce((total, file) => total + file.size, 0)
  });
});

// Special route for development to mark test files as complete
app.get('/mark-test-files-complete', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }

  const testFolder = path.join(SAVE_DIR, 'test_district');
  if (!fs.existsSync(testFolder)) {
    return res.status(404).json({ message: 'Test folder not found' });
  }

  let count = 0;
  fs.readdirSync(testFolder).forEach(file => {
    const filePath = path.join(testFolder, file);
    if (fs.statSync(filePath).isFile()) {
      downloadProgress[file] = {
        path: filePath,
        size: getFileSizeInBytes(filePath),
        complete: true
      };
      count++;
    }
  });

  broadcastDownloadProgress();
  return res.json({ 
    message: `Marked ${count} test files as complete`, 
    files: Object.keys(downloadProgress).filter(name => downloadProgress[name].complete) 
  });
});

// Route to test scraping configuration
app.post('/test-scrape', async (req, res) => {
  const { loginUrl, urls, folderName } = req.body;
  
  // Validate input
  if (!loginUrl || !urls || !folderName) {
    return res.status(400).json({ 
      success: false, 
      message: "Login URL, table URLs, and folder name are required." 
    });
  }
  
  // Check if URL is accessible
  let testDriver = null;
  try {
    logMessage(`Testing configuration: ${loginUrl}`, 'INFO');
    
    // Create temporary test folder
    const testDir = path.join(SAVE_DIR, '_test_' + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
    
    // Initialize a temporary driver
    const options = getChromeOptions(testDir);
    testDriver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Test login URL
    await testDriver.get(loginUrl);
    logMessage("Successfully accessed login URL", 'SUCCESS');
    
    // Check page title and source
    const title = await testDriver.getTitle();
    const source = await testDriver.getPageSource();
    
    // Simple checks for common issues
    const isLoginPage = 
      title.toLowerCase().includes('login') || 
      source.toLowerCase().includes('login') ||
      source.toLowerCase().includes('password') ||
      source.toLowerCase().includes('username') ||
      source.toLowerCase().includes('signin');
    
    // Get page screenshot for verification
    const screenshot = await testDriver.takeScreenshot();
    const screenshotPath = path.join(testDir, 'test_screenshot.png');
    fs.writeFileSync(screenshotPath, screenshot, 'base64');
    
    // Test one table URL if provided
    let tableTestResult = null;
    if (urls && urls.length > 0) {
      try {
        logMessage(`Testing first table URL: ${urls[0]}`, 'INFO');
        await testDriver.executeScript(`window.open('${urls[0]}', '_blank');`);
        
        // Switch to the new tab
        const handles = await testDriver.getAllWindowHandles();
        await testDriver.switchTo().window(handles[handles.length - 1]);
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if the page has tables or rows
        let hasRows = false;
        try {
          const rows = await testDriver.findElements(By.xpath('//tr'));
          hasRows = rows.length > 0;
          if (hasRows) {
            logMessage(`Found ${rows.length} rows in the table`, 'SUCCESS');
          } else {
            logMessage("No table rows found", 'WARNING');
          }
        } catch (error) {
          logMessage(`Error finding table rows: ${error.message}`, 'WARNING');
        }
        
        // Get table page screenshot
        const tableScreenshot = await testDriver.takeScreenshot();
        const tableScreenshotPath = path.join(testDir, 'table_test_screenshot.png');
        fs.writeFileSync(tableScreenshotPath, tableScreenshot, 'base64');
        
        tableTestResult = {
          success: true,
          hasRows,
          message: hasRows ? `Found ${rows.length} rows in the table` : "No table rows found"
        };
      } catch (error) {
        tableTestResult = {
          success: false,
          message: `Error accessing table URL: ${error.message}`
        };
        logMessage(`Error testing table URL: ${error.message}`, 'ERROR');
      }
    }
    
    // Clean up test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error cleaning up test directory: ${error.message}`);
    }
    
    return res.json({
      success: true,
      loginTest: {
        success: true,
        isLoginPage,
        title,
        message: "Login URL is accessible"
      },
      tableTest: tableTestResult,
      folderTest: {
        success: true,
        message: `Folder '${folderName}' will be created for saving PDFs`
      }
    });
    
  } catch (error) {
    logMessage(`Test failed: ${error.message}`, 'ERROR');
    return res.status(400).json({
      success: false,
      message: `Test failed: ${error.message}`
    });
  } finally {
    if (testDriver) {
      try {
        await testDriver.quit();
        logMessage("Test browser closed", 'INFO');
      } catch (error) {
        console.error(`Error closing test browser: ${error.message}`);
      }
    }
  }
});

// Route to check if a file exists before attempting to download
app.get('/check-file', (req, res) => {
  try {
    const { folder, file } = req.query;
    
    if (!folder || !file) {
      return res.status(400).json({ 
        exists: false, 
        message: "Folder name and file name are required" 
      });
    }
    
    // Construct the file path
    const filePath = path.join(SAVE_DIR, folder, file);
    
    // Check if file exists
    const exists = fs.existsSync(filePath);
    
    // Get additional info if file exists
    let fileInfo = null;
    if (exists) {
      const stats = fs.statSync(filePath);
      fileInfo = {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }
    
    // Get folder info
    const folderPath = path.join(SAVE_DIR, folder);
    const folderExists = fs.existsSync(folderPath);
    
    // List files in folder if it exists
    let folderFiles = [];
    if (folderExists) {
      try {
        folderFiles = fs.readdirSync(folderPath).filter(f => 
          f.endsWith('.pdf') || f.endsWith('.zip')
        );
      } catch (err) {
        console.error(`Error reading directory: ${err.message}`);
      }
    }
    
    return res.json({
      exists,
      fileInfo,
      folderExists,
      folderFiles
    });
  } catch (error) {
    return res.status(500).json({ 
      exists: false,
      message: `Error checking file: ${error.message}` 
    });
  }
});

// Catch-all route to serve the React app for any unknown routes
// This must be placed after all API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  // Add some test files to download progress for local testing
  if (process.env.NODE_ENV !== 'production') {
    const testFolder = path.join(SAVE_DIR, 'test_district');
    if (fs.existsSync(testFolder)) {
      fs.readdirSync(testFolder).forEach(file => {
        const filePath = path.join(testFolder, file);
        downloadProgress[file] = {
          path: filePath,
          size: getFileSizeInBytes(filePath),
          complete: true
        };
      });
      console.log(`Added ${Object.keys(downloadProgress).length} test files to download progress tracking`);
    }
  }
});

// Start watching the download folder
watchDownloadFolder(SAVE_DIR);
