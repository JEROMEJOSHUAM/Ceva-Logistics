import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function SimulatorControls() {
  const { resetSystem, registerCompany } = useSystem();
  const [demoMsg, setDemoMsg] = useState('');

  const triggerQuickCompany = () => {
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const name = `FastFreight Inc. #${randomNum}`;
    registerCompany(name, `ops@fastfreight${randomNum}.com`, `+1 555-0${randomNum}`);
    setDemoMsg(`Registered "${name}" onboarding request! See Ceva Portal.`);
    setTimeout(() => setDemoMsg(''), 4000);
  };

  return (
    <div className="simulator-controls-bar">
      <div className="sim-title-group">
        <h1 className="logo-text">CEVA LOGISTICS</h1>
        <p className="logo-subtext">Visitor & Truck Management System Simulator</p>
      </div>

      <div className="sim-action-group">
        {demoMsg && <span className="sim-toast slide-in">{demoMsg}</span>}
        <button className="btn-sim-action action-secondary" onClick={triggerQuickCompany}>
          🏢 Onboard Test Company
        </button>
        <button className="btn-sim-action action-danger" onClick={resetSystem}>
          🔄 Reset Simulation Data
        </button>
      </div>
    </div>
  );
}
