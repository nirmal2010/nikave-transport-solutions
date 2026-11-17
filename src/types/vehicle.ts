export type TaxType = 
  | 'mv_tax' 
  | 'green_tax' 
  | 'insurance' 
  | 'fitness' 
  | 'permit' 
  | 'pucc';

export type ComplianceStatus = 
  | 'valid' 
  | 'expiring_soon' 
  | 'urgent' 
  | 'grace_period' 
  | 'overdue' 
  | 'not_applicable';

export interface TaxThresholdConfig {
  id: string; // UUID
  taxCode: TaxType;
  taxName: string;
  description: string;
  defaultFrequency: 'quarterly' | 'half_yearly' | 'annual' | '5_years' | '6_months';
  preExpiryAlertDays: number[]; // e.g. [30, 15, 7, 3, 1, 0]
  gracePeriodDays: number; // e.g. 15 for MV Tax, 0 for Insurance
  postExpiryAlertDays: number[]; // e.g. [1, 3, 7, 15, 30, 60]
  penaltyType: 'DAILY_FLAT' | 'PERCENTAGE_PER_MONTH' | 'SLAB';
  penaltyRate: number; // e.g. 2.0% per month or ₹50/day
  lateFeeFlat: number; // e.g. ₹100 flat fee
  statutoryWarning: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRecord {
  enabled: boolean;
  lastPaidDate: string; // YYYY-MM-DD
  expiryDate: string;   // YYYY-MM-DD
  lastPaidAmount: number; // in INR (₹)
  receiptNumber?: string;
  paymentMode?: string;
  frequency?: 'quarterly' | 'half_yearly' | 'annual' | 'lifetime' | '5_years' | '6_months';
  gracePeriodDays?: number;
  status?: ComplianceStatus;
  daysUntilExpiry?: number;
  estimatedRenewalAmount?: number;
  estimatedPenaltyAmount?: number;
  notes?: string;
}

export interface InsuranceRecord extends ComplianceRecord {
  policyNumber: string;
  insurerName: string;
  insuranceType: 'Comprehensive' | 'Third Party Liability' | 'Bumper to Bumper';
  idvValue?: number;
}

export interface TaxPaymentLog {
  id: string; // UUID
  vehicleId: string; // UUID (NO foreign key)
  vehicleReg: string;
  taxType: TaxType;
  paidDate: string; // YYYY-MM-DD
  periodFrom: string; // YYYY-MM-DD
  periodTo: string; // YYYY-MM-DD
  amount: number; // Base Tax Amount
  greenTaxComponent?: number;
  penaltyOrFinePaid?: number;
  receiptChallanNo: string;
  paymentMode: 'Vahan Portal (Online)' | 'RTO Counter' | 'Treasury e-Challan' | 'Insurance Portal' | 'Bank Transfer';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleCategory = 
  | 'Heavy Goods Vehicle (HGV)'
  | 'Multi-Axle Truck (10/12/14 Wheeler)'
  | 'Prime Mover / Articulated Trailer'
  | 'Tipper / Dumper'
  | 'Tanker (Petroleum/Chemical/Water)'
  | 'Light Commercial Vehicle (LCV)'
  | 'Commercial Bus / Staff Bus';

export interface Vehicle {
  id: string; // UUID
  registrationNumber: string; // e.g. TN-01-AX-4825
  registrationDate: string;   // YYYY-MM-DD
  chassisNumber: string;      // Full 17-digit Chassis / VIN
  chassisLast5: string;       // Crucial 5 digits for Vahan portal
  engineNumber: string;       // Engine serial number
  vehicleType: VehicleCategory;
  vehicleClass?: string;
  makeModel: string;          // e.g. Tata Signa 4825.TK, Ashok Leyland 2820
  manufacturingYear: number;  // Determines Green Tax eligibility (>8/15 yrs)
  manufacturingMonth?: number;
  grossVehicleWeightKg: number; // GVW in kg
  unladenWeightKg?: number;
  seatingCapacity?: number;
  fuelType: 'DIESEL' | 'CNG' | 'ELECTRIC' | 'LNG';
  emissionNorms: 'BS-IV' | 'BS-VI';
  bodyType?: string;
  color?: string;
  state: string;              // e.g. Tamil Nadu, Karnataka
  rtoCode: string;            // e.g. TN-01 (Chennai Central)
  
  // Owner Details
  ownerName: string;
  ownerFatherOrRepName?: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerAddress?: string;
  ownerPanOrGst?: string;

  // Operational & Driver
  driverName?: string;
  driverPhone?: string;
  driverLicenseNumber?: string;
  division?: string;

  // Hypothecation / Financial Loan
  isHypothecated: boolean;
  financierName?: string;

  status: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  notes?: string;

  taxes: {
    mv_tax: ComplianceRecord;
    green_tax: ComplianceRecord;
    insurance: InsuranceRecord;
    fitness: ComplianceRecord;
    permit: ComplianceRecord;
    pucc: ComplianceRecord;
  };
  paymentHistory: TaxPaymentLog[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string; // UUID
  entityName: string; // 'vehicles' | 'vehicle_tax_compliances' | 'tax_payment_logs'
  entityId: string; // UUID (NO foreign key)
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  performedBy: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string; // UUID
  vehicleId: string; // UUID (NO foreign key)
  vehicleRegNo: string;
  taxCode: TaxType;
  channel: 'WHATSAPP_CALLMEBOT' | 'SMS_DEVICE_GATEWAY' | 'WHATSAPP_DIRECT_LINK';
  recipientPhone: string;
  recipientName?: string;
  triggerType: 'PRE_EXPIRY' | 'DUE_TODAY' | 'POST_EXPIRY_GRACE' | 'POST_EXPIRY_OVERDUE';
  daysDelta: number;
  messageContent: string;
  deliveryStatus: 'SENT' | 'FAILED' | 'QUEUED' | 'DISPATCHED';
  gatewayResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportManagerConfig {
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  notifyDaysBefore: number[]; // pre-expiry: e.g. [30, 15, 7, 3, 1, 0]
  notifyDaysAfter: number[];  // post-expiry: e.g. [1, 3, 7, 15, 30]
  channels: {
    callMeBotWhatsApp: boolean;
    androidSmsGateway: boolean;
    whatsappDirectLink: boolean;
  };
  callMeBotApiKey: string;
  callMeBotPhone: string;
  androidGatewayWebhookUrl?: string;
  androidGatewayAuthKey?: string;
  dailyDigestTime: string; // e.g. "08:30"
}
