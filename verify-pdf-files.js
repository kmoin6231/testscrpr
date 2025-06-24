// This script verifies the PDF files in the backend directory
const fs = require('fs');
const path = require('path');

// Function to check if a file is likely a valid PDF
function isProbablyValidPDF(filePath) {
  try {
    // Read the first few bytes of the file
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    
    // Check for the PDF magic number: %PDF-
    const magicNumber = buffer.toString('ascii', 0, 5);
    const isValid = magicNumber === '%PDF-';
    
    return {
      isValid,
      magicNumber,
      filePath
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      filePath
    };
  }
}

// Function to recursively check PDF files in a directory
function checkPDFsInDirectory(dir) {
  console.log(`Checking PDFs in directory: ${dir}`);
  const results = {
    valid: [],
    invalid: []
  };
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Recursively check subdirectories
      const subResults = checkPDFsInDirectory(itemPath);
      results.valid = [...results.valid, ...subResults.valid];
      results.invalid = [...results.invalid, ...subResults.invalid];
    } else if (item.name.toLowerCase().endsWith('.pdf')) {
      // Check if the PDF file is valid
      const checkResult = isProbablyValidPDF(itemPath);
      
      if (checkResult.isValid) {
        results.valid.push(itemPath);
      } else {
        results.invalid.push({
          path: itemPath,
          reason: checkResult.error || `Invalid magic number: ${checkResult.magicNumber}`
        });
      }
    }
  }
  
  return results;
}

// Main function to check all PDFs in the output directory
function checkAllPDFs() {
  const pdfOutputDir = path.join(__dirname, 'backend', 'pdf_output');
  
  if (!fs.existsSync(pdfOutputDir)) {
    console.error(`PDF output directory does not exist: ${pdfOutputDir}`);
    return;
  }
  
  const results = checkPDFsInDirectory(pdfOutputDir);
  
  console.log('\n===== PDF Validation Results =====');
  console.log(`Valid PDFs: ${results.valid.length}`);
  for (const validPath of results.valid) {
    console.log(`✅ ${path.relative(__dirname, validPath)}`);
  }
  
  console.log(`\nInvalid PDFs: ${results.invalid.length}`);
  for (const invalid of results.invalid) {
    console.log(`❌ ${path.relative(__dirname, invalid.path)}: ${invalid.reason}`);
  }
  
  console.log('\n=================================');
  
  return results;
}

// Run the check
checkAllPDFs();
