import React from 'react';
import './DownloadProgress.css';

const DownloadProgress = ({ downloadProgress }) => {
  if (!downloadProgress || Object.keys(downloadProgress).length === 0) {
    return null;
  }

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
      </div>
      
      <div className="file-list">
        <h4>Files ({totalFiles})</h4>
        <div className="file-list-container">
          {Object.entries(downloadProgress).map(([filename, fileInfo]) => (
            <div key={filename} className={`file-item ${fileInfo.complete ? 'complete' : 'downloading'}`}>
              <div className="file-name">{filename}</div>
              <div className="file-size">{formatFileSize(fileInfo.size)}</div>
              <div className="file-status">{fileInfo.complete ? 'Complete' : 'Downloading...'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DownloadProgress;
