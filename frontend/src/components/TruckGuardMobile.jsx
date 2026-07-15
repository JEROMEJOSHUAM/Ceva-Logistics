import React, { useState } from 'react';
import { useSystem } from '../context/SystemState';

export default function TruckGuardMobile() {
  const {
    deliveries,
    trucks,
    drivers,
    companies,
    checkInTruck,
    checkOutTruck,
    activeTruckHeadcount,
    triggerTruckOverstay,
    alerts
  } = useSystem();

  // Scan states
  const [selectedDeliveryId, setSelectedDeliveryId] = useState('');
  const [ocrVerified, setOcrVerified] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);
  const [sealVerified, setSealVerified] = useState(false);
  const [hasCapturedPhotos, setHasCapturedPhotos] = useState(false);

  // checkout state
  const [checkoutDeliveryId, setCheckoutDeliveryId] = useState('');
  const [exitOcrVerified, setExitOcrVerified] = useState(false);
  const [exitPhotoVerified, setExitPhotoVerified] = useState(false);
  const [exitSealVerified, setExitSealVerified] = useState(false);
  const [hasCapturedExitPhotos, setHasCapturedExitPhotos] = useState(false);

  const activeAlerts = alerts.filter(a => !a.resolved && a.message.includes('TRUCK'));
  const currentDelivery = deliveries.find(d => d.id === selectedDeliveryId);
  const currentDriver = currentDelivery ? drivers.find(dr => dr.id === currentDelivery.driverId) : null;
  const currentTruck = currentDelivery ? trucks.find(t => t.id === currentDelivery.truckId) : null;
  
  const dispatchedDeliveries = deliveries.filter(d => !d.checkedIn && d.status === 'assigned');
  const onsiteDeliveries = deliveries.filter(d => d.checkedIn && !d.checkedOut);

  const handleScanSelect = (deliveryId) => {
    setSelectedDeliveryId(deliveryId);
    setOcrVerified(false);
    setPhotoVerified(false);
    setSealVerified(false);
    setHasCapturedPhotos(false);
  };

  const handleCheckoutSelect = (deliveryId) => {
    setCheckoutDeliveryId(deliveryId);
    setExitOcrVerified(false);
    setExitPhotoVerified(false);
    setExitSealVerified(false);
    setHasCapturedExitPhotos(false);
  };

  const simulateOCRScan = () => {
    if (!currentTruck) return;
    setOcrVerified(true);
  };

  const simulatePhotoCapture = () => {
    setHasCapturedPhotos(true);
    setPhotoVerified(true);
  };

  const simulateSealVerify = () => {
    setSealVerified(true);
  };

  const handleCheckInSubmit = () => {
    if (!ocrVerified || !photoVerified || !sealVerified) return;
    checkInTruck(
      selectedDeliveryId,
      ocrVerified,
      photoVerified,
      sealVerified,
      'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=100&h=100&fit=crop', // mock guard photo
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop', // mock container photo
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop'  // mock live seal photo
    );
    setSelectedDeliveryId('');
  };

  const handleCheckOutSubmit = (deliveryId) => {
    if (!exitOcrVerified || !exitPhotoVerified || !exitSealVerified) return;
    checkOutTruck(deliveryId);
    setCheckoutDeliveryId('');
    setExitOcrVerified(false);
    setExitPhotoVerified(false);
    setExitSealVerified(false);
    setHasCapturedExitPhotos(false);
  };

  return (
    <div className="mobile-app-wrapper guard-wrapper">
      {/* Mobile Header */}
      <div className="mobile-header guard-header" style={{ backgroundColor: 'var(--ceva-blue)' }}>
        <div className="mobile-status-bar">
          <span>9:41 AM</span>
          <div className="status-icons">📶 🔋</div>
        </div>
        <div className="mobile-title">
          <span>Guard Cargo Inspection</span>
        </div>
      </div>

      <div className="mobile-content">
        {/* Headcount Card */}
        <div className="guard-headcount-card">
          <div className="headcount-label">ACTIVE FREIGHT TRUCKS ON-SITE</div>
          <div className="headcount-num">{activeTruckHeadcount}</div>
          <div className="headcount-sub">Total trucks logged in at container bays</div>
        </div>

        {/* Alerts Alarm */}
        {activeAlerts.length > 0 && (
          <div className="guard-alarm-alert pulse-danger">
            ⚠️ TMS OVERSTAY WARNING: {activeAlerts.length} Truck(s) Alert
          </div>
        )}

        {/* Outbound/Inbound Scan Selector */}
        <div className="scanner-simulator-box">
          <h4>📷 Gate License Plate OCR Scanner</h4>
          <p className="scanner-desc">Scan incoming truck license plates to fetch dispatch documents.</p>
          <select 
            value={selectedDeliveryId} 
            onChange={(e) => handleScanSelect(e.target.value)}
            className="mobile-select"
          >
            <option value="">-- Click to Scan OCR Plate --</option>
            {dispatchedDeliveries.map(d => {
              const driver = drivers.find(dr => dr.id === d.driverId);
              const truck = trucks.find(t => t.id === d.truckId);
              const company = companies.find(c => c.id === d.companyId);
              return (
                <option key={d.id} value={d.id}>
                  Scan Plate: {truck?.plate} ({company?.name}) - [{d.type.toUpperCase()}]
                </option>
              );
            })}
          </select>
        </div>

        {/* Selected Inspection Workflow */}
        {currentDelivery && (
          <div className="scan-result-card slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="scan-status-badge entry" style={{ alignSelf: 'center' }}>
              INSPECTION PROTOCOL ACTIVE: #{currentDelivery.id.slice(-5)}
            </div>
            <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
              <strong>1. Plate & Destination Check</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontSize: '0.78rem' }}>
                <span>Scheduled Plate: <strong>{currentTruck?.plate}</strong></span>
                <span>Destination Facility: <strong>{currentDelivery.destinationFacility || 'CEVA Hub - Dock A'}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  className={`btn-simulate-alert ${ocrVerified ? 'triggered' : ''}`}
                  style={{ backgroundColor: ocrVerified ? 'var(--color-success)' : 'var(--ceva-blue)', color: 'white', borderColor: ocrVerified ? 'var(--color-success)' : 'var(--ceva-blue)' }}
                  onClick={simulateOCRScan}
                  disabled={ocrVerified}
                >
                  {ocrVerified ? '🟢 OCR Match OK' : 'Trigger OCR Scan'}
                </button>
              </div>
            </div>

            {/* Step 2: Evidence Photos checklist */}
            <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
              <strong>2. Photographic Evidence Comparison</strong>
              <div className="inspection-photo-grid">
                <div className={`photo-placeholder-box ${hasCapturedPhotos ? 'success' : ''}`}>
                  {hasCapturedPhotos ? (
                    <img src={currentDelivery.containerPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" alt="" />
                  ) : (
                    <span>🚛 Dispatched Container</span>
                  )}
                </div>
                <div className={`photo-placeholder-box ${hasCapturedPhotos ? 'success' : ''}`}>
                  {hasCapturedPhotos ? (
                    <img src={currentDriver?.photo} className="photo-thumb-mini" alt="" />
                  ) : (
                    <span>👤 Driver Profile</span>
                  )}
                </div>
                <div className={`photo-placeholder-box ${hasCapturedPhotos ? 'success' : ''}`}>
                  {hasCapturedPhotos ? (
                    <img src={currentDelivery.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" alt="" />
                  ) : (
                    <span>📦 Baseline Seal</span>
                  )}
                </div>
              </div>
              <button 
                className="mobile-btn" 
                style={{ marginTop: '8px', fontSize: '0.75rem' }} 
                onClick={simulatePhotoCapture}
                disabled={hasCapturedPhotos}
              >
                📸 Fetch & Compare Dispatch Images
              </button>
            </div>

            {/* Step 3: On-the-spot Photo Verification */}
            {hasCapturedPhotos && (
              <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
                <strong>3. Biometric Driver ID Verification</strong>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <div style={{ textAlign: 'center', flex: '1' }}>
                    <img src={currentDriver?.photo} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    <div style={{ fontSize: '0.55rem' }}>Dispatched Profile</div>
                  </div>
                  <span style={{ fontSize: '1rem' }}>➡️</span>
                  <div style={{ textAlign: 'center', flex: '1' }}>
                    <img src={currentDriver?.photo} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', filter: 'hue-rotate(30deg)' }} alt="" />
                    <div style={{ fontSize: '0.55rem' }}>Gate Live Capture</div>
                  </div>
                  <div style={{ flex: '2', fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
                    ✅ Driver Match: 98% Correct (Biometric Verified)
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Seal Tamper Comparison verification */}
            {hasCapturedPhotos && (
              <div className="scan-details" style={{ backgroundColor: '#ffffff' }}>
                <strong>4. Container Seal Tamper Check</strong>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Compare baseline seal image from Sender with guard's gate seal photo.</p>
                <div className="seal-match-verification-card">
                  <div className="seal-images-comparison">
                    <div className="comparison-box">
                      <img src={currentDelivery.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} alt="" />
                      <span>Sender Dispatch</span>
                    </div>
                    <div className="comparison-box">
                      <img src={currentDelivery.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} style={{ filter: 'contrast(1.1) brightness(0.95)' }} alt="" />
                      <span>Gate Inspection Live</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem' }}>Seal #: {currentDelivery.sealNumber}</span>
                    <button 
                      className={`btn-simulate-alert ${sealVerified ? 'triggered' : ''}`}
                      style={{ backgroundColor: sealVerified ? 'var(--color-success)' : 'var(--ceva-blue)', color: 'white', borderColor: sealVerified ? 'var(--color-success)' : 'var(--ceva-blue)', fontSize: '0.65rem', padding: '4px 8px' }}
                      onClick={simulateSealVerify}
                      disabled={sealVerified}
                    >
                      {sealVerified ? '✅ Seal Matched' : 'Physically Verify Seal'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Check-In Action Button */}
            <button 
              className="mobile-btn btn-success" 
              onClick={handleCheckInSubmit}
              disabled={!ocrVerified || !photoVerified || !sealVerified}
            >
              🟢 Complete Gate Check-In
            </button>
          </div>
        )}

        {/* Onsite checked in trucks */}
        <div className="guard-onsite-list">
          <h4>Checked-In Freight Trucks ({onsiteDeliveries.length})</h4>
          {onsiteDeliveries.length === 0 ? (
            <p className="empty-text">No freight trucks registered inside bays.</p>
          ) : (
            <div className="onsite-cards-container">
              {onsiteDeliveries.map(d => {
                const driver = drivers.find(dr => dr.id === d.driverId);
                const truck = trucks.find(t => t.id === d.truckId);
                const company = companies.find(c => c.id === d.companyId);
                const hasAlert = alerts.some(a => a.passId === d.id && !a.resolved);
                const isSelectedCheckout = checkoutDeliveryId === d.id;

                return (
                  <div key={d.id} className={`onsite-card ${hasAlert ? 'alert-border' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={driver?.photo} alt="" className="onsite-avatar" />
                      <div className="onsite-details">
                        <strong>Truck Plate: {truck?.plate} ({d.type.toUpperCase()})</strong>
                        <span className="vendor-lbl">{company?.name}</span>
                        <span className="zone-lbl">Driver: {driver?.name} | Cargo: {d.items}</span>
                      </div>
                      <div className="onsite-actions">
                        <button 
                          className={`btn-simulate-alert ${hasAlert ? 'triggered' : ''}`}
                          onClick={() => triggerTruckOverstay(d.id)}
                          disabled={hasAlert}
                        >
                          {hasAlert ? '⚠️ Overstay' : 'Simulate Overstay'}
                        </button>
                      </div>
                    </div>

                    {/* Checkout verification section */}
                    {isSelectedCheckout ? (
                      <div className="scan-result-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', marginTop: '8px' }}>
                        <div className="scan-status-badge entry" style={{ alignSelf: 'center', backgroundColor: '#e11d48' }}>
                          OUTBOUND INSPECTION: #{d.id.slice(-5)}
                        </div>

                        {/* Step 1: Plate OCR Check */}
                        <div className="scan-details" style={{ backgroundColor: '#ffffff', padding: '8px' }}>
                          <strong>1. Exit Plate Check</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem' }}>
                            <span>Plate: <strong>{truck?.plate}</strong></span>
                            <button 
                              type="button"
                              className={`btn-simulate-alert ${exitOcrVerified ? 'triggered' : ''}`}
                              style={{ backgroundColor: exitOcrVerified ? 'var(--color-success)' : 'var(--ceva-blue)', color: 'white', borderColor: exitOcrVerified ? 'var(--color-success)' : 'var(--ceva-blue)', fontSize: '0.65rem', padding: '4px 8px' }}
                              onClick={() => setExitOcrVerified(true)}
                              disabled={exitOcrVerified}
                            >
                              {exitOcrVerified ? '🟢 Exit OCR OK' : 'Trigger OCR Scan'}
                            </button>
                          </div>
                        </div>

                        {/* Step 2: Evidence Photos checklist */}
                        <div className="scan-details" style={{ backgroundColor: '#ffffff', padding: '8px' }}>
                          <strong>2. Outbound Photos</strong>
                          <div className="inspection-photo-grid" style={{ gap: '6px', marginTop: '6px' }}>
                            <div className={`photo-placeholder-box ${hasCapturedExitPhotos ? 'success' : ''}`} style={{ padding: '4px', height: '60px', fontSize: '0.6rem' }}>
                              {hasCapturedExitPhotos ? (
                                <img src={d.containerPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" style={{ width: '32px', height: '32px' }} alt="" />
                              ) : (
                                <span>🚛 Exit Container</span>
                              )}
                            </div>
                            <div className={`photo-placeholder-box ${hasCapturedExitPhotos ? 'success' : ''}`} style={{ padding: '4px', height: '60px', fontSize: '0.6rem' }}>
                              {hasCapturedExitPhotos ? (
                                <img src={driver?.photo} className="photo-thumb-mini" style={{ width: '32px', height: '32px' }} alt="" />
                              ) : (
                                <span>👤 Driver Profile</span>
                              )}
                            </div>
                            <div className={`photo-placeholder-box ${hasCapturedExitPhotos ? 'success' : ''}`} style={{ padding: '4px', height: '60px', fontSize: '0.6rem' }}>
                              {hasCapturedExitPhotos ? (
                                <img src={d.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} className="photo-thumb-mini" style={{ width: '32px', height: '32px' }} alt="" />
                              ) : (
                                <span>📦 Exit Seal</span>
                              )}
                            </div>
                          </div>
                          <button 
                            type="button"
                            className="mobile-btn" 
                            style={{ marginTop: '8px', fontSize: '0.7rem', padding: '6px' }} 
                            onClick={() => {
                              setHasCapturedExitPhotos(true);
                              setExitPhotoVerified(true);
                            }}
                            disabled={hasCapturedExitPhotos}
                          >
                            📸 Capture Outbound Images
                          </button>
                        </div>

                        {/* Step 3: Biometric Driver ID Verification */}
                        {hasCapturedExitPhotos && (
                          <div className="scan-details" style={{ backgroundColor: '#ffffff', padding: '8px' }}>
                            <strong>3. Driver Biometric Verification</strong>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
                              <div style={{ textAlign: 'center', flex: '1' }}>
                                <img src={driver?.photo} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <div style={{ fontSize: '0.5rem' }}>Baseline</div>
                              </div>
                              <span style={{ fontSize: '0.8rem' }}>➡️</span>
                              <div style={{ textAlign: 'center', flex: '1' }}>
                                <img src={driver?.photo} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', filter: 'hue-rotate(60deg)' }} alt="" />
                                <div style={{ fontSize: '0.5rem' }}>Exit Captured</div>
                              </div>
                              <div style={{ flex: '2', fontSize: '0.65rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
                                ✅ Driver Match: 98%
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Seal Tamper Comparison verification */}
                        {hasCapturedExitPhotos && (
                          <div className="scan-details" style={{ backgroundColor: '#ffffff', padding: '8px' }}>
                            <strong>4. Outbound Seal Tamper Check</strong>
                            <div className="seal-images-comparison" style={{ marginTop: '6px' }}>
                              <div className="comparison-box">
                                <img src={d.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} style={{ height: '50px' }} alt="" />
                                <span style={{ fontSize: '0.55rem' }}>Entry Baseline</span>
                              </div>
                              <div className="comparison-box">
                                <img src={d.baselineSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100'} style={{ filter: 'contrast(1.1) brightness(0.95)', height: '50px' }} alt="" />
                                <span style={{ fontSize: '0.55rem' }}>Exit Live</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                              <span style={{ fontSize: '0.65rem' }}>Seal #: {d.sealNumber}</span>
                              <button 
                                type="button"
                                className={`btn-simulate-alert ${exitSealVerified ? 'triggered' : ''}`}
                                style={{ backgroundColor: exitSealVerified ? 'var(--color-success)' : 'var(--ceva-blue)', color: 'white', borderColor: exitSealVerified ? 'var(--color-success)' : 'var(--ceva-blue)', fontSize: '0.65rem', padding: '4px 8px' }}
                                onClick={() => setExitSealVerified(true)}
                                disabled={exitSealVerified}
                              >
                                {exitSealVerified ? '✅ Seal Matched' : 'Verify Outbound Seal'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button 
                            type="button"
                            className="mobile-btn btn-danger" 
                            style={{ margin: 0, padding: '6px', fontSize: '0.7rem', flex: 1 }}
                            onClick={() => handleCheckOutSubmit(d.id)}
                            disabled={!exitOcrVerified || !exitPhotoVerified || !exitSealVerified}
                          >
                            🔴 Complete Outbound Exit
                          </button>
                          <button 
                            type="button"
                            className="mobile-btn btn-close" 
                            style={{ margin: 0, padding: '6px', fontSize: '0.7rem', backgroundColor: '#e2e8f0', color: 'var(--text-primary)', flex: 1 }}
                            onClick={() => setCheckoutDeliveryId('')}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        className="mobile-btn btn-danger" 
                        style={{ padding: '6px', fontSize: '0.7rem', marginTop: '4px' }}
                        onClick={() => handleCheckoutSelect(d.id)}
                      >
                        Log Depart/Exit Gate
                      </button>
                    )}
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
