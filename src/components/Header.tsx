import React from 'react';
import {
  Truck,
  Plus,
  Receipt,
  Bell,
  ExternalLink,
  RotateCcw,
  BookOpen,
  LayoutDashboard,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { VAHAN_PORTAL_URL } from '../utils/compliance';
import { useVehicleStore } from '../stores/vehicleStore';

export type ActiveTab = 'fleet' | 'ledger' | 'audit' | 'thresholds' | 'alerts' | 'guide';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddVehicle: () => void;
  onOpenRecordPayment: () => void;
  onOpenVahanAssistant: () => void;
  onOpenManagerAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddVehicle,
  onOpenRecordPayment,
  onOpenVahanAssistant,
  onOpenManagerAlerts,
}) => {
  const { resetToSampleFleet } = useVehicleStore();

  const handleReset = () => {
    if (confirm('Reset fleet to realistic sample Indian commercial fleet?')) {
      resetToSampleFleet();
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Top Brand & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                NIKAVE <span className="text-amber-400 font-normal">Transport Solutions</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                MVP Fleet &amp; Tax
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Commercial Fleet Compliance • MV Tax • Green Tax • Insurance • Parivahan Vahan
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Official Parivahan Vahan Button */}
          <a
            href={VAHAN_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-500/50 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm group"
            title="Open Government Parivahan Vahan Portal"
          >
            <span className="text-amber-400">🏛️</span>
            <span>Vahan Parivahan</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition" />
          </a>

          {/* Vahan Assistant Modal Trigger */}
          <button
            onClick={onOpenVahanAssistant}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
          >
            <span>Tax Helper</span>
          </button>

          {/* Manager Alerts */}
          <button
            onClick={onOpenManagerAlerts}
            className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Manager Alerts</span>
          </button>

          {/* Record Tax Payment */}
          <button
            onClick={onOpenRecordPayment}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-lg shadow-emerald-500/20"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>

          {/* Add Vehicle */}
          <button
            onClick={onOpenAddVehicle}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>

          {/* Reset Fleet */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Reset to realistic sample fleet"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'fleet'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Fleet &amp; Tax Compliance
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Tax Payment Ledger &amp; Receipts
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Transactional Audit Trail
        </button>

        <button
          onClick={() => setActiveTab('thresholds')}
          className={`py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'thresholds'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Post-Expiry &amp; Grace Rules
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Free WhatsApp &amp; SMS Engine
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`py-2.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'guide'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Vahan Parivahan Portal Guide
        </button>
      </div>
    </header>
  );
};
