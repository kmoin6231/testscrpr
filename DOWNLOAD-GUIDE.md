# How to Download Files from Waqf Scraper

There are several ways to download files from the Waqf Scraper application. This guide will explain the different methods.

## Method 1: Using the Web Interface

The easiest way to download files is through the web interface:

1. Open your browser and go to http://localhost:5001 (or your deployed URL)
2. Log in if necessary
3. Perform a scraping operation
4. When complete, click the "Download File" or "Download ZIP" buttons
5. Files will be saved to your browser's default download location (usually the Downloads folder)

## Method 2: Using the Test Downloads Page

For testing and direct access to files:

1. Open your browser and go to http://localhost:5001/test-downloads.html
2. Click on any of the file links
3. Files will be saved to your browser's default download location

## Method 3: Using the PowerShell Script

For a command-line approach:

1. Open PowerShell in the project directory
2. Run the script: `.\Download-Waqf-Files.ps1`
3. Choose the option for the file you want to download
4. Files will be saved to your Downloads folder

## Method 4: Using Direct API Calls

For advanced users:

### Download a Single File
```powershell
Invoke-WebRequest -Uri "http://localhost:5001/download-file?folder=wamsi_data&file=1_MH000013_MQ001.pdf" -OutFile "$env:USERPROFILE\Downloads\wamsi_file.pdf"
```

### Download a ZIP File
```powershell
Invoke-WebRequest -Uri "http://localhost:5001/download-zip?folder=wamsi_data" -OutFile "$env:USERPROFILE\Downloads\wamsi_data.zip"
```

## Troubleshooting

### Files Downloading to Wrong Location

If files are downloading to the backend directory instead of your Downloads folder:

1. Make sure you're using the web interface or PowerShell script
2. When using PowerShell commands, always specify the full path using `$env:USERPROFILE\Downloads\filename.pdf`
3. Check your browser's download settings

### File Not Found Errors

If you get "File not found" errors:

1. Make sure the server is running
2. Verify that the file exists by checking the `/backend/pdf_output/` directory
3. Ensure you're using the correct folder and file names

### ZIP File Issues

If ZIP files aren't downloading correctly:

1. Try downloading individual files instead
2. Use the PowerShell script's ZIP download option
3. Check if the folder exists and contains files
