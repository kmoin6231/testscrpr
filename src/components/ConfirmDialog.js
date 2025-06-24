import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <h3>Confirmation</h3>
        <p>{message}</p>
        <div className="confirm-buttons">
          <button onClick={onCancel} className="cancel-button">Cancel</button>
          <button onClick={onConfirm} className="confirm-button">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
