import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Receipt, CreditCard, IndianRupee, FileText } from 'lucide-react';
import { Vehicle, TaxType } from '../types/vehicle';
import { TAX_NAMES } from '../utils/compliance';
import { useVehicleStore } from '../stores/vehicleStore';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVehicleId?: string | null;
  preselectedVehicleId?: string | null;
  defaultTaxType?: TaxType | null;
  preselectedTaxType?: TaxType | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  defaultVehicleId,
  preselectedVehicleId,
  defaultTaxType,
  preselectedTaxType,
}) => {
  const { vehicles, recordTaxPayment } = useVehicleStore();

  const initVehId = defaultVehicleId || preselectedVehicleId || (vehicles[0]?.id || '');
  const initTaxType = defaultTaxType || preselectedTaxType || 'mv_tax';

  const [vehicleId, setVehicleId] = useState<string>(initVehId);
  const [taxType, setTaxType] = useState<TaxType>(initTaxType);
  const [amount, setAmount] = useState<string>('24500');
  const [paidDate, setPaidDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [periodFrom, setPeriodFrom] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [periodTo, setPeriodTo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [receiptChallanNo, setReceiptChallanNo] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<
    'Vahan Portal (Online)' | 'RTO Counter' | 'Treasury e-Challan' | 'Insurance Portal' | 'Bank Transfer'
  >('Vahan Portal (Online)');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (defaultVehicleId || preselectedVehicleId) {
      setVehicleId(defaultVehicleId || preselectedVehicleId || '');
    }
    if (defaultTaxType || preselectedTaxType) {
      handleTaxTypeChange((defaultTaxType || preselectedTaxType) as TaxType);
    }
  }, [defaultVehicleId, preselectedVehicleId, defaultTaxType, preselectedTaxType]);

  // Update dates when tax type or period changes
  const handleTaxTypeChange = (newType: TaxType) => {
    setTaxType(newType);
    const selectedVeh = vehicles.find((v) => v.id === vehicleId);
    if (selectedVeh && selectedVeh.taxes[newType]?.lastPaidAmount) {
      setAmount(selectedVeh.taxes[newType].lastPaidAmount.toString());
    }
    
    // Set typical duration
    const today = new Date();
    const target = new Date();
    if (newType === 'mv_tax') {
      target.setDate(today.getDate() + 90); // Quarterly
    } else if (newType === 'green_tax' || newType === 'insurance' || newType === 'fitness') {
      target.setDate(today.getDate() + 365); // 1 Year
    } else if (newType === 'permit') {
      target.setDate(today.getDate() + 365 * 5); // 5 Years
    } else if (newType === 'pucc') {
      target.setDate(today.getDate() + 180); // 6 Months
    }
    setPeriodTo(target.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !amount || !receiptChallanNo) {
      alert('Please fill in Amount and Receipt/Challan Number');
      return;
    }

    recordTaxPayment({
      vehicleId,
      taxType,
      paidDate,
      periodFrom,
      periodTo,
      amount: parseFloat(amount) || 0,
      receiptChallanNo: receiptChallanNo.trim(),
      paymentMode,
      notes: notes.trim(),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Tax &amp; Renewal Payment</h2>
              <p className="text-xs text-slate-400">
                Advances vehicle validity date &amp; logs atomic transaction to audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vehicle Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Fleet Vehicle *
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} &mdash; {v.makeModel} (Chassis L5: {v.chassisLast5})
                </option>
              ))}
            </select>
          </div>

          {/* Tax Type Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Statutory Tax / Document Category *
            </label>
            <select
              value={taxType}
              onChange={(e) => handleTaxTypeChange(e.target.value as TaxType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-semibold text-amber-300"
              required
            >
              <option value="mv_tax">Motor Vehicle Road Tax (Quarterly/Annual)</option>
              <option value="green_tax">Green Tax / Environmental Cess (&gt;8-15 Yrs)</option>
              <option value="insurance">Commercial Vehicle Insurance</option>
              <option value="fitness">Fitness Certificate (FC)</option>
              <option value="permit">National / State Goods Permit</option>
              <option value="pucc">Pollution Under Control (PUCC)</option>
            </select>
          </div>

          {/* Dates & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="24500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Period Covered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Validity From (Start Date) *
              </label>
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Validity To (Next Expiry Date) *
              </label>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 font-bold text-emerald-400"
                required
              />
            </div>
          </div>

          {/* Receipt / Challan & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Receipt / Challan Number *
              </label>
              <input
                type="text"
                value={receiptChallanNo}
                onChange={(e) => setReceiptChallanNo(e.target.value.toUpperCase())}
                placeholder="e.g. TN01-TX-2026-99120"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase text-xs focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Channel / Gateway *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Vahan Portal (Online)">Vahan Portal (Online)</option>
                <option value="Treasury e-Challan">Treasury e-Challan (e-Gras)</option>
                <option value="RTO Counter">RTO Counter (Physical)</option>
                <option value="Insurance Portal">Insurance Direct Portal</option>
                <option value="Bank Transfer">Bank RTGS/NEFT Transfer</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Remarks / Transaction Ref (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via corporate SBI credit card"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Record &amp; Advance Expiry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
