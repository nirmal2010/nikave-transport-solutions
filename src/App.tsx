import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DashboardKPIs } from './components/DashboardKPIs';
import { VehicleList } from './components/VehicleList';
import { PaymentLedgerView } from './components/PaymentLedgerView';
import { AuditLogsView } from './components/AuditLogsView';
import { ThresholdConfigView } from './components/ThresholdConfigView';
import { NotificationPlanView } from './components/NotificationPlanView';
import { VahanGuideView } from './components/VahanGuideView';
import { AddVehicleModal } from './components/AddVehicleModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { VahanPortalModal } from './components/VahanPortalModal';
import { ManagerAlertModal } from './components/ManagerAlertModal';
import { useVehicleStore } from './stores/vehicleStore';
import { TaxType, Vehicle } from './types/vehicle';

export const App: React.FC = () => {
  const { vehicles } = useVehicleStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('fleet');

  // Modals state
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [recordPaymentVehicleId, setRecordPaymentVehicleId] = useState<string | null>(null);
  const [recordPaymentTaxType, setRecordPaymentTaxType] = useState<TaxType | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false);

  const [isVahanModalOpen, setIsVahanModalOpen] = useState(false);
  const [vahanModalVehicleId, setVahanModalVehicleId] = useState<string | null>(null);

  const [isManagerAlertOpen, setIsManagerAlertOpen] = useState(false);

  // Handlers
  const handleOpenRecordPayment = (vehicleId?: string, taxType?: TaxType) => {
    setRecordPaymentVehicleId(vehicleId || null);
    setRecordPaymentTaxType(taxType || null);
    setIsRecordPaymentOpen(true);
  };

  const handleOpenVahanAssistant = (vehicleId?: string) => {
    setVahanModalVehicleId(vehicleId || null);
    setIsVahanModalOpen(true);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
        onOpenRecordPayment={() => handleOpenRecordPayment()}
        onOpenVahanAssistant={() => handleOpenVahanAssistant()}
        onOpenManagerAlerts={() => setIsManagerAlertOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPIs row shown on Fleet, Ledger, and Thresholds tabs */}
        {(activeTab === 'fleet' || activeTab === 'ledger' || activeTab === 'thresholds') && <DashboardKPIs />}

        {/* Tab 1: Fleet & Taxes */}
        {activeTab === 'fleet' && (
          <VehicleList
            onSelectVehicle={handleSelectVehicle}
            onOpenRecordPayment={handleOpenRecordPayment}
            onOpenVahanAssistant={handleOpenVahanAssistant}
          />
        )}

        {/* Tab 2: Payment Ledger */}
        {activeTab === 'ledger' && (
          <PaymentLedgerView onOpenRecordPayment={handleOpenRecordPayment} />
        )}

        {/* Tab 3: Transaction Audit Logs */}
        {activeTab === 'audit' && (
          <AuditLogsView />
        )}

        {/* Tab 4: Post-Expiry Thresholds & Grace Periods */}
        {activeTab === 'thresholds' && (
          <ThresholdConfigView />
        )}

        {/* Tab 5: Free Notification Engine */}
        {activeTab === 'alerts' && <NotificationPlanView />}

        {/* Tab 6: Parivahan Vahan Guide */}
        {activeTab === 'guide' && <VahanGuideView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} <strong className="text-slate-400">NIKAVE Transport Solutions</strong>. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>Motor Vehicle Tax</span>
            <span>•</span>
            <span>Green Tax</span>
            <span>•</span>
            <span>Insurance</span>
            <span>•</span>
            <span>Vahan Portal Co-Pilot</span>
            <span>•</span>
            <span className="text-emerald-500 font-medium">Free WhatsApp / SMS</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {isAddVehicleOpen && (
        <AddVehicleModal isOpen={isAddVehicleOpen} onClose={() => setIsAddVehicleOpen(false)} />
      )}

      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          defaultVehicleId={recordPaymentVehicleId || undefined}
          defaultTaxType={recordPaymentTaxType || undefined}
        />
      )}

      {isVehicleDetailOpen && selectedVehicle && (
        <VehicleDetailModal
          isOpen={isVehicleDetailOpen}
          vehicle={selectedVehicle}
          onClose={() => setIsVehicleDetailOpen(false)}
          onOpenRecordPayment={handleOpenRecordPayment}
          onOpenVahanAssistant={handleOpenVahanAssistant}
        />
      )}

      {isVahanModalOpen && (
        <VahanPortalModal
          isOpen={isVahanModalOpen}
          vehicleId={vahanModalVehicleId || undefined}
          onClose={() => setIsVahanModalOpen(false)}
          onOpenRecordPayment={(vId, tax) => handleOpenRecordPayment(vId, tax)}
        />
      )}

      {isManagerAlertOpen && (
        <ManagerAlertModal
          isOpen={isManagerAlertOpen}
          onClose={() => setIsManagerAlertOpen(false)}
        />
      )}
    </div>
  );
};
export default App;
