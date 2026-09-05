import React from 'react';
import {
  Home,
  Calendar,
  Truck,
  Users,
  CreditCard,
  FileText,
  PieChart,
  Fuel,
  Receipt,
  Wrench,
  FileCheck,
  Disc,
  Banknote,
  ShieldCheck,
  Settings,
  PlusCircle,
  Building2,
  Smartphone,
} from 'lucide-react';
import { Language, translations } from '../translations';
import { User } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AddToHomeScreenModal } from './AddToHomeScreenModal';

interface Props {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddHisaab: () => void;
  lang: Language;
  user: User | null;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  onOpenAddHisaab,
  lang,
  user,
}) => {
  const t = translations[lang];
  const isDriver = user?.role === 'driver';
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    showInstallGuideModal,
    setShowInstallGuideModal,
    triggerInstall,
    openInNewTab,
  } = usePWAInstall();

  const navItemClass = (tab: string) => `
    flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
      currentTab === tab
        ? 'bg-[#FF8C00] text-white font-black shadow-xs'
        : 'text-[#A0A09B] hover:text-white hover:bg-[#2C2C2A]'
    }
  `;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1A1A1A] border-r border-[#2C2C2A] text-white shrink-0 min-h-screen">
      {/* Primary Action Button */}
      <div className="p-4 border-b border-[#2C2C2A]">
        <button
          onClick={onOpenAddHisaab}
          className="w-full flex items-center justify-center space-x-2 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black px-4 py-3 rounded-xl shadow-xs transition active:scale-98"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>{t.addHisaab}</span>
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Section */}
        <div>
          <p className="px-3 text-[10px] font-black text-[#70706B] uppercase tracking-wider mb-2">
            DAILY WORK
          </p>
          <div className="space-y-1">
            <button onClick={() => onTabChange('home')} className={`w-full ${navItemClass('home')}`}>
              <Home className="w-4 h-4" />
              <span>{t.navHome}</span>
            </button>
            <button onClick={() => onTabChange('hisaab')} className={`w-full ${navItemClass('hisaab')}`}>
              <Calendar className="w-4 h-4" />
              <span>{t.navHisaab} (Diary)</span>
            </button>
            <button onClick={() => onTabChange('trips')} className={`w-full ${navItemClass('trips')}`}>
              <Truck className="w-4 h-4" />
              <span>{t.navTrips}</span>
            </button>
          </div>
        </div>

        {/* Khata & Money */}
        {!isDriver && (
          <div>
            <p className="px-3 text-[10px] font-black text-[#70706B] uppercase tracking-wider mb-2">
              KHATA & PAYMENTS
            </p>
            <div className="space-y-1">
              <button onClick={() => onTabChange('customers')} className={`w-full ${navItemClass('customers')}`}>
                <Users className="w-4 h-4" />
                <span>Customers & Udhaar</span>
              </button>
              <button onClick={() => onTabChange('payments')} className={`w-full ${navItemClass('payments')}`}>
                <CreditCard className="w-4 h-4" />
                <span>Payment History</span>
              </button>
              <button onClick={() => onTabChange('bills')} className={`w-full ${navItemClass('bills')}`}>
                <FileText className="w-4 h-4" />
                <span>Transport Bills</span>
              </button>
              <button onClick={() => onTabChange('reports')} className={`w-full ${navItemClass('reports')}`}>
                <PieChart className="w-4 h-4" />
                <span>Profit & Reports</span>
              </button>
            </div>
          </div>
        )}

        {/* Fleet & Expenses */}
        <div>
          <p className="px-3 text-[10px] font-black text-[#70706B] uppercase tracking-wider mb-2">
            VEHICLE & EXPENSES
          </p>
          <div className="space-y-1">
            <button onClick={() => onTabChange('fuel')} className={`w-full ${navItemClass('fuel')}`}>
              <Fuel className="w-4 h-4" />
              <span>Diesel & Mileage</span>
            </button>
            <button onClick={() => onTabChange('expenses')} className={`w-full ${navItemClass('expenses')}`}>
              <Receipt className="w-4 h-4" />
              <span>Daily Expenses</span>
            </button>
            {!isDriver && (
              <>
                <button onClick={() => onTabChange('vehicles')} className={`w-full ${navItemClass('vehicles')}`}>
                  <Truck className="w-4 h-4" />
                  <span>My Vehicles</span>
                </button>
                <button onClick={() => onTabChange('drivers')} className={`w-full ${navItemClass('drivers')}`}>
                  <Users className="w-4 h-4" />
                  <span>Drivers & Staff</span>
                </button>
                <button onClick={() => onTabChange('maintenance')} className={`w-full ${navItemClass('maintenance')}`}>
                  <Wrench className="w-4 h-4" />
                  <span>Maintenance Logs</span>
                </button>
                <button onClick={() => onTabChange('documents')} className={`w-full ${navItemClass('documents')}`}>
                  <FileCheck className="w-4 h-4" />
                  <span>Documents & Expiry</span>
                </button>
                <button onClick={() => onTabChange('tyres')} className={`w-full ${navItemClass('tyres')}`}>
                  <Disc className="w-4 h-4" />
                  <span>Tyres & Wear</span>
                </button>
                <button onClick={() => onTabChange('salary')} className={`w-full ${navItemClass('salary')}`}>
                  <Banknote className="w-4 h-4" />
                  <span>Driver Salary</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Settings & Admin */}
        <div>
          <p className="px-3 text-[10px] font-black text-[#70706B] uppercase tracking-wider mb-2">
            PREFERENCES
          </p>
          <div className="space-y-1">
            <button onClick={() => onTabChange('settings')} className={`w-full ${navItemClass('settings')}`}>
              <Settings className="w-4 h-4" />
              <span>{t.settingsTitle}</span>
            </button>
            <button onClick={() => onTabChange('admin')} className={`w-full ${navItemClass('admin')}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
            {!isInstalled && (
              <button
                type="button"
                onClick={async () => {
                  const res = await triggerInstall();
                  if (res === 'manual') setShowInstallGuideModal(true);
                }}
                className="w-full mt-2 flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#FF8C00] bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 border border-[#FF8C00]/30 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#FF8C00]" />
                <span>{lang === 'hi' ? 'होम स्क्रीन पर जोड़ें' : 'Add to Home Screen'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Profile Box */}
      <div className="p-3 m-3 bg-[#242422] rounded-2xl border border-[#333330] flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-[#FF8C00]/20 text-[#FF8C00] flex items-center justify-center font-black text-sm">
          {user?.name ? user.name[0] : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{user?.name || 'Transport User'}</p>
          <p className="text-[10px] text-[#FF8C00] uppercase tracking-wider font-bold">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Modal */}
      <AddToHomeScreenModal
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
        lang={lang}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isAndroid={isAndroid}
        isInIframe={isInIframe}
        onNativeInstall={triggerInstall}
        onOpenInNewTab={openInNewTab}
      />
    </aside>
  );
};
