import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  MessageSquare,
  Trash2,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Clock,
  IndianRupee,
  Truck,
  Building,
  User,
} from 'lucide-react';
import { Vehicle, TaxType, ComplianceRecord } from '../types/vehicle';
import {
  TAX_NAMES,
  TAX_SHORT_NAMES,
  VAHAN_PORTAL_URL,
  formatDate,
  formatINR,
  getComplianceStatus,
  getDaysRemaining,
  getStatusBadgeInfo,
  calculateEstimatedPenalty,
  generateRenewalMessage,
} from '../utils/compliance';
import { useVehicleStore } from '../stores/vehicleStore';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (vehicleId: string, taxType: TaxType) => void;
  onOpenVahanAssistant: (vehicleId: string) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onOpenRecordPayment,
  onOpenVahanAssistant,
}) => {
  const { deleteVehicle, managerConfig } = useVehicleStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'taxes' | 'history' | 'specs' | 'owner'>('taxes');

  if (!isOpen || !vehicle) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove ${vehicle.registrationNumber} from fleet? This will record a DELETE entry in the audit trail.`)) {
      deleteVehicle(vehicle.id);
      onClose();
    }
  };

  const handleSendVehicleAlert = (taxType: TaxType) => {
    const text = generateRenewalMessage(vehicle, taxType);
    const cleanPhone = (managerConfig.managerPhone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const taxKeys: TaxType[] = ['mv_tax', 'green_tax', 'insurance', 'fitness', 'permit', 'pucc'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-mono tracking-wide">
                  {vehicle.registrationNumber}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {vehicle.vehicleType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {vehicle.makeModel} • Registered: {formatDate(vehicle.registrationDate)} • {vehicle.state} ({vehicle.rtoCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenVahanAssistant(vehicle.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              🏛️ Parivahan Vahan
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition"
              title="Delete Vehicle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Credentials Bar for Vahan Copying */}
        <div className="bg-slate-800/40 border-b border-slate-800 px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700/50">
            <span className="text-slate-400">Reg No:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{vehicle.registrationNumber}</span>
              <button
                onClick={() => copyToClipboard(vehicle.registrationNumber, 'reg')}
                className="text-slate-400 hover:text-amber-400"
                title="Copy Registration Number"
              >
                {copiedKey === 'reg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-lg border border-amber-500/40">
            <span className="text-amber-400 font-semibold">Chassis (Last 5):</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-300 text-sm tracking-wider">
                {vehicle.chassisLast5}
              </span>
              <button
                onClick={() => copyToClipboard(vehicle.chassisLast5, 'chassisL5')}
                className="text-amber-400 hover:text-amber-300"
                title="Copy Last 5 Digits for Vahan Portal"
              >
                {copiedKey === 'chassisL5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700/50">
            <span className="text-slate-400">Engine No:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-200 truncate max-w-[120px]">
                {vehicle.engineNumber}
              </span>
              <button
                onClick={() => copyToClipboard(vehicle.engineNumber, 'engine')}
                className="text-slate-400 hover:text-amber-400"
                title="Copy Engine Number"
              >
                {copiedKey === 'engine' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 gap-6 text-xs font-semibold bg-slate-950/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('taxes')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'taxes'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Taxes &amp; Compliance Tracker (6)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Payment History &amp; Ledger ({vehicle.paymentHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'owner'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            Owner &amp; Financier
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            Technical Specs &amp; Driver
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: Taxes & Compliance Cards */}
          {activeTab === 'taxes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taxKeys.map((key) => {
                  const record: ComplianceRecord = vehicle.taxes[key];
                  if (!record || !record.enabled) return null;
                  const status = getComplianceStatus(record, key);
                  const badge = getStatusBadgeInfo(status);
                  const daysLeft = getDaysRemaining(record.expiryDate);
                  const daysOverdue = daysLeft < 0 ? Math.abs(daysLeft) : 0;
                  const penalty = calculateEstimatedPenalty(key, daysOverdue, record.lastPaidAmount);

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border bg-slate-850/60 ${badge.border} hover:border-slate-600 transition flex flex-col justify-between`}
                    >
                      <div>
                        {/* Title & Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {TAX_NAMES[key]}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Next Renewal Due:</span>
                            <span className="font-semibold text-white">
                              {formatDate(record.expiryDate)}{' '}
                              <span className={`text-[11px] ${badge.text}`}>
                                ({daysLeft < 0 ? `${daysOverdue}d overdue` : `${daysLeft} days left`})
                              </span>
                            </span>
                          </div>

                          {penalty > 0 && (
                            <div className="flex justify-between p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold">
                              <span>Accrued Penalty:</span>
                              <span className="font-mono">+{formatINR(penalty)}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-400">
                            <span>Last Paid Date:</span>
                            <span className="text-slate-200">{formatDate(record.lastPaidDate)}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Last Paid Amount:</span>
                            <span className="font-semibold text-emerald-400 font-mono">
                              {formatINR(record.lastPaidAmount)}
                            </span>
                          </div>
                          {record.receiptNumber && (
                            <div className="flex justify-between text-slate-400">
                              <span>Receipt/Challan No:</span>
                              <span className="font-mono text-slate-300 text-[11px]">
                                {record.receiptNumber}
                              </span>
                            </div>
                          )}
                          {key === 'insurance' && (vehicle.taxes.insurance as any)?.policyNumber && (
                            <div className="flex justify-between text-slate-400">
                              <span>Policy &amp; Insurer:</span>
                              <span className="text-slate-300 text-[11px]">
                                {(vehicle.taxes.insurance as any).insurerName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons for this Tax */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
                        <button
                          onClick={() => handleSendVehicleAlert(key)}
                          className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                          title="Send alert to Manager via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp Alert
                        </button>

                        <div className="flex gap-2">
                          {(key === 'mv_tax' || key === 'green_tax') && (
                            <a
                              href={VAHAN_PORTAL_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              Pay on Vahan
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => onOpenRecordPayment(vehicle.id, key)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Record Paid
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Payment History Ledger */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {(!vehicle.paymentHistory || vehicle.paymentHistory.length === 0) ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No past payment receipts logged yet. Click &quot;Record Paid&quot; on any tax to log your first payment!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Payment Date</th>
                        <th className="p-3">Tax / Doc Type</th>
                        <th className="p-3">Period Covered</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Receipt / Challan #</th>
                        <th className="p-3">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {vehicle.paymentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-sans text-white">{formatDate(item.paidDate)}</td>
                          <td className="p-3 font-sans font-semibold text-amber-400">
                            {TAX_SHORT_NAMES[item.taxType] || item.taxType}
                          </td>
                          <td className="p-3 text-[11px] text-slate-400 font-sans">
                            {formatDate(item.periodFrom)} to {formatDate(item.periodTo)}
                          </td>
                          <td className="p-3 font-bold text-emerald-400">
                            {formatINR(item.amount)}
                          </td>
                          <td className="p-3 text-slate-300 text-[11px]">{item.receiptChallanNo}</td>
                          <td className="p-3 font-sans text-slate-400 text-[11px]">{item.paymentMode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Owner & Financier Details */}
          {activeTab === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Registered Owner Details</span>
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Owner Name:</span>
                  <span className="font-bold text-white">{vehicle.ownerName || 'NIKAVE Logistics'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Owner Mobile:</span>
                  <span className="font-mono text-amber-400">{vehicle.ownerPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200">{vehicle.ownerEmail || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">PAN / GST:</span>
                  <span className="font-mono text-slate-300">{vehicle.ownerPanOrGst || 'N/A'}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-0.5">Address:</span>
                  <span className="text-slate-300 leading-relaxed">{vehicle.ownerAddress || 'Main Transport Yard'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Hypothecation / Financier</span>
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Hypothecation Status:</span>
                  <span className={`font-bold ${vehicle.isHypothecated ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {vehicle.isHypothecated ? 'Financed (Loan Active)' : 'Fully Owned (No Loan)'}
                  </span>
                </div>
                {vehicle.isHypothecated && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Financier / Bank:</span>
                    <span className="font-semibold text-white">{vehicle.financierName || 'Commercial Bank'}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Operating Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                    {vehicle.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Technical Specs & Driver */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  Vehicle Identity &amp; Specs
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Registration Date:</span>
                  <span className="font-mono text-white">{formatDate(vehicle.registrationDate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Full Chassis / VIN:</span>
                  <span className="font-mono font-bold text-white">{vehicle.chassisNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Vahan Last 5 Digits:</span>
                  <span className="font-mono font-bold text-amber-400">{vehicle.chassisLast5}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Engine Number:</span>
                  <span className="font-mono font-bold text-white">{vehicle.engineNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Gross Vehicle Wt (GVW):</span>
                  <span className="text-white">{vehicle.grossVehicleWeightKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Fuel &amp; Emissions:</span>
                  <span className="text-white">{vehicle.fuelType || 'DIESEL'} ({vehicle.emissionNorms || 'BS-VI'})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Mfg Year:</span>
                  <span className="text-white">{vehicle.manufacturingYear}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">
                  Operations &amp; Driver Crew
                </h4>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Driver Name:</span>
                  <span className="text-white font-semibold">{vehicle.driverName || 'Not Assigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Driver Phone:</span>
                  <span className="font-mono text-white">{vehicle.driverPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Hub / Division:</span>
                  <span className="text-white">{vehicle.division || 'Main Fleet'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Primary RTO Jurisdiction:</span>
                  <span className="text-white">{vehicle.rtoCode}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Vehicle UUID:</span>
            <span className="font-mono text-slate-300">{vehicle.id}</span>
            <button
              onClick={() => copyToClipboard(vehicle.id, 'uuid')}
              className="text-slate-400 hover:text-amber-400"
              title="Copy UUID"
            >
              {copiedKey === 'uuid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
