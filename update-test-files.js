// This script updates the test files in the download progress tracking
// by manually adding them to the state via API calls

const axios = require('axios');

// Mark test files as complete using our special endpoint
axios.get('http://localhost:5001/mark-test-files-complete')
  .then(response => {
    console.log('Test files update response:');
    console.log(response.data);
    
    // Get current download progress
    return axios.get('http://localhost:5001/download-progress');
  })
  .then(response => {
    console.log('\nCurrent download progress:');
    console.log(`Total files: ${response.data.totalFiles}`);
    console.log(`Completed files: ${response.data.completedFiles}`);
    
    console.log('\nTo test the download functionality:');
    console.log('1. Open the app at http://localhost:3000');
    console.log('2. Enter "test_district" as the District Name');
    console.log('3. Click "Show Download Progress" at the bottom');
    console.log('4. Try downloading individual files or the ZIP file');
    console.log('5. Check your Downloads folder for the downloaded files');
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
