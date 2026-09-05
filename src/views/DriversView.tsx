import React, { useState, useEffect } from 'react';
import { 
  User, 
  Plus, 
  Phone, 
  X, 
  IndianRupee, 
  Truck, 
  Calendar, 
  Printer, 
  Share2, 
  Download, 
  Wallet, 
  FileText, 
  CheckCircle2, 
  Trash2,
  Clock
} from 'lucide-react';
import { Language, translations } from '../translations';
import { Driver, Vehicle, DriverAdvance, SalaryPayment } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  vehicles: Vehicle[];
}

export const DriversView: React.FC<Props> = ({ lang, vehicles }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'roster' | 'salary'>('roster');

  // Drivers Data
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Salary & Advance Data
  const [advances, setAdvances] = useState<DriverAdvance[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('all');

  // Modals
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSalaryPayModal, setShowSalaryPayModal] = useState(false);
  const [activeSlip, setActiveSlip] = useState<{
    driver: Driver;
    payment: SalaryPayment;
  } | null>(null);

  // Add Driver Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('18000');
  const [vehicleId, setVehicleId] = useState('');

  // Add Advance Form State
  const [advDriverId, setAdvDriverId] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advAmount, setAdvAmount] = useState('');
  const [advReason, setAdvReason] = useState('Road Kharcha & Diesel Support');
  const [advMode, setAdvMode] = useState('Cash');

  // Settle Salary Form State
  const [salDriverId, setSalDriverId] = useState('');
  const [salMonthYear, setSalMonthYear] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [salBasic, setSalBasic] = useState('18000');
  const [salAdvanceDeducted, setSalAdvanceDeducted] = useState('0');
  const [salBonus, setSalBonus] = useState('0');
  const [salMethod, setSalMethod] = useState('bank_transfer');
  const [salNotes, setSalNotes] = useState('Full and final monthly salary settlement');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driversData, salaryData] = await Promise.all([
        api.getDrivers(),
        api.getSalaryData(),
      ]);
      setDrivers(driversData);
      setAdvances(salaryData.advances || []);
      setPayments(salaryData.payments || []);

      if (driversData.length > 0) {
        if (!advDriverId) setAdvDriverId(driversData[0].id);
        if (!salDriverId) {
          setSalDriverId(driversData[0].id);
          setSalBasic(String(driversData[0].monthly_salary || 18000));
        }
      }
    } catch (err) {
      console.error('Failed to load driver/salary data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      setSaving(true);
      await api.addDriver({
        name,
        phone,
        license_number: licenseNumber,
        license_expiry: licenseExpiry || null,
        salary_monthly: parseFloat(monthlySalary) || 0,
        assigned_vehicle_id: vehicleId || null,
      });

      setShowAddModal(false);
      setName('');
      setPhone('');
      setLicenseNumber('');
      setMonthlySalary('18000');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add driver');
    } finally {
      setSaving(false);
    }
  };

  // Open Advance Modal
  const openAdvanceModalForDriver = (driverIdToUse?: string) => {
    const targetId = driverIdToUse || (drivers[0]?.id ?? '');
    setAdvDriverId(targetId);
    setAdvAmount('');
    setAdvReason('Road Kharcha & Diesel Support');
    setShowAdvanceModal(true);
  };

  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(advAmount);
    if (!advDriverId || isNaN(amt) || amt <= 0) {
      alert('Please select driver and enter a valid advance amount');
      return;
    }

    try {
      setSaving(true);
      await api.addAdvance({
        driver_id: advDriverId,
        date: advDate,
        amount: amt,
        reason: `${advReason} (${advMode})`,
      });
      setShowAdvanceModal(false);
      setAdvAmount('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record advance');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdvance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advance entry?')) return;
    try {
      await api.deleteAdvance(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete advance');
    }
  };

  // Open Settle Salary Modal
  const openSalaryModalForDriver = (driverIdToUse?: string) => {
    const targetId = driverIdToUse || (drivers[0]?.id ?? '');
    setSalDriverId(targetId);

    const driverObj = drivers.find((d) => d.id === targetId);
    const basic = driverObj?.monthly_salary || 18000;
    setSalBasic(String(basic));

    // Calculate pending advances for this driver
    const pendingAdvTotal = advances
      .filter((a) => a.driver_id === targetId && a.status === 'pending')
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    setSalAdvanceDeducted(String(pendingAdvTotal));
    setSalBonus('0');
    setShowSalaryPayModal(true);
  };

  const handleDriverSelectInSalaryModal = (driverIdSelected: string) => {
    setSalDriverId(driverIdSelected);
    const driverObj = drivers.find((d) => d.id === driverIdSelected);
    const basic = driverObj?.monthly_salary || 18000;
    setSalBasic(String(basic));

    const pendingAdvTotal = advances
      .filter((a) => a.driver_id === driverIdSelected && a.status === 'pending')
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    setSalAdvanceDeducted(String(pendingAdvTotal));
  };

  const handleSaveSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const basic = parseFloat(salBasic) || 0;
    const adv = parseFloat(salAdvanceDeducted) || 0;
    const bonus = parseFloat(salBonus) || 0;
    const net = basic - adv + bonus;

    if (!salDriverId || !salMonthYear || net < 0) {
      alert('Invalid salary figures. Net payable cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.paySalary({
        driver_id: salDriverId,
        month_year: salMonthYear,
        basic_salary: basic,
        advance_deducted: adv,
        bonus_incentive: bonus,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: salMethod,
        notes: salNotes,
      });

      setShowSalaryPayModal(false);
      await loadData();

      // Show the generated settlement slip immediately
      const driverObj = drivers.find((d) => d.id === salDriverId);
      if (driverObj) {
        setActiveSlip({
          driver: driverObj,
          payment: {
            id: res.id,
            owner_id: 'owner-1',
            driver_id: salDriverId,
            driver_name: driverObj.name,
            driver_phone: driverObj.phone,
            month_year: salMonthYear,
            basic_salary: basic,
            advance_deducted: adv,
            bonus_incentive: bonus,
            net_paid: res.netPaid ?? net,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: salMethod,
            notes: salNotes,
            created_at: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record salary payment');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalMonthlySalaries = drivers.reduce((sum, d) => sum + Number(d.monthly_salary || 0), 0);
  const totalPendingAdvances = advances
    .filter((a) => a.status === 'pending')
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalSettledPayments = payments.reduce((sum, p) => sum + Number(p.net_paid || 0), 0);

  // Filtered lists
  const filteredAdvances = selectedDriverFilter === 'all'
    ? advances
    : advances.filter((a) => a.driver_id === selectedDriverFilter);

  const filteredPayments = selectedDriverFilter === 'all'
    ? payments
    : payments.filter((p) => p.driver_id === selectedDriverFilter);

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1A1A1A] flex items-center space-x-2">
            <User className="w-5 h-5 text-[#FF8C00]" />
            <span>
              {lang === 'hi'
                ? 'ड्राइवर एवं वेतन-पेशगी हिसाब (Hisaab Register)'
                : 'Drivers & Salary Hisaab Register'}
            </span>
          </h1>
          <p className="text-xs text-[#70706B]">
            {lang === 'hi'
              ? 'चालक सूची, मासिक वेतन, पेशगी (Advance) और मासिक सेटलमेंट पर्ची'
              : 'Driver fleet profiles, road advances ledger, and monthly salary settlement slips'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openAdvanceModalForDriver()}
            className="px-3.5 py-2 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] font-black text-xs rounded-xl flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{lang === 'hi' ? '+ पेशगी दें (Add Advance)' : '+ Add Advance'}</span>
          </button>

          <button
            type="button"
            onClick={() => openSalaryModalForDriver()}
            className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'hi' ? 'वेतन पर्ची बनाएं (Settle Salary)' : 'Settle Salary'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF8C00]" />
            <span>{lang === 'hi' ? 'नया ड्राइवर जोड़ें' : 'Add Driver'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Toggle */}
      <div className="flex items-center space-x-2 border-b border-[#E5E5DF] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'roster'
              ? 'bg-[#1A1A1A] text-white shadow-xs'
              : 'bg-white text-[#70706B] border border-[#E5E5DF] hover:text-[#1A1A1A]'
          }`}
        >
          <span>👤 {lang === 'hi' ? 'चालक सूची (Fleet Roster)' : 'Drivers Roster'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {drivers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('salary')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'salary'
              ? 'bg-[#FF8C00] text-white shadow-xs'
              : 'bg-white text-[#70706B] border border-[#E5E5DF] hover:text-[#1A1A1A]'
          }`}
        >
          <span>💵 {lang === 'hi' ? 'वेतन व पेशगी खाता (Salary & Advances)' : 'Advance & Salary Register'}</span>
          {totalPendingAdvances > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-mono">
              {formatINR(totalPendingAdvances)}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: DRIVERS ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#70706B]">Loading driver roster...</div>
          ) : drivers.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-[#E5E5DF] text-center space-y-3">
              <p className="font-bold text-[#1A1A1A] text-sm">No drivers registered yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#FF8C00] text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Add Your First Driver
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drivers.map((d) => {
                const driverPendingAdvances = advances
                  .filter((a) => a.driver_id === d.id && a.status === 'pending')
                  .reduce((sum, a) => sum + Number(a.amount || 0), 0);

                return (
                  <div
                    key={d.id}
                    className="bg-white rounded-3xl border border-[#E5E5DF] p-5 shadow-xs hover:border-[#FF8C00] transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFF3E0] text-[#FF8C00] flex items-center justify-center font-bold text-xl">
                          👨‍✈️
                        </div>
                        <div>
                          <h3 className="font-black text-[#1A1A1A] text-base">{d.name}</h3>
                          <p className="text-xs text-[#70706B] font-medium">
                            📞 {d.phone} {d.license_number ? `• DL: ${d.license_number}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <a
                          href={`tel:${d.phone}`}
                          className="p-2 bg-[#E5E5DF]/60 hover:bg-[#E5E5DF] text-[#1A1A1A] rounded-xl transition"
                          title="Call Driver"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-[#F9F9F6] p-3 rounded-2xl text-center text-xs border border-[#E5E5DF]">
                      <div>
                        <span className="text-[10px] text-[#70706B] uppercase font-bold block">Assigned</span>
                        <span className="font-bold text-[#1A1A1A]">{d.vehicle_number || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#70706B] uppercase font-bold block">Monthly Salary</span>
                        <span className="font-bold text-[#1A1A1A]">{formatINR(d.monthly_salary)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#70706B] uppercase font-bold block">Pending Advance</span>
                        <span className={`font-black ${driverPendingAdvances > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                          {formatINR(driverPendingAdvances)}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar per Driver */}
                    <div className="pt-2 border-t border-[#E5E5DF] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => openAdvanceModalForDriver(d.id)}
                        className="text-xs font-bold text-[#E65100] hover:underline flex items-center space-x-1"
                      >
                        <span>+ Give Advance (पेशगी दें)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openSalaryModalForDriver(d.id)}
                        className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-lg text-xs font-bold transition"
                      >
                        <span>Generate Salary Slip</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADVANCE & SALARY HISAAB REGISTER */}
      {activeTab === 'salary' && (
        <div className="space-y-5">
          {/* Top 3 Financial Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-[#E5E5DF] shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#70706B] block">
                Total Monthly Salary Bill
              </span>
              <p className="text-2xl font-black text-[#1A1A1A] mt-1">{formatINR(totalMonthlySalaries)}</p>
              <p className="text-[11px] text-[#70706B] mt-0.5">Across {drivers.length} active drivers</p>
            </div>

            <div className="bg-[#FFF8E7] p-4 rounded-3xl border border-[#FF8C00]/30 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#E65100] block">
                Active Pending Advances (पेशगी)
              </span>
              <p className="text-2xl font-black text-[#DC2626] mt-1">{formatINR(totalPendingAdvances)}</p>
              <p className="text-[11px] text-[#70706B] mt-0.5">To be deducted in next salary settlement</p>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E5E5DF] shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#059669] block">
                Total Salary Paid & Settled
              </span>
              <p className="text-2xl font-black text-[#059669] mt-1">{formatINR(totalSettledPayments)}</p>
              <p className="text-[11px] text-[#70706B] mt-0.5">{payments.length} monthly slips processed</p>
            </div>
          </div>

          {/* Driver Filter Dropdown */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#E5E5DF]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#70706B]">Filter by Driver:</span>
              <select
                value={selectedDriverFilter}
                onChange={(e) => setSelectedDriverFilter(e.target.value)}
                className="bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3 py-1 text-xs font-bold text-[#1A1A1A]"
              >
                <option value="all">All Drivers (सभी चालक)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({formatINR(d.monthly_salary)}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => openAdvanceModalForDriver()}
                className="px-3 py-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] font-black text-xs rounded-xl"
              >
                + Record Advance
              </button>
              <button
                type="button"
                onClick={() => openSalaryModalForDriver()}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl"
              >
                Settle Month
              </button>
            </div>
          </div>

          {/* SECTION A: ADVANCES LEDGER (पेशगी खाता) */}
          <div className="bg-white rounded-3xl border border-[#E5E5DF] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
                <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wide">
                  1. Advances Ledger (पेशगी / खर्च खाता)
                </h3>
              </div>
              <span className="text-xs text-[#70706B] font-semibold">
                {filteredAdvances.length} Advance Entries
              </span>
            </div>

            {filteredAdvances.length === 0 ? (
              <p className="text-xs text-[#70706B] py-4 text-center">No driver advance recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9F9F6] text-[#70706B] font-bold border-b border-[#E5E5DF]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Driver</th>
                      <th className="p-2.5">Reason / Details</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5DF]">
                    {filteredAdvances.map((adv) => (
                      <tr key={adv.id} className="hover:bg-[#F9F9F6]/60">
                        <td className="p-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                          {formatDate(adv.date)}
                        </td>
                        <td className="p-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                          {adv.driver_name || 'Driver'}
                        </td>
                        <td className="p-2.5 text-[#50504B]">{adv.reason || 'Road advance'}</td>
                        <td className="p-2.5 text-right font-black text-[#DC2626] whitespace-nowrap">
                          {formatINR(adv.amount)}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              adv.status === 'pending'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {adv.status === 'pending' ? 'Pending Deduction' : 'Settled in Salary'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          {adv.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdvance(adv.id)}
                              className="p-1 text-[#70706B] hover:text-[#DC2626] rounded"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION B: PAST SALARY PAYMENTS & SETTLEMENT SLIPS */}
          <div className="bg-white rounded-3xl border border-[#E5E5DF] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wide">
                  2. Monthly Salary Settlement Register (मासिक वेतन पर्चियां)
                </h3>
              </div>
              <span className="text-xs text-[#70706B] font-semibold">
                {filteredPayments.length} Settled Slips
              </span>
            </div>

            {filteredPayments.length === 0 ? (
              <p className="text-xs text-[#70706B] py-4 text-center">No salary payments processed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9F9F6] text-[#70706B] font-bold border-b border-[#E5E5DF]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Driver</th>
                      <th className="p-2.5">Month</th>
                      <th className="p-2.5 text-right">Basic</th>
                      <th className="p-2.5 text-right">Advances Less</th>
                      <th className="p-2.5 text-right">Bata / Incentive</th>
                      <th className="p-2.5 text-right">Net Paid</th>
                      <th className="p-2.5 text-center">Mode</th>
                      <th className="p-2.5 text-center">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5DF]">
                    {filteredPayments.map((p) => {
                      const drv = drivers.find((d) => d.id === p.driver_id);
                      return (
                        <tr key={p.id} className="hover:bg-[#F9F9F6]/60">
                          <td className="p-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                            {formatDate(p.payment_date)}
                          </td>
                          <td className="p-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                            {p.driver_name || drv?.name || 'Driver'}
                          </td>
                          <td className="p-2.5 font-mono text-[#50504B] whitespace-nowrap">
                            {p.month_year}
                          </td>
                          <td className="p-2.5 text-right font-semibold whitespace-nowrap">
                            {formatINR(p.basic_salary)}
                          </td>
                          <td className="p-2.5 text-right text-[#DC2626] font-semibold whitespace-nowrap">
                            - {formatINR(p.advance_deducted)}
                          </td>
                          <td className="p-2.5 text-right text-[#059669] font-semibold whitespace-nowrap">
                            + {formatINR(p.bonus_incentive)}
                          </td>
                          <td className="p-2.5 text-right font-black text-[#059669] whitespace-nowrap">
                            {formatINR(p.net_paid)}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap uppercase font-bold text-[10px] text-[#70706B]">
                            {p.payment_method}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const matchedDriver = drv || {
                                  id: p.driver_id,
                                  owner_id: 'owner-1',
                                  name: p.driver_name || 'Driver',
                                  phone: p.driver_phone || '9876543211',
                                  monthly_salary: p.basic_salary,
                                  created_at: p.payment_date,
                                };
                                setActiveSlip({ driver: matchedDriver, payment: p });
                              }}
                              className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-lg text-[11px] font-bold inline-flex items-center space-x-1"
                            >
                              <FileText className="w-3 h-3 text-[#FF8C00]" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD DRIVER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5DF]">
              <h3 className="font-black text-[#1A1A1A] text-base">Add New Driver (ड्राइवर जोड़ें)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#70706B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Gurpreet Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2.5 font-bold outline-none focus:border-[#FF8C00]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2.5 font-bold outline-none focus:border-[#FF8C00]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">DL Number</label>
                  <input
                    type="text"
                    placeholder="TS0920..."
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-black text-[#059669]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Assign Primary Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                >
                  <option value="">None / Flexible Truck</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-3 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl shadow-xs transition"
              >
                {saving ? 'Saving...' : 'Save Driver (चालक दर्ज करें)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD ADVANCE (पेशगी खर्च) */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5DF]">
              <div>
                <h3 className="font-black text-[#1A1A1A] text-base">Give Advance (पेशगी दर्ज करें)</h3>
                <p className="text-[11px] text-[#70706B]">Record road kharcha, diesel assistance, or emergency cash</p>
              </div>
              <button onClick={() => setShowAdvanceModal(false)} className="text-[#70706B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Select Driver *</label>
                <select
                  value={advDriverId}
                  onChange={(e) => setAdvDriverId(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2.5 font-bold"
                  required
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Date</label>
                  <input
                    type="date"
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-black text-[#DC2626]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Reason / Purpose</label>
                <select
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold mb-2"
                >
                  <option value="Road Kharcha & Diesel Support">Road Kharcha & Diesel Support (रास्ते का खर्च)</option>
                  <option value="Family / Personal Cash Emergency">Family / Personal Emergency (घर का खर्च)</option>
                  <option value="Food & Daily Allowance (Bata)">Food & Daily Allowance / Bata (भोजन भत्ता)</option>
                  <option value="Vehicle Repair / Puncture Urgent Help">Vehicle Repair / Urgent Support</option>
                  <option value="Police / RTO Challan Assistance">Police / RTO Challan Assistance</option>
                  <option value="Festival Advance (त्यौहार पेशगी)">Festival Advance (त्यौहार पेशगी)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Cash (नकद)', 'UPI (PhonePe/GPay)', 'Bank Transfer'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAdvMode(m.split(' ')[0])}
                      className={`p-1.5 rounded-xl border text-[11px] font-bold transition ${
                        advMode === m.split(' ')[0]
                          ? 'border-[#FF8C00] bg-[#FFF3E0] text-[#1A1A1A]'
                          : 'border-[#E5E5DF] text-[#70706B]'
                      }`}
                    >
                      {m.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-3 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-xs rounded-xl shadow-xs transition"
              >
                {saving ? 'Saving...' : 'Save Advance (पेशगी जोड़ें)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SETTLE MONTHLY SALARY (वेतन पर्ची बनाएं) */}
      {showSalaryPayModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5DF]">
              <div>
                <h3 className="font-black text-[#1A1A1A] text-base">
                  Settle Monthly Salary (वेतन पर्ची बनाएं)
                </h3>
                <p className="text-[11px] text-[#70706B]">
                  Deduct all advances and generate printable driver settlement slip
                </p>
              </div>
              <button onClick={() => setShowSalaryPayModal(false)} className="text-[#70706B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryPayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Select Driver *</label>
                  <select
                    value={salDriverId}
                    onChange={(e) => handleDriverSelectInSalaryModal(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Month & Year *</label>
                  <input
                    type="month"
                    value={salMonthYear}
                    onChange={(e) => setSalMonthYear(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Breakdown Box */}
              <div className="bg-[#F9F9F6] border border-[#E5E5DF] p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A1A1A]">Basic Monthly Salary (मूल वेतन):</span>
                  <div className="w-32">
                    <input
                      type="number"
                      value={salBasic}
                      onChange={(e) => setSalBasic(e.target.value)}
                      className="w-full bg-white border border-[#E5E5DF] rounded-lg p-1.5 text-right font-black text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#DC2626]">Less: Advances to Deduct (काटी गई पेशगी):</span>
                  <div className="w-32">
                    <input
                      type="number"
                      value={salAdvanceDeducted}
                      onChange={(e) => setSalAdvanceDeducted(e.target.value)}
                      className="w-full bg-white border border-[#E5E5DF] rounded-lg p-1.5 text-right font-black text-[#DC2626]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#059669]">Add: Trip Bata / Incentive (इंसेंटिव / भत्ता):</span>
                  <div className="w-32">
                    <input
                      type="number"
                      value={salBonus}
                      onChange={(e) => setSalBonus(e.target.value)}
                      className="w-full bg-white border border-[#E5E5DF] rounded-lg p-1.5 text-right font-black text-[#059669]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E5DF] flex items-center justify-between text-sm">
                  <span className="font-black text-[#1A1A1A] uppercase">NET PAYABLE (कुल देय वेतन):</span>
                  <span className="font-black text-[#059669] text-base font-mono">
                    {formatINR(
                      Math.max(
                        0,
                        (parseFloat(salBasic) || 0) -
                          (parseFloat(salAdvanceDeducted) || 0) +
                          (parseFloat(salBonus) || 0)
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Payment Method</label>
                  <select
                    value={salMethod}
                    onChange={(e) => setSalMethod(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="upi">UPI (PhonePe/GPay)</option>
                    <option value="cash">Cash (नकद भुगतान)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Remarks / Notes</label>
                  <input
                    type="text"
                    value={salNotes}
                    onChange={(e) => setSalNotes(e.target.value)}
                    className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-3 py-3 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Processing...' : 'Confirm Settlement & Print Slip'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: OFFICIAL MONTHLY SETTLEMENT SLIP (वेतन पर्ची) */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Top Bar */}
            <div className="px-5 py-3 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#FF8C00]" />
                <span className="font-bold text-sm">
                  Salary Settlement Slip ({activeSlip.payment.month_year})
                </span>
              </div>
              <button
                onClick={() => setActiveSlip(null)}
                className="p-1 text-[#A0A09B] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 printable-area text-[#1A1A1A]">
              {/* Slip Card */}
              <div className="border-2 border-[#1A1A1A] rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
                {/* Header */}
                <div className="text-center border-b-2 border-[#1A1A1A] pb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A1A1A] text-white">
                    DRIVER SALARY SETTLEMENT SLIP (मासिक वेतन पर्ची)
                  </span>
                  <h2 className="text-xl font-black text-[#1A1A1A] mt-1 uppercase">
                    Singh Roadlines & Logistics
                  </h2>
                  <p className="text-xs text-[#70706B]">
                    Plot 42, Transport Nagar, Autonagar, Hyderabad • Ph: 9876543210
                  </p>
                </div>

                {/* Driver Details Box */}
                <div className="grid grid-cols-2 gap-2 bg-[#F9F9F6] p-3 rounded-xl border border-[#E5E5DF] text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#70706B] uppercase block">Driver Name</span>
                    <span className="font-black text-sm text-[#1A1A1A]">{activeSlip.driver.name}</span>
                    <span className="text-[11px] text-[#70706B] block">📞 {activeSlip.driver.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#70706B] uppercase block">Salary Month</span>
                    <span className="font-black text-sm text-[#1A1A1A] font-mono">{activeSlip.payment.month_year}</span>
                    <span className="text-[11px] text-[#70706B] block">Date: {formatDate(activeSlip.payment.payment_date)}</span>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="border border-[#1A1A1A] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#1A1A1A] text-white font-bold">
                      <tr>
                        <th className="p-2.5">Salary Component (वेतन मद)</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5DF]">
                      <tr>
                        <td className="p-2.5 font-bold">Basic Monthly Salary (मूल वेतन)</td>
                        <td className="p-2.5 text-right font-black">{formatINR(activeSlip.payment.basic_salary)}</td>
                      </tr>
                      {Number(activeSlip.payment.bonus_incentive) > 0 && (
                        <tr>
                          <td className="p-2.5 text-[#059669] font-bold">Add: Trip Allowances / Bata / Incentive</td>
                          <td className="p-2.5 text-right text-[#059669] font-black">+ {formatINR(activeSlip.payment.bonus_incentive)}</td>
                        </tr>
                      )}
                      {Number(activeSlip.payment.advance_deducted) > 0 && (
                        <tr>
                          <td className="p-2.5 text-[#DC2626] font-bold">Less: Advance Recovered / Deducted (पेशगी कटौती)</td>
                          <td className="p-2.5 text-right text-[#DC2626] font-black">- {formatINR(activeSlip.payment.advance_deducted)}</td>
                        </tr>
                      )}
                      <tr className="bg-[#FFF3E0] font-black text-sm text-[#1A1A1A] border-t-2 border-[#1A1A1A]">
                        <td className="p-3 text-[#FF8C00] uppercase">NET AMOUNT PAID (कुल शुद्ध वेतन)</td>
                        <td className="p-3 text-right text-[#FF8C00] font-mono text-base">{formatINR(activeSlip.payment.net_paid)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mode & Note */}
                <div className="bg-[#F5F5F0] p-2.5 rounded-xl text-[11px] text-[#50504B] flex justify-between items-center">
                  <span><strong>Payment Method:</strong> {activeSlip.payment.payment_method.toUpperCase()}</span>
                  <span><strong>Status:</strong> <span className="text-[#059669] font-black">SETTLED & PAID</span></span>
                </div>

                {/* Acknowledgement Text */}
                <p className="text-[10px] text-[#70706B] italic border-t border-dashed border-[#E5E5DF] pt-2">
                  "I acknowledge full and final settlement of my salary and trip accounts for this period with zero pending claims."
                </p>

                {/* Signatures */}
                <div className="pt-5 grid grid-cols-2 gap-4 text-center text-[10px] text-[#50504B]">
                  <div className="border-t border-[#1A1A1A] pt-1">
                    <p className="font-bold text-[#1A1A1A]">Driver's Signature (चालक हस्ताक्षर)</p>
                    <p className="text-[9px]">{activeSlip.driver.name}</p>
                  </div>
                  <div className="border-t border-[#1A1A1A] pt-1">
                    <p className="font-bold text-[#1A1A1A]">Transporter Signature & Stamp</p>
                    <p className="text-[9px]">Authorized Signatory</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Excluded from Print) */}
              <div className="pt-2 flex items-center space-x-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = `*🚚 SINGH ROADLINES & LOGISTICS*
*DRIVER SALARY SETTLEMENT SLIP*
-----------------------------------
*Driver:* ${activeSlip.driver.name}
*Month:* ${activeSlip.payment.month_year}
*Date:* ${formatDate(activeSlip.payment.payment_date)}
-----------------------------------
*Basic Salary:* ${formatINR(activeSlip.payment.basic_salary)}
*Incentive / Bata:* +${formatINR(activeSlip.payment.bonus_incentive)}
*Advance Deducted:* -${formatINR(activeSlip.payment.advance_deducted)}
-----------------------------------
*NET SALARY PAID:* ${formatINR(activeSlip.payment.net_paid)}
*Method:* ${activeSlip.payment.payment_method.toUpperCase()}
*Status:* FULLY SETTLED
-----------------------------------
Generated via Gaadi Hisaab App.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex-1 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp to Driver</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
