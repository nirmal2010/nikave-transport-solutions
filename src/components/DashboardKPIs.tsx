import React from 'react';
import { Truck, CheckCircle2, AlertTriangle, Clock, XCircle, IndianRupee, Scale } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { getComplianceStatus, formatINR } from '../utils/compliance';
import { TaxType, ComplianceStatus } from '../types/vehicle';

export const DashboardKPIs: React.FC = () => {
  const { vehicles, setStatusFilter } = useVehicleStore();

  let compliantCount = 0;
  let dueSoonCount = 0;
  let urgentCount = 0;
  let gracePeriodCount = 0;
  let overdueCount = 0;

  const taxKeys: TaxType[] = ['mv_tax', 'green_tax', 'insurance', 'fitness', 'permit', 'pucc'];

  vehicles.forEach((v) => {
    let worst: ComplianceStatus = 'valid';
    for (const key of taxKeys) {
      const rec = v.taxes[key];
      if (rec && rec.enabled) {
        const s = getComplianceStatus(rec, key);
        if (s === 'overdue') {
          worst = 'overdue';
          break;
        } else if (s === 'grace_period') {
          worst = 'grace_period';
        } else if (s === 'urgent' && worst !== 'grace_period') {
          worst = 'urgent';
        } else if (s === 'expiring_soon' && worst === 'valid') {
          worst = 'expiring_soon';
        }
      }
    }

    if (worst === 'overdue') overdueCount++;
    else if (worst === 'grace_period') gracePeriodCount++;
    else if (worst === 'urgent') urgentCount++;
    else if (worst === 'expiring_soon') dueSoonCount++;
    else compliantCount++;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
      {/* Total Fleet */}
      <div
        onClick={() => setStatusFilter('all')}
        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg group"
      >
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Active Fleet</span>
          <Truck className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
        </div>
        <div className="text-2xl font-black text-white font-mono">{vehicles.length}</div>
        <div className="text-[11px] text-slate-500 mt-1">Vehicles tracked</div>
      </div>

      {/* Overdue / Active Penalty */}
      <div
        onClick={() => setStatusFilter('overdue')}
        className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer shadow-lg group ${
          overdueCount > 0
            ? 'border-rose-500/50 bg-rose-950/10 hover:border-rose-400'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-rose-400 text-xs mb-1">
          <span className="font-semibold">Overdue (Penalty)</span>
          <XCircle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-black text-rose-400 font-mono">{overdueCount}</div>
        <div className="text-[11px] text-rose-300/80 mt-1">Late interest active</div>
      </div>

      {/* Grace Period */}
      <div
        onClick={() => setStatusFilter('grace_period')}
        className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer shadow-lg group ${
          gracePeriodCount > 0
            ? 'border-orange-500/50 bg-orange-950/10 hover:border-orange-400'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-orange-400 text-xs mb-1">
          <span className="font-semibold">Grace Period</span>
          <Clock className="w-4 h-4 text-orange-400" />
        </div>
        <div className="text-2xl font-black text-orange-400 font-mono">{gracePeriodCount}</div>
        <div className="text-[11px] text-orange-300/80 mt-1">Renew before penalty</div>
      </div>

      {/* Urgent */}
      <div
        onClick={() => setStatusFilter('urgent')}
        className={`p-4 rounded-2xl bg-slate-900 border transition cursor-pointer shadow-lg group ${
          urgentCount > 0
            ? 'border-amber-500/50 bg-amber-950/10 hover:border-amber-400'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
          <span className="font-semibold">Urgent (≤7 Days)</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-black text-amber-400 font-mono">{urgentCount}</div>
        <div className="text-[11px] text-amber-300/80 mt-1">Due this week</div>
      </div>

      {/* Compliant */}
      <div
        onClick={() => setStatusFilter('valid')}
        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer shadow-lg group"
      >
        <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
          <span>Compliant</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-black text-emerald-400 font-mono">{compliantCount}</div>
        <div className="text-[11px] text-slate-500 mt-1">All dues clear</div>
      </div>
    </div>
  );
};
