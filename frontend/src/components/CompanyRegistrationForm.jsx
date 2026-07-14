import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function CompanyRegistrationForm() {
  const { companies, registerCompany } = useSystem();

  const [formStep,               setFormStep]               = useState('fill'); // 'fill' | 'review' | 'success'

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [type,            setType]            = useState('vendor');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [successMsg,      setSuccessMsg]      = useState('');

  // Real-time compliance verification fields
  const [taxId,                  setTaxId]                  = useState('');
  const [dotNumber,              setDotNumber]              = useState('');
  const [insurancePolicy,        setInsurancePolicy]        = useState('');
  const [insuranceAmount,        setInsuranceAmount]        = useState('');
  const [dunsNumber,             setDunsNumber]             = useState('');
  const [physicalAddress,        setPhysicalAddress]        = useState('');
  const [bizRegType,             setBizRegType]             = useState('SSM (Malaysia)');
  const [gpsEquipped,            setGpsEquipped]            = useState('yes');
  const [customsLicense,         setCustomsLicense]         = useState('');
  const [iso9001,                setIso9001]                = useState(false);
  const [iso28000,               setIso28000]               = useState(false);
  const [tapaTsr,                setTapaTsr]                = useState(false);
  const [ctpat,                  setCtpat]                  = useState(false);
  const [gdpPharma,              setGdpPharma]              = useState(false);
  const [publicLiabilityLimit,   setPublicLiabilityLimit]   = useState('');
  const [acceptedTerms,          setAcceptedTerms]          = useState(false);

  const approvedVendors = companies.filter(c => c.status === 'approved' && c.type === 'vendor');
  const parentCompany = approvedVendors.find(v => v.id === parentCompanyId);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !taxId || !physicalAddress) {
      setSuccessMsg('Please fill in all required fields.');
      return;
    }
    if (type === 'trucking' && !dotNumber) {
      setSuccessMsg('DOT/MC License Number is required for trucking carriers.');
      return;
    }
    setSuccessMsg('');
    setFormStep('review');
  };

  const handleFinalSubmit = async () => {
    if (!acceptedTerms) {
      setSuccessMsg('You must accept the terms and conditions to submit.');
      return;
    }

    const res = await registerCompany(name, email, phone, type, type === 'trucking' ? parentCompanyId : '', {
      taxId,
      dotNumber: type === 'trucking' ? dotNumber : null,
      insurancePolicy,
      insuranceAmount,
      dunsNumber,
      physicalAddress,
      bizRegType,
      gpsEquipped: type === 'trucking' ? gpsEquipped : null,
      customsLicense,
      iso9001,
      iso28000,
      tapaTsr,
      ctpat,
      gdpPharma,
      publicLiabilityLimit,
    });

    if (res) {
      setFormStep('success');
      setSuccessMsg('');
    } else {
      setSuccessMsg('An error occurred during submission. Please try again.');
    }
  };

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setType('vendor'); setParentCompanyId('');
    setTaxId(''); setDotNumber(''); setInsurancePolicy(''); setInsuranceAmount('');
    setDunsNumber(''); setPhysicalAddress(''); setCustomsLicense('');
    setIso9001(false); setIso28000(false); setTapaTsr(false); setCtpat(false); setGdpPharma(false);
    setPublicLiabilityLimit('');
    setAcceptedTerms(false);
    setFormStep('fill');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 'calc(100vh - 120px)', padding: '20px 0' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        
        {/* Page header */}
        <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: 6, marginBottom: 24, borderBottom: 'none' }}>
          <div className="page-title" style={{ fontSize: '1.8rem', fontWeight: 700 }}>Company Onboarding Application</div>
          <div className="page-subtitle" style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {formStep === 'fill' && 'Submit a verification request for Ceva Logistics facility access clearance'}
            {formStep === 'review' && 'Review your registration details carefully before final submission'}
            {formStep === 'success' && 'Onboarding Application Submitted Successfully'}
          </div>
        </div>

        {formStep === 'fill' && (
          <>
            {/* Info callout */}
            <div className="info-callout" style={{ marginBottom: 20 }}>
              <div className="info-callout-title">About the Registration Process</div>
              <div className="info-callout-text">
                Standard vendor companies submit directly and are reviewed by Ceva Logistics Admin.
                Trucking 3PL sub-contractors route through their parent vendor first for initial clearance,
                then receive a final 2FA verification from Ceva before full approval.
              </div>
            </div>

            {/* Form */}
            <div className="form-panel">
              <div className="form-panel-header">
                <div className="form-panel-title">Company Information</div>
                <div className="form-panel-desc">Enter your company details and select the appropriate onboarding category.</div>
              </div>
              <div className="form-panel-body">
                <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div className="field-group">
                    <label>Company / Organization Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Atlantic Carrier Group"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="fields-row">
                    <div className="field-group">
                      <label>Business Email Address *</label>
                      <input
                        type="email"
                        placeholder="ops@company.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label>Contact Phone Number *</label>
                      <input
                        type="text"
                        placeholder="+1 555-0992"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 14 }}>
                      Onboarding Category
                    </div>

                    <div className="fields-row">
                      <div className="field-group">
                        <label>Company Type *</label>
                        <select
                          value={type}
                          onChange={e => { setType(e.target.value); setParentCompanyId(''); }}
                        >
                          <option value="vendor">Standard Vendor (VMS)</option>
                          <option value="trucking">Trucking 3PL Partner (TMS)</option>
                        </select>
                      </div>

                      {type === 'trucking' && (
                        <div className="field-group">
                          <label>Parent Vendor Company</label>
                          <select
                            value={parentCompanyId}
                            onChange={e => setParentCompanyId(e.target.value)}
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

                    {type === 'trucking' && (
                      <div className="info-callout" style={{ marginTop: 12 }}>
                        <div className="info-callout-title">Trucking Sub-Contractor Routing</div>
                        <div className="info-callout-text">
                          Your application will first be reviewed by the selected parent vendor,
                          then forwarded to Ceva Logistics for final 2FA approval.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compliance & Verification section */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: 14 }}>
                      Regulatory Compliance & Verification
                    </div>

                    <div className="fields-row">
                      <div className="field-group">
                        <label>Corporate Registry Type *</label>
                        <select value={bizRegType} onChange={e => setBizRegType(e.target.value)}>
                          <option value="SSM (Malaysia)">SSM (Malaysia)</option>
                          <option value="ACRA (Singapore)">ACRA (Singapore)</option>
                          <option value="EIN (United States)">EIN (United States)</option>
                          <option value="Trade Register (Europe)">Trade Register (Europe)</option>
                          <option value="Other">Other Global Registry</option>
                        </select>
                      </div>
                      <div className="field-group">
                        <label>Registration Number / Tax ID *</label>
                        <input
                          type="text"
                          placeholder="e.g. 202601023456 / XX-XXXXXXX"
                          value={taxId}
                          onChange={e => setTaxId(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="fields-row" style={{ marginTop: 12 }}>
                      <div className="field-group">
                        <label>DUNS Number (Dun & Bradstreet)</label>
                        <input
                          type="text"
                          placeholder="e.g. 12-345-6789"
                          value={dunsNumber}
                          onChange={e => setDunsNumber(e.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label>Customs Agent License ID (If applicable)</label>
                        <input
                          type="text"
                          placeholder="e.g. CUST-MY-8899"
                          value={customsLicense}
                          onChange={e => setCustomsLicense(e.target.value)}
                        />
                      </div>
                    </div>

                    {type === 'trucking' && (
                      <div className="fields-row" style={{ marginTop: 12 }}>
                        <div className="field-group">
                          <label>US DOT / MC Number *</label>
                          <input
                            type="text"
                            placeholder="e.g. USDOT 1234567"
                            value={dotNumber}
                            onChange={e => setDotNumber(e.target.value)}
                            required
                          />
                        </div>
                        <div className="field-group">
                          <label>GPS Tracking Active *</label>
                          <select value={gpsEquipped} onChange={e => setGpsEquipped(e.target.value)}>
                            <option value="yes">Equipped & Active (APAD Compliant)</option>
                            <option value="no">Not Equipped</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="fields-row" style={{ marginTop: 12 }}>
                      <div className="field-group">
                        <label>Cargo Insurance Policy</label>
                        <input
                          type="text"
                          placeholder="Policy # e.g. CRG-9988"
                          value={insurancePolicy}
                          onChange={e => setInsurancePolicy(e.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label>Cargo Liability Coverage Limit ($)</label>
                        <select value={insuranceAmount} onChange={e => setInsuranceAmount(e.target.value)}>
                          <option value="">-- Select Limit --</option>
                          <option value="$1,000,000">$1,000,000 Minimum</option>
                          <option value="$2,000,000">$2,000,000 Standard</option>
                          <option value="$5,000,000">$5,000,000 Premium</option>
                        </select>
                      </div>
                    </div>

                    <div className="fields-row" style={{ marginTop: 12 }}>
                      <div className="field-group">
                        <label>Public Liability Policy Limit ($)</label>
                        <select value={publicLiabilityLimit} onChange={e => setPublicLiabilityLimit(e.target.value)}>
                          <option value="">-- Select Limit --</option>
                          <option value="$1,000,000">$1,000,000 Minimum</option>
                          <option value="$2,000,000">$2,000,000 Standard</option>
                          <option value="$5,000,000">$5,000,000 Premium</option>
                          <option value="$10,000,000+">$10,000,000+ High Limit</option>
                        </select>
                      </div>
                    </div>

                    {/* Safety & Compliance Certifications */}
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 8 }}>Safety & Security Certifications Held</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={iso9001} onChange={e => setIso9001(e.target.checked)} />
                          <span>ISO 9001 (Quality Management)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={iso28000} onChange={e => setIso28000(e.target.checked)} />
                          <span>ISO 28000 (Supply Chain Security)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={tapaTsr} onChange={e => setTapaTsr(e.target.checked)} />
                          <span>TAPA TSR (Truck Security Requirements)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={ctpat} onChange={e => setCtpat(e.target.checked)} />
                          <span>C-TPAT / AEO Certified Security</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={gdpPharma} onChange={e => setGdpPharma(e.target.checked)} />
                          <span>GDP / GDPMD (Pharma Distribution)</span>
                        </label>
                      </div>
                    </div>

                    <div className="field-group" style={{ marginTop: 16 }}>
                      <label>Physical Headquarter Address *</label>
                      <input
                        type="text"
                        placeholder="e.g. Level 15, Menara CIMB, Jalan Stesen Sentral 2, Kuala Lumpur, 50470"
                        value={physicalAddress}
                        onChange={e => setPhysicalAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: 10 }}>
                    Review Application Details
                  </button>

                  {successMsg && (
                    <div className="form-feedback-error" style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, marginTop: 8 }}>{successMsg}</div>
                  )}
                </form>
              </div>
            </div>
          </>
        )}

        {formStep === 'review' && (
          <div className="form-panel">
            <div className="form-panel-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              <div className="form-panel-title">Application Verification Review</div>
              <div className="form-panel-desc">Please verify all compliance details carefully before final registration.</div>
            </div>
            
            <div className="form-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: '#64748b' }}>Company Name:</strong>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{name}</div>
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>Partnership Type:</strong>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: 2, textTransform: 'capitalize' }}>
                    {type === 'trucking' ? 'Trucking 3PL Partner' : 'Standard Vendor'}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>Business Email:</strong>
                  <div style={{ marginTop: 2 }}>{email}</div>
                </div>
                <div>
                  <strong style={{ color: '#64748b' }}>Contact Phone:</strong>
                  <div style={{ marginTop: 2 }}>{phone}</div>
                </div>
                
                {type === 'trucking' && (
                  <div>
                    <strong style={{ color: '#64748b' }}>Parent Vendor Broker:</strong>
                    <div style={{ marginTop: 2 }}>{parentCompany ? parentCompany.name : 'Independent Carrier'}</div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Registry & Licensing Compliance
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: '#64748b' }}>Registry Authority:</strong>
                    <div style={{ marginTop: 2 }}>{bizRegType}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Tax / Reg ID Number:</strong>
                    <div style={{ marginTop: 2 }}>{taxId}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>DUNS Number:</strong>
                    <div style={{ marginTop: 2 }}>{dunsNumber || 'Not provided'}</div>
                  </div>
                  {customsLicense && (
                    <div>
                      <strong style={{ color: '#64748b' }}>Customs License ID:</strong>
                      <div style={{ marginTop: 2 }}>{customsLicense}</div>
                    </div>
                  )}
                  {type === 'trucking' && (
                    <>
                      <div>
                        <strong style={{ color: '#64748b' }}>US DOT / MC Number:</strong>
                        <div style={{ marginTop: 2 }}>{dotNumber}</div>
                      </div>
                      <div>
                        <strong style={{ color: '#64748b' }}>GPS Tracking Status:</strong>
                        <div style={{ marginTop: 2 }}>{gpsEquipped === 'yes' ? '✅ Active / Compliant' : '❌ Inactive'}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Liability Policies & Safety Certifications
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.85rem' }}>
                  <div>
                    <strong style={{ color: '#64748b' }}>Cargo Insurance:</strong>
                    <div style={{ marginTop: 2 }}>{insurancePolicy ? `${insurancePolicy} (${insuranceAmount || 'No Limit'})` : 'None'}</div>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Public Liability Limit:</strong>
                    <div style={{ marginTop: 2 }}>{publicLiabilityLimit || 'Not Specified'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Declared Security Certifications:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {iso9001 && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>ISO 9001</span>}
                      {iso28000 && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>ISO 28000</span>}
                      {tapaTsr && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>TAPA TSR</span>}
                      {ctpat && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>C-TPAT / AEO</span>}
                      {gdpPharma && <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>GDP Pharma</span>}
                      {!iso9001 && !iso28000 && !tapaTsr && !ctpat && !gdpPharma && <span style={{ color: '#94a3b8' }}>None Declared</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <strong style={{ color: '#64748b', fontSize: '0.85rem' }}>Physical Address:</strong>
                <div style={{ fontSize: '0.88rem', marginTop: 2 }}>{physicalAddress}</div>
              </div>

              {/* Terms and Conditions */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <label htmlFor="terms-checkbox" style={{ fontSize: '0.8rem', color: '#475569', cursor: 'pointer', lineHeight: 1.4 }}>
                  <strong>Declaration Agreement *</strong><br />
                  I declare that the details provided are true and accurate to the best of our corporate records. We agree to comply with Ceva Logistics' Safety Code of Conduct, Facility Access Security standards, and active GPS-tracking requirements during operations.
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn-action" style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '12px' }} onClick={() => setFormStep('fill')}>
                  Go Back & Edit
                </button>
                <button type="button" className="btn-primary" style={{ flex: 2, padding: '12px' }} onClick={handleFinalSubmit}>
                  Confirm & Submit Onboarding Application
                </button>
              </div>

              {successMsg && (
                <div className="form-feedback-error" style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{successMsg}</div>
              )}
            </div>
          </div>
        )}

        {formStep === 'success' && (
          <div className="form-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: '2rem', marginBottom: 20 }}>
              ✓
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Application Submitted!</h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Your onboarding request has been successfully transmitted. Ceva Logistics safety and operations teams will review your credentials against local SSM/APAD regulations.
            </p>
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={resetForm}>
              Submit Another Application
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
