import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function CompanyRegistrationForm() {
  const { companies, registerCompany } = useSystem();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('vendor'); // 'vendor' or 'trucking'
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const approvedVendors = companies.filter(c => c.status === 'approved' && c.type === 'vendor');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setSuccessMsg('Please fill in all required fields.');
      return;
    }

    registerCompany(name, email, phone, type, type === 'trucking' ? parentCompanyId : '');
    
    // Clear form
    setName('');
    setEmail('');
    setPhone('');
    setType('vendor');
    setParentCompanyId('');
    
    setSuccessMsg('🎉 Registration submitted! Application sent in real-time to Ceva Logistics.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="portal-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="portal-header">
        <h2>Submit Access Application</h2>
        <span className="badge-role ceva-badge">External Registration Portal</span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Complete this form to apply for access to Ceva Logistics facility operations. Standard vendors submit directly for Ceva review. Trucking subcontracting 3PL partners will route through their parent vendor first.
      </p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Company / Organization Name *</label>
          <input 
            type="text" 
            placeholder="e.g. Atlantic Carrier Group" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Business Email Address *</label>
            <input 
              type="email" 
              placeholder="ops@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Phone Number *</label>
            <input 
              type="text" 
              placeholder="+1 555-0992" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Onboarding Category *</label>
            <select 
              value={type} 
              onChange={(e) => {
                setType(e.target.value);
                setParentCompanyId('');
              }}
            >
              <option value="vendor">Standard Vendor (VMS Visitor)</option>
              <option value="trucking">Trucking 3PL Partner (TMS Logistics)</option>
            </select>
          </div>

          {type === 'trucking' && (
            <div className="form-group">
              <label>Parent/Contractor Vendor</label>
              <select 
                value={parentCompanyId} 
                onChange={(e) => setParentCompanyId(e.target.value)}
                required
              >
                <option value="">-- Independent Carrier --</option>
                {approvedVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button type="submit" className="btn-submit" style={{ padding: '12px' }}>
          🚀 Submit Onboarding Application
        </button>

        {successMsg && (
          <div className="sim-toast slide-in" style={{ textAlign: 'center', marginTop: '10px', display: 'block' }}>
            {successMsg}
          </div>
        )}
      </form>
    </div>
  );
}
