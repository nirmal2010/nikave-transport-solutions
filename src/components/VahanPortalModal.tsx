import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Info, ArrowRight, X, AlertCircle, Receipt } from 'lucide-react';
import { Vehicle, TaxType } from '../types/vehicle';
import { VAHAN_PORTAL_URL } from '../utils/compliance';
import { useVehicleStore } from '../stores/vehicleStore';

interface VahanPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles?: Vehicle[];
  vehicleId?: string | null;
  onOpenRecordPayment?: (vehicleId: string, taxType: TaxType) => void;
}

export const VahanPortalModal: React.FC<VahanPortalModalProps> = ({
  isOpen,
  onClose,
  vehicles: propVehicles,
  vehicleId,
  onOpenRecordPayment,
}) => {
  const storeVehicles = useVehicleStore((s) => s.vehicles);
  const vehicles = propVehicles || storeVehicles;

  const [selectedVehId, setSelectedVehId] = useState<string>(
    vehicleId || (vehicles[0]?.id || '')
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentVehicle = vehicles.find((v) => v.id === selectedVehId) || vehicles[0];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRecordPayment = () => {
    if (onOpenRecordPayment && currentVehicle) {
      onClose();
      onOpenRecordPayment(currentVehicle.id, 'mv_tax');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-amber-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Parivahan Vahan Tax Assistant
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  MoRTH Govt Portal
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct integration guide &amp; 1-click clipboard helper for paying MV Tax &amp; Green Tax
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Official Vahan Link Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Info className="w-4 h-4" /> Official Tax Payment URL
              </div>
              <p className="text-xs text-slate-300 font-mono mt-1 break-all">
                {VAHAN_PORTAL_URL}
              </p>
            </div>
            <a
              href={VAHAN_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              Open Parivahan Vahan
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Quick Copy Helper for Selected Vehicle */}
          {currentVehicle && (
            <div className="bg-slate-800/70 rounded-xl p-5 border border-slate-700/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Step 1: Select Vehicle to Copy Credentials
                  </span>
                </div>
                <select
                  value={selectedVehId}
                  onChange={(e) => setSelectedVehId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Registration Number */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1">Registration No:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-base">
                      {currentVehicle.registrationNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentVehicle.registrationNumber, 'reg')}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                      title="Copy to clipboard"
                    >
                      {copiedKey === 'reg' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Chassis Number (Last 5 Digits - Mandatory on Vahan) */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-amber-500/40 relative">
                  <div className="text-[11px] text-amber-400 font-semibold mb-1 flex items-center justify-between">
                    <span>Chassis (Last 5 Chars)</span>
                    <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">
                      Vahan Input
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-300 text-lg tracking-wider">
                      {currentVehicle.chassisLast5}
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentVehicle.chassisLast5, 'chassisL5')}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition"
                      title="Copy last 5 digits"
                    >
                      {copiedKey === 'chassisL5' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Engine Number */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1">Engine Number:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-sm truncate max-w-[140px]">
                      {currentVehicle.engineNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentVehicle.engineNumber, 'engine')}
                      className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                      title="Copy Engine No"
                    >
                      {copiedKey === 'engine' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 bg-slate-950/40 px-3 py-2 rounded-lg">
                <span>
                  State: <strong className="text-white">{currentVehicle.state}</strong> | RTO:{' '}
                  <strong className="text-white">{currentVehicle.rtoCode}</strong>
                </span>
                <span>
                  Full Chassis:{' '}
                  <strong className="text-slate-300 font-mono text-[11px]">
                    {currentVehicle.chassisNumber}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Step-by-Step Flow on Vahan Portal */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋 Step-by-Step Tax Payment Procedure on Parivahan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Select State &amp; Enter Reg No</h4>
                  <p className="text-slate-400 mt-0.5">
                    On the homepage, select your State ({currentVehicle?.state || 'e.g. Tamil Nadu'}) from the dropdown, then select RTO Office or enter Registration Number directly. Accept terms and click <strong>Proceed</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Click &quot;Pay Your Tax&quot;</h4>
                  <p className="text-slate-400 mt-0.5">
                    In the Citizen Services dashboard, click on <strong>&quot;Pay Your Tax&quot;</strong>. Paste the <strong>last 5 characters of your Chassis Number</strong> (<span className="text-amber-400 font-mono font-bold">{currentVehicle?.chassisLast5}</span>).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Verify Tax Period &amp; Amount</h4>
                  <p className="text-slate-400 mt-0.5">
                    Vahan will calculate your Motor Vehicle Tax (Quarterly/Annual) and Green Tax (if vehicle &gt; 8-15 years). Review any penalty or surcharge if overdue.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200">Pay &amp; Log Receipt in NIKAVE</h4>
                  <p className="text-slate-400 mt-0.5">
                    Complete payment via SBI ePay, NetBanking, or UPI. Download <strong>Form 53 / 54 Receipt</strong> and copy the Receipt Number into NIKAVE to update vehicle validity automatically!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Tip */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>Transport Manager Tip:</strong> Paying commercial vehicle road tax even 1 day late incurs a compound penalty (up to 2% to 100% depending on state RTO rules). Keep notification alerts active on NIKAVE!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60">
          <button
            onClick={handleRecordPayment}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Finished Payment? Record in NIKAVE</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close Assistant
            </button>
            <a
              href={VAHAN_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              Go to Parivahan Vahan Now
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
