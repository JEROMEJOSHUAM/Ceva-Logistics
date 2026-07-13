import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function CompanyAdminDashboard() {
  const { 
    companies, 
    workers, 
    verifyWorker, 
    passes, 
    approvePassVendor,
    registerWorker
  } = useSystem();

  // Pick first approved company as default if none selected
  const approvedCompanies = companies.filter(c => c.status === 'approved');
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    approvedCompanies.length > 0 ? approvedCompanies[0].id : ''
  );

  // New Worker Form state
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerSupervisor, setNewWorkerSupervisor] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const currentCompany = companies.find(c => c.id === selectedCompanyId);

  // Filter based on selected company
  const companyWorkers = workers.filter(w => w.companyId === selectedCompanyId);
  const pendingWorkers = companyWorkers.filter(w => w.status === 'pending');
  const verifiedWorkers = companyWorkers.filter(w => w.status === 'approved');

  const pendingPasses = passes.filter(
    p => p.companyId === selectedCompanyId && p.status === 'pending_vendor'
  );

  const handleAddWorker = (e) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      setFormMsg('Please select or verify a company first.');
      return;
    }
    if (!newWorkerName || !newWorkerSupervisor) {
      setFormMsg('Name and Supervisor Name are required.');
      return;
    }
    registerWorker(
      newWorkerName,
      selectedCompanyId,
      newWorkerSupervisor,
      newWorkerEmail || `${newWorkerName.toLowerCase().replace(/\s+/g, '')}@vendor.com`,
      newWorkerPhone || '+1 555-9999'
    );
    setNewWorkerName('');
    setNewWorkerEmail('');
    setNewWorkerPhone('');
    setNewWorkerSupervisor('');
    setFormMsg('Worker registered successfully! Needs profile verification.');
    setTimeout(() => setFormMsg(''), 4000);
  };

  if (approvedCompanies.length === 0) {
    return (
      <div className="portal-container">
        <div className="portal-header">
          <h2>Vendor Admin Portal</h2>
          <span className="badge-role vendor-badge">Company Admin</span>
        </div>
        <p className="empty-text">No verified vendor companies are available. Please go to the Ceva Admin Dashboard to approve a company registration request first!</p>
      </div>
    );
  }

  return (
    <div className="portal-container">
      <div className="portal-header">
        <div className="company-selector-wrap">
          <h2>Vendor Dashboard: </h2>
          <select 
            value={selectedCompanyId} 
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="company-select-dropdown"
          >
            {approvedCompanies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <span className="badge-role vendor-badge">Company Admin Portal</span>
      </div>

      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-val">{companyWorkers.length}</div>
          <div className="stat-label">Total Workers</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{pendingWorkers.length}</div>
          <div className="stat-label">Pending Profiles</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{pendingPasses.length}</div>
          <div className="stat-label">Pass Requests (Step-1)</div>
        </div>
      </div>

      <div className="portal-sections">
        {/* Left Column: Worker Profiles and Pass requests */}
        <div className="portal-section">
          <h3>Worker Profile Verification ({pendingWorkers.length})</h3>
          {pendingWorkers.length === 0 ? (
            <p className="empty-text">All worker profiles are verified.</p>
          ) : (
            <div className="request-list">
              {pendingWorkers.map(w => (
                <div key={w.id} className="request-card">
                  <div className="card-details">
                    <h4>{w.name}</h4>
                    <p>Email: {w.email} | Phone: {w.phone}</p>
                    <p><strong>Supervisor:</strong> {w.supervisorName}</p>
                  </div>
                  <div className="card-actions">
                    <button className="btn-approve" onClick={() => verifyWorker(w.id, true)}>Verify Profile</button>
                    <button className="btn-reject" onClick={() => verifyWorker(w.id, false)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: '24px' }}>Initial Pass Verification - Step 1 ({pendingPasses.length})</h3>
          {pendingPasses.length === 0 ? (
            <p className="empty-text">No pass requests awaiting initial review.</p>
          ) : (
            <div className="request-list">
              {pendingPasses.map(p => {
                const worker = workers.find(w => w.id === p.workerId);
                return (
                  <div key={p.id} className="request-card">
                    <div className="card-details">
                      <h4>Gate Pass: #{p.id.slice(-6)}</h4>
                      <p><strong>Worker:</strong> {worker ? worker.name : 'Unknown'}</p>
                      <p><strong>Access Zone:</strong> {p.zoneLevel}</p>
                      <p><strong>Shift Date:</strong> {p.startDate} to {p.endDate}</p>
                      <p><strong>Shift Time:</strong> {p.startTime} - {p.endTime}</p>
                      <p><strong>Supervisor:</strong> {p.supervisorName}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-approve" onClick={() => approvePassVendor(p.id, true)}>Verify & Forward</button>
                      <button className="btn-reject" onClick={() => approvePassVendor(p.id, false)}>Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add Worker & Roster */}
        <div className="portal-section">
          <h3>Register New Worker Profile</h3>
          <form className="admin-form" onSubmit={handleAddWorker}>
            <div className="form-group">
              <label>Worker Full Name *</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Supervisor Name *</label>
              <input 
                type="text" 
                placeholder="Robert Downey" 
                value={newWorkerSupervisor}
                onChange={(e) => setNewWorkerSupervisor(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@vendor.com" 
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+1 555-1234" 
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">Submit Registration</button>
            {formMsg && <p className="form-feedback">{formMsg}</p>}
          </form>

          <h3 style={{ marginTop: '24px' }}>Verified Company Roster ({verifiedWorkers.length})</h3>
          {verifiedWorkers.length === 0 ? (
            <p className="empty-text">No verified workers found.</p>
          ) : (
            <div className="roster-grid">
              {verifiedWorkers.map(w => (
                <div key={w.id} className="roster-item">
                  <img src={w.photo} alt={w.name} className="roster-avatar" />
                  <div className="roster-info">
                    <strong>{w.name}</strong>
                    <div className="sub-detail">Supervisor: {w.supervisorName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
