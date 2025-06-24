const fetch = require('node-fetch');

async function startScraping() {
  try {
    console.log('Starting scraping operation...');
    
    // First, check if there's an active scraping operation
    const statusResponse = await fetch('http://localhost:5001/scraping-status');
    const statusData = await statusResponse.json();
    
    if (statusData.isScrapingActive) {
      console.log('A scraping operation is already in progress. Attempting to reset...');
      
      // Reset the scraping operation
      const resetResponse = await fetch('http://localhost:5001/reset-scraping?clearLogs=true', {
        method: 'POST'
      });
      const resetData = await resetResponse.json();
      console.log('Reset result:', resetData.message);
      
      // Wait a moment to ensure the reset is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Prepare the scraping data
    const scrapeData = {
      loginUrl: 'https://wamsi.nic.in/wamsi/LoginAction.do?statecode=27',
      urls: ['https://wamsi.nic.in/wamsi/WaqfPropLocationSumaction.do?opt=immProp&prop_stuts=Al&st=MH&prop_is=AL&type=atype&dst=499&tal=Select%20Sub-District&vill=Select%20Village'],
      folderName: 'wamsi_data',
      startIndex: '1',
      lastIndex: '5'  // Only scrape 5 items for testing
    };
    
    // Start the scraping operation with force parameter to ensure it starts
    const response = await fetch('http://localhost:5001/scrape?force=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scrapeData)
    });
    
    const data = await response.json();
    console.log('Scraping response:', data);
    
    // Poll for scraping status
    let isActive = true;
    console.log('Polling for scraping status...');
    
    while (isActive) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusCheckResponse = await fetch('http://localhost:5001/scraping-status');
      const statusCheckData = await statusCheckResponse.json();
      
      isActive = statusCheckData.isScrapingActive;
      console.log(`Scraping active: ${isActive}`);
      
      if (statusCheckData.logs && statusCheckData.logs.length > 0) {
        console.log('Recent log:', statusCheckData.logs[statusCheckData.logs.length - 1]);
      }
    }
    
    console.log('Scraping operation completed.');
    
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

startScraping();
