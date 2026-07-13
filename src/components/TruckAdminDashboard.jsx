import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function TruckAdminDashboard({ role }) {
  const {
    companies,
    verifyCompany,
    trucks,
    verifyTruck,
    registerTruck,
    drivers,
    verifyDriver,
    registerDriver,
    deliveries,
    assignDelivery,
    logs,
    activeTruckHeadcount,
    alerts,
    resolveAlert
  } = useSystem();

  // Active view: 'ceva' or 'vendor'
  const isAdminRole = role === 'ceva';

  // Ceva Admin States
  const [pendingCompany2FAId, setPendingCompany2FAId] = useState(null);
  const [smsCode, setSmsCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error2FA, setError2FA] = useState('');

  // Vendor Admin States
  const approvedVendors = companies.filter(c => c.status === 'approved' && c.type === 'vendor');
  const [selectedVendorId, setSelectedVendorId] = useState(
    approvedVendors.length > 0 ? approvedVendors[0].id : ''
  );
  
  const approvedTruckingCompanies = companies.filter(
    c => c.status === 'approved' && c.type === 'trucking' && (c.parentCompanyId === selectedVendorId || !c.parentCompanyId)
  );
  const [selectedTruckingId, setSelectedTruckingId] = useState(
    approvedTruckingCompanies.length > 0 ? approvedTruckingCompanies[0].id : ''
  );

  // Asset registration forms
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [model, setModel] = useState('');
  const [driverName, setDriverName] = useState('');
  const [license, setLicense] = useState('');
  
  // Delivery Assignment Form
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignTruckId, setAssignTruckId] = useState('');
  const [taskType, setTaskType] = useState('dropoff');
  const [sealNumber, setSealNumber] = useState('');
  const [cargoItems, setCargoItems] = useState('');
  const [assignMsg, setAssignMsg] = useState('');

  // Filtering for Ceva Admin
  const pendingCevaCompanies = companies.filter(
    c => c.type === 'trucking' && c.status === 'pending_ceva'
  );
  const activeTruckDeliveries = deliveries.filter(d => d.checkedIn && !d.checkedOut);
  const activeAlerts = alerts.filter(a => !a.resolved && a.message.includes('TRUCK'));
  const tmsLogs = logs.filter(l => l.type === 'truck');

  // Filtering for Vendor Admin
  const subContractedCompanies = companies.filter(
    c => c.type === 'trucking' && c.parentCompanyId === selectedVendorId && c.status === 'pending_vendor'
  );

  // Filtering for Trucking Company Admin
  const currentTruckingCompany = companies.find(c => c.id === selectedTruckingId);
  const companyTrucks = trucks.filter(t => t.companyId === selectedTruckingId);
  const companyDrivers = drivers.filter(d => d.companyId === selectedTruckingId);
  const pendingTrucks = companyTrucks.filter(t => t.status === 'pending');
  const pendingDrivers = companyDrivers.filter(d => d.status === 'pending');

  const trigger2FAApproval = (companyId) => {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSmsCode(code);
    setPendingCompany2FAId(companyId);
    setInputCode('');
    setError2FA('');
  };

  const handle2FAVerify = (e) => {
    e.preventDefault();
    if (inputCode === smsCode) {
      verifyCompany(pendingCompany2FAId, true);
      setPendingCompany2FAId(null);
    } else {
      setError2FA('Incorrect 2FA verification code. Please try again.');
    }
  };

  const handleRegisterTruck = (e) => {
    e.preventDefault();
    if (!selectedTruckingId) return;
    registerTruck(plate, vin, model, selectedTruckingId);
    setPlate('');
    setVin('');
    setModel('');
    setAssignMsg('Truck registered! Needs profile verification.');
    setTimeout(() => setAssignMsg(''), 4000);
  };

  const handleRegisterDriver = (e) => {
    e.preventDefault();
    if (!selectedTruckingId) return;
    registerDriver(driverName, license, selectedTruckingId);
    setDriverName('');
    setLicense('');
    setAssignMsg('Driver registered! Needs license verification.');
    setTimeout(() => setAssignMsg(''), 4000);
  };

  const handleAssignDelivery = (e) => {
    e.preventDefault();
    if (!assignDriverId || !assignTruckId || !sealNumber) {
      setAssignMsg('All fields are required.');
      return;
    }
    assignDelivery(assignTruckId, assignDriverId, selectedTruckingId, taskType, sealNumber, cargoItems);
    setAssignDriverId('');
    setAssignTruckId('');
    setSealNumber('');
    setCargoItems('');
    setAssignMsg('Task dispatched! Truck and driver scheduled for gate entry.');
    setTimeout(() => setAssignMsg(''), 4000);
  };

  return (
    <div className="portal-container">
      {/* 2FA Modal Dialog */}
      {pendingCompany2FAId && (
        <div className="modal-backdrop-2fa">
          <form className="modal-2fa-card slide-in" onSubmit={handle2FAVerify}>
            <h3>🔐 Two-Factor Authentication</h3>
            <p>CEVA Admin authorization requires 2FA validation to prevent unauthorized sub-contracting routing.</p>
            <div className="alert-banner-area" style={{ margin: '8px 0', backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }}>
              <span style={{ color: '#0369a1', fontSize: '0.8rem' }}><strong>Simulated 2FA SMS Code:</strong> {smsCode}</span>
            </div>
            <input 
              type="text" 
              className="input-2fa-digit" 
              maxLength="4" 
              placeholder="0000"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              required
            />
            {error2FA && <p className="danger-text" style={{ fontSize: '0.8rem', color: 'red' }}>{error2FA}</p>}
            <div className="card-actions">
              <button type="submit" className="btn-submit" style={{ backgroundColor: 'var(--ceva-red)' }}>Verify & Approve</button>
              <button type="button" className="btn-close" onClick={() => setPendingCompany2FAId(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Role Toggle Header */}
      <div className="portal-header">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <h2>Truck Management Admin</h2>
        </div>
        <span className={`badge-role ${isAdminRole ? 'ceva-badge' : 'vendor-badge'}`}>
          {isAdminRole ? 'Ceva Logistics Portal' : 'Vendor Admin Portal'}
        </span>
      </div>

      {isAdminRole ? (
        /* ==================================================================
           CEVA LOGISTICS ADMIN VIEW
           ================================================================== */
        <>
          <div className="grid-stats">
            <div className="stat-card">
              <div className="stat-val">{activeTruckHeadcount}</div>
              <div className="stat-label">Active Trucks On-Site</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{companies.filter(c => c.type === 'trucking' && c.status === 'approved').length}</div>
              <div className="stat-label">Approved 3PL Trucking</div>
            </div>
            <div className="stat-card">
              <div className="stat-val">{pendingCevaCompanies.length}</div>
              <div className="stat-label">Pending 2FA Approvals</div>
            </div>
          </div>

          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="alert-banner-area" style={{ marginTop: '16px' }}>
              <h3 style={{ color: 'var(--ceva-red)' }} className="pulse-text">🚨 CRITICAL LOGISTICS ALERTS</h3>
              {activeAlerts.map(alert => (
                <div key={alert.id} className="alert-card-item">
                  <div className="alert-msg">{alert.message}</div>
                  <div className="alert-meta">Triggered: {alert.timestamp}</div>
                  <button className="btn-resolve" onClick={() => resolveAlert(alert.id)}>Acknowledge & Clear</button>
                </div>
              ))}
            </div>
          )}

          <div className="portal-sections">
            {/* Left Panel: Trucking Company Approvals */}
            <div className="portal-section">
              <h3>Trucking Company Onboarding (Pending Ceva Approval)</h3>
              {pendingCevaCompanies.length === 0 ? (
                <p className="empty-text">No trucking companies waiting for Ceva 2FA verification.</p>
              ) : (
                <div className="request-list">
                  {pendingCevaCompanies.map(c => {
                    const parentName = companies.find(p => p.id === c.parentCompanyId)?.name || 'Independent';
                    return (
                      <div key={c.id} className="request-card">
                        <div className="card-details">
                          <h4>{c.name}</h4>
                          <p>Parent Vendor: <strong>{parentName}</strong></p>
                          <p>Contact: {c.email} | {c.phone}</p>
                          <p className="date-stamp">Vendor Route Cleared: Pending Ceva 2FA Check</p>
                        </div>
                        <div className="card-actions">
                          <button 
                            className="btn-approve" 
                            style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}
                            onClick={() => trigger2FAApproval(c.id)}
                          >
                            🔒 2FA Verification Approval
                          </button>
                          <button className="btn-reject" onClick={() => verifyCompany(c.id, false)}>Reject</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Panel: Live Logs and active docks */}
            <div className="portal-section">
              <h3>Cargo Dock Status ({activeTruckDeliveries.length} Trucks Docked)</h3>
              {activeTruckDeliveries.length === 0 ? (
                <p className="empty-text">No freight trucks currently checked in at bays.</p>
              ) : (
                <ul className="live-worker-list">
                  {activeTruckDeliveries.map(d => {
                    const driver = drivers.find(dr => dr.id === d.driverId);
                    const truck = trucks.find(t => t.id === d.truckId);
                    return (
                      <li key={d.id} className="live-worker-item">
                        <div className="pulse-dot"></div>
                        <div>
                          <strong>{d.type.toUpperCase()}: Truck {truck?.plate}</strong> (Seal: {d.sealNumber})
                          <div className="sub-detail">Driver: {driver?.name} | Cargo: {d.items}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <h3 style={{ marginTop: '24px' }}>Cargo Gate Inspection Logs</h3>
              <div className="log-console">
                {tmsLogs.length === 0 ? (
                  <p className="empty-text">No trucking log events recorded yet.</p>
                ) : (
                  tmsLogs.map(log => (
                    <div key={log.id} className={`log-entry ${log.action}`}>
                      <span className="log-time">[{log.timestamp}]</span>{' '}
                      <span className="log-action">
                        {log.action === 'check_in' ? '🚛 INSPECTED CHECK-IN' : '🚚 DEPARTED CHECK-OUT'}
                      </span>{' '}
                      <strong>{log.workerName}</strong> ({log.companyName})
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ==================================================================
           VENDOR / TRUCKING COMPANY ADMIN VIEW
           ================================================================== */
        <>
          <div className="portal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span>Vendor:</span>
              <select 
                value={selectedVendorId} 
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="company-select-dropdown"
              >
                {approvedVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>

              <span>3PL Trucking:</span>
              <select 
                value={selectedTruckingId} 
                onChange={(e) => setSelectedTruckingId(e.target.value)}
                className="company-select-dropdown"
              >
                {approvedTruckingCompanies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="portal-sections" style={{ marginTop: '16px' }}>
            {/* Column 1: Onboarding Routing and Registering Assets */}
            <div className="portal-section">
              {/* Vendor Hierarchy Onboarding approval */}
              <h3>Sub-Contractor Routing Approvals ({subContractedCompanies.length})</h3>
              {subContractedCompanies.length === 0 ? (
                <p className="empty-text">No subcontracted company registrations waiting routing clearance.</p>
              ) : (
                <div className="request-list">
                  {subContractedCompanies.map(c => (
                    <div key={c.id} className="request-card">
                      <div className="card-details">
                        <h4>{c.name}</h4>
                        <p>Hierarchy: Operating as 3PL subcontract under {companies.find(p => p.id === c.parentCompanyId)?.name}</p>
                        <p>Contact: {c.email}</p>
                      </div>
                      <div className="card-actions">
                        <button className="btn-approve" onClick={() => verifyCompany(c.id, true)}>Approve & Route to Ceva</button>
                        <button className="btn-reject" onClick={() => verifyCompany(c.id, false)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Roster lists of assets */}
              <h3 style={{ marginTop: '24px' }}>Roster and Fleet Profile</h3>
              <div className="admin-form" style={{ gap: '16px' }}>
                <h4>Register Fleet Truck</h4>
                <form onSubmit={handleRegisterTruck} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>License Plate Number *</label>
                      <input type="text" placeholder="TX-8821" value={plate} onChange={(e) => setPlate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Truck Model *</label>
                      <input type="text" placeholder="Freightliner Cascadia" value={model} onChange={(e) => setModel(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>VIN (Vehicle Identification Number) *</label>
                    <input type="text" placeholder="1FVAC54Y3G8921..." value={vin} onChange={(e) => setVin(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-submit">Add Truck Profile</button>
                </form>

                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                <h4>Register Driver profile</h4>
                <form onSubmit={handleRegisterDriver} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Driver Full Name *</label>
                      <input type="text" placeholder="Marcus Miller" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Commercial Driver License *</label>
                      <input type="text" placeholder="DL-99210" value={license} onChange={(e) => setLicense(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-submit">Add Driver Profile</button>
                </form>
                {assignMsg && <p className="form-feedback">{assignMsg}</p>}
              </div>
            </div>

            {/* Column 2: Verify assets and Assign Cargo Tasks */}
            <div className="portal-section">
              {/* Asset verification lists */}
              <h3>Verify Registered Fleet Assets</h3>
              {pendingTrucks.length === 0 && pendingDrivers.length === 0 ? (
                <p className="empty-text">All company driver credentials and trucks verified.</p>
              ) : (
                <div className="request-list">
                  {pendingTrucks.map(t => (
                    <div key={t.id} className="request-card">
                      <div className="card-details">
                        <h4>🚚 Truck Profile: {t.plate}</h4>
                        <p>Model: {t.model} | VIN: {t.vin}</p>
                      </div>
                      <div className="card-actions">
                        <button className="btn-approve" onClick={() => verifyTruck(t.id, true)}>Verify Truck</button>
                        <button className="btn-reject" onClick={() => verifyTruck(t.id, false)}>Reject</button>
                      </div>
                    </div>
                  ))}
                  {pendingDrivers.map(d => (
                    <div key={d.id} className="request-card">
                      <div className="card-details">
                        <h4>👤 Driver Credentials: {d.name}</h4>
                        <p>CDL License: {d.license}</p>
                      </div>
                      <div className="card-actions">
                        <button className="btn-approve" onClick={() => verifyDriver(d.id, true)}>Verify License</button>
                        <button className="btn-reject" onClick={() => verifyDriver(d.id, false)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Assignment form */}
              <h3 style={{ marginTop: '24px' }}>Assign Delivery / Pickup Task</h3>
              <form className="admin-form" onSubmit={handleAssignDelivery}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Select Driver</label>
                    <select value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)} required>
                      <option value="">-- Choose Driver --</option>
                      {companyDrivers.filter(d => d.status === 'approved').map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.license})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Truck</label>
                    <select value={assignTruckId} onChange={(e) => setAssignTruckId(e.target.value)} required>
                      <option value="">-- Choose Truck --</option>
                      {companyTrucks.filter(t => t.status === 'approved').map(t => (
                        <option key={t.id} value={t.id}>{t.plate} ({t.model})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Task Operations</label>
                    <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                      <option value="dropoff">Inbound Drop-off (Ceva Receives)</option>
                      <option value="pickup">Outbound Pickup (Ceva Sends)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Container Seal Number *</label>
                    <input type="text" placeholder="SEAL-55441" value={sealNumber} onChange={(e) => setSealNumber(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Cargo Description / scheduled items</label>
                  <input type="text" placeholder="Electronics Batch 4A" value={cargoItems} onChange={(e) => setCargoItems(e.target.value)} />
                </div>

                <button type="submit" className="btn-submit">Dispatch Assigned Driver</button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
