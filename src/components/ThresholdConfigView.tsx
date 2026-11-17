import React, { useState } from 'react';
import { Sliders, AlertTriangle, ShieldCheck, Check, Clock, Scale } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { TaxType, TaxThresholdConfig } from '../types/vehicle';
import { TAX_NAMES } from '../utils/compliance';

export const ThresholdConfigView: React.FC = () => {
  const { taxThresholds, updateTaxThreshold } = useVehicleStore();
  const [editingCode, setEditingCode] = useState<TaxType | null>(null);
  const [formData, setFormData] = useState<Partial<TaxThresholdConfig>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleStartEdit = (threshold: TaxThresholdConfig) => {
    setEditingCode(threshold.taxCode);
    setFormData({
      gracePeriodDays: threshold.gracePeriodDays,
      penaltyRate: threshold.penaltyRate,
      lateFeeFlat: threshold.lateFeeFlat,
      preExpiryAlertDays: threshold.preExpiryAlertDays,
      postExpiryAlertDays: threshold.postExpiryAlertDays,
      statutoryWarning: threshold.statutoryWarning,
    });
  };

  const handleSave = (taxCode: TaxType) => {
    updateTaxThreshold(taxCode, formData);
    setEditingCode(null);
    setSaveSuccess(taxCode);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 border border-amber-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Statutory Compliance Thresholds</span>
              </span>
              <span className="text-xs text-slate-400">
                • Indian Motor Vehicles Act &amp; State RTO Rules
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Tax Thresholds, Grace Periods &amp; Penalty Rules
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Configure pre-expiry notification lead times, statutory grace periods, and post-expiry compounding penalty calculations. 
              These thresholds control when the automated WhatsApp and SMS alerts trigger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Persistence</div>
              <div className="text-xs font-extrabold text-amber-400 flex items-center justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Stored in Postgres</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {taxThresholds.map((threshold) => {
          const isEditing = editingCode === threshold.taxCode;

          return (
            <div
              key={threshold.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold">
                      {threshold.taxCode}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-1">
                      {threshold.taxName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {threshold.description}
                    </p>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(threshold)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                    >
                      Configure
                    </button>
                  )}
                </div>

                {saveSuccess === threshold.taxCode && (
                  <div className="mb-4 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Thresholds updated and logged to audit trail!</span>
                  </div>
                )}

                {/* Form or Display */}
                {isEditing ? (
                  <div className="space-y-4 py-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">
                          Grace Period (Days):
                        </label>
                        <input
                          type="number"
                          value={formData.gracePeriodDays ?? 0}
                          onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">
                          Penalty Rate (% per mo / ₹ per day):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.penaltyRate ?? 0}
                          onChange={(e) => setFormData({ ...formData, penaltyRate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Pre-Expiry Alert Days (comma separated):
                      </label>
                      <input
                        type="text"
                        value={(formData.preExpiryAlertDays || []).join(', ')}
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                          setFormData({ ...formData, preExpiryAlertDays: arr });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Post-Expiry Alert Days (comma separated):
                      </label>
                      <input
                        type="text"
                        value={(formData.postExpiryAlertDays || []).join(', ')}
                        onChange={(e) => {
                          const arr = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                          setFormData({ ...formData, postExpiryAlertDays: arr });
                        }}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 font-semibold block mb-1">
                        Statutory Warning Message:
                      </label>
                      <textarea
                        rows={2}
                        value={formData.statutoryWarning || ''}
                        onChange={(e) => setFormData({ ...formData, statutoryWarning: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSave(threshold.taxCode)}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                      >
                        Save Configuration
                      </button>
                      <button
                        onClick={() => setEditingCode(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Grace Period</span>
                        <span className="font-extrabold text-amber-400 text-sm">
                          {threshold.gracePeriodDays} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Penalty Structure</span>
                        <span className="font-extrabold text-rose-400 text-sm">
                          {threshold.penaltyType === 'DAILY_FLAT' 
                            ? `₹${threshold.penaltyRate}/day` 
                            : `${threshold.penaltyRate}% / month`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>Pre-Expiry Triggers:</strong> {threshold.preExpiryAlertDays.join(', ')} days before
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>
                        <strong>Post-Expiry Triggers:</strong> {threshold.postExpiryAlertDays.join(', ')} days after
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                      <strong>Legal Consequence:</strong> {threshold.statutoryWarning}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Default Cycle: <strong className="text-slate-400 uppercase">{threshold.defaultFrequency}</strong></span>
                <span className="font-mono text-[10px]">UUID: {threshold.id.slice(0, 8)}...</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

