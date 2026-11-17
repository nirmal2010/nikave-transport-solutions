import React, { useState } from 'react';
import { X, Truck, Check, Sparkles, Shield, AlertCircle, Building, User } from 'lucide-react';
import { Vehicle, VehicleCategory } from '../types/vehicle';
import { useVehicleStore } from '../stores/vehicleStore';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  'Multi-Axle Truck (10/12/14 Wheeler)',
  'Heavy Goods Vehicle (HGV)',
  'Prime Mover / Articulated Trailer',
  'Tipper / Dumper',
  'Tanker (Petroleum/Chemical/Water)',
  'Light Commercial Vehicle (LCV)',
  'Commercial Bus / Staff Bus',
];

const PRESET_MODELS = [
  'Tata Signa 4825.TK (16 Wheeler)',
  'Tata Prima 3530.K',
  'Ashok Leyland 2820 (6x2 Haulage)',
  'Ashok Leyland AVTR 4220',
  'BharatBenz 3528C (Heavy Tipper)',
  'BharatBenz 2823R (Multi-Axle)',
  'Mahindra Blazo X 49 (Tractor Trailer)',
  'Eicher Pro 3015 (Container LCV)',
  'Eicher Pro 6028 (Heavy Duty)',
];

const INDIAN_STATES = [
  { name: 'Tamil Nadu', rto: 'TN-01 (Chennai Central)' },
  { name: 'Maharashtra', rto: 'MH-12 (Pune)' },
  { name: 'Karnataka', rto: 'KA-04 (Bangalore North)' },
  { name: 'Gujarat', rto: 'GJ-06 (Vadodara)' },
  { name: 'Delhi', rto: 'DL-01 (Mall Road)' },
  { name: 'Andhra Pradesh', rto: 'AP-16 (Vijayawada)' },
  { name: 'Telangana', rto: 'TS-09 (Hyderabad Central)' },
  { name: 'Rajasthan', rto: 'RJ-14 (Jaipur South)' },
  { name: 'Uttar Pradesh', rto: 'UP-32 (Lucknow)' },
  { name: 'West Bengal', rto: 'WB-02 (Kolkata Central)' },
];

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ isOpen, onClose }) => {
  const { addVehicle, managerConfig } = useVehicleStore();

  const [regNo, setRegNo] = useState('');
  const [regDate, setRegDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [chassisNo, setChassisNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleCategory>('Multi-Axle Truck (10/12/14 Wheeler)');
  const [makeModel, setMakeModel] = useState('Tata Signa 4825.TK (16 Wheeler)');
  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const [mfgYear, setMfgYear] = useState<number>(2022);
  const [gvwKg, setGvwKg] = useState<number>(35000);
  const [unladenWeightKg, setUnladenWeightKg] = useState<number>(9500);
  const [fuelType, setFuelType] = useState<'DIESEL' | 'CNG' | 'ELECTRIC' | 'LNG'>('DIESEL');
  const [emissionNorms, setEmissionNorms] = useState<'BS-VI' | 'BS-IV'>('BS-VI');

  // Owner & Finance Details
  const [ownerName, setOwnerName] = useState('NIKAVE Logistics Solutions Pvt Ltd');
  const [ownerPhone, setOwnerPhone] = useState(managerConfig.managerPhone || '+919876543210');
  const [ownerEmail, setOwnerEmail] = useState(managerConfig.managerEmail || 'fleet@nikave.com');
  const [ownerPanOrGst, setOwnerPanOrGst] = useState('33AAACN1234F1Z8');
  const [isHypothecated, setIsHypothecated] = useState(true);
  const [financierName, setFinancierName] = useState('HDFC Bank Commercial Vehicle Division');

  // Driver Details
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [division, setDivision] = useState('Main Freight Division');

  // MV Tax
  const [mvTaxExpiry, setMvTaxExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [mvTaxAmount, setMvTaxAmount] = useState('24500');

  // Green Tax
  const [hasGreenTax, setHasGreenTax] = useState(false);
  const [greenTaxExpiry, setGreenTaxExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d.toISOString().split('T')[0];
  });
  const [greenTaxAmount, setGreenTaxAmount] = useState('3500');

  // Insurance
  const [insurerName, setInsurerName] = useState('ICICI Lombard General Insurance');
  const [policyNo, setPolicyNo] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d.toISOString().split('T')[0];
  });
  const [insuranceAmount, setInsuranceAmount] = useState('58000');

  // Fitness Certificate
  const [fitnessExpiry, setFitnessExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d.toISOString().split('T')[0];
  });
  const [fitnessAmount, setFitnessAmount] = useState('4200');

  // Auto-derived chassis last 5
  const chassisL5 = chassisNo.trim().length >= 5 ? chassisNo.trim().slice(-5).toUpperCase() : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim() || !chassisNo.trim() || !engineNo.trim()) {
      alert('Please fill in Registration Number, Chassis Number, and Engine Number');
      return;
    }

    const stateObj = INDIAN_STATES[selectedStateIndex];
    const today = new Date().toISOString().split('T')[0];

    addVehicle({
      registrationNumber: regNo.trim().toUpperCase(),
      registrationDate: regDate,
      chassisNumber: chassisNo.trim().toUpperCase(),
      chassisLast5: chassisL5,
      engineNumber: engineNo.trim().toUpperCase(),
      vehicleType,
      vehicleClass: vehicleType,
      makeModel,
      state: stateObj.name,
      rtoCode: stateObj.rto,
      manufacturingYear: mfgYear,
      grossVehicleWeightKg: gvwKg,
      unladenWeightKg,
      fuelType,
      emissionNorms,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim(),
      ownerPanOrGst: ownerPanOrGst.trim(),
      isHypothecated,
      financierName: isHypothecated ? financierName.trim() : undefined,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      division: division.trim(),
      taxes: {
        mv_tax: {
          enabled: true,
          lastPaidDate: today,
          expiryDate: mvTaxExpiry,
          lastPaidAmount: parseFloat(mvTaxAmount) || 0,
          frequency: 'quarterly',
          paymentMode: 'Vahan Portal (Online)',
          gracePeriodDays: 15,
        },
        green_tax: {
          enabled: hasGreenTax,
          lastPaidDate: hasGreenTax ? today : '',
          expiryDate: hasGreenTax ? greenTaxExpiry : '',
          lastPaidAmount: hasGreenTax ? parseFloat(greenTaxAmount) || 0 : 0,
          frequency: 'annual',
          paymentMode: 'Vahan Portal (Online)',
          gracePeriodDays: 0,
        },
        insurance: {
          enabled: true,
          lastPaidDate: today,
          expiryDate: insuranceExpiry,
          lastPaidAmount: parseFloat(insuranceAmount) || 0,
          insurerName: insurerName.trim(),
          policyNumber: policyNo.trim() || `POL-${Date.now().toString().slice(-6)}`,
          insuranceType: 'Comprehensive',
          frequency: 'annual',
          gracePeriodDays: 0,
        },
        fitness: {
          enabled: true,
          lastPaidDate: today,
          expiryDate: fitnessExpiry,
          lastPaidAmount: parseFloat(fitnessAmount) || 0,
          frequency: 'annual',
          gracePeriodDays: 0,
        },
        permit: {
          enabled: true,
          lastPaidDate: today,
          expiryDate: new Date(Date.now() + 365 * 5 * 86400000).toISOString().split('T')[0],
          lastPaidAmount: 18000,
          frequency: '5_years',
          gracePeriodDays: 15,
        },
        pucc: {
          enabled: true,
          lastPaidDate: today,
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          lastPaidAmount: 250,
          frequency: '6_months',
          gracePeriodDays: 0,
        },
      },
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add New Fleet Vehicle</h2>
              <p className="text-xs text-slate-400">
                Register vehicle details, owner info, Parivahan chassis credentials &amp; tax dates
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Identification */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>1. Vehicle Identification &amp; Parivahan Keys</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                  placeholder="e.g. TN-01-AB-1234"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registration Date *
                </label>
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Chassis / VIN *
                </label>
                <input
                  type="text"
                  value={chassisNo}
                  onChange={(e) => setChassisNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MAT628045M2C19482"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase text-sm focus:outline-none focus:border-amber-500"
                  required
                />
                {chassisL5 && (
                  <div className="mt-1 text-[11px] text-amber-400 font-mono">
                    Vahan Last 5 Digits: <strong>{chassisL5}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Engine Number *
                </label>
                <input
                  type="text"
                  value={engineNo}
                  onChange={(e) => setEngineNo(e.target.value.toUpperCase())}
                  placeholder="e.g. CUMMINS-ISBe6.7"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gross Vehicle Wt (GVW Kg)
                </label>
                <input
                  type="number"
                  value={gvwKg}
                  onChange={(e) => setGvwKg(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mfg Year
                </label>
                <input
                  type="number"
                  value={mfgYear}
                  onChange={(e) => setMfgYear(parseInt(e.target.value) || 2022)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Owner & Finance */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>2. Owner Information &amp; Hypothecation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner / Company Name *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner Mobile (for WhatsApp/SMS) *
                </label>
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Owner PAN / GST
                </label>
                <input
                  type="text"
                  value={ownerPanOrGst}
                  onChange={(e) => setOwnerPanOrGst(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isHypothecated}
                  onChange={(e) => setIsHypothecated(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                />
                <span>Vehicle is Hypothecated (Loan / Bank Financed)</span>
              </label>
            </div>

            {isHypothecated && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Financier / Bank Name
                </label>
                <input
                  type="text"
                  value={financierName}
                  onChange={(e) => setFinancierName(e.target.value)}
                  placeholder="e.g. HDFC Bank, Sundaram Finance Ltd"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Section 3: Initial Tax Expiry Dates */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>3. Statutory Tax &amp; Compliance Due Dates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MV Tax */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">Motor Vehicle Tax</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Quarterly / Vahan
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Next Expiry Date</label>
                    <input
                      type="date"
                      value={mvTaxExpiry}
                      onChange={(e) => setMvTaxExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Est. Amount (₹)</label>
                    <input
                      type="number"
                      value={mvTaxAmount}
                      onChange={(e) => setMvTaxAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Green Tax */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-white">
                    <input
                      type="checkbox"
                      checked={hasGreenTax}
                      onChange={(e) => setHasGreenTax(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                    />
                    <span>Green Tax (Env Cess)</span>
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    Annual / &gt;8 Yrs
                  </span>
                </div>
                {hasGreenTax && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={greenTaxExpiry}
                        onChange={(e) => setGreenTaxExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={greenTaxAmount}
                        onChange={(e) => setGreenTaxAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Insurance */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">Commercial Insurance</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                    Zero Grace Period
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={insuranceExpiry}
                      onChange={(e) => setInsuranceExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Premium (₹)</label>
                    <input
                      type="number"
                      value={insuranceAmount}
                      onChange={(e) => setInsuranceAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Fitness */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-white">Fitness Certificate (FC)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                    ₹50/day penalty
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={fitnessExpiry}
                      onChange={(e) => setFitnessExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Fee (₹)</label>
                    <input
                      type="number"
                      value={fitnessAmount}
                      onChange={(e) => setFitnessAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/25"
            >
              <Check className="w-4 h-4" />
              <span>Save Vehicle &amp; Generate UUID</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
