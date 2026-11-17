import React, { useState } from 'react';
import { Receipt, Download, Search, Filter, IndianRupee, Calendar, Truck, Plus } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { TaxPaymentLog, TaxType } from '../types/vehicle';
import { formatDate, formatINR, TAX_NAMES, TAX_SHORT_NAMES } from '../utils/compliance';

interface PaymentLedgerViewProps {
  onOpenRecordPayment: (vehicleId?: string, taxType?: TaxType) => void;
}

export const PaymentLedgerView: React.FC<PaymentLedgerViewProps> = ({ onOpenRecordPayment }) => {
  const { vehicles } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [taxFilter, setTaxFilter] = useState<'all' | TaxType>('all');

  // Collect all payments across vehicles
  const allPayments: TaxPaymentLog[] = [];
  vehicles.forEach((v) => {
    if (v.paymentHistory && v.paymentHistory.length > 0) {
      allPayments.push(...v.paymentHistory);
    }
  });

  // Sort descending by paidDate
  allPayments.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());

  // Filtered payments
  const filtered = allPayments.filter((p) => {
    if (taxFilter !== 'all' && p.taxType !== taxFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchReg = p.vehicleReg.toLowerCase().includes(q);
      const matchRc = p.receiptChallanNo.toLowerCase().includes(q);
      const matchMode = p.paymentMode.toLowerCase().includes(q);
      if (!matchReg && !matchRc && !matchMode) return false;
    }
    return true;
  });

  // Financial Stats
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalMvTax = allPayments.filter((p) => p.taxType === 'mv_tax').reduce((sum, p) => sum + p.amount, 0);
  const totalGreenTax = allPayments.filter((p) => p.taxType === 'green_tax').reduce((sum, p) => sum + p.amount, 0);
  const totalInsurance = allPayments.filter((p) => p.taxType === 'insurance').reduce((sum, p) => sum + p.amount, 0);

  const exportCSV = () => {
    if (filtered.length === 0) {
      alert('No records to export');
      return;
    }

    const headers = ['Vehicle Reg', 'Tax Type', 'Paid Date', 'Period From', 'Period To', 'Amount (INR)', 'Receipt / Challan No', 'Payment Mode', 'Notes'];
    const rows = filtered.map((p) => [
      p.vehicleReg,
      TAX_NAMES[p.taxType] || p.taxType,
      p.paidDate,
      p.periodFrom,
      p.periodTo,
      p.amount,
      p.receiptChallanNo,
      p.paymentMode,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NIKAVE_Tax_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Total Taxes &amp; Fees Logged</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">All-Time</span>
          </div>
          <div className="text-xl font-black text-white font-mono">{formatINR(totalPaid)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{allPayments.length} recorded payments</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-lg">
          <div className="text-xs text-amber-400 mb-1 flex items-center justify-between">
            <span>Motor Vehicle Tax (MV Tax)</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">Vahan</span>
          </div>
          <div className="text-xl font-black text-amber-300 font-mono">{formatINR(totalMvTax)}</div>
          <div className="text-[11px] text-slate-500 mt-1">State road quarterly taxes</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg">
          <div className="text-xs text-emerald-400 mb-1 flex items-center justify-between">
            <span>Green Tax (Env Cess)</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Vahan</span>
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">{formatINR(totalGreenTax)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Old vehicle environmental fee</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-lg">
          <div className="text-xs text-blue-400 mb-1 flex items-center justify-between">
            <span>Commercial Insurance</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Policy</span>
          </div>
          <div className="text-xl font-black text-blue-300 font-mono">{formatINR(totalInsurance)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Comprehensive fleet cover</div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Reg No, Receipt No..."
              className="w-full bg-slate-900 border border-slate-750 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={taxFilter}
            onChange={(e) => setTaxFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-750 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Tax &amp; Fee Types</option>
            <option value="mv_tax">Motor Vehicle Tax</option>
            <option value="green_tax">Green Tax</option>
            <option value="insurance">Insurance</option>
            <option value="fitness">Fitness Certificate</option>
            <option value="permit">Permit</option>
            <option value="pucc">PUCC</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => onOpenRecordPayment()}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No payment records found. Use &quot;Record Payment&quot; above to log your road tax or insurance payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Vehicle Reg #</th>
                  <th className="p-3.5">Tax / Document</th>
                  <th className="p-3.5">Paid Date</th>
                  <th className="p-3.5">Period Covered</th>
                  <th className="p-3.5">Amount (INR)</th>
                  <th className="p-3.5">Receipt / Challan No</th>
                  <th className="p-3.5">Payment Channel</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-white tracking-wider font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                        {item.vehicleReg}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans font-semibold text-amber-400">
                      {TAX_NAMES[item.taxType] || item.taxType}
                    </td>
                    <td className="p-3.5 font-sans text-slate-300">{formatDate(item.paidDate)}</td>
                    <td className="p-3.5 text-[11px] font-sans text-slate-400">
                      {formatDate(item.periodFrom)} → {formatDate(item.periodTo)}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400 text-sm">
                      {formatINR(item.amount)}
                    </td>
                    <td className="p-3.5 text-slate-200 text-[11px]">
                      <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {item.receiptChallanNo}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans text-slate-400 text-[11px]">{item.paymentMode}</td>
                    <td className="p-3.5 font-sans text-slate-500 text-[11px] truncate max-w-[200px]">
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
