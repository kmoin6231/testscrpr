import React, { useState } from 'react';
import { apiService } from '../services/api';
import './DownloadProgress.css';

const DownloadProgress = ({ downloadProgress, folderName }) => {
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  
  if (!downloadProgress || Object.keys(downloadProgress).length === 0) {
    return null;
  }

  // Handle download of a single file with pre-check
  const handleDownloadFile = async (filename) => {
    setDownloadingFile(filename);
    setDownloadError(null);
    
    try {
      // First check if the file exists
      console.log(`Checking if file exists: ${filename} in folder: ${folderName}`);
      const checkResult = await apiService.checkFileExists(folderName, filename);
      
      if (!checkResult.exists) {
        // File doesn't exist
        console.error(`File does not exist: ${filename} in folder: ${folderName}`);
        
        let errorMessage = `Failed to download ${filename}: File not found on server.`;
        
        // Add helpful information if available
        if (checkResult.folderExists && checkResult.folderFiles && checkResult.folderFiles.length > 0) {
          errorMessage += ` Available files: ${checkResult.folderFiles.join(', ')}`;
        } else if (!checkResult.folderExists) {
          errorMessage += ` Folder "${folderName}" does not exist.`;
        }
        
        setDownloadError(errorMessage);
        return;
      }
      
      // File exists, proceed with download
      console.log(`File exists, downloading: ${filename} from folder: ${folderName}`);
      await apiService.downloadFile(folderName, filename);
    } catch (error) {
      console.error(`Error downloading file ${filename}:`, error);
      
      // Provide a more user-friendly error message
      let errorMessage = `Failed to download ${filename}`;
      
      if (error.message.includes('404')) {
        errorMessage += `: File not found on server. The file may not have been generated correctly during scraping.`;
      } else if (error.message.includes('Server error')) {
        errorMessage += `: ${error.message}. Please try again later.`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      setDownloadError(errorMessage);
    } finally {
      setDownloadingFile(null);
    }
  };
  
  // Handle download of all files as ZIP
  const handleDownloadAllAsZip = async () => {
    setDownloadingFile('all-zip');
    setDownloadError(null);
    
    try {
      await apiService.downloadZipFile(folderName);
    } catch (error) {
      console.error(`Error downloading ZIP:`, error);
      setDownloadError(`Failed to download ZIP file: ${error.message}`);
    } finally {
      setDownloadingFile(null);
    }
  };
  
  const totalFiles = Object.keys(downloadProgress).length;
  const completedFiles = Object.values(downloadProgress).filter(file => file.complete).length;
  const totalSize = Object.values(downloadProgress).reduce((total, file) => total + file.size, 0);
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate completion percentage
  const completionPercentage = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
  
  return (
    <div className="download-progress">
      <h3>Download Progress</h3>
        <div className="progress-summary">
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="progress-stats">
          <span>{completionPercentage}% complete</span>
          <span>{completedFiles} of {totalFiles} files</span>
          <span>Total size: {formatFileSize(totalSize)}</span>
        </div>
        {completedFiles > 0 && (
          <button 
            className="download-all-button" 
            onClick={handleDownloadAllAsZip}
            disabled={downloadingFile === 'all-zip'}
          >
            {downloadingFile === 'all-zip' ? 'Preparing ZIP...' : 'Download All as ZIP'}
          </button>
        )}
      </div>
      
      {downloadError && (
        <div className="download-error">
          {downloadError}
          <button onClick={() => setDownloadError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="file-list">
        <h4>Files ({totalFiles})</h4>
        <div className="file-list-container">
          {Object.entries(downloadProgress).map(([filename, fileInfo]) => (
            <div key={filename} className={`file-item ${fileInfo.complete ? 'complete' : 'downloading'}`}>
              <div className="file-info">
                <div className="file-name">{filename}</div>
                <div className="file-size">{formatFileSize(fileInfo.size)}</div>
                <div className="file-status">{fileInfo.complete ? 'Complete' : 'Downloading...'}</div>
              </div>
              {fileInfo.complete && (
                <button 
                  className="download-button"
                  onClick={() => handleDownloadFile(filename)}
                  disabled={downloadingFile === filename}
                >
                  {downloadingFile === filename ? 'Downloading...' : 'Download'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DownloadProgress;
