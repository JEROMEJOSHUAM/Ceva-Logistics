import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function SimulatorControls() {
  const { companies, registerCompany, resetSystem } = useSystem();
  const [open,    setOpen]    = useState(false);
  const [toast,   setToast]   = useState('');

  const triggerQuickCompany = () => {
    const ts = Date.now();
    registerCompany(`Test Vendor ${ts % 1000}`, `test${ts}@vendor.com`, '+1 555-0000', 'vendor');
    setToast('Test company registered.');
    setTimeout(() => setToast(''), 3000);
  };

  const handleReset = () => {
    resetSystem();
    setToast('Simulation data reset to defaults.');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="floating-sim-settings">
      {open && (
        <div className="sim-panel">
          <h4>Simulator Controls</h4>
          <p>Quick actions for populating test data in the system.</p>
          {toast && <div className="sim-toast">{toast}</div>}
          <button className="btn-sim-action" onClick={triggerQuickCompany}>
            Onboard Test Company
          </button>
          <button className="btn-sim-action danger" onClick={handleReset}>
            Reset Simulation Data
          </button>
        </div>
      )}
      <button
        id="simulator-controls-trigger"
        className="btn-sim-trigger"
        onClick={() => setOpen(p => !p)}
        title="Simulator Controls"
      >
        <IconSettings />
      </button>
    </div>
  );
}
