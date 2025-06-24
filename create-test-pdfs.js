// This script creates proper PDF files for testing
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Create the test directory if it doesn't exist
const testDir = path.join(__dirname, 'backend', 'pdf_output', 'test_district');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`Created test directory: ${testDir}`);
}

// Function to create a sample PDF file
function createSamplePDF(filePath, title, content) {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      
      // Pipe the PDF to the file
      doc.pipe(stream);
      
      // Add content to the PDF
      doc.fontSize(25).text(title, 100, 100);
      doc.moveDown();
      doc.fontSize(12).text(content);
      
      // Add some additional content to make it more realistic
      doc.moveDown();
      doc.fontSize(14).text('Document Information', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
      doc.moveDown();
      doc.text(`File path: ${filePath}`);
      
      // Add a table-like structure
      doc.moveDown(2);
      doc.fontSize(14).text('Sample Data', { underline: true });
      doc.moveDown();
      
      const tableData = [
        ['ID', 'Name', 'Value'],
        ['001', 'Example 1', '$100'],
        ['002', 'Example 2', '$200'],
        ['003', 'Example 3', '$300']
      ];
      
      let y = doc.y + 10;
      let x = 100;
      
      // Draw headers
      tableData[0].forEach((header, i) => {
        doc.fontSize(12).text(header, x + (i * 100), y);
      });
      
      y += 20;
      
      // Draw rows
      for (let i = 1; i < tableData.length; i++) {
        tableData[i].forEach((cell, j) => {
          doc.fontSize(10).text(cell, x + (j * 100), y);
        });
        y += 20;
      }
      
      // Finalize the PDF and end the stream
      doc.end();
      
      stream.on('finish', () => {
        console.log(`Created PDF file: ${filePath}`);
        resolve();
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Create 3 sample PDF files
async function createTestPDFs() {
  try {
    await createSamplePDF(
      path.join(testDir, 'test_file_1.pdf'),
      'Test Document 1',
      'This is a test PDF file that should open correctly in Adobe Acrobat Reader.'
    );
    
    await createSamplePDF(
      path.join(testDir, 'test_file_2.pdf'),
      'Test Document 2',
      'This is another test PDF file with different content.'
    );
    
    await createSamplePDF(
      path.join(testDir, 'test_file_3.pdf'),
      'Test Document 3',
      'This is the third test PDF file with yet another different content.'
    );
    
    console.log('All test PDF files created successfully!');
    console.log('\nTo test the download functionality:');
    console.log('1. Open the app at http://localhost:3000');
    console.log('2. Enter "test_district" as the District Name');
    console.log('3. Click "Show Download Progress" at the bottom');
    console.log('4. Try downloading individual files or the ZIP file');
    console.log('5. Check your Downloads folder for the downloaded files');
  } catch (err) {
    console.error('Error creating PDF files:', err);
  }
}

// Run the function
createTestPDFs();
