// This script updates the downloadProgress object in the backend server
// with our test files without requiring a server restart

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Create test files
const testDir = path.join(__dirname, 'backend', 'pdf_output', 'test_district');

// Create directory if it doesn't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`Created test directory: ${testDir}`);
}

// Create test files
for (let i = 1; i <= 3; i++) {
  const filePath = path.join(testDir, `test_file_${i}.pdf`);
  fs.writeFileSync(filePath, `This is test PDF file ${i} content.`);
  console.log(`Created test file: ${filePath}`);
}

// Manually check the download endpoint to verify
axios.get('http://localhost:5001/download-progress')
  .then(response => {
    console.log('Current download progress data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Output instructions
    console.log('\n-----------------------------');
    console.log('TEST ENVIRONMENT READY');
    console.log('-----------------------------');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Fill in the form with:');
    console.log('   - Login URL: https://example.com/login');
    console.log('   - Table URLs: https://example.com/table1');
    console.log('   - District Name: test_district');
    console.log('3. Click "Test Configuration" to avoid actual scraping');
    console.log('4. Click the "Show Download Progress" button to see test files');
    console.log('5. Try downloading files and check your Downloads folder');
    console.log('-----------------------------');
  })
  .catch(error => {
    console.error('Error querying download progress:', error.message);
  });
