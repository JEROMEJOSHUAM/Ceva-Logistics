import React from 'react';
import { useSystem } from '../context/SystemState';

export default function CevaAdminDashboard() {
  const { 
    companies, 
    verifyCompany, 
    passes, 
    approvePassCeva, 
    activeHeadcount, 
    logs, 
    alerts, 
    resolveAlert 
  } = useSystem();

  const pendingCompanies = companies.filter(c => c.status === 'pending');
  const verifiedCompanies = companies.filter(c => c.status === 'approved');

  const pendingPasses = passes.filter(p => p.status === 'pending_ceva');
  const activePasses = passes.filter(p => p.checkedIn && !p.checkedOut);
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="portal-container">
      <div className="portal-header">
        <h2>Ceva Logistics Admin Command Center</h2>
        <span className="badge-role ceva-badge">Ceva Admin Portal</span>
      </div>

      {/* Stats Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-val">{activeHeadcount}</div>
          <div className="stat-label">Active Headcount</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{verifiedCompanies.length}</div>
          <div className="stat-label">Verified Vendors</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{pendingPasses.length}</div>
          <div className="stat-label">Pending Approvals</div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="alert-banner-area">
          <h3 className="danger-text pulse-text">🚨 CRITICAL SECURITY ALERTS</h3>
          {activeAlerts.map(alert => (
            <div key={alert.id} className="alert-card-item">
              <div className="alert-msg">{alert.message}</div>
              <div className="alert-meta">Triggered: {alert.timestamp}</div>
              <button className="btn-resolve" onClick={() => resolveAlert(alert.id)}>Acknowledge & Clear</button>
            </div>
          ))}
        </div>
      )}

      {/* Dual Column Layout */}
      <div className="portal-sections">
        {/* Column Left: Approvals */}
        <div className="portal-section">
          <h3>Vendor Onboarding Requests ({pendingCompanies.length})</h3>
          {pendingCompanies.length === 0 ? (
            <p className="empty-text">No pending company registrations.</p>
          ) : (
            <div className="request-list">
              {pendingCompanies.map(c => (
                <div key={c.id} className="request-card">
                  <div className="card-details">
                    <h4>{c.name}</h4>
                    <p>Email: {c.email} | Phone: {c.phone}</p>
                    <p className="date-stamp">Submitted: {c.createdAt}</p>
                  </div>
                  <div className="card-actions">
                    <button className="btn-approve" onClick={() => verifyCompany(c.id, true)}>Verify</button>
                    <button className="btn-reject" onClick={() => verifyCompany(c.id, false)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: '24px' }}>Final Gate Pass Approvals ({pendingPasses.length})</h3>
          {pendingPasses.length === 0 ? (
            <p className="empty-text">No pending gate pass authorizations.</p>
          ) : (
            <div className="request-list">
              {pendingPasses.map(p => {
                const vendorName = companies.find(c => c.id === p.companyId)?.name || 'Unknown Vendor';
                return (
                  <div key={p.id} className="request-card">
                    <div className="card-details">
                      <h4>Pass Request: #{p.id.slice(-6)}</h4>
                      <p><strong>Vendor:</strong> {vendorName}</p>
                      <p><strong>Zone Access:</strong> <span className="zone-highlight">{p.zoneLevel}</span></p>
                      <p><strong>Date:</strong> {p.startDate} to {p.endDate}</p>
                      <p><strong>Hours:</strong> {p.startTime} - {p.endTime}</p>
                      <p><strong>Purpose:</strong> {p.purpose}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-approve" onClick={() => approvePassCeva(p.id, true)}>Approve & Issue</button>
                      <button className="btn-reject" onClick={() => approvePassCeva(p.id, false)}>Deny</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column Right: Live Ops Logs & Vendors */}
        <div className="portal-section">
          <h3>Active Workers on Site ({activePasses.length})</h3>
          {activePasses.length === 0 ? (
            <p className="empty-text">No workers currently checked in.</p>
          ) : (
            <ul className="live-worker-list">
              {activePasses.map(p => (
                <li key={p.id} className="live-worker-item">
                  <div className="pulse-dot"></div>
                  <div>
                    <strong>Worker Pass #{p.id.slice(-6)}</strong> - Authorized for {p.zoneLevel}
                    <div className="sub-detail">Shift End: {p.endTime} (Access expires {p.endDate})</div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: '24px' }}>Security Gate Entry Logs</h3>
          <div className="log-console">
            {logs.length === 0 ? (
              <p className="empty-text">No logs recorded yet.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className={`log-entry ${log.action}`}>
                  <span className="log-time">[{log.timestamp}]</span>{' '}
                  <span className="log-action">
                    {log.action === 'check_in' ? '🟢 ENTRY' : '🔴 EXIT'}
                  </span>{' '}
                  <strong>{log.workerName}</strong> ({log.companyName})
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
