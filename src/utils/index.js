// src/pages/ReportsPage.jsx
import React from 'react';

export const ProductReportPage = ({ analyticMetrics = [] }) => {
  return (
    <div className="analytics-dashboard-page">
      <div className="analytics-identity-header">
        <h2>System Document ID Log: REP_001</h2>
        <span>Status Report Framework Engine Activated</span>
      </div>

      <div className="metric-tiles-layout-grid">
        {analyticMetrics.map(metric => (
          <div key={metric.id} className="tile-card-metric">
            <h5>Metric Code Group: {metric.categoryGroup}</h5>
            <div className="data-numerical-large">{metric.totalEvaluatedUnits} units</div>
            <p className="card-subtext-label">Active Database Calculations Verified</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TopSellingPage = ({ leaderboardsData = [] }) => {
  return (
    <div className="analytics-dashboard-page spacing-block-top">
      <div className="analytics-identity-header">
        <h2>System Document ID Log: REP_002</h2>
        <span>Velocity Trends Inventory Mapping Channel</span>
      </div>

      <div className="ordered-leaderboard-list">
        {leaderboardsData.map((product, placement) => (
          <div key={product.id} className="leaderboard-row-strip">
            <span className="placement-rank-index">Rank Assignment #{placement + 1}</span>
            <div className="product-identity-name">{product.name}</div>
            <div className="sales-tally-count">Volumetric Throughput: <strong>{product.unitsMovedCount} items shipped</strong></div>
          </div>
        ))}
      </div>
    </div>
  );
};