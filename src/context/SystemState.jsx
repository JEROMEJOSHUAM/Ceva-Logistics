import React, { createContext, useContext, useState, useEffect } from 'react';

const SystemContext = createContext();

const SEEDED_COMPANIES = [
  { id: 'c1', name: 'QuickTrans Logistics', email: 'info@quicktrans.com', phone: '+1 555-0192', status: 'approved', type: 'vendor', createdAt: '2026-07-01' },
  { id: 'c2', name: 'SafeGuard Deliveries', email: 'contact@safeguard.com', phone: '+1 555-0143', status: 'approved', type: 'vendor', createdAt: '2026-07-03' },
  { id: 'c3', name: 'Express Freight Co', email: 'ops@expressfreight.com', phone: '+1 555-0177', status: 'pending', type: 'vendor', createdAt: '2026-07-08' },
  
  // Seeded Trucking Companies
  { id: 'tc1', name: 'Elite Fleet 3PL', email: 'ops@elitefleet.com', phone: '+1 555-4421', status: 'approved', type: 'trucking', parentCompanyId: 'c1', createdAt: '2026-07-05' },
  { id: 'tc2', name: 'Express Haulers', email: 'contact@expresshaulers.com', phone: '+1 555-4477', status: 'pending_vendor', type: 'trucking', parentCompanyId: 'c2', createdAt: '2026-07-08' },
  { id: 'tc3', name: 'Global Cargo Carriers', email: 'admin@globalcargo.com', phone: '+1 555-4499', status: 'pending_ceva', type: 'trucking', parentCompanyId: '', createdAt: '2026-07-09' }
];

const SEEDED_WORKERS = [
  { id: 'w1', name: 'Carlos Santana', email: 'carlos@quicktrans.com', phone: '+1 555-0231', companyId: 'c1', supervisorName: 'Robert Downey', status: 'approved', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  { id: 'w2', name: 'Elena Rostova', email: 'elena@safeguard.com', phone: '+1 555-0288', companyId: 'c2', supervisorName: 'Jane Doe', status: 'approved', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
  { id: 'w3', name: 'Liam Neeson', email: 'liam@expressfreight.com', phone: '+1 555-0299', companyId: 'c3', supervisorName: 'Alfred Pennyworth', status: 'pending', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
];

const SEEDED_PASSES = [
  { 
    id: 'p1', 
    workerId: 'w1', 
    companyId: 'c1', 
    supervisorName: 'Robert Downey', 
    zoneLevel: 'Zone A - Warehouse Floor', 
    startDate: '2026-07-09', 
    endDate: '2026-07-15', 
    startTime: '08:00', 
    endTime: '17:00', 
    purpose: 'Machinery Maintenance', 
    status: 'approved',
    checkedIn: false,
    checkedOut: false
  },
  { 
    id: 'p2', 
    workerId: 'w2', 
    companyId: 'c2', 
    supervisorName: 'Jane Doe', 
    zoneLevel: 'Zone B - Cargo Loading', 
    startDate: '2026-07-09', 
    endDate: '2026-07-10', 
    startTime: '06:00', 
    endTime: '14:00', 
    purpose: 'Cargo Loading & Packing', 
    status: 'pending_ceva',
    checkedIn: false,
    checkedOut: false
  }
];

// Seeded TMS Assets
const SEEDED_TRUCKS = [
  { id: 't1', plate: 'TX-8821', vin: '1FVAC54Y3G8921', model: 'Freightliner Cascadia', companyId: 'tc1', status: 'approved' },
  { id: 't2', plate: 'NY-4590', vin: '1FVAC54Y3G8945', model: 'Volvo VNL 860', companyId: 'tc1', status: 'pending' },
  { id: 't3', plate: 'CA-1122', vin: '1FVAC54Y3G8911', model: 'Peterbilt 579', companyId: 'tc2', status: 'approved' }
];

const SEEDED_DRIVERS = [
  { id: 'd1', name: 'Marcus Miller', license: 'DL-99210', companyId: 'tc1', status: 'approved', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { id: 'd2', name: 'Sara Connor', license: 'DL-88320', companyId: 'tc1', status: 'pending', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' }
];

const SEEDED_DELIVERIES = [
  {
    id: 'del_1',
    truckId: 't1',
    driverId: 'd1',
    companyId: 'tc1',
    type: 'dropoff', // Inbound
    sealNumber: 'SEAL-55441',
    baselineSealPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop', // Initial seal photo shared from Location A
    items: 'Electronics Batch 4A',
    status: 'assigned',
    checkedIn: false,
    checkedOut: false
  },
  {
    id: 'del_2',
    truckId: 't3',
    driverId: 'd1',
    companyId: 'tc1',
    type: 'pickup', // Outbound
    sealNumber: 'SEAL-99882',
    baselineSealPhoto: '', // Will be uploaded at gate when picking up
    items: 'Empty Containers (Return)',
    status: 'assigned',
    checkedIn: false,
    checkedOut: false
  }
];

export const SystemProvider = ({ children }) => {
  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('ceva_companies');
    return saved ? JSON.parse(saved) : SEEDED_COMPANIES;
  });

  const [workers, setWorkers] = useState(() => {
    const saved = localStorage.getItem('ceva_workers');
    return saved ? JSON.parse(saved) : SEEDED_WORKERS;
  });

  const [passes, setPasses] = useState(() => {
    const saved = localStorage.getItem('ceva_passes');
    return saved ? JSON.parse(saved) : SEEDED_PASSES;
  });

  // TMS State
  const [trucks, setTrucks] = useState(() => {
    const saved = localStorage.getItem('ceva_trucks');
    return saved ? JSON.parse(saved) : SEEDED_TRUCKS;
  });

  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem('ceva_drivers');
    return saved ? JSON.parse(saved) : SEEDED_DRIVERS;
  });

  const [deliveries, setDeliveries] = useState(() => {
    const saved = localStorage.getItem('ceva_deliveries');
    return saved ? JSON.parse(saved) : SEEDED_DELIVERIES;
  });

  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('ceva_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('ceva_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ceva_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('ceva_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('ceva_passes', JSON.stringify(passes));
  }, [passes]);

  useEffect(() => {
    localStorage.setItem('ceva_trucks', JSON.stringify(trucks));
  }, [trucks]);

  useEffect(() => {
    localStorage.setItem('ceva_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('ceva_deliveries', JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem('ceva_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('ceva_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // VMS active headcount
  const activeHeadcount = passes.filter(p => p.checkedIn && !p.checkedOut).length;
  // TMS active truck count
  const activeTruckHeadcount = deliveries.filter(d => d.checkedIn && !d.checkedOut).length;

  // Actions for VMS Onboarding
  const registerCompany = (name, email, phone, type = 'vendor', parentCompanyId = '') => {
    const newCompany = {
      id: 'c_' + Date.now(),
      name,
      email,
      phone,
      type,
      parentCompanyId,
      status: type === 'trucking' ? (parentCompanyId ? 'pending_vendor' : 'pending_ceva') : 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCompanies(prev => [...prev, newCompany]);
    return newCompany;
  };

  const verifyCompany = (companyId, approve = true) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        if (c.type === 'trucking') {
          // If approved by vendor, advance to pending_ceva
          if (c.status === 'pending_vendor') {
            return { ...c, status: approve ? 'pending_ceva' : 'rejected' };
          }
          // If in ceva admin review, advance to approved
          return { ...c, status: approve ? 'approved' : 'rejected' };
        } else {
          return { ...c, status: approve ? 'approved' : 'rejected' };
        }
      }
      return c;
    }));
  };

  const registerWorker = (name, companyId, supervisorName, email, phone) => {
    const newWorker = {
      id: 'w_' + Date.now(),
      name,
      email,
      phone,
      companyId,
      supervisorName,
      status: 'pending',
      photo: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&h=150&fit=crop&crop=face`
    };
    setWorkers(prev => [...prev, newWorker]);
    return newWorker;
  };

  const verifyWorker = (workerId, approve = true) => {
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, status: approve ? 'approved' : 'rejected' } : w));
  };

  const requestPass = (workerId, zoneLevel, startDate, endDate, startTime, endTime, purpose) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return null;

    const newPass = {
      id: 'p_' + Date.now(),
      workerId,
      companyId: worker.companyId,
      supervisorName: worker.supervisorName,
      zoneLevel,
      startDate,
      endDate,
      startTime,
      endTime,
      purpose,
      status: 'pending_vendor',
      checkedIn: false,
      checkedOut: false
    };
    setPasses(prev => [...prev, newPass]);
    return newPass;
  };

  const approvePassVendor = (passId, approve = true) => {
    setPasses(prev => prev.map(p => p.id === passId ? { ...p, status: approve ? 'pending_ceva' : 'rejected' } : p));
  };

  const approvePassCeva = (passId, approve = true) => {
    setPasses(prev => prev.map(p => p.id === passId ? { ...p, status: approve ? 'approved' : 'rejected' } : p));
  };

  const checkInPass = (passId) => {
    const pass = passes.find(p => p.id === passId);
    if (!pass) return false;

    setPasses(prev => prev.map(p => p.id === passId ? { ...p, checkedIn: true, checkInTime: new Date().toISOString() } : p));
    
    const worker = workers.find(w => w.id === pass.workerId);
    const company = companies.find(c => c.id === pass.companyId);

    setLogs(prev => [
      {
        id: 'l_' + Date.now(),
        passId,
        workerName: worker ? worker.name : 'Unknown Worker',
        companyName: company ? company.name : 'Unknown Company',
        action: 'check_in',
        type: 'visitor',
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
    return true;
  };

  const checkOutPass = (passId) => {
    const pass = passes.find(p => p.id === passId);
    if (!pass) return false;

    setPasses(prev => prev.map(p => p.id === passId ? { ...p, checkedOut: true, checkOutTime: new Date().toISOString() } : p));
    setAlerts(prev => prev.map(a => a.passId === passId ? { ...a, resolved: true } : a));

    const worker = workers.find(w => w.id === pass.workerId);
    const company = companies.find(c => c.id === pass.companyId);

    setLogs(prev => [
      {
        id: 'l_' + Date.now(),
        passId,
        workerName: worker ? worker.name : 'Unknown Worker',
        companyName: company ? company.name : 'Unknown Company',
        action: 'check_out',
        type: 'visitor',
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
    return true;
  };

  // ==========================================================================
  // TMS LOGIC ACTIONS
  // ==========================================================================

  const registerTruck = (plate, vin, model, companyId) => {
    const newT = {
      id: 't_' + Date.now(),
      plate,
      vin,
      model,
      companyId,
      status: 'pending'
    };
    setTrucks(prev => [...prev, newT]);
    return newT;
  };

  const verifyTruck = (truckId, approve = true) => {
    setTrucks(prev => prev.map(t => t.id === truckId ? { ...t, status: approve ? 'approved' : 'rejected' } : t));
  };

  const registerDriver = (name, license, companyId) => {
    const newD = {
      id: 'd_' + Date.now(),
      name,
      license,
      companyId,
      status: 'pending',
      photo: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&h=150&fit=crop&crop=face`
    };
    setDrivers(prev => [...prev, newD]);
    return newD;
  };

  const verifyDriver = (driverId, approve = true) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: approve ? 'approved' : 'rejected' } : d));
  };

  const assignDelivery = (truckId, driverId, companyId, type, sealNumber, items, sealPhoto = '') => {
    const newDel = {
      id: 'del_' + Date.now(),
      truckId,
      driverId,
      companyId,
      type,
      sealNumber,
      baselineSealPhoto: sealPhoto || (type === 'dropoff' ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop' : ''),
      items,
      status: 'assigned',
      checkedIn: false,
      checkedOut: false
    };
    setDeliveries(prev => [...prev, newDel]);
    return newDel;
  };

  const checkInTruck = (deliveryId, ocrMatched, driverVerified, sealVerified, guardPhoto = '', containerPhoto = '', liveSealPhoto = '') => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return false;

    setDeliveries(prev => prev.map(d => {
      if (d.id === deliveryId) {
        return {
          ...d,
          checkedIn: true,
          status: 'inspected',
          ocrMatched,
          driverVerified,
          sealVerified,
          guardPhoto: guardPhoto || 'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=100&h=100&fit=crop',
          containerPhoto: containerPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop',
          liveSealPhoto: liveSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop',
          entryTime: new Date().toISOString()
        };
      }
      return d;
    }));

    const truck = trucks.find(t => t.id === delivery.truckId);
    const driver = drivers.find(d => d.id === delivery.driverId);
    const company = companies.find(c => c.id === delivery.companyId);

    setLogs(prev => [
      {
        id: 'l_' + Date.now(),
        passId: deliveryId,
        workerName: `${driver ? driver.name : 'Driver'} [Truck: ${truck ? truck.plate : 'OCR'}]`,
        companyName: company ? company.name : 'Trucking Company',
        action: 'check_in',
        type: 'truck',
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
    return true;
  };

  const checkOutTruck = (deliveryId, exitSealVerified = true, exitSealPhoto = '') => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return false;

    setDeliveries(prev => prev.map(d => {
      if (d.id === deliveryId) {
        return {
          ...d,
          checkedOut: true,
          status: 'departed',
          exitSealVerified,
          exitSealPhoto: exitSealPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop',
          exitTime: new Date().toISOString()
        };
      }
      return d;
    }));
    
    // Auto resolve alert if any
    setAlerts(prev => prev.map(a => a.passId === deliveryId ? { ...a, resolved: true } : a));

    const truck = trucks.find(t => t.id === delivery.truckId);
    const driver = drivers.find(d => d.id === delivery.driverId);
    const company = companies.find(c => c.id === delivery.companyId);

    setLogs(prev => [
      {
        id: 'l_' + Date.now(),
        passId: deliveryId,
        workerName: `${driver ? driver.name : 'Driver'} [Truck: ${truck ? truck.plate : 'OCR'}]`,
        companyName: company ? company.name : 'Trucking Company',
        action: 'check_out',
        type: 'truck',
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
    return true;
  };

  const triggerTruckOverstay = (deliveryId) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    const driver = drivers.find(dr => dr.id === delivery.driverId);
    const company = companies.find(c => c.id === delivery.companyId);
    const truck = trucks.find(t => t.id === delivery.truckId);

    const newAlert = {
      id: 'a_' + Date.now(),
      type: 'overstay',
      message: `🚛 TRUCK OVERSTAY ALERT: Driver ${driver ? driver.name : 'Driver'} (Truck: ${truck ? truck.plate : 'Pending'}) exceeded inspection/dock time limit!`,
      passId: deliveryId,
      timestamp: new Date().toLocaleTimeString(),
      resolved: false
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  const resetSystem = () => {
    localStorage.removeItem('ceva_companies');
    localStorage.removeItem('ceva_workers');
    localStorage.removeItem('ceva_passes');
    localStorage.removeItem('ceva_trucks');
    localStorage.removeItem('ceva_drivers');
    localStorage.removeItem('ceva_deliveries');
    localStorage.removeItem('ceva_logs');
    localStorage.removeItem('ceva_alerts');
    setCompanies(SEEDED_COMPANIES);
    setWorkers(SEEDED_WORKERS);
    setPasses(SEEDED_PASSES);
    setTrucks(SEEDED_TRUCKS);
    setDrivers(SEEDED_DRIVERS);
    setDeliveries(SEEDED_DELIVERIES);
    setLogs([]);
    setAlerts([]);
  };

  return (
    <SystemContext.Provider value={{
      companies,
      workers,
      passes,
      trucks,
      drivers,
      deliveries,
      logs,
      alerts,
      activeHeadcount,
      activeTruckHeadcount,
      registerCompany,
      verifyCompany,
      registerWorker,
      verifyWorker,
      requestPass,
      approvePassVendor,
      approvePassCeva,
      checkInPass,
      checkOutPass,
      registerTruck,
      verifyTruck,
      registerDriver,
      verifyDriver,
      assignDelivery,
      checkInTruck,
      checkOutTruck,
      triggerTruckOverstay,
      resolveAlert: (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a)),
      resetSystem
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => useContext(SystemContext);
