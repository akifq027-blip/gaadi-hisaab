import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  ChevronRight,
  CreditCard,
  RefreshCw,
  Truck,
  FileText,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building,
  ShieldCheck,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ExternalLink,
} from 'lucide-react';
import { Language, translations } from '../translations';
import { Customer, Trip, Payment } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  onOpenReceivePayment: (customerId?: string) => void;
}

export const CustomersView: React.FC<Props> = ({ lang, onOpenReceivePayment }) => {
  const t = translations[lang];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadingDemo, setReloadingDemo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{
    customer: Customer;
    summary: {
      totalBilled: number;
      totalReceived: number;
      totalOutstanding: number;
      tripsCount: number;
      paymentsCount?: number;
    };
    trips: Trip[];
    payments: Payment[];
    ledger?: Array<{
      id: string;
      date: string;
      type: 'trip' | 'payment';
      title: string;
      subtitle: string;
      reference?: string;
      vehicle_number?: string;
      debit: number;
      credit: number;
      balance: number;
    }>;
  } | null>(null);
  const [activeKhataTab, setActiveKhataTab] = useState<'ledger' | 'trips' | 'payments' | 'info'>('ledger');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [category, setCategory] = useState('Mandi & Foodgrains');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [regularRoute, setRegularRoute] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [creditPeriodDays, setCreditPeriodDays] = useState(7);
  const [creditLimit, setCreditLimit] = useState(50000);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadDemo = async () => {
    try {
      setReloadingDemo(true);
      await api.seedCustomerDemo();
      await loadCustomers();
      showToast('✅ Pure Gaadi demo customers, routes & khata ledgers reloaded!');
    } catch (err: any) {
      console.error('Failed to reload demo:', err);
      showToast('❌ Failed to reload demo data');
    } finally {
      setReloadingDemo(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      setSelectedCustomerId(id);
      setActiveKhataTab('ledger');
      const data = await api.getCustomerDetail(id);
      setCustomerDetail(data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    try {
      setSaving(true);
      await api.addCustomer({
        name,
        phone,
        contact_person: contactPerson,
        category,
        city,
        address,
        regular_route: regularRoute,
        gst_number: gstNumber,
        credit_period_days: Number(creditPeriodDays),
        credit_limit: Number(creditLimit),
        notes,
      });
      // Reset
      setName('');
      setPhone('');
      setContactPerson('');
      setCity('');
      setAddress('');
      setRegularRoute('');
      setGstNumber('');
      setNotes('');
      setShowAddModal(false);
      await loadCustomers();
      showToast('✅ Party added to your transport khata!');
    } catch (err: any) {
      alert(err.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppReminder = (c: Customer) => {
    const outstanding = Number(c.total_outstanding || 0);
    const text = `*GAADI HISAAB - PAYMENT STATEMENT / तगादा* 🚛
--------------------------------
*Party:* ${c.name}
*Contact:* ${c.contact_person || 'Sir'}
*Phone:* ${c.phone}
*Route:* ${c.regular_route || 'All Routes'}
*Total Trips:* ${c.total_trips || 0}
*Total Billed:* ₹${Number(c.total_billed || 0).toLocaleString('en-IN')}
*Total Received:* ₹${Number(c.total_received || 0).toLocaleString('en-IN')}
--------------------------------
*PENDING BALANCE / बाकी उधार:* ₹${outstanding.toLocaleString('en-IN')}
--------------------------------
Namaste ${c.contact_person || c.name} ji 🙏,
Aapki gaadi hisaab khata bahi me ₹${outstanding.toLocaleString('en-IN')} ka baki hisaab pending hai.
Kripya jald se jald payment (UPI / NEFT / Cash) clearance karne ka kasht karein taaki gaadi dispatch me asuvidha na ho.

*Bank / UPI Details:* 9876543210@upi (Balwinder Transport)
Dhanyawaad!`;

    window.open(`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintKhata = () => {
    window.print();
  };

  // High level totals
  const totalOutstanding = customers.reduce((acc, c) => acc + Number(c.total_outstanding || 0), 0);
  const totalBilled = customers.reduce((acc, c) => acc + Number(c.total_billed || 0), 0);
  const totalReceived = customers.reduce((acc, c) => acc + Number(c.total_received || 0), 0);
  const partiesWithDues = customers.filter((c) => Number(c.total_outstanding || 0) > 0);

  // Available categories for filtering
  const categories = [
    { id: 'all', label: `All Parties (${customers.length})` },
    { id: 'dues', label: `Pending Udhaar (${partiesWithDues.length})` },
    { id: 'Mandi & Foodgrains', label: 'Mandi / Grains' },
    { id: 'Hardware & Steel Goods', label: 'Hardware & Steel' },
    { id: 'Cement & Building Materials', label: 'Cement Depot' },
    { id: 'Corrugated Boxes & Packaging', label: 'Packaging' },
    { id: 'Transport Broker & FTL Commission', label: 'Brokers' },
    { id: 'Air Cargo & E-Commerce', label: 'Air Cargo' },
    { id: 'cleared', label: 'All Clear (0 Dues)' },
  ];

  const filteredCustomers = customers.filter((c) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone?.includes(q);
      const matchCity = c.city?.toLowerCase().includes(q);
      const matchContact = c.contact_person?.toLowerCase().includes(q);
      const matchGst = c.gst_number?.toLowerCase().includes(q);
      const matchRoute = c.regular_route?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCity && !matchContact && !matchGst && !matchRoute) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'dues') return Number(c.total_outstanding || 0) > 0;
    if (selectedCategory === 'cleared') return Number(c.total_outstanding || 0) <= 0;
    return c.category === selectedCategory;
  });

  return (
    <div className="space-y-4 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Pure Gaadi Commercial Transport Khata</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <Users className="w-6 h-6 text-amber-400" />
              <span>Customers & Udhaar Ledger (ग्राहक खाता बही)</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Complete pure gaadi commercial freight accounting. Track Mandi commissions, cement depots, steel mills, transport brokers, bilty receivables, and automated WhatsApp payment reminders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReloadDemo}
              disabled={reloadingDemo}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 active:scale-95 shadow-xs"
              title="Reset and reload all 9 authentic Indian transport clients and trips"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reloadingDemo ? 'animate-spin' : ''}`} />
              <span>{reloadingDemo ? 'Reloading...' : 'Reload Demo Parties (डेमो रिसेट)'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Party (नया ग्राहक)</span>
            </button>
          </div>
        </div>
      </div>

      {/* High Level KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-rose-50/80 border border-rose-200/80 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">Total Pending Udhaar</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-700 mt-1">{formatINR(totalOutstanding)}</p>
          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
            Across {partiesWithDues.length} pending parties
          </span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Freight Collected</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1">{formatINR(totalReceived)}</p>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            Cash, UPI & Bank settlements
          </span>
        </div>

        <div className="bg-blue-50/80 border border-blue-200/80 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">Total Billed Gross</span>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-blue-800 mt-1">{formatINR(totalBilled)}</p>
          <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
            All trips & bilty invoices
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Active Pure Gaadi Parties</span>
            <Building className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1">{customers.length}</p>
          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
            Mandi, Cement, Steel, Brokers
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-xs shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search party by name, contact person, phone, route, city or GST number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-amber-500 shadow-xs transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer List Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
          <p className="font-bold">Loading Pure Gaadi Customer Ledger...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <Building className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-extrabold text-slate-800 text-sm">No customers match your search or filter</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching a different party name, or click below to reload all 9 authentic pure gaadi transport clients.
          </p>
          <button
            onClick={handleReloadDemo}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs"
          >
            Reload Pure Gaadi Demo Parties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCustomers.map((cust) => {
            const hasPending = Number(cust.total_outstanding || 0) > 0;
            const creditLimit = Number(cust.credit_limit || 50000);
            const outstanding = Number(cust.total_outstanding || 0);
            const creditPct = Math.min(100, Math.round((outstanding / creditLimit) * 100));

            return (
              <div
                key={cust.id}
                className={`bg-white rounded-3xl border transition-all duration-200 p-4 shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 ${
                  hasPending ? 'border-slate-200 hover:border-rose-300' : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase tracking-wide">
                        {cust.category || 'General Freight'}
                      </span>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                        {cust.name}
                      </h3>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                        hasPending ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {hasPending ? 'Udhaar Dues' : 'All Clear (चुकता)'}
                    </span>
                  </div>

                  {/* Contact & Location */}
                  <div className="text-[11px] text-slate-500 font-medium space-y-1 pt-1">
                    {cust.contact_person && (
                      <p className="flex items-center space-x-1.5 text-slate-700 font-bold">
                        <span className="text-slate-400 font-normal">Contact:</span>
                        <span>{cust.contact_person}</span>
                      </p>
                    )}
                    <p className="flex items-center space-x-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-slate-800 font-semibold">{cust.phone}</span>
                      {cust.city && <span className="text-slate-400">• {cust.city}</span>}
                    </p>
                    {cust.regular_route && (
                      <p className="flex items-center space-x-1 text-slate-600 truncate">
                        <Truck className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="font-medium text-[10px] text-slate-600 truncate">{cust.regular_route}</span>
                      </p>
                    )}
                    {cust.gst_number && (
                      <p className="text-[10px] font-mono text-slate-400">
                        GST: <span className="font-semibold text-slate-600">{cust.gst_number}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Balance Stats Box */}
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl space-y-2">
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="border-r border-slate-200/60 pr-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Billed</span>
                      <span className="font-black text-slate-800 text-xs">{formatINR(cust.total_billed)}</span>
                    </div>
                    <div className="border-r border-slate-200/60 pr-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Received</span>
                      <span className="font-black text-emerald-700 text-xs">{formatINR(cust.total_received)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Balance Due</span>
                      <span className={`font-black text-xs ${hasPending ? 'text-rose-600' : 'text-slate-500'}`}>
                        {formatINR(cust.total_outstanding)}
                      </span>
                    </div>
                  </div>

                  {/* Credit limit gauge */}
                  {hasPending && (
                    <div className="space-y-1 pt-1 border-t border-slate-200/50">
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                        <span>Limit: {formatINR(creditLimit)}</span>
                        <span className={creditPct > 80 ? 'text-rose-600 font-black' : 'text-slate-600'}>
                          {creditPct}% used ({cust.credit_period_days || 7}d credit)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            creditPct > 80 ? 'bg-rose-500' : creditPct > 50 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${creditPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-1 text-xs gap-1.5">
                  <div className="flex items-center space-x-1.5">
                    {hasPending && (
                      <button
                        onClick={() => onOpenReceivePayment(cust.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-xl flex items-center space-x-1 transition active:scale-95 shadow-xs"
                        title="Record payment received from party"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>जमा (Pay)</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleWhatsAppReminder(cust)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition active:scale-95"
                      title="Send WhatsApp Payment Reminder (तगादा)"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`tel:${cust.phone}`}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition active:scale-95"
                      title="Call Party"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleOpenDetail(cust.id)}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] rounded-xl flex items-center space-x-1 transition active:scale-95 shadow-xs"
                  >
                    <span>Khata (खाता)</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">Add Commercial Transport Party</h3>
                <p className="text-xs text-slate-500">Add new customer, mandi agent, or transport broker</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Party / Business Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Balaji Hardware & Pipes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="e.g. 9848011223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Bhai (Proprietor)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Commercial Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                  >
                    <option value="Mandi & Foodgrains">Mandi & Foodgrains (अनाज मंडी)</option>
                    <option value="Hardware & Steel Goods">Hardware & Steel Goods (लोहा व स्टील)</option>
                    <option value="Cement & Building Materials">Cement & Building Materials (सीमेंट)</option>
                    <option value="Corrugated Boxes & Packaging">Corrugated Packaging (कार्टन व रोल)</option>
                    <option value="Transport Broker & FTL Commission">Transport Broker (ट्रांसपोर्ट ब्रोकर)</option>
                    <option value="Agricultural Mandi & Cold Storage">Cold Storage & Sabzi Mandi</option>
                    <option value="Air Cargo & E-Commerce">Air Cargo & Courier</option>
                    <option value="Fertilizers & Agriculture Seeds">Fertilizers & Agro (खाद-बीज)</option>
                    <option value="General Commercial Goods">General Commercial Goods</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Regular Route</label>
                  <input
                    type="text"
                    placeholder="e.g. Kattedan Mandi ➔ Medchal"
                    value={regularRoute}
                    onChange={(e) => setRegularRoute(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Mandi Hub</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad / Secunderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="36AABCU9821M1ZT"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Credit Days</label>
                  <input
                    type="number"
                    value={creditPeriodDays}
                    onChange={(e) => setCreditPeriodDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Godown / Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. Shed #14, Kattedan Wholesale Grains Complex"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Transport Terms & Notes</label>
                <input
                  type="text"
                  placeholder="e.g. 50% advance at loading, balance on POD bilty receipt"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95"
                >
                  {saving ? 'Saving Party...' : 'Save Transport Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Full Detail / Khata Bahi Modal */}
      {selectedCustomerId && customerDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:rounded-none">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                    {customerDetail.customer.category || 'Transport Party'}
                  </span>
                  {customerDetail.customer.city && (
                    <span className="text-xs text-slate-400 font-semibold">• {customerDetail.customer.city}</span>
                  )}
                </div>

                <h2 className="font-black text-base sm:text-xl text-white">
                  {customerDetail.customer.name}
                </h2>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                  <span>📞 {customerDetail.customer.phone}</span>
                  {customerDetail.customer.contact_person && (
                    <span>👤 {customerDetail.customer.contact_person}</span>
                  )}
                  {customerDetail.customer.gst_number && (
                    <span className="font-mono text-amber-300">GST: {customerDetail.customer.gst_number}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={handlePrintKhata}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
                  title="Print Khata Statement"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setCustomerDetail(null);
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary Strip */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Freight Billed</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">
                  {formatINR(customerDetail.summary.totalBilled)}
                </span>
                <span className="text-[10px] text-slate-500 block font-semibold">
                  {customerDetail.summary.tripsCount} Gaadi Trips
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Received</span>
                <span className="font-black text-emerald-700 text-sm sm:text-base">
                  {formatINR(customerDetail.summary.totalReceived)}
                </span>
                <span className="text-[10px] text-emerald-600 block font-semibold">Cleared Payments</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Balance (उधार)</span>
                <span className={`font-black text-sm sm:text-base ${Number(customerDetail.summary.totalOutstanding) > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {formatINR(customerDetail.summary.totalOutstanding)}
                </span>
                <span className={`text-[10px] font-black uppercase block ${Number(customerDetail.summary.totalOutstanding) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {Number(customerDetail.summary.totalOutstanding) > 0 ? 'Udhaar Due' : 'All Clear (चुकता)'}
                </span>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 px-4 bg-white text-xs font-bold shrink-0 print:hidden">
              <button
                onClick={() => setActiveKhataTab('ledger')}
                className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  activeKhataTab === 'ledger'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Khata Ledger (खाता नकल)</span>
              </button>

              <button
                onClick={() => setActiveKhataTab('trips')}
                className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  activeKhataTab === 'trips'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Trips & Bilty ({customerDetail.trips.length})</span>
              </button>

              <button
                onClick={() => setActiveKhataTab('payments')}
                className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  activeKhataTab === 'payments'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payments ({customerDetail.payments.length})</span>
              </button>

              <button
                onClick={() => setActiveKhataTab('info')}
                className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
                  activeKhataTab === 'info'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Party Profile</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* TAB 1: UNIFIED CHRONOLOGICAL KHATA LEDGER */}
              {activeKhataTab === 'ledger' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                    <span>Ledger Entries (खाता विवरण - नया ऊपर)</span>
                    <span className="text-[10px] text-slate-400">Dr = भाड़ा (Billed) | Cr = जमा (Received)</span>
                  </div>

                  {customerDetail.ledger && customerDetail.ledger.length > 0 ? (
                    <div className="space-y-2">
                      {customerDetail.ledger.map((item) => {
                        const isDebit = item.debit > 0;
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border transition ${
                              isDebit
                                ? 'bg-white border-slate-200'
                                : 'bg-emerald-50/60 border-emerald-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {formatDate(item.date)}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                      isDebit ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {isDebit ? 'Billed (भाड़ा)' : 'Received (जमा)'}
                                  </span>
                                  {item.reference && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      #{item.reference}
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                              </div>

                              <div className="text-right shrink-0">
                                {isDebit ? (
                                  <span className="font-black text-slate-900 text-sm block">
                                    +{formatINR(item.debit)}
                                  </span>
                                ) : (
                                  <span className="font-black text-emerald-700 text-sm block">
                                    -{formatINR(item.credit)}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                                  Bal: <span className={item.balance > 0 ? 'text-rose-600 font-black' : 'text-slate-700'}>{formatINR(item.balance)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No ledger transactions found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TRIPS & BILTY */}
              {activeKhataTab === 'trips' && (
                <div className="space-y-2">
                  {customerDetail.trips.map((tr: any) => (
                    <div
                      key={tr.id}
                      className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {tr.trip_number}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{formatDate(tr.date)}</span>
                          <span className="text-[10px] text-slate-600 font-bold">🚛 {tr.vehicle_number}</span>
                        </div>
                        <p className="font-black text-slate-900 text-xs sm:text-sm">
                          {tr.pickup_location} ➔ {tr.drop_location}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          📦 {tr.goods_type} {tr.total_km ? `• ${tr.total_km} KM` : ''} {tr.driver_name ? `• Driver: ${tr.driver_name}` : ''}
                        </p>
                      </div>

                      <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                        <div>
                          <span className="font-black text-slate-900 text-sm sm:text-base block">
                            {formatINR(tr.gross_income)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Paid: {formatINR(tr.paid_amount)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${
                            tr.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tr.payment_status === 'paid' ? 'Paid in Full' : `Due: ${formatINR(tr.pending_amount)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: PAYMENTS RECEIVED */}
              {activeKhataTab === 'payments' && (
                <div className="space-y-2">
                  {customerDetail.payments.length > 0 ? (
                    customerDetail.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-emerald-950 text-xs">Payment Received (जमा)</span>
                            <span className="px-1.5 py-0.5 bg-emerald-200/60 text-emerald-900 font-extrabold text-[9px] uppercase rounded">
                              {p.payment_method?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            {formatDate(p.payment_date)} {p.reference_number ? `• Ref: ${p.reference_number}` : ''}
                          </p>
                          {p.notes && <p className="text-[10px] text-slate-500 italic">{p.notes}</p>}
                        </div>

                        <span className="font-black text-emerald-700 text-base">
                          +{formatINR(p.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No payments recorded yet for this customer.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PARTY INFO & PROFILE */}
              {activeKhataTab === 'info' && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Party Name</span>
                      <span className="font-bold text-slate-900">{customerDetail.customer.name}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Person</span>
                      <span className="font-bold text-slate-900">{customerDetail.customer.contact_person || 'Not specified'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone</span>
                      <span className="font-bold text-slate-900">{customerDetail.customer.phone}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">GST Number</span>
                      <span className="font-mono font-bold text-slate-900">{customerDetail.customer.gst_number || 'Unregistered'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Regular Route</span>
                      <span className="font-semibold text-slate-800">{customerDetail.customer.regular_route || 'All Routes'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Credit Terms</span>
                      <span className="font-semibold text-slate-800">
                        {customerDetail.customer.credit_period_days || 7} Days • Limit {formatINR(customerDetail.customer.credit_limit || 50000)}
                      </span>
                    </div>
                  </div>

                  {customerDetail.customer.address && (
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Office / Godown Address</span>
                      <span className="text-slate-800 font-medium">{customerDetail.customer.address}</span>
                    </div>
                  )}

                  {customerDetail.customer.notes && (
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Commercial Notes</span>
                      <span className="text-slate-700 italic">{customerDetail.customer.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer CTAs */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
              <button
                onClick={() => handleWhatsAppReminder(customerDetail.customer)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp Tagaada (तगादा)</span>
              </button>

              <button
                onClick={() => {
                  const id = customerDetail.customer.id;
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                  onOpenReceivePayment(id);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Payment (खाते में जमा)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
