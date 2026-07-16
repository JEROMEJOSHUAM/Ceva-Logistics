import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function GuardMobileApp() {
  const { 
    passes, 
    workers, 
    companies, 
    checkInPass, 
    checkOutPass, 
    activeHeadcount, 
    triggerOverstay, 
    alerts 
  } = useSystem();

  // Scan state
  const [scannedPassId, setScannedPassId] = useState('');
  const [scanResult, setScanResult] = useState(null); // 'check_in_confirm', 'check_out_confirm', 'invalid'

  // Get active approved passes for scanning dropdown
  const approvablePasses = passes.filter(p => p.status === 'approved');
  const activeOnsitePasses = passes.filter(p => p.checkedIn && !p.checkedOut);
  const activeAlerts = alerts.filter(a => !a.resolved && a.type === 'overstay');

  const handleScanSimulate = (passId) => {
    if (!passId) {
      setScanResult(null);
      return;
    }
    const pass = passes.find(p => p.id === passId);
    if (!pass || pass.status !== 'approved') {
      setScanResult({ status: 'invalid' });
      return;
    }

    const worker = workers.find(w => w.id === pass.workerId);
    const company = companies.find(c => c.id === pass.companyId);

    if (!pass.checkedIn) {
      setScanResult({
        status: 'check_in_confirm',
        pass,
        worker,
        company
      });
    } else if (!pass.checkedOut) {
      setScanResult({
        status: 'check_out_confirm',
        pass,
        worker,
        company
      });
    } else {
      setScanResult({
        status: 'expired',
        pass,
        worker,
        company
      });
    }
  };

  const executeCheckIn = (passId) => {
    checkInPass(passId);
    setScanResult(null);
    setScannedPassId('');
  };

  const executeCheckOut = (passId) => {
    checkOutPass(passId);
    setScanResult(null);
    setScannedPassId('');
  };

  return (
    <div className="mobile-app-wrapper guard-wrapper">
      {/* Mobile Header */}
      <div className="mobile-header guard-header">
        <div className="mobile-status-bar">
          <span>9:41 AM</span>
          <div className="status-icons">📶 🔋</div>
        </div>
        <div className="mobile-title">
          <span>Guard Security Scan</span>
        </div>
      </div>

      <div className="mobile-content">
        {/* Headcount Dashboard */}
        <div className="guard-headcount-card">
          <div className="headcount-label">LIVE SITE HEADCOUNT</div>
          <div className="headcount-num">{activeHeadcount}</div>
          <div className="headcount-sub">Total active workers inside facility</div>
        </div>

        {/* Alerts Alarm */}
        {activeAlerts.length > 0 && (
          <div className="guard-alarm-alert pulse-danger">
            ⚠️ OVERSTAY WARNING: {activeAlerts.length} Active Alert(s)
          </div>
        )}

        {/* Scan Selector (QR Simulator) */}
        <div className="scanner-simulator-box">
          <h4>📷 QR Code Scanner Simulator</h4>
          <p className="scanner-desc">Select a worker's digital pass below to simulate scanning their secure QR code.</p>
          
          <select 
            value={scannedPassId}
            onChange={(e) => {
              setScannedPassId(e.target.value);
              handleScanSimulate(e.target.value);
            }}
            className="mobile-select"
          >
            <option value="">-- Click to Scan QR Code --</option>
            {approvablePasses.map(p => {
              const worker = workers.find(w => w.id === p.workerId);
              const stateLabel = !p.checkedIn 
                ? 'Check-In' 
                : (!p.checkedOut ? 'Check-Out' : 'Already Left');
              return (
                <option key={p.id} value={p.id}>
                  {worker ? worker.name : 'Unknown'} ({stateLabel})
                </option>
              );
            })}
          </select>
        </div>

        {/* Scanner Visual Overlay Result */}
        {scanResult && (
          <div className="scan-result-card slide-in">
            {scanResult.status === 'check_in_confirm' && (
              <div className="scan-confirm check-in">
                <div className="worker-status-badge status-approved" style={{ marginBottom: 16 }}>
                  VALID PASS - ENTRY PERMITTED
                </div>
                
                <div className="digital-pass-card" style={{ marginBottom: 16 }}>
                  <div className="pass-header">
                    <span className="pass-title">DIGITAL GATE PASS</span>
                    <span className="pass-id-num">Pass #{scanResult.pass.id.slice(-6)}</span>
                  </div>
                  
                  <div className="pass-body">
                    <div className="pass-photo-wrap">
                      {scanResult.worker?.photo ? (
                        <img src={scanResult.worker.photo} alt={scanResult.worker.name} className="pass-avatar" />
                      ) : (
                        <div className="pass-avatar-placeholder">
                          {scanResult.worker?.name?.[0]?.toUpperCase() || 'W'}
                        </div>
                      )}
                      <div className="pass-name">
                        <h4>{scanResult.worker?.name}</h4>
                        <p className="pass-vendor">{scanResult.company?.name}</p>
                      </div>
                    </div>

                    <div className="pass-info-grid">
                      <div className="pass-info-item">
                        <span>ZONE</span>
                        <strong>{scanResult.pass.zoneLevel}</strong>
                      </div>
                      <div className="pass-info-item">
                        <span>HOURS</span>
                        <strong>{scanResult.pass.startTime.slice(0, 5)} - {scanResult.pass.endTime.slice(0, 5)}</strong>
                      </div>
                      <div className="pass-info-item" style={{ gridColumn: 'span 2' }}>
                        <span>VALID DATES</span>
                        <strong>{scanResult.pass.startDate} to {scanResult.pass.endDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    className="mobile-btn" 
                    style={{ backgroundColor: '#10b981', flex: 1, marginTop: 0 }}
                    onClick={() => executeCheckIn(scanResult.pass.id)}
                  >
                    🟢 Log Check-In
                  </button>
                  <button 
                    className="mobile-btn" 
                    style={{ backgroundColor: '#64748b', flex: 1, marginTop: 0 }}
                    onClick={() => setScanResult(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {scanResult.status === 'check_out_confirm' && (
              <div className="scan-confirm check-out">
                <div className="worker-status-badge status-approved" style={{ backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5', marginBottom: 16 }}>
                  LOGGED IN - EXIT DEPARTURE
                </div>

                <div className="digital-pass-card" style={{ marginBottom: 16 }}>
                  <div className="pass-header">
                    <span className="pass-title">DIGITAL GATE PASS</span>
                    <span className="pass-id-num">Pass #{scanResult.pass.id.slice(-6)}</span>
                  </div>
                  
                  <div className="pass-body">
                    <div className="pass-photo-wrap">
                      {scanResult.worker?.photo ? (
                        <img src={scanResult.worker.photo} alt={scanResult.worker.name} className="pass-avatar" />
                      ) : (
                        <div className="pass-avatar-placeholder">
                          {scanResult.worker?.name?.[0]?.toUpperCase() || 'W'}
                        </div>
                      )}
                      <div className="pass-name">
                        <h4>{scanResult.worker?.name}</h4>
                        <p className="pass-vendor">{scanResult.company?.name}</p>
                      </div>
                    </div>

                    <div className="pass-info-grid">
                      <div className="pass-info-item">
                        <span>CHECKED IN</span>
                        <strong>{scanResult.pass.checkInTime ? new Date(scanResult.pass.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</strong>
                      </div>
                      <div className="pass-info-item">
                        <span>ALLOWED SHIFT</span>
                        <strong>{scanResult.pass.startTime.slice(0, 5)} - {scanResult.pass.endTime.slice(0, 5)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    className="mobile-btn" 
                    style={{ backgroundColor: '#ef4444', flex: 1, marginTop: 0 }}
                    onClick={() => executeCheckOut(scanResult.pass.id)}
                  >
                    🔴 Log Check-Out
                  </button>
                  <button 
                    className="mobile-btn" 
                    style={{ backgroundColor: '#64748b', flex: 1, marginTop: 0 }}
                    onClick={() => setScanResult(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {scanResult.status === 'expired' && (
              <div className="scan-confirm invalid">
                <div className="worker-status-badge status-rejected" style={{ marginBottom: 16 }}>
                  EXPIRED PASS
                </div>
                <div className="digital-pass-card" style={{ marginBottom: 16 }}>
                  <div className="pass-header">
                    <span className="pass-title">DIGITAL GATE PASS</span>
                    <span className="pass-id-num">Pass #{scanResult.pass.id.slice(-6)}</span>
                  </div>
                  <div className="pass-body">
                    <h4>{scanResult.worker?.name}</h4>
                    <p style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>This pass has already been used for check-in and check-out.</p>
                  </div>
                </div>
                <button className="mobile-btn btn-close" onClick={() => setScanResult(null)}>Close</button>
              </div>
            )}

            {scanResult.status === 'invalid' && (
              <div className="scan-confirm invalid">
                <div className="worker-status-badge status-rejected" style={{ marginBottom: 16 }}>
                  INVALID QR CODE
                </div>
                <div className="digital-pass-card" style={{ marginBottom: 16 }}>
                  <div className="pass-body">
                    <p style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600 }}>The scanned QR code is either invalid or rejected by Ceva Logistics.</p>
                  </div>
                </div>
                <button className="mobile-btn btn-close" onClick={() => setScanResult(null)}>Close</button>
              </div>
            )}
          </div>
        )}

        {/* Checked-In Workers List */}
        <div className="guard-onsite-list">
          <h4>Checked-In Personnel ({activeOnsitePasses.length})</h4>
          {activeOnsitePasses.length === 0 ? (
            <p className="empty-text">No personnel currently checked in on site.</p>
          ) : (
            <div className="onsite-cards-container">
              {activeOnsitePasses.map(p => {
                const worker = workers.find(w => w.id === p.workerId);
                const company = companies.find(c => c.id === p.companyId);
                const hasAlert = alerts.some(a => a.passId === p.id && !a.resolved);
                return (
                  <div key={p.id} className={`onsite-card ${hasAlert ? 'alert-border' : ''}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      {worker?.photo ? (
                        <img src={worker.photo} alt="" className="onsite-avatar" />
                      ) : (
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: '#e2e8f0', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 600, color: '#475569',
                          fontSize: '1rem', flexShrink: 0
                        }}>
                          {worker?.name?.[0]?.toUpperCase() || 'W'}
                        </div>
                      )}
                      <div className="onsite-details" style={{ flex: 1 }}>
                        <strong>{worker?.name}</strong>
                        <span className="vendor-lbl">{company?.name}</span>
                        <span className="zone-lbl">{p.zoneLevel} | shift end {p.endTime}</span>
                      </div>
                    </div>
                    <div className="onsite-actions">
                      <button 
                        className={`btn-simulate-alert ${hasAlert ? 'triggered' : ''}`}
                        onClick={() => triggerOverstay(p.id)}
                        disabled={hasAlert}
                      >
                        {hasAlert ? '⚠️ Alarming' : 'Simulate Overstay'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
