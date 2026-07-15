import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ── Role display config ─────────────────────────────────── */
const ROLE_CONFIG = {
  ceva_admin:    { label: 'Ceva Logistics Admin',      color: '#002048', badge: 'CEVA ADMIN' },
  company_admin: { label: 'Vendor Company Admin',      color: '#6d28d9', badge: 'COMPANY ADMIN' },
  cargo_admin:   { label: 'Truck & Cargo Fleet Admin', color: '#d97706', badge: 'CARGO ADMIN' },
};

/* ── Eye icon ────────────────────────────────────────────── */
const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

export default function LoginPage({ onRegister }) {
  const { signIn, error, setError } = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required.'); return; }
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Left Brand Panel ───────────────────────────────── */}
      <div style={{
        width: 480, flexShrink: 0,
        background: 'linear-gradient(160deg, #001433 0%, #002a5e 60%, #001433 100%)',
        display: 'flex', flexDirection: 'column',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(230,16,13,0.06)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />
        <div style={{ position:'absolute', top:'40%', left:-30, width:150, height:150, borderRadius:'50%', background:'rgba(230,16,13,0.04)' }} />

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1 }}>
          <img src="/ceva-logo.png" alt="CEVA Logistics" style={{ height: 52, objectFit:'contain', filter:'brightness(0) invert(1)' }} />
          <div style={{ width: 40, height: 3, background: '#e6100d', borderRadius: 2, marginTop: 16 }} />
        </div>

        {/* Headline */}
        <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', justifyContent:'center', marginTop: 48 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(255,255,255,0.4)', marginBottom: 12 }}>
            CEVA Logistics — Partner Network
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: 16 }}>
            Visitor & Truck Management System
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 340 }}>
            Secure multi-role operations platform for managing vendor access, cargo logistics, and gate pass authorization across CEVA facilities.
          </p>

          {/* Role pills */}
          <div style={{ display:'flex', flexDirection:'column', gap: 10, marginTop: 40 }}>
            {Object.values(ROLE_CONFIG).map(r => (
              <div key={r.label} style={{
                display:'flex', alignItems:'center', gap: 10,
                background:'rgba(255,255,255,0.05)', borderRadius: 8,
                padding:'10px 14px', border:'1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#e6100d', flexShrink:0 }} />
                <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', fontWeight:500 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position:'relative', zIndex:1, fontSize:'0.72rem', color:'rgba(255,255,255,0.25)' }}>
          © 2026 CEVA Logistics. All rights reserved.
        </div>
      </div>

      {/* ── Right Login Panel ──────────────────────────────── */}
      <div style={{
        flex: 1,
        background: '#f1f5f9',
        display: 'flex', flexDirection:'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: '#ffffff',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 10px 40px rgba(15,23,42,0.1)',
          border: '1px solid #e2e8f0',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28, textAlign:'left' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#94a3b8', marginBottom:8 }}>
              Secure Admin Access
            </div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#0f172a', marginBottom:6, letterSpacing:'-0.02em' }}>
              Sign In to Your Account
            </h2>
            <p style={{ fontSize:'0.83rem', color:'#64748b', lineHeight:1.6 }}>
              Enter your admin credentials. Access is role-restricted.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:'rgba(220,38,38,0.06)', border:'1px solid rgba(220,38,38,0.2)',
              borderRadius: 8, padding:'10px 14px', marginBottom: 18,
              fontSize:'0.8rem', color:'#dc2626', fontWeight:500,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', color:'#64748b' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="admin@cevalogistics.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                autoFocus
                style={{
                  fontFamily:"'Inter',sans-serif", fontSize:'0.875rem',
                  padding:'10px 12px', border:'1.5px solid #cbd5e1', borderRadius:6,
                  outline:'none', color:'#0f172a', background:'#fff', width:'100%',
                  transition:'border-color 0.18s',
                }}
                onFocus={e => e.target.style.borderColor='#002048'}
                onBlur={e => e.target.style.borderColor='#cbd5e1'}
              />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', color:'#64748b' }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  style={{
                    fontFamily:"'Inter',sans-serif", fontSize:'0.875rem',
                    padding:'10px 40px 10px 12px', border:'1.5px solid #cbd5e1', borderRadius:6,
                    outline:'none', color:'#0f172a', background:'#fff', width:'100%',
                    transition:'border-color 0.18s',
                  }}
                  onFocus={e => e.target.style.borderColor='#002048'}
                  onBlur={e => e.target.style.borderColor='#cbd5e1'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#94a3b8',
                    display:'flex', alignItems:'center', padding:0,
                  }}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                fontFamily:"'Inter',sans-serif", fontSize:'0.9rem', fontWeight:700,
                background: submitting ? '#94a3b8' : '#002048', color:'white',
                border:'none', padding:'12px', borderRadius:8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop:6, transition:'background 0.18s', letterSpacing:'0.01em',
              }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'24px 0 0' }}>
            <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
            <span style={{ fontSize:'0.75rem', color:'#94a3b8', fontWeight:500 }}>or</span>
            <div style={{ flex:1, height:1, background:'#e2e8f0' }} />
          </div>

          {/* Quick Switch Profiles */}
          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#94a3b8', marginBottom:10 }}>
              ⚡ Prototype Profile Switcher
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('ceva_admin@cevalogistics.com');
                  setPassword('CevaAdmin@2026');
                  setError('');
                }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 600,
                  background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
                  padding: '10px 12px', color: '#002048', cursor: 'pointer', transition: 'all 0.18s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <span>🏢 CEVA Logistics Admin</span>
                <span style={{ fontSize: '0.65rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>ceva_admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('company_admin@quicktrans.com');
                  setPassword('Vendor@2026');
                  setError('');
                }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 600,
                  background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
                  padding: '10px 12px', color: '#6d28d9', cursor: 'pointer', transition: 'all 0.18s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <span>🤝 Vendor Company Admin</span>
                <span style={{ fontSize: '0.65rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>company_admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('cargo_admin@elitefleet.com');
                  setPassword('Cargo@2026');
                  setError('');
                }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 600,
                  background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
                  padding: '10px 12px', color: '#d97706', cursor: 'pointer', transition: 'all 0.18s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <span>🚛 Truck & Fleet Admin</span>
                <span style={{ fontSize: '0.65rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>cargo_admin</span>
              </button>
            </div>
          </div>

          {/* Register link */}
          <button
            onClick={onRegister}
            style={{
              width:'100%', marginTop:18,
              fontFamily:"'Inter',sans-serif", fontSize:'0.875rem', fontWeight:600,
              background:'transparent', border:'1.5px solid #e2e8f0',
              borderRadius:8, padding:'11px',
              color:'#002048', cursor:'pointer',
              transition:'all 0.18s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor='#002048'; e.currentTarget.style.background='rgba(0,32,72,0.04)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='transparent'; }}
          >
            New Partner? Register Your Company
          </button>
        </div>

        {/* Hint */}
        <div style={{ marginTop:20, textAlign:'center', fontSize:'0.75rem', color:'#94a3b8' }}>
          Contact CEVA IT Support if you have trouble accessing your account.
        </div>
      </div>
    </div>
  );
}
