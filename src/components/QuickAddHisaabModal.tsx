import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  User as UserIcon,
  MapPin,
  Package,
  Gauge,
  IndianRupee,
  Fuel,
  CreditCard,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language, translations } from '../translations';
import { Vehicle, Driver, Customer } from '../types';
import { api, formatINR } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  defaultVehicleId?: string;
}

export const QuickAddHisaabModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
  vehicles,
  drivers,
  customers,
  defaultVehicleId,
}) => {
  const t = translations[lang];

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || (vehicles[0]?.id ?? ''));
  const [driverId, setDriverId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [goodsType, setGoodsType] = useState('General Goods');
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');

  // Financials
  const [freightAmount, setFreightAmount] = useState('');
  const [loadingCharge, setLoadingCharge] = useState('');
  const [unloadingCharge, setUnloadingCharge] = useState('');
  const [extraCharge, setExtraCharge] = useState('');
  const [dieselCost, setDieselCost] = useState('');
  const [tollCost, setTollCost] = useState('');
  const [parkingCost, setParkingCost] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('cash');
  const [notes, setNotes] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default vehicle and prefill driver/km
  useEffect(() => {
    if (defaultVehicleId && defaultVehicleId !== 'all') {
      setVehicleId(defaultVehicleId);
    } else if (vehicles.length > 0 && !vehicleId) {
      setVehicleId(vehicles[0].id);
    }
  }, [defaultVehicleId, vehicles]);

  useEffect(() => {
    const selectedVeh = vehicles.find((v) => v.id === vehicleId);
    if (selectedVeh) {
      if (selectedVeh.assigned_driver_id) {
        setDriverId(selectedVeh.assigned_driver_id);
      }
      if (selectedVeh.current_km && !startKm) {
        setStartKm(String(selectedVeh.current_km));
      }
    }
  }, [vehicleId, vehicles]);

  if (!isOpen) return null;

  // Real-time Math Calculations
  const freight = Number(freightAmount) || 0;
  const loadingFee = Number(loadingCharge) || 0;
  const unloadingFee = Number(unloadingCharge) || 0;
  const extraFee = Number(extraCharge) || 0;
  const grossIncome = freight + loadingFee + unloadingFee + extraFee;

  const diesel = Number(dieselCost) || 0;
  const toll = Number(tollCost) || 0;
  const parking = Number(parkingCost) || 0;
  const other = Number(otherExpenses) || 0;
  const totalExpenses = diesel + toll + parking + other;

  const netIncome = grossIncome - totalExpenses;
  const paid = Number(paidAmount) || 0;
  const pendingAmount = Math.max(0, grossIncome - paid);

  const startKmNum = Number(startKm) || 0;
  const endKmNum = Number(endKm) || 0;
  const totalKm = endKmNum > startKmNum ? endKmNum - startKmNum : 0;

  const handleQuickGoods = (type: string) => {
    setGoodsType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicleId) {
      setError('Please select a vehicle');
      return;
    }
    if (!pickupLocation || !dropLocation) {
      setError('Please enter pickup and drop locations');
      return;
    }
    if (!freight && !grossIncome) {
      setError('Please enter freight amount');
      return;
    }

    try {
      setLoading(true);
      await api.createTrip({
        date,
        vehicle_id: vehicleId,
        driver_id: driverId || null,
        customer_id: customerId || null,
        customer_name: customerId ? '' : customCustomerName,
        customer_phone: customerId ? '' : customCustomerPhone,
        pickup_location: pickupLocation,
        drop_location: dropLocation,
        goods_type: goodsType,
        start_km: startKmNum,
        end_km: endKmNum,
        freight_amount: freight,
        loading_charge: loadingFee,
        unloading_charge: unloadingFee,
        extra_charge: extraFee,
        diesel_cost: diesel,
        toll_cost: toll,
        parking_cost: parking,
        other_expenses: other,
        paid_amount: paid,
        payment_method: paymentMethod,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save Hisaab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                {t.addHisaab}
              </h2>
              <p className="text-[10px] text-amber-300">Fast 30-Second Transport Entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          {/* Row 1: Date & Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-date" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                📅 Date
              </label>
              <input
                id="quick-date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="quick-vehicle" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                🚚 {t.vehicle} *
              </label>
              <select
                id="quick-vehicle"
                name="vehicleId"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.vehicle_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Customer / Party */}
          <div>
            <label htmlFor="quick-customer" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              👤 {t.customer} / Party
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                id="quick-customer"
                name="customerId"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  if (e.target.value) {
                    setCustomCustomerName('');
                    setCustomCustomerPhone('');
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
              >
                <option value="">+ Type New Customer Below</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.city || 'Party'})
                  </option>
                ))}
              </select>

              {!customerId && (
                <div className="flex space-x-1.5">
                  <input
                    id="quick-customer-name"
                    name="customCustomerName"
                    type="text"
                    placeholder="Party Name"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                  />
                  <input
                    id="quick-customer-phone"
                    name="customCustomerPhone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Phone"
                    value={customCustomerPhone}
                    onChange={(e) => setCustomCustomerPhone(e.target.value)}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Pickup & Drop Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-pickup" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                📍 {t.pickup} *
              </label>
              <input
                id="quick-pickup"
                name="pickupLocation"
                type="text"
                placeholder="e.g., Bowenpally Mandi"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="quick-drop" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                🏁 {t.drop} *
              </label>
              <input
                id="quick-drop"
                name="dropLocation"
                type="text"
                placeholder="e.g., Shamshabad Hub"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Quick Goods Type Selector Pills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="quick-goods" className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                📦 {t.goods}
              </label>
              <span className="text-[10px] text-slate-500">Tap quick tag</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {['Vegetables', 'FMCG / Retail', 'Hardware / Steel', 'Cement', 'Fruits', 'General Goods'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleQuickGoods(item)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition font-medium ${
                    goodsType === item
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <input
              id="quick-goods"
              name="goodsType"
              type="text"
              value={goodsType}
              onChange={(e) => setGoodsType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
            />
          </div>

          {/* Core Money Section: Freight & Diesel */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quick-freight" className="block text-xs font-black text-amber-950 uppercase tracking-wide mb-1">
                  💰 {t.freight} (₹) *
                </label>
                <input
                  id="quick-freight"
                  name="freightAmount"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="quick-diesel" className="block text-xs font-black text-amber-950 uppercase tracking-wide mb-1">
                  ⛽ {t.diesel} Cost (₹)
                </label>
                <input
                  id="quick-diesel"
                  name="dieselCost"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={dieselCost}
                  onChange={(e) => setDieselCost(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Payment Received Now */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200">
              <div>
                <label htmlFor="quick-paid" className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-1">
                  💵 Paid / Received (₹)
                </label>
                <input
                  id="quick-paid"
                  name="paidAmount"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="quick-payment-mode" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Payment Mode
                </label>
                <select
                  id="quick-payment-mode"
                  name="paymentMethod"
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="cash">Cash (नकद)</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
          </div>

          {/* Toggle for Advanced Fields (Toll, Loading, Unloading, Odometer KM) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 py-1"
            >
              <span>{showAdvanced ? 'Hide' : 'More Details'} (Tolls, Loading, KM, Driver)</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                {/* Odometer KM */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="quick-start-km" className="block text-[10px] font-bold text-slate-600">Start KM</label>
                    <input
                      id="quick-start-km"
                      name="startKm"
                      type="number"
                      inputMode="numeric"
                      value={startKm}
                      onChange={(e) => setStartKm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-end-km" className="block text-[10px] font-bold text-slate-600">End KM</label>
                    <input
                      id="quick-end-km"
                      name="endKm"
                      type="number"
                      inputMode="numeric"
                      value={endKm}
                      onChange={(e) => setEndKm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-600">Total KM</span>
                    <div className="bg-slate-200/80 rounded-lg p-1.5 text-xs font-bold text-slate-800 text-center">
                      {totalKm} KM
                    </div>
                  </div>
                </div>

                {/* Additional Income Charges */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="quick-loading" className="block text-[10px] font-bold text-slate-600">Loading (₹)</label>
                    <input
                      id="quick-loading"
                      name="loadingCharge"
                      type="number"
                      inputMode="numeric"
                      value={loadingCharge}
                      onChange={(e) => setLoadingCharge(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-unloading" className="block text-[10px] font-bold text-slate-600">Unloading (₹)</label>
                    <input
                      id="quick-unloading"
                      name="unloadingCharge"
                      type="number"
                      inputMode="numeric"
                      value={unloadingCharge}
                      onChange={(e) => setUnloadingCharge(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-extra-charge" className="block text-[10px] font-bold text-slate-600">Extra / Halting</label>
                    <input
                      id="quick-extra-charge"
                      name="extraCharge"
                      type="number"
                      inputMode="numeric"
                      value={extraCharge}
                      onChange={(e) => setExtraCharge(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Other Expenses */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="quick-toll" className="block text-[10px] font-bold text-slate-600">Toll (₹)</label>
                    <input
                      id="quick-toll"
                      name="tollCost"
                      type="number"
                      inputMode="numeric"
                      value={tollCost}
                      onChange={(e) => setTollCost(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-parking" className="block text-[10px] font-bold text-slate-600">Parking (₹)</label>
                    <input
                      id="quick-parking"
                      name="parkingCost"
                      type="number"
                      inputMode="numeric"
                      value={parkingCost}
                      onChange={(e) => setParkingCost(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="quick-misc" className="block text-[10px] font-bold text-slate-600">Misc / Tea (₹)</label>
                    <input
                      id="quick-misc"
                      name="otherExpenses"
                      type="number"
                      inputMode="numeric"
                      value={otherExpenses}
                      onChange={(e) => setOtherExpenses(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Driver */}
                <div>
                  <label htmlFor="quick-driver" className="block text-[10px] font-bold text-slate-600 mb-1">Driver</label>
                  <select
                    id="quick-driver"
                    name="driverId"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-medium"
                  >
                    <option value="">No Driver / Self Driven</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Automatic Live Calculation Bar */}
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-inner">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Gross</span>
                <span className="text-xs sm:text-sm font-black text-emerald-400">
                  {formatINR(grossIncome)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Expenses</span>
                <span className="text-xs sm:text-sm font-black text-rose-400">
                  {formatINR(totalExpenses)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Net Profit</span>
                <span className={`text-xs sm:text-sm font-black ${netIncome >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {formatINR(netIncome)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Udhaar / Bal</span>
                <span className={`text-xs sm:text-sm font-black ${pendingAmount > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                  {formatINR(pendingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition active:scale-98 disabled:opacity-50"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>{loading ? t.saving : t.saveHisaab}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
