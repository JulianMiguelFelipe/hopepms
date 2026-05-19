// src/pages/UserManagementPage.jsx (Version B - Updated)
import React from 'react';

export const UserManagementPage = ({ structuralUsers = [], activeOperatorRole, onKillSession }) => {
  return (
    <div className="management-view-panel">
      <h3>Operational Matrix Credentials Log</h3>
      <table className="user-access-matrix-table">
        <thead>
          <tr><th>Account Subject</th><th>System Security Tier Tag</th><th>Actions Control</th></tr>
        </thead>
        <tbody>
          {structuralUsers.map(profile => (
            <tr key={profile.id}>
              <td>{profile.emailAddress}</td>
              <td>{profile.assignedSystemTier}</td>
              <td>
                {/* INAYOS: Row Level Action Protection Logic Implemented */}
                {profile.assignedSystemTier === 'SUPERADMIN' ? (
                  <span className="security-lockout-badge">⚠️ Immutable Core Master Identity</span>
                ) : (
                  <button 
                    disabled={activeOperatorRole !== 'SUPERADMIN' && activeOperatorRole !== 'ADMIN'}
                    onClick={() => onKillSession(profile.id)}
                    className="btn-revoke-destructive"
                  >
                    Revoke Credentials
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};