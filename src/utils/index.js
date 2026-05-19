// src/pages/ProductListPage.jsx (Version B - Updated)
import React, { useState } from 'react';

export const ProductListPage = ({ products = [], onOpenAddModal, onTriggerEdit, onTriggerDelete }) => {
  // Inayos: Nagdagdag ng filter controls para hindi sabog ang listahan
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const processedDataList = products.filter(item => item.status === statusFilter);

  return (
    <div className="content-view-panel">
      <div className="panel-header">
        <h2>Active Stocks Records</h2>
        <button onClick={onOpenAddModal}>Create New Stock Entry</button>
      </div>

      {/* FILTER CONTROL BUTTONS BAR */}
      <div className="filter-navigation-menu">
        <button className={statusFilter === 'ACTIVE' ? 'active' : ''} onClick={() => setStatusFilter('ACTIVE')}>Active Storefront</button>
        <button className={statusFilter === 'DELETED' ? 'active' : ''} onClick={() => setStatusFilter('DELETED')}>Archived Soft-Delete Log</button>
      </div>

      <table className="data-table-grid">
        <thead>
          <tr><th>SKU ID</th><th>Product Details Name</th><th>Base Cost</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {processedDataList.length === 0 ? (
            <tr><td colSpan="4">No catalog items match criteria filters.</td></tr>
          ) : (
            processedDataList.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>${item.price}</td>
                <td>
                  <button onClick={() => onTriggerEdit(item)}>Edit</button>
                  <button onClick={() => onTriggerDelete(item)} className="btn-table-delete">Trash</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};