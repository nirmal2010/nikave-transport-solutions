import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Info, ShieldCheck, ArrowRight, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { VAHAN_PORTAL_URL } from '../utils/compliance';
import { useVehicleStore } from '../stores/vehicleStore';

export const VahanGuideView: React.FC = () => {
  const { vehicles } = useVehicleStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
            <span>🏛️ MoRTH Parivahan Sewa</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
              Government Portal Integration
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Vahan Citizen Services — Online Tax Payment Portal Guide
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            The official Ministry of Road Transport and Highways (MoRTH) portal enables commercial vehicle owners to pay Motor Vehicle Tax, Green Tax (Environmental Cess), and check pending liabilities online.
          </p>
        </div>

        <a
          href={VAHAN_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shrink-0 shadow-lg shadow-amber-500/20"
        >
          Open Parivahan Vahan
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* The 4-Step Payment Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">State &amp; RTO Selection</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Navigate to <code>vahan/ui/statevalidation/homepage.xhtml</code>. Select your vehicle&apos;s registered State (e.g. Tamil Nadu, Maharashtra, Karnataka) and your corresponding RTO Office. Check &quot;I accept the privacy policy&quot; and click <strong>Proceed</strong>.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
            <strong>Pro Tip:</strong> Many states now allow you to directly enter the Vehicle Registration Number on the homepage without picking the RTO manually.
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Citizen Services &rarr; &quot;Pay Your Tax&quot;</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            On the Citizen Services dashboard, select <strong>&quot;Pay Your Tax&quot;</strong>. The portal will prompt you for:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>Vehicle Registration Number (e.g. <span className="font-mono text-amber-300">TN-01-AX-4825</span>)</li>
            <li><strong>Chassis Number (Last 5 characters)</strong> &mdash; <em>mandatory verification step!</em></li>
          </ul>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
            NIKAVE highlights the last 5 chassis digits on every vehicle card with a 1-click copy button so you never type it wrong.
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Tax Computation &amp; Green Tax Review</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Vahan automatically fetches your vehicle specifications (Gross Vehicle Weight, Seating, Fuel Type) and computes:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li><strong>Motor Vehicle Tax (MV Tax)</strong>: Quarterly, Half-Yearly, or Annual payment options.</li>
            <li><strong>Green Tax</strong>: Added automatically if vehicle age exceeds 8 or 15 years depending on state.</li>
            <li><strong>Late Fee / Penalty</strong>: Accrues daily if paid after due date!</li>
          </ul>
        </div>

        {/* Step 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-sm">
              4
            </div>
            <h3 className="text-sm font-bold text-white">Online Payment &amp; Form 53 Receipt</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select payment gateway (SBI ePay, Treasury e-GRAS, NetBanking, or UPI). Once transaction succeeds, download <strong>e-Receipt / Form 53</strong>. Copy the Receipt Number into NIKAVE&apos;s &quot;Record Payment&quot; modal to log it in your ledger!
          </p>
        </div>
      </div>

      {/* Fleet Vahan Credentials Quick Sheet */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>Active Fleet Vahan Quick-Copy Credentials</span>
          <span className="text-xs text-slate-400 font-normal">Ready to paste into Parivahan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-mono font-bold text-white">{v.registrationNumber}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{v.makeModel}</div>
                <div className="text-[11px] text-slate-500">
                  State: {v.state} | RTO: {v.rtoCode}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-[10px] text-slate-400">Chassis Last 5:</div>
                <button
                  onClick={() => copyToClipboard(v.chassisLast5, v.id)}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs flex items-center gap-1.5 transition ml-auto"
                  title="Click to copy chassis last 5"
                >
                  {copiedKey === v.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{v.chassisLast5}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
