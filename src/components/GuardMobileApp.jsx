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
              const companyName = companies.find(c => c.id === p.companyId)?.name || 'Vendor';
              const stateLabel = !p.checkedIn 
                ? 'Check-In' 
                : (!p.checkedOut ? 'Check-Out' : 'Already Left');
              return (
                <option key={p.id} value={p.id}>
                  Scan: {worker ? worker.name : 'Unknown'} ({companyName}) - [{stateLabel}]
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
                <div className="scan-status-badge entry">VALID PASS - ENTRY PERMITTED</div>
                <img src={scanResult.worker?.photo} alt="" className="scan-avatar" />
                <h3>{scanResult.worker?.name}</h3>
                <p className="vendor-name">{scanResult.company?.name}</p>
                
                <div className="scan-details">
                  <div><strong>Zone:</strong> {scanResult.pass.zoneLevel}</div>
                  <div><strong>Hours:</strong> {scanResult.pass.startTime} - {scanResult.pass.endTime}</div>
                  <div><strong>Validity:</strong> {scanResult.pass.startDate} to {scanResult.pass.endDate}</div>
                </div>

                <button 
                  className="mobile-btn btn-success" 
                  onClick={() => executeCheckIn(scanResult.pass.id)}
                >
                  🟢 Log Check-In Entry
                </button>
              </div>
            )}

            {scanResult.status === 'check_out_confirm' && (
              <div className="scan-confirm check-out">
                <div className="scan-status-badge exit">LOGGED IN - EXIT DEPARTURE</div>
                <img src={scanResult.worker?.photo} alt="" className="scan-avatar" />
                <h3>{scanResult.worker?.name}</h3>
                <p className="vendor-name">{scanResult.company?.name}</p>

                <div className="scan-details">
                  <div><strong>Checked In:</strong> {new Date(scanResult.pass.checkInTime).toLocaleTimeString()}</div>
                  <div><strong>Allowed Shift:</strong> {scanResult.pass.startTime} - {scanResult.pass.endTime}</div>
                </div>

                <button 
                  className="mobile-btn btn-danger" 
                  onClick={() => executeCheckOut(scanResult.pass.id)}
                >
                  🔴 Log Check-Out Exit
                </button>
              </div>
            )}

            {scanResult.status === 'expired' && (
              <div className="scan-confirm invalid">
                <div className="scan-status-badge invalid">EXPIRED PASS</div>
                <h3>{scanResult.worker?.name}</h3>
                <p>This pass has already been used for entry and exit.</p>
                <button className="mobile-btn btn-close" onClick={() => setScanResult(null)}>Close</button>
              </div>
            )}

            {scanResult.status === 'invalid' && (
              <div className="scan-confirm invalid">
                <div className="scan-status-badge invalid">INVALID QR CODE</div>
                <p>The scanned QR code is either invalid or rejected by Ceva Logistics.</p>
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
                  <div key={p.id} className={`onsite-card ${hasAlert ? 'alert-border' : ''}`}>
                    <img src={worker?.photo} alt="" className="onsite-avatar" />
                    <div className="onsite-details">
                      <strong>{worker?.name}</strong>
                      <span className="vendor-lbl">{company?.name}</span>
                      <span className="zone-lbl">{p.zoneLevel.split(' - ')[0]} | shift end {p.endTime}</span>
                    </div>
                    <div className="onsite-actions">
                      <button 
                        className={`btn-simulate-alert ${hasAlert ? 'triggered' : ''}`}
                        onClick={() => triggerOverstay(p.id)}
                        disabled={hasAlert}
                      >
                        ⚠️ {hasAlert ? 'Alarming' : 'Simulate Overstay'}
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
