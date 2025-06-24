// This script updates the download progress tracking for the test files
const fs = require('fs');
const path = require('path');

// Create a folder for test files
const testDir = path.join(__dirname, 'backend', 'pdf_output', 'test_district');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`Created test directory: ${testDir}`);
}

// Create a dummy HTML file with direct links to the test files
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test File Download</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            max-width: 800px;
        }
        h1 {
            color: #333;
        }
        .file-link {
            display: block;
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
            text-decoration: none;
            color: #333;
        }
        .file-link:hover {
            background-color: #e0e0e0;
        }
    </style>
</head>
<body>
    <h1>Test PDF Files for Download</h1>
    <p>
        These links will download the test PDF files directly from the backend server.
        The files should open correctly in Adobe Acrobat Reader.
    </p>
    
    <h2>Individual Files</h2>
    <a class="file-link" href="http://localhost:5001/download-file?folder=test_district&file=test_file_1.pdf">
        Download test_file_1.pdf
    </a>
    <a class="file-link" href="http://localhost:5001/download-file?folder=test_district&file=test_file_2.pdf">
        Download test_file_2.pdf
    </a>
    <a class="file-link" href="http://localhost:5001/download-file?folder=test_district&file=test_file_3.pdf">
        Download test_file_3.pdf
    </a>
    
    <h2>ZIP File</h2>
    <a class="file-link" href="http://localhost:5001/download-zip?folder=test_district">
        Download All Files as ZIP
    </a>
</body>
</html>
`;

// Write the HTML file
const htmlFilePath = path.join(__dirname, 'test-downloads.html');
fs.writeFileSync(htmlFilePath, htmlContent);
console.log(`Created HTML file with direct download links: ${htmlFilePath}`);

console.log('\nTo test the direct downloads:');
console.log('1. Open the HTML file in your browser:');
console.log(`   file://${htmlFilePath.replace(/\\/g, '/')}`);
console.log('2. Click on the links to download the files');
console.log('3. Check if the downloaded files open correctly in Adobe Acrobat');
