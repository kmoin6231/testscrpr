import React from 'react';
import './Spinner.css';

const Spinner = ({ message = 'Processing...' }) => {
  return (
    <div className="spinner-overlay">
      <div className="spinner"></div>
      <p className="spinner-text">{message}</p>
    </div>
  );
};

export default Spinner;
