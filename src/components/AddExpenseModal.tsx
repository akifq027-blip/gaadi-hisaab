import React, { useState } from 'react';
import { X, Receipt, Check } from 'lucide-react';
import { Vehicle, Driver } from '../types';
import { api } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
}

export const AddExpenseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicles,
  drivers,
}) => {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<any>('toll');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'toll', label: 'Toll (टोल)', icon: '🛣️' },
    { id: 'parking', label: 'Parking (पार्किंग)', icon: '🅿️' },
    { id: 'food', label: 'Food / Tea (खाना-चाय)', icon: '☕' },
    { id: 'loading', label: 'Loading', icon: '📦' },
    { id: 'unloading', label: 'Unloading', icon: '📥' },
    { id: 'tyre', label: 'Tyre / Puncture', icon: '🛞' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'challan', label: 'Challan / Police', icon: '🚨' },
    { id: 'misc', label: 'Misc Expense', icon: '💸' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter expense amount');
      return;
    }

    try {
      setLoading(true);
      await api.addExpense({
        vehicle_id: vehicleId || null,
        driver_id: driverId || null,
        date,
        category,
        amount: amt,
        description,
        payment_method: paymentMethod,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              💸
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Record Expense (खर्चा लिखें)</h3>
              <p className="text-[11px] text-slate-500">Tolls, parking, food, punctures, challans</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          {/* Quick Category Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition ${
                    category === c.id
                      ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-base">{c.icon}</span>
                  <span className="truncate block mt-0.5 text-[11px]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="expense-amount" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Amount (₹) *
            </label>
            <input
              id="expense-amount"
              name="amount"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 150"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-base font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="expense-vehicle" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Vehicle
              </label>
              <select
                id="expense-vehicle"
                name="vehicleId"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="">General (No Vehicle)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Date
              </label>
              <input
                id="expense-date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expense-desc" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Description / Detail
            </label>
            <input
              id="expense-desc"
              name="description"
              type="text"
              placeholder="e.g. Patancheru Toll Fastag / Tyre puncture patch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Expense'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
