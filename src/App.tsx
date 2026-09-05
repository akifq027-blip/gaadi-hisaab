/**
 * GAADI HISAAB - Digital Driver Diary & Transport Fleet Manager
 * Natural Tones Theme Application Entry Point
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Views
import { DashboardView } from './views/DashboardView';
import { HisaabDiaryView } from './views/HisaabDiaryView';
import { TripsView } from './views/TripsView';
import { FuelView } from './views/FuelView';
import { ExpensesView } from './views/ExpensesView';
import { CustomersView } from './views/CustomersView';
import { VehiclesView } from './views/VehiclesView';
import { DriversView } from './views/DriversView';
import { DocumentsView } from './views/DocumentsView';
import { MaintenanceView } from './views/MaintenanceView';
import { ReportsView } from './views/ReportsView';

// Modals & Auth
import { LoginScreen } from './components/LoginScreen';
import { QuickAddHisaabModal } from './components/QuickAddHisaabModal';
import { AddFuelModal } from './components/AddFuelModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ReceivePaymentModal } from './components/ReceivePaymentModal';
import { BillModal } from './components/BillModal';
import { BiltyModal } from './components/BiltyModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { SearchModal } from './components/SearchModal';

// APIs & Types
import { api, formatINR, formatDate, getStoredToken } from './api';
import { Language, translations } from './translations';
import { User, Vehicle, Driver, Customer, Trip, TransportBill } from './types';
import { 
  FileText, 
  PieChart, 
  Banknote, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Truck, 
  Plus, 
  Check, 
  Download, 
  Share2,
  Calendar,
  AlertCircle,
  Printer
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('gaadi_lang') as Language) || 'hi';
  });

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bills, setBills] = useState<TransportBill[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal States
  const [isAddHisaabOpen, setIsAddHisaabOpen] = useState(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [receivePaymentCustomerId, setReceivePaymentCustomerId] = useState<string | undefined>(undefined);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [activeBill, setActiveBill] = useState<TransportBill | null>(null);
  const [isBiltyModalOpen, setIsBiltyModalOpen] = useState(false);
  const [activeBiltyTrip, setActiveBiltyTrip] = useState<any>(null);
  const [billActiveSubtab, setBillActiveSubtab] = useState<'bilty' | 'invoices'>('bilty');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('gaadi_lang', newLang);
  };

  // Initial Data Fetch
  const refreshCoreData = useCallback(async () => {
    try {
      const [dash, me, vehs, drvs, custs, trps, bls] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getMe().catch(() => null),
        api.getVehicles().catch(() => []),
        api.getDrivers().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getTrips().catch(() => []),
        api.getBills().catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      if (me?.user) {
        setUser(me.user);
        setIsLoggedOut(false);
      }
      if (Array.isArray(vehs)) setVehicles(vehs);
      if (Array.isArray(drvs)) setDrivers(drvs);
      if (Array.isArray(custs)) setCustomers(custs);
      if (Array.isArray(trps)) setTrips(trps);
      if (Array.isArray(bls)) setBills(bls);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCoreData();
  }, [refreshCoreData]);

  // Handle Switch Role
  const handleSwitchRole = async (role: string) => {
    try {
      const res = await api.switchRole(role);
      setUser(res.user);
      showToast(`Switched perspective to ${role.replace('_', ' ').toUpperCase()}`);
      refreshCoreData();
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setIsLoggedOut(true);
    showToast(lang === 'hi' ? 'सफलतापूर्वक लॉगआउट किया गया' : 'Logged out successfully');
  };

  const t = translations[lang];

  // If not logged in and not loading, show the authentic Login Screen!
  if (!loading && (!user || isLoggedOut)) {
    return (
      <LoginScreen
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsLoggedOut(false);
          refreshCoreData();
          showToast(lang === 'hi' ? 'लॉगिन सफल! (Welcome)' : 'Login Successful! Welcome');
        }}
      />
    );
  }

  // Render content based on currentTab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <DashboardView
            data={dashboardData}
            user={user}
            lang={lang}
            onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
            onOpenAddFuel={() => setIsAddFuelOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenReceivePayment={() => {
              setReceivePaymentCustomerId(undefined);
              setIsReceivePaymentOpen(true);
            }}
            onOpenCreateBill={() => {
              setActiveBiltyTrip(null);
              setIsBiltyModalOpen(true);
            }}
            onOpenWhatsAppShare={() => setIsWhatsAppModalOpen(true)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );

      case 'hisaab':
        return (
          <HisaabDiaryView
            lang={lang}
            onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
            onSelectTrip={(trip) => {
              setActiveBiltyTrip(trip);
              setIsBiltyModalOpen(true);
            }}
          />
        );

      case 'trips':
        return (
          <TripsView
            lang={lang}
            onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
            onOpenBillModal={(trip) => {
              setActiveBiltyTrip(trip);
              setIsBiltyModalOpen(true);
            }}
            vehicles={vehicles}
          />
        );

      case 'fuel':
        return (
          <FuelView
            lang={lang}
            onOpenAddFuel={() => setIsAddFuelOpen(true)}
            vehicles={vehicles}
          />
        );

      case 'expenses':
        return (
          <ExpensesView
            lang={lang}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            vehicles={vehicles}
          />
        );

      case 'customers':
        return (
          <CustomersView
            lang={lang}
            onOpenReceivePayment={(customerId) => {
              setReceivePaymentCustomerId(customerId);
              setIsReceivePaymentOpen(true);
            }}
          />
        );

      case 'vehicles':
        return (
          <VehiclesView
            lang={lang}
            onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
            onOpenAddFuel={() => setIsAddFuelOpen(true)}
            drivers={drivers}
          />
        );

      case 'drivers':
        return (
          <DriversView
            lang={lang}
            vehicles={vehicles}
          />
        );

      case 'documents':
        return (
          <DocumentsView
            lang={lang}
            vehicles={vehicles}
          />
        );

      case 'maintenance':
        return (
          <MaintenanceView
            lang={lang}
            vehicles={vehicles}
          />
        );

      case 'bills':
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-[#1A1A1A] flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#FF8C00]" />
                  <span>
                    {lang === 'hi'
                      ? 'ट्रांसपोर्ट बिल्टी (LR) एवं टैक्स बिल'
                      : 'Transport Bilty (LR) & Tax Invoices'}
                  </span>
                </h1>
                <p className="text-xs text-[#70706B]">
                  {lang === 'hi'
                    ? 'GST व Non-GST बिल्टी, कन्साइनमेंट नोट (LR), प्रिंट, डाउनलोड एवं व्हाट्सएप्प शेयर'
                    : 'Downloadable GST & Non-GST Bilty (Consignment Note / LR) with print and WhatsApp sharing'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBiltyTrip(null);
                    setIsBiltyModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>{lang === 'hi' ? '+ नई बिल्टी (Bilty / LR बनाएं)' : '+ Create Bilty / LR'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveBill(null);
                    setIsBillModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FF8C00]" />
                  <span>{lang === 'hi' ? '+ टैक्स बिल (Invoice)' : '+ Tax Invoice'}</span>
                </button>
              </div>
            </div>

            {/* Subtab Toggle: Bilty vs Invoices */}
            <div className="flex items-center space-x-2 border-b border-[#E5E5DF] pb-2">
              <button
                type="button"
                onClick={() => setBillActiveSubtab('bilty')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
                  billActiveSubtab === 'bilty'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'bg-white text-[#70706B] border border-[#E5E5DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span>🚚 {lang === 'hi' ? 'बिल्टी रजिस्टर (Bilty / LR Notes)' : 'Bilty / LR Notes'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {trips.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBillActiveSubtab('invoices')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
                  billActiveSubtab === 'invoices'
                    ? 'bg-[#FF8C00] text-white shadow-xs'
                    : 'bg-white text-[#70706B] border border-[#E5E5DF] hover:text-[#1A1A1A]'
                }`}
              >
                <span>🧾 {lang === 'hi' ? 'टैक्स इनवॉइस (Tax Invoices)' : 'Tax Invoices'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                  {bills.length}
                </span>
              </button>
            </div>

            {/* Bilty (LR) Register View */}
            {billActiveSubtab === 'bilty' && (
              <div className="space-y-3">
                {/* Feature highlight card */}
                <div className="bg-gradient-to-r from-[#FFF8E7] to-[#FFF3E0] border border-[#FF8C00]/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FF8C00] text-white uppercase">
                        Official Consignment Note
                      </span>
                      <span className="text-xs font-bold text-[#1A1A1A]">GST & Non-GST Compliant</span>
                    </div>
                    <p className="text-xs text-[#70706B]">
                      Every trip creates an authentic 3-copy Indian Bilty (Consignor, Consignee & Driver copies) with print, PDF download, and WhatsApp share.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBiltyTrip(null);
                      setIsBiltyModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-xs rounded-xl shadow-xs transition self-start sm:self-auto cursor-pointer"
                  >
                    + Generate New Bilty
                  </button>
                </div>

                {/* Bilties Table */}
                <div className="bg-white rounded-3xl border border-[#E5E5DF] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
                    <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-wide">
                      Consignment Notes / Bilties ({trips.length})
                    </span>
                    <span className="text-xs text-[#70706B]">Click any row to view full Bilty</span>
                  </div>

                  {trips.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#70706B]">
                      No trips or bilties created yet. Click "+ Create Bilty / LR" to make one!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F9F9F6] text-[#70706B] font-bold border-b border-[#E5E5DF]">
                          <tr>
                            <th className="p-2.5">LR / Bilty No</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Vehicle</th>
                            <th className="p-2.5">Route (From ➔ To)</th>
                            <th className="p-2.5">Customer / Party</th>
                            <th className="p-2.5 text-right">Freight</th>
                            <th className="p-2.5 text-center">Type</th>
                            <th className="p-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5DF]">
                          {trips.map((t, idx) => (
                            <tr key={t.id} className="hover:bg-[#FFF9F2] transition cursor-pointer">
                              <td
                                className="p-2.5 font-mono font-black text-[#1A1A1A] whitespace-nowrap"
                                onClick={() => {
                                  setActiveBiltyTrip(t);
                                  setIsBiltyModalOpen(true);
                                }}
                              >
                                {t.trip_number || `LR-${2026}-${String(idx + 101).padStart(3, '0')}`}
                              </td>
                              <td className="p-2.5 text-[#50504B] whitespace-nowrap">
                                {formatDate(t.date)}
                              </td>
                              <td className="p-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                                {t.vehicle_number}
                              </td>
                              <td className="p-2.5 font-semibold text-[#1A1A1A]">
                                {t.pickup_location} ➔ {t.drop_location}
                              </td>
                              <td className="p-2.5 text-[#50504B]">
                                {t.customer_name || 'Direct Party'}
                              </td>
                              <td className="p-2.5 text-right font-black text-[#059669] whitespace-nowrap">
                                {formatINR(t.freight_amount)}
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                                  {idx % 2 === 0 ? 'GST BILTY' : 'NON-GST'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center whitespace-nowrap space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveBiltyTrip(t);
                                    setIsBiltyModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 transition"
                                >
                                  <Printer className="w-3 h-3 text-[#FF8C00]" />
                                  <span>Print LR</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoices View */}
            {billActiveSubtab === 'invoices' && (
              <div className="bg-white rounded-3xl border border-[#E5E5DF] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
                  <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-wide">
                    Generated Tax Invoices ({bills.length})
                  </span>
                  <button
                    onClick={() => {
                      setActiveBill(null);
                      setIsBillModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#FF8C00] text-white text-xs font-bold rounded-xl"
                  >
                    + New Invoice
                  </button>
                </div>

                {bills.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#70706B]">
                    No tax bills generated yet. Click "+ Tax Invoice" to create a bill.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F9F9F6] text-[#70706B] font-bold border-b border-[#E5E5DF]">
                        <tr>
                          <th className="p-2.5">Invoice #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Vehicle</th>
                          <th className="p-2.5 text-right">Total</th>
                          <th className="p-2.5 text-right">Balance</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5DF]">
                        {bills.map((b) => (
                          <tr key={b.id} className="hover:bg-[#F9F9F6]/60">
                            <td className="p-2.5 font-bold font-mono text-[#1A1A1A]">{b.bill_number}</td>
                            <td className="p-2.5 text-[#50504B]">{formatDate(b.date)}</td>
                            <td className="p-2.5 font-bold text-[#1A1A1A]">{b.customer_name || 'Party'}</td>
                            <td className="p-2.5 font-mono text-[#1A1A1A]">{b.vehicle_number}</td>
                            <td className="p-2.5 text-right font-black text-[#1A1A1A]">{formatINR(b.total_amount)}</td>
                            <td className="p-2.5 text-right font-black text-[#DC2626]">{formatINR(b.balance_amount)}</td>
                            <td className="p-2.5 text-center uppercase font-bold text-[10px] text-[#059669]">
                              {b.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'reports':
        return <ReportsView lang={lang} vehicles={vehicles} />;

      case 'settings':
        return (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h1 className="text-xl font-black text-[#1A1A1A]">App Settings & Preferences</h1>
              <p className="text-xs text-[#70706B]">Driver diary personalization, language & transport profile</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5DF] p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">Language (भाषा चुनें)</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'hi', label: 'हिन्दी (Hindi)' },
                  { code: 'en', label: 'English' },
                  { code: 'te', label: 'తెలుగు (Telugu)' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleLanguageChange(item.code as Language)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                      lang === item.code
                        ? 'border-[#FF8C00] bg-[#FFF3E0] text-[#FF8C00] shadow-xs'
                        : 'border-[#E5E5DF] text-[#1A1A1A] hover:bg-[#F9F9F6]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E5DF] p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">Transport Profile</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-[#70706B] block mb-1">Owner / Transport Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || 'Singh Roadlines & Logistics'}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F9F9F6] text-[#1A1A1A] font-medium outline-none focus:border-[#FF8C00]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#70706B] block mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="text"
                    defaultValue={user?.phone || '9876543210'}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5DF] bg-[#F9F9F6] text-[#1A1A1A] font-medium outline-none focus:border-[#FF8C00]"
                  />
                </div>
              </div>
            </div>

            {/* Logout Card */}
            <div className="bg-white rounded-2xl border border-[#E5E5DF] p-5 flex items-center justify-between shadow-xs">
              <div>
                <p className="font-bold text-xs text-[#1A1A1A]">Logged in as {user?.name}</p>
                <p className="text-[11px] text-[#70706B]">Role: {user?.role.toUpperCase()} • {user?.phone}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#DC2626] font-bold text-xs rounded-xl border border-red-200 transition"
              >
                Logout / Switch Role
              </button>
            </div>
          </div>
        );

      case 'more':
        return (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-[#1A1A1A]">Transport Menu & Modules</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { tab: 'customers', icon: '👥', label: 'Customers & Udhaar', desc: 'Party khata book' },
                { tab: 'bills', icon: '🧾', label: 'Bilty (LR) & Bills', desc: 'GST/Non-GST Consignment note' },
                { tab: 'drivers', icon: '👨‍✈️', label: 'Drivers & Salary Hisaab', desc: 'Advances & settlement slips' },
                { tab: 'reports', icon: '📊', label: 'Daily Profit & Loss', desc: 'Excel & PDF exports' },
                { tab: 'fuel', icon: '⛽', label: 'Diesel Log', desc: 'Fuel average & spend' },
                { tab: 'expenses', icon: '💸', label: 'Daily Expenses', desc: 'Toll, food, police' },
                { tab: 'vehicles', icon: '🚚', label: 'Vehicles', desc: 'Trucks & DCM fleet' },
                { tab: 'maintenance', icon: '🔧', label: 'Maintenance', desc: 'Service & garage' },
                { tab: 'documents', icon: '📄', label: 'Documents', desc: 'Insurance, fitness' },
                { tab: 'settings', icon: '⚙️', label: 'Settings', desc: 'Language & profile' },
              ].map((m) => (
                <button
                  key={m.tab}
                  onClick={() => setCurrentTab(m.tab)}
                  className="bg-white p-4 rounded-2xl border border-[#E5E5DF] hover:border-[#FF8C00] text-left shadow-xs transition group cursor-pointer"
                >
                  <span className="text-2xl mb-1.5 block group-hover:scale-110 transition-transform">{m.icon}</span>
                  <p className="font-black text-xs text-[#1A1A1A]">{m.label}</p>
                  <p className="text-[10px] text-[#70706B] mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <DashboardView
            data={dashboardData}
            user={user}
            lang={lang}
            onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
            onOpenAddFuel={() => setIsAddFuelOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenReceivePayment={() => {
              setReceivePaymentCustomerId(undefined);
              setIsReceivePaymentOpen(true);
            }}
            onOpenCreateBill={() => {
              setActiveBiltyTrip(null);
              setIsBiltyModalOpen(true);
            }}
            onOpenWhatsAppShare={() => setIsWhatsAppModalOpen(true)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#FF8C00] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Toast message popup */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border border-[#333] flex items-center space-x-2 animate-fade-in max-w-[calc(100vw-32px)]">
          <Check className="w-4 h-4 text-[#FF8C00] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        user={user}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onVehicleChange={setSelectedVehicleId}
        onSwitchRole={handleSwitchRole}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* PWA Banner */}
      <PWAInstallBanner lang={lang} />

      {/* Main Body Layout */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto min-w-0">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
          lang={lang}
          user={user}
        />

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 min-w-0 w-full p-3 sm:p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-[#E5E5DF] border-t-[#FF8C00] rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#70706B]">Loading Gaadi Hisaab...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onOpenAddHisaab={() => setIsAddHisaabOpen(true)}
        lang={lang}
      />

      {/* Modals */}
      <QuickAddHisaabModal
        isOpen={isAddHisaabOpen}
        onClose={() => setIsAddHisaabOpen(false)}
        onSuccess={() => {
          setIsAddHisaabOpen(false);
          showToast('Trip hisaab saved successfully!');
          refreshCoreData();
        }}
        lang={lang}
        vehicles={vehicles}
        drivers={drivers}
        customers={customers}
        defaultVehicleId={selectedVehicleId !== 'all' ? selectedVehicleId : undefined}
      />

      <AddFuelModal
        isOpen={isAddFuelOpen}
        onClose={() => setIsAddFuelOpen(false)}
        onSuccess={() => {
          setIsAddFuelOpen(false);
          showToast('Diesel entry saved!');
          refreshCoreData();
        }}
        vehicles={vehicles}
        drivers={drivers}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => {
          setIsAddExpenseOpen(false);
          showToast('Expense added!');
          refreshCoreData();
        }}
        vehicles={vehicles}
        drivers={drivers}
      />

      <ReceivePaymentModal
        isOpen={isReceivePaymentOpen}
        onClose={() => setIsReceivePaymentOpen(false)}
        onSuccess={() => {
          setIsReceivePaymentOpen(false);
          showToast('Payment recorded and party khata updated!');
          refreshCoreData();
        }}
        customers={customers}
        preselectedCustomerId={receivePaymentCustomerId}
      />

      {/* Bilty Modal (Consignment Note / LR) */}
      <BiltyModal
        isOpen={isBiltyModalOpen}
        onClose={() => setIsBiltyModalOpen(false)}
        initialTrip={activeBiltyTrip}
        vehicles={vehicles}
        drivers={drivers}
        customers={customers}
      />

      {/* Standard Tax Bill Modal */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onSuccess={() => {
          setIsBillModalOpen(false);
          showToast('Transport bill generated!');
          refreshCoreData();
        }}
        bill={activeBill}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
      />

      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        dashboardData={dashboardData}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectTrip={(tripId) => {
          setIsSearchModalOpen(false);
          setCurrentTab('trips');
        }}
        onSelectCustomer={(customerId) => {
          setIsSearchModalOpen(false);
          setCurrentTab('customers');
        }}
      />
    </div>
  );
}
