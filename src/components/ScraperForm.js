import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import './ScraperForm.css';
import Spinner from './Spinner';
import Tooltip from './Tooltip';
import HelpIcon from './HelpIcon';
import ConfirmDialog from './ConfirmDialog';
import DownloadProgress from './DownloadProgress';
import TestResults from './TestResults';

const ScraperForm = () => {
  // State variables
  const [loginUrl, setLoginUrl] = useState('');
  const [tableUrls, setTableUrls] = useState('');
  const [folderName, setFolderName] = useState('');
  const [startIndex, setStartIndex] = useState('');
  const [lastIndex, setLastIndex] = useState('');
  const [logs, setLogs] = useState('No logs yet. Start scraping to see real-time updates here.');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('darkMode') === 'on'
  );
  const [zipAvailable, setZipAvailable] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [downloadProgress, setDownloadProgress] = useState({});
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [checkingServer, setCheckingServer] = useState(false);
  
  // Refs
  const statusRef = useRef(null);
  const eventSourceRef = useRef(null);
  
  // Check server connectivity on load and periodically
  useEffect(() => {
    const checkServerConnection = async () => {
      setCheckingServer(true);
      const isOnline = await apiService.checkServerStatus();
      setServerOnline(isOnline);
      setCheckingServer(false);
      
      if (!isOnline) {
        setError('Server appears to be offline or slow to respond. Retrying connection...');
      } else if (error.includes('Server appears to be offline')) {
        setError(''); // Clear error when server comes back online
      }
    };
    
    // Check immediately on load
    checkServerConnection();
    
    // Then check every 30 seconds
    const interval = setInterval(checkServerConnection, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [error]);
  
  // Effect for dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode ? 'on' : 'off');
  }, [isDarkMode]);
  
  // Effect for auto-scrolling logs
  useEffect(() => {
    if (statusRef.current) {
      statusRef.current.scrollTop = statusRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Effect for polling download progress
  useEffect(() => {
    let progressInterval = null;
    
    if (isLoading) {
      // Start polling for download progress
      setShowDownloadProgress(true);
      progressInterval = setInterval(async () => {
        try {
          const progressData = await apiService.getDownloadProgress();
          setDownloadProgress(progressData.downloadProgress || {});
          
          // If no more files are being downloaded, slow down polling
          if (progressData.completedFiles === progressData.totalFiles && progressData.totalFiles > 0) {
            clearInterval(progressInterval);
            progressInterval = setInterval(async () => {
              const refreshData = await apiService.getDownloadProgress();
              setDownloadProgress(refreshData.downloadProgress || {});
            }, 5000); // Check every 5 seconds for new files
          }
        } catch (error) {
          console.error('Error fetching download progress:', error);
        }
      }, 1000); // Poll every second initially
    } else if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isLoading]);
  
  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs('No logs yet. Start scraping to see real-time updates here.');
  };
  
  // Load example data
  const loadExampleData = () => {
    setLoginUrl('https://example.com/login');
    setTableUrls('https://example.com/table1\nhttps://example.com/table2');
    setFolderName('Example_District');
    setStartIndex('1');
    setLastIndex('10');
  };
    // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');
    
    // Check server status first
    setStatusMessage('Checking server connection...');
    setShowSpinner(true);
    const isOnline = await apiService.checkServerStatus();
    
    if (!isOnline) {
      setError('Cannot connect to server. Please try again later or contact support.');
      setShowSpinner(false);
      return;
    }
    
    // Validate form inputs
    if (!loginUrl || !tableUrls || !folderName) {
      setError('Please fill in all required fields');
      setShowSpinner(false);
      return;
    }
    
    // Format table URLs
    const formattedTableUrls = tableUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url);
      
    if (formattedTableUrls.length === 0) {
      setError('Please enter at least one valid table URL');
      setShowSpinner(false);
      return;
    }
    
    // Set up loading state
    setIsLoading(true);
    setStatusMessage('Starting scraping process...');
    setLogs('Starting...');
    setZipAvailable(false);
    
    // Set up event source for real-time logs
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    eventSourceRef.current = apiService.getEventSource();
    
    if (eventSourceRef.current) {
      eventSourceRef.current.onmessage = (event) => {
        const msg = event.data;
        setLogs(prevLogs => {
          if (prevLogs === 'No logs yet. Start scraping to see real-time updates here.') {
            return msg;
          }
          return prevLogs + '\n' + msg;
        });
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error('EventSource error:', error);
        setLogs(prevLogs => prevLogs + '\nLost connection to server log stream. Will continue in background.');
      };
    } else {
      setLogs(prevLogs => prevLogs + '\nYour browser doesn\'t support real-time logging or the server is unavailable.');
    }
    
    try {
      // Start scraping
      const data = {
        loginUrl,
        urls: formattedTableUrls,
        folderName,
        startIndex: startIndex ? parseInt(startIndex) : undefined,
        lastIndex: lastIndex ? parseInt(lastIndex) : undefined
      };
      
      const response = await apiService.startScraping(data);
      setLogs(prevLogs => prevLogs + '\n' + response.message);
      setZipAvailable(true);
      setStatusMessage('Scraping completed successfully!');
    } catch (error) {
      setError(`Error: ${error.message || 'An unknown error occurred'}`);
      setLogs(prevLogs => prevLogs + '\n' + `Error: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setIsLoading(false);
      setShowSpinner(false);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
    // Handle testing of scraping configuration
  const handleTestConfiguration = async (e) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');
    setTestResults(null);
    
    // Check server status first
    setStatusMessage('Checking server connection...');
    setShowSpinner(true);
    const isOnline = await apiService.checkServerStatus();
    
    if (!isOnline) {
      setError('Cannot connect to server. Please try again later or contact support.');
      setShowSpinner(false);
      return;
    }
    
    // Validate form inputs
    if (!loginUrl || !tableUrls || !folderName) {
      setError('Please fill in all required fields to test the configuration');
      setShowSpinner(false);
      return;
    }
    
    // Format table URLs
    const formattedTableUrls = tableUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url);
      
    if (formattedTableUrls.length === 0) {
      setError('Please enter at least one valid table URL');
      setShowSpinner(false);
      return;
    }
    
    // Show loading state
    setIsTesting(true);
    setStatusMessage('Testing your configuration...');
    
    try {
      // Test configuration
      const data = {
        loginUrl,
        urls: formattedTableUrls,
        folderName
      };
      
      const response = await apiService.testScraping(data);
      setTestResults(response);
      setStatusMessage('Testing completed');
      
      // Add test results to logs
      setLogs(prevLogs => {
        const initialLog = prevLogs === 'No logs yet. Start scraping to see real-time updates here.' ? '' : prevLogs + '\n';
        return initialLog + `
--- Configuration Test Results ---
Login URL: ${response.loginTest?.success ? 'Accessible ✓' : 'Not Accessible ✗'}
Table URL: ${response.tableTest?.success ? 'Accessible ✓' : 'Not Accessible ✗'}
${response.tableTest?.hasRows !== undefined ? `Table Rows: ${response.tableTest.hasRows ? 'Detected ✓' : 'Not Detected ⚠️'}` : ''}
Overall: ${response.success ? 'PASSED ✓' : 'FAILED ✗'}
`;
      });
      
    } catch (error) {
      setError(`Test failed: ${error.message || 'An unknown error occurred'}`);
      setLogs(prevLogs => {
        const initialLog = prevLogs === 'No logs yet. Start scraping to see real-time updates here.' ? '' : prevLogs + '\n';
        return initialLog + `Test failed: ${error.message || 'An unknown error occurred'}`;
      });
    } finally {
      setIsTesting(false);
      setShowSpinner(false);
    }
  };
  
  // Handle abort scraping
  const confirmAbort = () => {
    setConfirmMessage('Are you sure you want to abort the current scraping operation? This cannot be undone.');
    setConfirmAction('abort');
    setShowConfirmDialog(true);
  };
  
  const handleAbort = async () => {
    try {
      setShowSpinner(true);
      setStatusMessage('Aborting operation...');
      setLogs(prevLogs => prevLogs + '\nAborting operation...');
      const response = await apiService.abortScraping();
      setLogs(prevLogs => prevLogs + '\n' + response.message);
      setStatusMessage('Operation aborted');
    } catch (error) {
      setError(`Error during abort: ${error.message || 'An unknown error occurred'}`);
      setLogs(prevLogs => prevLogs + '\n' + `Error during abort: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setShowSpinner(false);
    }
  };
    // Handle creating zip file
  const confirmCreateZip = () => {
    if (!folderName) {
      setError('Please enter a District Name first.');
      setLogs(prevLogs => prevLogs + '\nPlease enter a District Name first.');
      return;
    }
    
    setConfirmMessage(`Are you sure you want to create a ZIP file for the folder "${folderName}"?`);
    setConfirmAction('createZip');
    setShowConfirmDialog(true);
  };
  
  const handleCreateZip = async () => {
    try {
      setShowSpinner(true);
      setStatusMessage('Creating ZIP file...');
      setLogs(prevLogs => prevLogs + '\nCreating ZIP file...');
      
      // First create the ZIP file on the server
      const result = await apiService.createZip(folderName);
      setLogs(prevLogs => prevLogs + '\n' + result.message);
      
      // Then download it to the user's system
      setStatusMessage('Downloading ZIP file...');
      setLogs(prevLogs => prevLogs + '\nDownloading ZIP file...');
      await apiService.downloadZipFile(folderName);
      
      setStatusMessage('ZIP file downloaded successfully!');
      setLogs(prevLogs => prevLogs + '\nZIP file downloaded successfully!');
    } catch (error) {
      setError(`Error with ZIP: ${error.message || 'An unknown error occurred'}`);
      setLogs(prevLogs => prevLogs + '\n' + `Error with ZIP: ${error.message || 'An unknown error occurred'}`);
    } finally {
      setShowSpinner(false);
    }
  };
  
  // Handle confirm dialog actions
  const handleConfirmAction = () => {
    setShowConfirmDialog(false);
    
    if (confirmAction === 'abort') {
      handleAbort();
    } else if (confirmAction === 'createZip') {
      handleCreateZip();
    }
  };
  
  // Handle cancel confirm dialog
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };
  
  return (
    <div className="card">
      {showSpinner && <Spinner message={statusMessage} />}
      <ConfirmDialog 
        isOpen={showConfirmDialog}
        message={confirmMessage}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />
      
      <button 
        className="dark-toggle" 
        onClick={toggleDarkMode} 
        title="Toggle dark mode" 
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg id="iconMoon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 0 1 12.21 3a7 7 0 1 0 8.79 9.79z"/>
          </svg>
        ) : (
          <svg id="iconSun" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5"/>
            <g>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </g>
          </svg>
        )}
      </button>
      
      <h1>Document Scraper</h1>
      {error && <div className="error-banner">{error}</div>}
      
      {/* Server Status Indicator */}
      <div className={`server-status ${serverOnline ? 'online' : 'offline'} ${checkingServer ? 'checking' : ''}`}>
        <span className="status-indicator"></span>
        <span className="status-text">
          {checkingServer 
            ? 'Checking server connection...' 
            : (serverOnline ? 'Server online' : 'Server offline or responding slowly')}
        </span>
      </div>
      
      <form onSubmit={handleSubmit}>
        <label htmlFor="loginUrl">
          Login URL
          <Tooltip text="Enter the URL of the login page for the Waqf database. The application will navigate to this page first.">
            <HelpIcon />
          </Tooltip>
        </label>
        <input 
          type="text" 
          id="loginUrl" 
          placeholder="https://..." 
          value={loginUrl}
          onChange={(e) => setLoginUrl(e.target.value)}
          required 
        />
        
        <label htmlFor="tableUrls">
          Table URLs 
          <span style={{fontWeight: '400', fontSize: '0.95em'}}>(one per line)</span>
          <Tooltip text="Enter the URLs of the tables containing the documents you want to scrape. Each URL should be on a separate line.">
            <HelpIcon />
          </Tooltip>
        </label>
        <textarea 
          id="tableUrls" 
          placeholder="Paste table URLs here, one per line" 
          value={tableUrls}
          onChange={(e) => setTableUrls(e.target.value)}
          required 
        />
        
        <label htmlFor="folderName">
          District Name
          <Tooltip text="Enter a name for the folder where the scraped PDFs will be saved. This is typically the district name.">
            <HelpIcon />
          </Tooltip>
        </label>
        <input 
          type="text" 
          id="folderName" 
          placeholder="e.g. Mumbai" 
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required 
        />
        
        <div className="input-row">
          <div>
            <label htmlFor="startIndex">
              Start Index 
              <span style={{fontWeight: '400', fontSize: '0.95em'}}>(optional)</span>
              <Tooltip text="The row number to start scraping from (1-based). If left empty, scraping starts from the first row.">
                <HelpIcon />
              </Tooltip>
            </label>
            <input 
              type="number" 
              id="startIndex" 
              placeholder="e.g. 1" 
              value={startIndex}
              onChange={(e) => setStartIndex(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lastIndex">
              Last Index 
              <span style={{fontWeight: '400', fontSize: '0.95em'}}>(optional)</span>
              <Tooltip text="The row number to end scraping at (inclusive). If left empty, scraping continues to the last row.">
                <HelpIcon />
              </Tooltip>
            </label>
            <input 
              type="number" 
              id="lastIndex" 
              placeholder="e.g. 100" 
              value={lastIndex}
              onChange={(e) => setLastIndex(e.target.value)}
            />
          </div>
        </div>
          <div className="button-container">
          <div className="main-buttons">
            <button 
              type="submit" 
              disabled={isLoading || isTesting} 
              className={isLoading ? 'loading-button' : ''}
            >
              {isLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Processing...
                </>
              ) : 'Start Scraping'}
            </button>
            <button 
              type="button" 
              onClick={handleTestConfiguration}
              disabled={isLoading || isTesting}
              className={isTesting ? 'loading-button' : 'test-button'}
            >
              {isTesting ? (
                <>
                  <span className="button-spinner"></span>
                  Testing...
                </>
              ) : 'Test Configuration'}
            </button>
            <button 
              type="button" 
              id="abortButton" 
              onClick={confirmAbort}
              disabled={!isLoading}
            >
              Abort
            </button>
          </div>
          <div className="button-row">
            <button 
              type="button" 
              id="createZipButton" 
              onClick={confirmCreateZip}
              disabled={!zipAvailable}
              title={!zipAvailable ? 'First complete a scraping operation' : 'Create a ZIP file of scraped documents'}
            >
              Create ZIP File
            </button>
            <button 
              type="button" 
              id="submitDataButton" 
              onClick={() => window.open('https://forms.gle/N9J2ci1xDjNTk3ZWA', '_blank')}
            >
              Submit Data
            </button>
          </div>
        </div>
      </form>
      
      <div className="test-configuration">
        <h2>Test Scraping Configuration</h2>
        <button 
          type="button" 
          onClick={handleTestConfiguration}
          disabled={isTesting}
          className={isTesting ? 'loading-button' : ''}
        >
          {isTesting ? (
            <>
              <span className="button-spinner"></span>
              Testing...
            </>
          ) : 'Test Configuration'}
        </button>
        
        {testResults && (
          <div className="test-results">
            <h3>Test Results</h3>
            <pre>{JSON.stringify(testResults, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <div 
        id="status" 
        ref={statusRef}
        className={logs.includes('[ERROR]') ? 'error' : ''}
      >
        {logs.split('\n').map((line, index) => {
          let className = '';
          let content = line;
          
          if (line.startsWith('[ERROR]')) {
            className = 'log-error';
            content = line.replace(/^\[ERROR\]\s*/, '');
          } else if (line.startsWith('[WARNING]')) {
            className = 'log-warning';
            content = line.replace(/^\[WARNING\]\s*/, '');
          } else if (line.includes('Success')) {
            className = 'log-success';
          }
          
          return (
            <div key={index} className={className}>
              {content}
            </div>
          );
        })}      </div>
      
      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          message={confirmMessage}
          onConfirm={() => {
            setShowConfirmDialog(false);
            if (confirmAction === 'abort') {
              handleAbort();
            } else if (confirmAction === 'createZip') {
              handleCreateZip();
            }
          }}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}
      
      {/* Test Results Dialog */}
      {testResults && (
        <TestResults
          testResults={testResults}
          onClose={() => setTestResults(null)}
        />
      )}
        {/* Download Progress Display */}
      {showDownloadProgress && Object.keys(downloadProgress).length > 0 && (
        <DownloadProgress 
          downloadProgress={downloadProgress} 
          folderName={folderName} 
        />
      )}
      
      <div className="log-controls">        <button type="button" onClick={clearLogs} className="control-button">
          Clear Logs
        </button>
        <button type="button" onClick={loadExampleData} className="control-button">
          Load Example Data
        </button>
        <button 
          type="button" 
          onClick={() => setShowDownloadProgress(!showDownloadProgress)} 
          className="control-button"
          disabled={Object.keys(downloadProgress).length === 0}
        >
          {showDownloadProgress ? 'Hide Download Progress' : 'Show Download Progress'}
        </button>
      </div>
    </div>
  );
};

export default ScraperForm;
