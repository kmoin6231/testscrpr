// This script converts invalid HTML PDFs to valid PDFs
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Function to convert HTML content saved as PDF to proper PDF
function convertHTMLToPDF(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      // Check if file exists
      if (!fs.existsSync(inputPath)) {
        reject(new Error(`Input file not found: ${inputPath}`));
        return;
      }
      
      // Read HTML content from file
      const htmlContent = fs.readFileSync(inputPath, 'utf-8');
      
      // Create a PDF document
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      
      // Pipe the PDF to the file
      doc.pipe(stream);
      
      // Add content to the PDF
      doc.fontSize(16).text('Converted Document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Converted on: ${new Date().toLocaleString()}`);
      doc.fontSize(12).text(`Original file: ${path.basename(inputPath)}`);
      doc.moveDown();
      
      // Add content from the HTML
      doc.fontSize(10).text('Document content from web page:', { underline: true });
      doc.moveDown();
      
      // Extract text content from HTML
      const textContent = htmlContent.replace(/<[^>]*>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();
      
      // Add the content to the PDF (limited to avoid huge files)
      doc.text(textContent.substring(0, 2000) + '...');
      
      // Finalize the PDF and end the stream
      doc.end();
      
      // Wait for the stream to finish
      stream.on('finish', () => {
        console.log(`Successfully converted ${inputPath} to PDF at ${outputPath}`);
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Function to check if a file is likely a valid PDF
function isProbablyValidPDF(filePath) {
  try {
    // Read the first few bytes of the file
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    
    // Check for the PDF magic number: %PDF-
    return buffer.toString('ascii', 0, 5) === '%PDF-';
  } catch (error) {
    return false;
  }
}

// Function to convert all invalid PDFs in a directory
async function convertInvalidPDFs(directory) {
  console.log(`Checking for invalid PDFs in ${directory}...`);
  
  // Get all files in the directory
  const files = fs.readdirSync(directory);
  let convertedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    
    // Skip directories and non-PDF files
    if (fs.statSync(filePath).isDirectory() || !file.toLowerCase().endsWith('.pdf')) {
      continue;
    }
    
    // Check if the file is a valid PDF
    if (!isProbablyValidPDF(filePath)) {
      console.log(`Found invalid PDF: ${filePath}`);
      
      // Create a backup of the original file
      const backupPath = `${filePath}.bak`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`Created backup at ${backupPath}`);
      
      // Convert the file to a proper PDF
      try {
        await convertHTMLToPDF(filePath, `${filePath}.temp`);
        
        // Replace the original file with the converted one
        fs.unlinkSync(filePath);
        fs.renameSync(`${filePath}.temp`, filePath);
        
        convertedCount++;
        console.log(`Converted and replaced: ${filePath}`);
      } catch (error) {
        console.error(`Error converting ${filePath}: ${error.message}`);
      }
    }
  }
  
  return convertedCount;
}

// Main function
async function main() {
  const pdfOutputDir = path.join(__dirname, 'backend', 'pdf_output');
  
  if (!fs.existsSync(pdfOutputDir)) {
    console.error(`PDF output directory does not exist: ${pdfOutputDir}`);
    return;
  }
  
  // Process the main directory
  let totalConverted = await convertInvalidPDFs(pdfOutputDir);
  
  // Process subdirectories
  const subDirs = fs.readdirSync(pdfOutputDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => path.join(pdfOutputDir, dirent.name));
  
  for (const subDir of subDirs) {
    totalConverted += await convertInvalidPDFs(subDir);
  }
  
  console.log(`\nConversion complete. Total files converted: ${totalConverted}`);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error.message);
});
