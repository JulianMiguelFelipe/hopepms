// src/components/PriceHistoryPanel.jsx
import React, { useState } from 'react';

export const PriceHistoryPanel = ({ auditRecords = [], onAppendNewPriceLog }) => {
  const [inputtedPrice, setInputtedPrice] = useState('');

  const localFormSubmission = (e) => {
    e.preventDefault();
    if (!inputtedPrice || isNaN(inputtedPrice)) return;
    
    onAppendNewPriceLog({
      priceValue: parseFloat(inputtedPrice),
      updatedTimestamp: new Date().toISOString()
    });
    setInputtedPrice('');
  };

  return (
    <div className="audit-history-panel">
      <h3>Price Flow Auditing Log Monitor</h3>
      <div className="timeline-scroll-axis">
        {auditRecords.length === 0 ? (
          <p className="fallback-text">No baseline shifts observed in execution logs.</p>
        ) : (
          <ul className="timeline-nodes">
            {auditRecords.map((log, index) => (
              <li key={index} className="timeline-node-item">
                <span className="price-tag">${log.priceValue.toFixed(2)}</span>
                <span className="timestamp-tag">Logged: {log.updatedTimestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={localFormSubmission} className="inline-audit-form">
        <input 
          type="number" 
          step="0.01"
          placeholder="New Price Configuration Value" 
          value={inputtedPrice}
          onChange={(e) => setInputtedPrice(e.target.value)}
        />
        <button type="submit">Commit Base Value Adjustments</button>
      </form>
    </div>
  );
};