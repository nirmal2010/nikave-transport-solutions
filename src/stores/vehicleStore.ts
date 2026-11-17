import { create } from 'zustand';
import { SAMPLE_VEHICLES, INITIAL_MANAGER_CONFIG, INITIAL_TAX_THRESHOLDS } from '../data/sampleVehicles';
import { 
  TaxPaymentLog, 
  TransportManagerConfig, 
  Vehicle, 
  TaxType, 
  ComplianceStatus, 
  TaxThresholdConfig, 
  AuditLog, 
  NotificationLog 
} from '../types/vehicle';
import { getComplianceStatus, STATUTORY_GRACE_PERIODS } from '../utils/compliance';

// Browser-safe UUID generator
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface VehicleStore {
  vehicles: Vehicle[];
  managerConfig: TransportManagerConfig;
  taxThresholds: TaxThresholdConfig[];
  auditLogs: AuditLog[];
  notificationLogs: NotificationLog[];
  
  selectedVehicleId: string | null;
  searchQuery: string;
  statusFilter: 'all' | ComplianceStatus;
  taxFilter: 'all' | TaxType;
  
  // Navigation & Filtering Actions
  setSelectedVehicleId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setStatusFilter: (status: 'all' | ComplianceStatus) => void;
  setTaxFilter: (tax: 'all' | TaxType) => void;

  // Transactional Data Mutations (with Automatic Audit Logging)
  addVehicle: (vehicleData: Partial<Vehicle>) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  
  recordTaxPayment: (payment: {
    vehicleId: string;
    taxType: TaxType;
    paidDate: string;
    periodFrom: string;
    periodTo: string;
    amount: number;
    greenTaxComponent?: number;
    penaltyOrFinePaid?: number;
    receiptChallanNo: string;
    paymentMode: 'Vahan Portal (Online)' | 'RTO Counter' | 'Treasury e-Challan' | 'Insurance Portal' | 'Bank Transfer';
    notes?: string;
  }) => void;

  updateTaxThreshold: (taxCode: TaxType, updates: Partial<TaxThresholdConfig>) => void;
  logNotification: (log: Omit<NotificationLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateManagerConfig: (updates: Partial<TransportManagerConfig>) => void;
  resetToSampleFleet: () => void;
}

const STORAGE_KEY_VEHICLES = 'nikave_vehicles_v2';
const STORAGE_KEY_CONFIG = 'nikave_manager_config_v2';
const STORAGE_KEY_THRESHOLDS = 'nikave_tax_thresholds_v2';
const STORAGE_KEY_AUDIT = 'nikave_audit_logs_v2';
const STORAGE_KEY_NOTIFS = 'nikave_notification_logs_v2';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(fallback)) {
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
      } else if (parsed && typeof parsed === 'object') {
        return { ...fallback, ...parsed } as T;
      }
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
  }
  return fallback;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: loadFromStorage<Vehicle[]>(STORAGE_KEY_VEHICLES, SAMPLE_VEHICLES),
  managerConfig: loadFromStorage<TransportManagerConfig>(STORAGE_KEY_CONFIG, INITIAL_MANAGER_CONFIG),
  taxThresholds: loadFromStorage<TaxThresholdConfig[]>(STORAGE_KEY_THRESHOLDS, INITIAL_TAX_THRESHOLDS),
  auditLogs: loadFromStorage<AuditLog[]>(STORAGE_KEY_AUDIT, [
    {
      id: 'f1a2b3c4-0001-4000-8000-000000000001',
      entityName: 'vehicles',
      entityId: 'e5d9a101-1111-4000-8000-000000000001',
      action: 'INSERT',
      previousValue: null,
      newValue: {
        registrationNumber: 'TN-01-AX-4825',
        makeModel: 'Tata Signa 4825.TK',
        ownerName: 'NIKAVE Logistics Solutions Pvt Ltd',
      },
      performedBy: 'system_seed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]),
  notificationLogs: loadFromStorage<NotificationLog[]>(STORAGE_KEY_NOTIFS, []),

  selectedVehicleId: null,
  searchQuery: '',
  statusFilter: 'all',
  taxFilter: 'all',

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setTaxFilter: (taxFilter) => set({ taxFilter }),

  // Transactional Add Vehicle + Audit Log
  addVehicle: (vehicleData) => {
    const now = new Date().toISOString();
    const newId = generateUuid();
    const chassis = (vehicleData.chassisNumber || '').trim().toUpperCase();
    const chassisL5 = chassis.length >= 5 ? chassis.slice(-5) : chassis;

    const newVehicle: Vehicle = {
      id: newId,
      registrationNumber: (vehicleData.registrationNumber || '').trim().toUpperCase(),
      registrationDate: vehicleData.registrationDate || new Date().toISOString().split('T')[0],
      chassisNumber: chassis,
      chassisLast5: vehicleData.chassisLast5 || chassisL5,
      engineNumber: (vehicleData.engineNumber || '').trim().toUpperCase(),
      vehicleType: vehicleData.vehicleType || 'Heavy Goods Vehicle (HGV)',
      vehicleClass: vehicleData.vehicleClass || 'Commercial Vehicle',
      makeModel: vehicleData.makeModel || 'Commercial Vehicle',
      manufacturingYear: vehicleData.manufacturingYear || new Date().getFullYear(),
      manufacturingMonth: vehicleData.manufacturingMonth || 1,
      grossVehicleWeightKg: vehicleData.grossVehicleWeightKg || 25000,
      unladenWeightKg: vehicleData.unladenWeightKg || 8000,
      seatingCapacity: vehicleData.seatingCapacity || 2,
      fuelType: vehicleData.fuelType || 'DIESEL',
      emissionNorms: vehicleData.emissionNorms || 'BS-VI',
      bodyType: vehicleData.bodyType || 'Open Body',
      color: vehicleData.color || 'White',
      state: vehicleData.state || 'Tamil Nadu',
      rtoCode: vehicleData.rtoCode || 'TN-01',
      
      ownerName: vehicleData.ownerName || 'NIKAVE Transport Solutions',
      ownerFatherOrRepName: vehicleData.ownerFatherOrRepName || '',
      ownerPhone: vehicleData.ownerPhone || get().managerConfig.managerPhone,
      ownerEmail: vehicleData.ownerEmail || get().managerConfig.managerEmail,
      ownerAddress: vehicleData.ownerAddress || '',
      ownerPanOrGst: vehicleData.ownerPanOrGst || '',

      driverName: vehicleData.driverName || '',
      driverPhone: vehicleData.driverPhone || '',
      driverLicenseNumber: vehicleData.driverLicenseNumber || '',
      division: vehicleData.division || 'Main Fleet',

      isHypothecated: vehicleData.isHypothecated || false,
      financierName: vehicleData.financierName || '',

      status: vehicleData.status || 'ACTIVE',
      notes: vehicleData.notes || '',

      taxes: vehicleData.taxes || {
        mv_tax: { enabled: true, lastPaidDate: '', expiryDate: '', lastPaidAmount: 0, gracePeriodDays: 15 },
        green_tax: { enabled: false, lastPaidDate: '', expiryDate: '', lastPaidAmount: 0, gracePeriodDays: 0 },
        insurance: {
          enabled: true,
          lastPaidDate: '',
          expiryDate: '',
          lastPaidAmount: 0,
          policyNumber: '',
          insurerName: '',
          insuranceType: 'Comprehensive',
          gracePeriodDays: 0,
        },
        fitness: { enabled: true, lastPaidDate: '', expiryDate: '', lastPaidAmount: 0, gracePeriodDays: 0 },
        permit: { enabled: true, lastPaidDate: '', expiryDate: '', lastPaidAmount: 0, gracePeriodDays: 15 },
        pucc: { enabled: true, lastPaidDate: '', expiryDate: '', lastPaidAmount: 0, gracePeriodDays: 0 },
      },
      paymentHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    // Audit log entry for INSERT
    const auditEntry: AuditLog = {
      id: generateUuid(),
      entityName: 'vehicles',
      entityId: newId,
      action: 'INSERT',
      previousValue: null,
      newValue: newVehicle as unknown as Record<string, unknown>,
      performedBy: get().managerConfig.managerName,
      createdAt: now,
      updatedAt: now,
    };

    const updatedVehicles = [newVehicle, ...get().vehicles];
    const updatedAudit = [auditEntry, ...get().auditLogs];

    set({ vehicles: updatedVehicles, auditLogs: updatedAudit });
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updatedVehicles));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));

    return newVehicle;
  },

  // Transactional Update Vehicle + Audit Log
  updateVehicle: (id, updates) => {
    const now = new Date().toISOString();
    const prevVehicle = get().vehicles.find(v => v.id === id);
    if (!prevVehicle) return;

    let chassisL5 = prevVehicle.chassisLast5;
    if (updates.chassisNumber) {
      const trimmed = updates.chassisNumber.trim().toUpperCase();
      chassisL5 = trimmed.length >= 5 ? trimmed.slice(-5) : trimmed;
    }

    const updatedVehicle: Vehicle = {
      ...prevVehicle,
      ...updates,
      chassisLast5: updates.chassisLast5 || chassisL5,
      updatedAt: now,
    };

    const auditEntry: AuditLog = {
      id: generateUuid(),
      entityName: 'vehicles',
      entityId: id,
      action: 'UPDATE',
      previousValue: prevVehicle as unknown as Record<string, unknown>,
      newValue: updatedVehicle as unknown as Record<string, unknown>,
      performedBy: get().managerConfig.managerName,
      createdAt: now,
      updatedAt: now,
    };

    const updatedVehicles = get().vehicles.map(v => v.id === id ? updatedVehicle : v);
    const updatedAudit = [auditEntry, ...get().auditLogs];

    set({ vehicles: updatedVehicles, auditLogs: updatedAudit });
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updatedVehicles));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
  },

  // Transactional Delete Vehicle + Audit Log
  deleteVehicle: (id) => {
    const prevVehicle = get().vehicles.find(v => v.id === id);
    if (!prevVehicle) return;

    const now = new Date().toISOString();
    const auditEntry: AuditLog = {
      id: generateUuid(),
      entityName: 'vehicles',
      entityId: id,
      action: 'DELETE',
      previousValue: prevVehicle as unknown as Record<string, unknown>,
      newValue: null,
      performedBy: get().managerConfig.managerName,
      createdAt: now,
      updatedAt: now,
    };

    const updatedVehicles = get().vehicles.filter(v => v.id !== id);
    const updatedAudit = [auditEntry, ...get().auditLogs];

    set({ 
      vehicles: updatedVehicles, 
      auditLogs: updatedAudit,
      selectedVehicleId: get().selectedVehicleId === id ? null : get().selectedVehicleId 
    });
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updatedVehicles));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
  },

  // Transactional Record Payment + Compliance Advance + Financial Ledger + Audit Log
  recordTaxPayment: (payment) => {
    const now = new Date().toISOString();
    const vehicle = get().vehicles.find(v => v.id === payment.vehicleId);
    if (!vehicle) return;

    const paymentLogId = generateUuid();
    const newLog: TaxPaymentLog = {
      id: paymentLogId,
      vehicleId: payment.vehicleId,
      vehicleReg: vehicle.registrationNumber,
      taxType: payment.taxType,
      paidDate: payment.paidDate,
      periodFrom: payment.periodFrom,
      periodTo: payment.periodTo,
      amount: payment.amount,
      greenTaxComponent: payment.greenTaxComponent || 0,
      penaltyOrFinePaid: payment.penaltyOrFinePaid || 0,
      receiptChallanNo: payment.receiptChallanNo,
      paymentMode: payment.paymentMode,
      notes: payment.notes,
      createdAt: now,
      updatedAt: now,
    };

    const prevTax = vehicle.taxes[payment.taxType];
    const updatedTax = {
      ...prevTax,
      enabled: true,
      lastPaidDate: payment.paidDate,
      expiryDate: payment.periodTo,
      lastPaidAmount: payment.amount,
      receiptNumber: payment.receiptChallanNo,
      paymentMode: payment.paymentMode,
      gracePeriodDays: prevTax?.gracePeriodDays ?? STATUTORY_GRACE_PERIODS[payment.taxType],
      status: 'valid' as ComplianceStatus,
    };

    const updatedVehicle: Vehicle = {
      ...vehicle,
      taxes: {
        ...vehicle.taxes,
        [payment.taxType]: updatedTax,
      },
      paymentHistory: [newLog, ...(vehicle.paymentHistory || [])],
      updatedAt: now,
    };

    // Audit log for Compliance State Transition
    const auditEntry: AuditLog = {
      id: generateUuid(),
      entityName: 'vehicle_tax_compliances',
      entityId: payment.vehicleId,
      action: 'UPDATE',
      previousValue: {
        taxType: payment.taxType,
        expiryDate: prevTax?.expiryDate,
        lastPaidAmount: prevTax?.lastPaidAmount,
        status: prevTax?.status || getComplianceStatus(prevTax, payment.taxType),
      },
      newValue: {
        taxType: payment.taxType,
        expiryDate: payment.periodTo,
        lastPaidAmount: payment.amount,
        receiptNumber: payment.receiptChallanNo,
        status: 'valid',
      },
      performedBy: get().managerConfig.managerName,
      createdAt: now,
      updatedAt: now,
    };

    const updatedVehicles = get().vehicles.map(v => v.id === payment.vehicleId ? updatedVehicle : v);
    const updatedAudit = [auditEntry, ...get().auditLogs];

    set({ vehicles: updatedVehicles, auditLogs: updatedAudit });
    localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(updatedVehicles));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
  },

  // Update Tax Threshold Configurations (Post-Expiry & Grace Periods)
  updateTaxThreshold: (taxCode, updates) => {
    const now = new Date().toISOString();
    const prevThreshold = get().taxThresholds.find(t => t.taxCode === taxCode);
    if (!prevThreshold) return;

    const updatedThreshold: TaxThresholdConfig = {
      ...prevThreshold,
      ...updates,
      updatedAt: now,
    };

    const auditEntry: AuditLog = {
      id: generateUuid(),
      entityName: 'tax_threshold_configs',
      entityId: prevThreshold.id,
      action: 'UPDATE',
      previousValue: prevThreshold as unknown as Record<string, unknown>,
      newValue: updatedThreshold as unknown as Record<string, unknown>,
      performedBy: get().managerConfig.managerName,
      createdAt: now,
      updatedAt: now,
    };

    const updatedThresholds = get().taxThresholds.map(t => t.taxCode === taxCode ? updatedThreshold : t);
    const updatedAudit = [auditEntry, ...get().auditLogs];

    set({ taxThresholds: updatedThresholds, auditLogs: updatedAudit });
    localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(updatedThresholds));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
  },

  // Record an autogenerated WhatsApp or SMS notification
  logNotification: (log) => {
    const now = new Date().toISOString();
    const newEntry: NotificationLog = {
      ...log,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newEntry, ...get().notificationLogs];
    set({ notificationLogs: updated });
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
  },

  updateManagerConfig: (updates) => {
    const updatedConfig = { ...get().managerConfig, ...updates };
    set({ managerConfig: updatedConfig });
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updatedConfig));
  },

  resetToSampleFleet: () => {
    set({
      vehicles: SAMPLE_VEHICLES,
      taxThresholds: INITIAL_TAX_THRESHOLDS,
      managerConfig: INITIAL_MANAGER_CONFIG,
    });
    localStorage.removeItem(STORAGE_KEY_VEHICLES);
    localStorage.removeItem(STORAGE_KEY_THRESHOLDS);
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  },
}));
