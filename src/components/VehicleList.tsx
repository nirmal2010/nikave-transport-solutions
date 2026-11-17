import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Receipt,
  MessageSquare,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  IndianRupee,
  User,
  ShieldAlert,
} from 'lucide-react';
import { Vehicle, TaxType, ComplianceStatus } from '../types/vehicle';
import {
  VAHAN_PORTAL_URL,
  formatDate,
  formatINR,
  getComplianceStatus,
  getDaysRemaining,
  getStatusBadgeInfo,
  calculateEstimatedPenalty,
  generateRenewalMessage,
  TAX_SHORT_NAMES,
} from '../utils/compliance';
import { useVehicleStore } from '../stores/vehicleStore';

interface VehicleListProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onOpenRecordPayment: (vehicleId: string, taxType: TaxType) => void;
  onOpenVahanAssistant: (vehicleId: string) => void;
  onOpenAddVehicle?: () => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({
  onSelectVehicle,
  onOpenRecordPayment,
  onOpenVahanAssistant,
  onOpenAddVehicle,
}) => {
  const { vehicles, searchQuery, setSearchQuery, statusFilter, setStatusFilter, managerConfig } =
    useVehicleStore();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleWhatsAppAlert = (vehicle: Vehicle, taxType: TaxType, e: React.MouseEvent) => {
    e.stopPropagation();
    const message = generateRenewalMessage(vehicle, taxType);
    const cleanPhone = (managerConfig.managerPhone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Helper to determine the worst status across all taxes for a vehicle
  const getOverallVehicleStatus = (v: Vehicle): ComplianceStatus => {
    const keys: TaxType[] = ['mv_tax', 'green_tax', 'insurance', 'fitness', 'permit', 'pucc'];
    let worst: ComplianceStatus = 'valid';

    for (const key of keys) {
      const rec = v.taxes[key];
      if (rec && rec.enabled) {
        const s = getComplianceStatus(rec, key);
        if (s === 'overdue') return 'overdue';
        if (s === 'grace_period') worst = 'grace_period';
        else if (s === 'urgent' && worst !== 'grace_period') worst = 'urgent';
        else if (s === 'expiring_soon' && worst === 'valid') {
          worst = 'expiring_soon';
        }
      }
    }
    return worst;
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchReg = v.registrationNumber.toLowerCase().includes(q);
      const matchChassis = v.chassisNumber.toLowerCase().includes(q) || v.chassisLast5.includes(q);
      const matchEngine = v.engineNumber.toLowerCase().includes(q);
      const matchModel = v.makeModel.toLowerCase().includes(q);
      const matchOwner = (v.ownerName || '').toLowerCase().includes(q);
      const matchState = v.state.toLowerCase().includes(q);
      if (!matchReg && !matchChassis && !matchEngine && !matchModel && !matchOwner && !matchState) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      const overall = getOverallVehicleStatus(v);
      if (overall !== statusFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Reg No, Chassis Last 5, Engine No, Owner..."
            className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({vehicles.length})
          </button>
          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'overdue'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-900 text-rose-400 hover:bg-rose-500/10 border border-rose-500/30'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Overdue
          </button>
          <button
            onClick={() => setStatusFilter('grace_period')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'grace_period'
                ? 'bg-orange-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-orange-400 hover:bg-orange-500/10 border border-orange-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Grace Period
          </button>
          <button
            onClick={() => setStatusFilter('urgent')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'urgent'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-amber-400 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgent (≤7d)
          </button>
          <button
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'expiring_soon'
                ? 'bg-yellow-400 text-slate-950 font-bold'
                : 'bg-slate-900 text-yellow-300 hover:bg-yellow-500/10 border border-yellow-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Due Soon (≤30d)
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'valid'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Compliant
          </button>
        </div>
      </div>

      {/* Vehicles Grid / Cards */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">
            {vehicles.length === 0 ? "No Vehicles in Fleet Yet" : "No vehicles match your search or filter"}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
            {vehicles.length === 0
              ? "Register your commercial trucks, trailers, or buses to monitor MV Road Tax, Green Tax, Commercial Insurance, and Parivahan renewals."
              : "Try adjusting your search query or reset filter to \"All\"."}
          </p>
          {vehicles.length === 0 && onOpenAddVehicle && (
            <button
              onClick={onOpenAddVehicle}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
            >
              <span>+ Add First Vehicle</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVehicles.map((vehicle) => {
            const overallStatus = getOverallVehicleStatus(vehicle);
            const overallBadge = getStatusBadgeInfo(overallStatus);

            // Taxes
            const mvStatus = getComplianceStatus(vehicle.taxes.mv_tax, 'mv_tax');
            const mvBadge = getStatusBadgeInfo(mvStatus);

            const gtStatus = getComplianceStatus(vehicle.taxes.green_tax, 'green_tax');
            const gtBadge = getStatusBadgeInfo(gtStatus);

            const insStatus = getComplianceStatus(vehicle.taxes.insurance, 'insurance');
            const insBadge = getStatusBadgeInfo(insStatus);

            const fcStatus = getComplianceStatus(vehicle.taxes.fitness, 'fitness');
            const fcBadge = getStatusBadgeInfo(fcStatus);

            return (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle)}
                className={`p-5 rounded-2xl bg-slate-900 border ${overallBadge.border} hover:border-slate-500/60 transition shadow-lg cursor-pointer group`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Vehicle Title & Vahan Key Specs */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-lg font-black font-mono text-white tracking-wider px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700">
                        {vehicle.registrationNumber}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">
                        {vehicle.makeModel}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {vehicle.vehicleType}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${overallBadge.bg} ${overallBadge.text} ${overallBadge.border}`}
                      >
                        {overallBadge.label}
                      </span>
                    </div>

                    {/* Vahan Credentials Snippet */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Chassis (Last 5):</span>
                        <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {vehicle.chassisLast5}
                        </span>
                        <button
                          onClick={(e) => copyToClipboard(vehicle.chassisLast5, `l5-${vehicle.id}`, e)}
                          className="text-slate-500 hover:text-amber-400 p-0.5"
                          title="Copy last 5 digits for Vahan"
                        >
                          {copiedKey === `l5-${vehicle.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Engine:</span>
                        <span className="font-mono text-slate-300">{vehicle.engineNumber}</span>
                      </div>

                      <div className="text-slate-500">
                        Owner: <span className="text-slate-300 font-semibold">{vehicle.ownerName}</span>
                      </div>

                      <div className="text-slate-500">
                        RTO: <span className="text-slate-300">{vehicle.rtoCode}</span>
                      </div>

                      {vehicle.driverName && (
                        <div className="text-slate-500">
                          Driver: <span className="text-slate-300">{vehicle.driverName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenVahanAssistant(vehicle.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      🏛️ Pay on Vahan
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRecordPayment(vehicle.id, 'mv_tax');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Record Paid
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVehicle(vehicle);
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Compliance Status Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                  {/* MV Tax */}
                  <div className={`p-2.5 rounded-xl bg-slate-950/60 border ${mvBadge.border} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-300">Motor Vehicle Tax</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${mvBadge.bg} ${mvBadge.text}`}>
                        {mvBadge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Due: <strong className="text-white">{formatDate(vehicle.taxes.mv_tax?.expiryDate)}</strong>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatINR(vehicle.taxes.mv_tax?.lastPaidAmount || 0)}
                      </span>
                      <button
                        onClick={(e) => handleWhatsAppAlert(vehicle, 'mv_tax', e)}
                        className="text-slate-500 hover:text-emerald-400"
                        title="WhatsApp Alert"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Green Tax */}
                  <div className={`p-2.5 rounded-xl bg-slate-950/60 border ${gtBadge.border} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-300">Green Tax</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${gtBadge.bg} ${gtBadge.text}`}>
                        {gtBadge.label}
                      </span>
                    </div>
                    {vehicle.taxes.green_tax?.enabled ? (
                      <>
                        <div className="text-[11px] text-slate-400">
                          Due: <strong className="text-white">{formatDate(vehicle.taxes.green_tax?.expiryDate)}</strong>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-emerald-400 font-mono font-semibold">
                            {formatINR(vehicle.taxes.green_tax?.lastPaidAmount || 0)}
                          </span>
                          <button
                            onClick={(e) => handleWhatsAppAlert(vehicle, 'green_tax', e)}
                            className="text-slate-500 hover:text-emerald-400"
                            title="WhatsApp Alert"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic mt-1">Exempt (&lt;8 yrs)</div>
                    )}
                  </div>

                  {/* Insurance */}
                  <div className={`p-2.5 rounded-xl bg-slate-950/60 border ${insBadge.border} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-300">Insurance</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${insBadge.bg} ${insBadge.text}`}>
                        {insBadge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Due: <strong className="text-white">{formatDate(vehicle.taxes.insurance?.expiryDate)}</strong>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatINR(vehicle.taxes.insurance?.lastPaidAmount || 0)}
                      </span>
                      <button
                        onClick={(e) => handleWhatsAppAlert(vehicle, 'insurance', e)}
                        className="text-slate-500 hover:text-emerald-400"
                        title="WhatsApp Alert"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Fitness */}
                  <div className={`p-2.5 rounded-xl bg-slate-950/60 border ${fcBadge.border} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-300">Fitness (FC)</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${fcBadge.bg} ${fcBadge.text}`}>
                        {fcBadge.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Due: <strong className="text-white">{formatDate(vehicle.taxes.fitness?.expiryDate)}</strong>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-emerald-400 font-mono font-semibold">
                        {formatINR(vehicle.taxes.fitness?.lastPaidAmount || 0)}
                      </span>
                      <button
                        onClick={(e) => handleWhatsAppAlert(vehicle, 'fitness', e)}
                        className="text-slate-500 hover:text-emerald-400"
                        title="WhatsApp Alert"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
