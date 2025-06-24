import React from 'react';
import './ConfirmDialog.css';
import './TestResults.css';

const TestResults = ({ testResults, onClose }) => {
  if (!testResults) return null;
  
  const { success, loginTest, tableTest, folderTest, message } = testResults;
  
  // Helper function to render status icon
  const StatusIcon = ({ success }) => (
    <span className={`status-icon ${success ? 'success' : 'failure'}`}>
      {success ? '✓' : '✗'}
    </span>
  );
  
  return (
    <div className="modal-backdrop">
      <div className="modal-content test-results">
        <div className="modal-header">
          <h2>Configuration Test Results</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!success ? (
            <div className="test-error">
              <h3>Test Failed</h3>
              <p>{message}</p>
            </div>
          ) : (
            <div className="test-sections">
              <div className="test-section">
                <h3>
                  <StatusIcon success={loginTest.success} />
                  Login URL Test
                </h3>
                <div className="test-details">
                  <p><strong>Status:</strong> {loginTest.success ? 'Accessible' : 'Not Accessible'}</p>
                  <p><strong>Page Title:</strong> {loginTest.title}</p>
                  <p><strong>Login Form Detected:</strong> {loginTest.isLoginPage ? 'Yes' : 'No'}</p>
                  {!loginTest.isLoginPage && (
                    <p className="warning-text">
                      Warning: This page doesn't appear to be a login page. Please verify the URL.
                    </p>
                  )}
                </div>
              </div>
              
              {tableTest && (
                <div className="test-section">
                  <h3>
                    <StatusIcon success={tableTest.success} />
                    Table URL Test
                  </h3>
                  <div className="test-details">
                    <p><strong>Status:</strong> {tableTest.success ? 'Accessible' : 'Not Accessible'}</p>
                    {tableTest.success && (
                      <>
                        <p><strong>Table Rows Detected:</strong> {tableTest.hasRows ? 'Yes' : 'No'}</p>
                        {!tableTest.hasRows && (
                          <p className="warning-text">
                            Warning: No table rows detected. Please verify the URL.
                          </p>
                        )}
                      </>
                    )}
                    <p>{tableTest.message}</p>
                  </div>
                </div>
              )}
              
              <div className="test-section">
                <h3>
                  <StatusIcon success={folderTest.success} />
                  Output Folder Test
                </h3>
                <div className="test-details">
                  <p>{folderTest.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <div className="overall-result">
            <strong>Overall Result:</strong> 
            <span className={`result-text ${success ? 'success' : 'failure'}`}>
              {success ? 'PASSED' : 'FAILED'}
            </span>
          </div>
          
          <div className="buttons">
            <button 
              className="primary-button" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
