import React, { useState } from 'react';
import { SystemProvider } from './context/SystemState';
import SimulatorControls from './components/SimulatorControls';

// Visitor Module Components
import CevaAdminDashboard from './components/CevaAdminDashboard';
import CompanyAdminDashboard from './components/CompanyAdminDashboard';
import WorkerMobileApp from './components/WorkerMobileApp';
import GuardMobileApp from './components/GuardMobileApp';

// Truck Module Components
import TruckAdminDashboard from './components/TruckAdminDashboard';
import TruckGuardMobile from './components/TruckGuardMobile';
import CompanyRegistrationForm from './components/CompanyRegistrationForm';

function MainApp() {
  const [activeModule, setActiveModule] = useState('visitor'); // 'visitor' or 'truck'

  // VMS View Toggles
  const [activeWebTab, setActiveWebTab] = useState('ceva'); // 'ceva' or 'company'
  const [activePhoneRole, setActivePhoneRole] = useState('worker'); // 'worker' or 'guard'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Brand Navigation Header with Module Toggle */}
      <header className="module-tabs-header">
        <div className="module-logo-area" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/ceva-logo.png" alt="CEVA Logistics" style={{ height: '48px', objectFit: 'contain', display: 'block' }} />
        </div>

        <div className="module-nav-buttons">
          <button 
            className={`btn-module-nav ${activeModule === 'visitor' ? 'active' : ''}`}
            onClick={() => setActiveModule('visitor')}
          >
            👤 Visitor Management
          </button>
          <button 
            className={`btn-module-nav ${activeModule === 'truck' ? 'active' : ''}`}
            onClick={() => setActiveModule('truck')}
          >
            🚛 Truck & Cargo Management
          </button>
        </div>
      </header>

      <div className="simulator-layout">
        {/* Top simulator action bar */}
        <SimulatorControls />

        {/* Side-by-side main container */}
        <div className="simulation-grids">
          
          {/* LEFT PANEL: WEB PORTALS */}
          <div className="web-portal-wrapper">
            <div className="portal-nav-tabs">
              <button 
                className={`portal-nav-btn ${activeWebTab === 'ceva' ? 'active' : ''}`}
                onClick={() => setActiveWebTab('ceva')}
              >
                🏢 Ceva Logistics Admin
              </button>
              <button 
                className={`portal-nav-btn ${activeWebTab === 'company' ? 'active' : ''}`}
                onClick={() => setActiveWebTab('company')}
              >
                👥 Vendor Company Admin
              </button>
              <button 
                className={`portal-nav-btn ${activeWebTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveWebTab('register')}
              >
                📝 Register Company
              </button>
            </div>
            
            <div className="portal-content-scroll">
              {activeWebTab === 'register' ? (
                <CompanyRegistrationForm />
              ) : activeModule === 'visitor' ? (
                activeWebTab === 'ceva' ? (
                  <CevaAdminDashboard />
                ) : (
                  <CompanyAdminDashboard />
                )
              ) : (
                <TruckAdminDashboard role={activeWebTab} />
              )}
            </div>
          </div>

          {/* RIGHT PANEL: SMARTPHONE SIMULATOR */}
          <div className="mobile-simulator-column">
            <div className="phone-bezel-frame">
              <div className="phone-screen-container">
                {activeModule === 'visitor' ? (
                  activePhoneRole === 'worker' ? (
                    <WorkerMobileApp />
                  ) : (
                    <GuardMobileApp />
                  )
                ) : (
                  <TruckGuardMobile />
                )}
              </div>
            </div>

            {/* Toggle buttons to switch mobile screen role (only visible for Visitor module) */}
            {activeModule === 'visitor' ? (
              <div className="phone-role-selector-bar">
                <button 
                  className={`btn-phone-role ${activePhoneRole === 'worker' ? 'active' : ''}`}
                  onClick={() => setActivePhoneRole('worker')}
                >
                  👤 Worker Mobile
                </button>
                <button 
                  className={`btn-phone-role ${activePhoneRole === 'guard' ? 'active' : ''}`}
                  onClick={() => setActivePhoneRole('guard')}
                >
                  🛡️ Security Guard
                </button>
              </div>
            ) : (
              <div className="phone-role-selector-bar">
                <span className="btn-phone-role active">🛡️ Guard Inspection App</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SystemProvider>
      <MainApp />
    </SystemProvider>
  );
}
