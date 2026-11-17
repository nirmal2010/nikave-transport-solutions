import React, { useState } from 'react';
import { ShieldCheck, History, ArrowRight, CheckCircle2, Copy, Filter } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { formatDate } from '../utils/compliance';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useVehicleStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (entityFilter !== 'all' && log.entityName !== entityFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Transactional Audit Trail</span>
              </span>
              <span className="text-xs text-slate-400">
                • {auditLogs.length} Immutable Transaction Records
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Database Audit Trail &amp; JSON State History
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Every vehicle addition, compliance update, and tax payment is recorded atomically inside a single database transaction. 
              Captures full <strong className="text-rose-400">previous_value</strong> and <strong className="text-emerald-400">new_value</strong> JSON state for audit compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Integrity Level</div>
              <div className="text-xs font-extrabold text-emerald-400 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Atomic Transactions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">Filter Audits:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Entities</option>
            <option value="vehicles">vehicles</option>
            <option value="vehicle_tax_compliances">vehicle_tax_compliances</option>
            <option value="tax_threshold_configs">tax_threshold_configs</option>
            <option value="notification_logs">notification_logs</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* Audit Log Items */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
          <p className="text-sm font-semibold">No audit logs matching selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const actionBadge = 
              log.action === 'INSERT'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : log.action === 'UPDATE'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

            return (
              <div 
                key={log.id}
                className="rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition overflow-hidden"
              >
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${actionBadge}`}>
                      {log.action}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {log.entityName}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          UUID: {log.entityId ? `${log.entityId.slice(0, 8)}...${log.entityId.slice(-4)}` : 'N/A'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>By: <strong className="text-slate-400">{log.performedBy}</strong></span>
                        <span>•</span>
                        <span>{formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(log.entityId, log.id);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition"
                      title="Copy Entity UUID"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === log.id ? 'Copied!' : 'Copy UUID'}</span>
                    </button>
                    <span className="text-xs text-indigo-400 font-semibold">
                      {isExpanded ? 'Hide Diff ▲' : 'View Diff ▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded Diff Viewer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous Value */}
                    <div className="rounded-lg bg-slate-900/60 p-3 border border-rose-500/20">
                      <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Previous State (Pre-image)</span>
                        <span className="text-[10px] text-slate-500">NULL on INSERT</span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded overflow-x-auto max-h-48 scrollbar-thin">
                        {log.previousValue 
                          ? JSON.stringify(log.previousValue, null, 2)
                          : '// None (New Entity Created)'}
                      </pre>
                    </div>

                    {/* New Value */}
                    <div className="rounded-lg bg-slate-900/60 p-3 border border-emerald-500/20">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>New State (Post-image)</span>
                        <span className="text-[10px] text-slate-500">Committed to Postgres</span>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded overflow-x-auto max-h-48 scrollbar-thin">
                        {log.newValue 
                          ? JSON.stringify(log.newValue, null, 2)
                          : '// None (Entity Deleted)'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

