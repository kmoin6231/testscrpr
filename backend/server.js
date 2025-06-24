const express = require('express');
const cors = require('cors');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { DateTime } = require('luxon');

const app = express();
const port = process.env.PORT || 5001;

// Configure CORS options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://waqf-scraper-frontend.onrender.com'] 
    : ['http://localhost:3000'],
  optionsSuccessStatus: 200,
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

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
          
          // Generate PDF
          const pdf = await driver.executeScript('return document.documentElement.outerHTML');
          const pdfPath = path.join(saveDir, filename);
          
          // In a real implementation, we would use a PDF generation library like puppeteer
          // For this example, we'll simulate PDF creation with HTML content
          fs.writeFileSync(pdfPath, pdf);
          logMessage(` Saved: ${filename}`, 'SUCCESS');
          
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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
