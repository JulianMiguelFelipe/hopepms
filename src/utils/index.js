import React from 'react';

export const ProductFormModal = ({ isOpen, operationMode, selectedRecord, onDismiss, onApplySave }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-canvas-frame">
      <div className="modal-body-wrapper">
        <h3>{operationMode === 'ADD' ? 'Log New Stock Resource' : 'Modify Record Parameters'}</h3>
        <input type="text" defaultValue={selectedRecord?.name} id="form-field-name" placeholder="Item Label Name" />
        <input type="number" defaultValue={selectedRecord?.price} id="form-field-price" placeholder="Retail Value Cost" />
        <button onClick={() => onApplySave({ name: document.getElementById('form-field-name').value })}>Execute Write</button>
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  );
};

export const SoftDeleteConfirmDialog = ({ isOpen, targetItemName, onConfirmSoftDelete, onDismiss }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-danger-zone">
      <p>Flag item <strong>{targetItemName}</strong> for soft-delete removal parameters?</p>
      <button onClick={onConfirmSoftDelete}>Yes, Purge Record</button>
      <button onClick={onDismiss}>Halt Command</button>
    </div>
  );
};