import React, { useState } from 'react';
import {
  X,
  Bell,
  Send,
  MessageSquare,
  Smartphone,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';
import { generateDailyDigest, VAHAN_PORTAL_URL, getWhatsAppDirectUrl } from '../utils/compliance';

interface ManagerAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManagerAlertModal: React.FC<ManagerAlertModalProps> = ({ isOpen, onClose }) => {
  const { vehicles, managerConfig, updateManagerConfig } = useVehicleStore();

  const [activeTab, setActiveTab] = useState<'preview' | 'free_options' | 'settings'>('preview');
  const [managerName, setManagerName] = useState(managerConfig.managerName);
  const [managerPhone, setManagerPhone] = useState(managerConfig.managerPhone);
  const [callMeBotKey, setCallMeBotKey] = useState(managerConfig.callMeBotApiKey);
  const [selectedIntervals, setSelectedIntervals] = useState<number[]>(
    managerConfig.notifyDaysBefore || [30, 15, 7, 3, 1, 0]
  );
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Digest message
  const digestMessage = generateDailyDigest(vehicles);

  const toggleInterval = (day: number) => {
    if (selectedIntervals.includes(day)) {
      setSelectedIntervals(selectedIntervals.filter((d) => d !== day));
    } else {
      setSelectedIntervals([...selectedIntervals, day].sort((a, b) => b - a));
    }
  };

  const handleSaveConfig = () => {
    updateManagerConfig({
      managerName,
      managerPhone,
      callMeBotApiKey: callMeBotKey,
      callMeBotPhone: managerPhone,
      notifyDaysBefore: selectedIntervals,
    });
    alert('Transport Manager alert preferences saved successfully!');
  };

  const copyDigest = () => {
    navigator.clipboard.writeText(digestMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTest = () => {
    setTestSent(true);
    const url = getWhatsAppDirectUrl(managerPhone, digestMessage);
    window.open(url, '_blank');
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-emerald-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Transport Manager Alert System
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  100% Free WhatsApp &amp; SMS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                NIKAVE automated notifications for MV Tax, Green Tax &amp; Insurance renewals
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

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 gap-6 text-xs font-semibold bg-slate-950/40">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'preview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Live Preview &amp; Test Alert
          </button>
          <button
            onClick={() => setActiveTab('free_options')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'free_options'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Free WhatsApp &amp; SMS Options
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Config &amp; Alert Intervals
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Live Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Target Recipient: {managerName} ({managerPhone})
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Compiled directly from current fleet records with active Parivahan payment links.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyDigest}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleSendTest}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open WhatsApp Alert
                  </button>
                </div>
              </div>

              {/* Formatted Message Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  WhatsApp / SMS Message Payload Preview:
                </label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {digestMessage}
                </div>
              </div>

              {/* Quick Explanation */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-start gap-3">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <div>
                  <strong>Instant WhatsApp Dispatch:</strong> Clicking &quot;Open WhatsApp Alert&quot; launches WhatsApp with this pre-formatted message filled in. The Transport Manager can immediately review pending taxes and tap the Parivahan link directly to complete payments!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Free WhatsApp & SMS Options */}
          {activeTab === 'free_options' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                100% permanently free options for delivering renewal alerts to your Transport Manager without paying gateway fees:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: WhatsApp Direct Link (wa.me) */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        1. WhatsApp Direct (wa.me)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Uses WhatsApp native web/app URI scheme (<code>wa.me/number?text=...</code>). Requires no API keys, no server costs, and no approvals. Works immediately in 1-click.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-400 font-bold border-t border-slate-700/50 pt-2">
                    ✓ 100% Free &bull; Zero Setup
                  </div>
                </div>

                {/* Option 2: CallMeBot Free WhatsApp API */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-amber-500/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        2. CallMeBot Gateway
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Free developer gateway that sends automated WhatsApp messages to your own phone via a simple HTTP GET endpoint. Fully automated via Vercel Cron.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-amber-400 font-bold border-t border-slate-700/50 pt-2">
                    ✓ 100% Free &bull; Automated Push
                  </div>
                </div>

                {/* Option 3: Android Local SMS Gateway */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-blue-500/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-blue-400" />
                        3. Android SMS Gateway
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Runs on any spare office Android phone. Uses standard 100 free SMS/day bundled in Indian mobile recharges (Jio/Airtel). Zero DLT fees!
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-blue-400 font-bold border-t border-slate-700/50 pt-2">
                    ✓ 100% Free &bull; Offline Cellular SMS
                  </div>
                </div>
              </div>

              {/* Vercel Hosting & Cron Plan */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <h4 className="font-bold text-white mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Vercel Serverless Hosting + Vercel Cron Plan:
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  When deployed to Vercel, NIKAVE uses <strong>Vercel Cron</strong> (configured in <code>vercel.json</code> to run daily at 08:30 AM IST). The cron triggers <code>/api/cron-check-renewals</code>, evaluates all vehicles with upcoming due dates (30d, 15d, 7d, 1d) and post-expiry thresholds (1d, 3d, 7d, 15d, 30d), and automatically delivers the notification!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Configuration & Trigger Intervals */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transport Manager Name
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Rajesh Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CallMeBot Free API Key (Optional for Automated WhatsApp)
                </label>
                <input
                  type="text"
                  value={callMeBotKey}
                  onChange={(e) => setCallMeBotKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 1234567"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Get your key free in 60 seconds by sending <code>I allow callmebot to send me messages</code> to <strong>+34 644 68 83 23</strong> on WhatsApp.
                </span>
              </div>

              {/* Interval Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Configured Pre-Expiry Renewal Alert Intervals (Days before expiry):
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[30, 15, 7, 3, 1, 0].map((days) => {
                    const isSelected = selectedIntervals.includes(days);
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => toggleInterval(days)}
                        className={`p-3 rounded-xl border text-center transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-base font-mono">
                          {days === 0 ? 'Due Day' : `${days}d`}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {days === 0 ? 'On Expiry' : 'Before'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  Save Alert Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="text-[11px] text-slate-400">
            Transport Solution: <strong>NIKAVE Fleet Systems</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
