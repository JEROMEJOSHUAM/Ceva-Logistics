import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemState';
import SimulatorControls from './components/SimulatorControls';
import LoginPage from './pages/LoginPage';
import CompanyRegistrationForm from './components/CompanyRegistrationForm';
import CevaAdminDashboard from './components/CevaAdminDashboard';
import CompanyAdminDashboard from './components/CompanyAdminDashboard';
import TruckAdminDashboard from './components/TruckAdminDashboard';

/* ── Inline SVG icons ─────────────────────────────────────── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const IconDashboard  = () => <Icon d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />;
const IconUsers      = () => <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />;
const IconPlusCircle = () => <Icon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v8M8 12h8" />;
const IconCargo      = () => <Icon d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />;
const IconDriver     = () => <Icon d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21v-4M8 21v-4M12 3v4" />;
const IconLogout     = () => <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />;
const IconSupervisor = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 3h15v13H1V3zM16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="1.5"/>
    <circle cx="18.5" cy="18.5" r="1.5"/>
  </svg>
);
const IconDispatch = () => <Icon d="M5 12h14M12 5l7 7-7 7" />;

/* ── Nav config by role ───────────────────────────────────── */
const NAV_BY_ROLE = {
  ceva_admin: [
    {
      group: 'Ceva Command Center',
      items: [
        { id: 'vms_ceva_dashboard',  label: 'Operations Monitor',  icon: <IconDashboard /> },
        { id: 'vms_ceva_onboarding', label: 'Company Onboarding', icon: <IconPlusCircle /> },
        { id: 'vms_ceva_passes',     label: 'Gate Pass Clearance', icon: <IconUsers /> },
        { id: 'vms_ceva_cargo',      label: 'Cargo & Dock Monitor',icon: <IconCargo /> },
      ]
    },
  ],
  company_admin: [
    {
      group: 'Visitor Management',
      items: [
        { id: 'vms_vendor_dashboard',   label: 'Overall Dashboard',   icon: <IconDashboard /> },
        { id: 'vms_vendor_workers',     label: 'Workers Roster',      icon: <IconUsers /> },
        { id: 'vms_vendor_supervisors', label: 'Supervisors',         icon: <IconSupervisor /> },
        { id: 'vms_vendor_verify',      label: 'Verification Desk',   icon: <IconDashboard /> },
        { id: 'vms_vendor_passes',      label: 'Pass Requests',       icon: <IconPlusCircle /> },
      ]
    },
  ],
  cargo_admin: [
    {
      group: 'Fleet Management',
      items: [
        { id: 'tms_overview',  label: 'Fleet Overview', icon: <IconDashboard /> },
        { id: 'tms_trucks',    label: 'Trucks',         icon: <IconTruck /> },
        { id: 'tms_drivers',   label: 'Drivers',        icon: <IconUsers /> },
        { id: 'tms_dispatch',  label: 'Dispatch',       icon: <IconDispatch /> },
      ]
    },
  ],
};

const DEFAULT_PAGE_BY_ROLE = {
  ceva_admin:    'vms_ceva_dashboard',
  company_admin: 'vms_vendor_dashboard',
  cargo_admin:   'tms_overview',
};

/* ── Loading spinner ─────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      height:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'#f1f5f9', gap:16, fontFamily:"'Inter',sans-serif",
    }}>
      <img src="/ceva-logo.png" alt="CEVA" style={{ height:48, objectFit:'contain' }} />
      <div style={{ fontSize:'0.85rem', color:'#64748b', fontWeight:500 }}>Loading system...</div>
    </div>
  );
}

/* ── Main authenticated app ──────────────────────────────── */
function AuthenticatedApp() {
  const { profile, signOut } = useAuth();
  const role = profile?.role || 'ceva_admin';
  const nav  = NAV_BY_ROLE[role] || NAV_BY_ROLE.ceva_admin;
  const defaultPage = DEFAULT_PAGE_BY_ROLE[role] || 'vms_ceva_dashboard';

  const [activePage, setActivePage] = useState(defaultPage);

  const renderPage = () => {
    switch (activePage) {
      case 'vms_ceva':               return <CevaAdminDashboard view="dashboard" />;
      case 'vms_ceva_dashboard':     return <CevaAdminDashboard view="dashboard" />;
      case 'vms_ceva_onboarding':    return <CevaAdminDashboard view="onboarding" />;
      case 'vms_ceva_passes':        return <CevaAdminDashboard view="passes" />;
      case 'vms_ceva_cargo':         return <CevaAdminDashboard view="cargo" />;
      case 'vms_vendor':             return <CompanyAdminDashboard />;
      case 'vms_vendor_dashboard':   return <CompanyAdminDashboard view="dashboard" />;
      case 'vms_vendor_workers':     return <CompanyAdminDashboard view="workers" />;
      case 'vms_vendor_supervisors': return <CompanyAdminDashboard view="supervisors" />;
      case 'vms_vendor_verify':      return <CompanyAdminDashboard view="verification" />;
      case 'vms_vendor_passes':      return <CompanyAdminDashboard view="passes" />;
      case 'vms_register':           return <CompanyRegistrationForm />;
      case 'tms_ceva':               return <TruckAdminDashboard role="ceva" />;
      case 'tms_vendor':             return <TruckAdminDashboard role="vendor" view="overview" />;
      case 'tms_overview':           return <TruckAdminDashboard role="vendor" view="overview" />;
      case 'tms_trucks':             return <TruckAdminDashboard role="vendor" view="trucks" />;
      case 'tms_drivers':            return <TruckAdminDashboard role="vendor" view="drivers" />;
      case 'tms_dispatch':           return <TruckAdminDashboard role="vendor" view="dispatch" />;
      default:                       return <CevaAdminDashboard view="dashboard" />;
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    : 'AD';

  const roleLabel = { ceva_admin:'Ceva Admin', company_admin:'Company Admin', cargo_admin:'Cargo Admin' }[role] || 'Admin';

  return (
    <div className="app-shell">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-logo-zone">
          <img src="/ceva-logo.png" alt="CEVA Logistics" />
        </div>
        <div className="header-right">
          <div className="header-user-pill">
            <div className="header-user-avatar">{initials}</div>
            <div className="header-user-info">
              <span className="header-user-name">{profile?.full_name || roleLabel}</span>
              <span className="header-user-role">{roleLabel}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:8, padding:'7px 10px', cursor:'pointer', color:'rgba(255,255,255,0.7)',
              display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', fontWeight:600,
              fontFamily:"'Inter',sans-serif", transition:'all 0.18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background='rgba(230,16,13,0.15)'; e.currentTarget.style.color='#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}
          >
            <IconLogout />
            Sign Out
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="app-sidebar">
          {nav.map(section => (
            <div key={section.group} className="sidebar-section">
              <div className="sidebar-group-label">{section.group}</div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  className={`sidebar-item${activePage === item.id ? ' active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </button>
              ))}
              <div className="sidebar-divider" />
            </div>
          ))}
        </aside>

        {/* ── Content ─────────────────────────────────────── */}
        <main className="app-content">
          <div className="page-wrapper">
            {renderPage()}
          </div>
        </main>
      </div>

      <SimulatorControls />
    </div>
  );
}

/* ── App root — handles auth state routing ───────────────── */
function AppRouter() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) return <LoadingScreen />;

  // Public registration view (accessible without login)
  if (!user && showRegister) {
    return (
      <SystemProvider>
        <div className="app-shell">
          <header className="app-header">
            <div className="header-logo-zone">
              <img src="/ceva-logo.png" alt="CEVA Logistics" />
            </div>
            <div className="header-right">
              <button
                onClick={() => setShowRegister(false)}
                style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'0.8rem', fontWeight:600,
                  background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
                  borderRadius:8, padding:'7px 14px', cursor:'pointer', color:'rgba(255,255,255,0.8)',
                }}
              >
                Back to Login
              </button>
            </div>
          </header>
          <div className="app-body">
            <main className="app-content">
              <div className="page-wrapper">
                <CompanyRegistrationForm />
              </div>
            </main>
          </div>
        </div>
      </SystemProvider>
    );
  }

  // Not logged in — show login
  if (!user) {
    return <LoginPage onRegister={() => setShowRegister(true)} />;
  }

  // Logged in — wrap with data provider and show full app
  return (
    <SystemProvider>
      <AuthenticatedApp />
    </SystemProvider>
  );
}

/* ── Root export ─────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
