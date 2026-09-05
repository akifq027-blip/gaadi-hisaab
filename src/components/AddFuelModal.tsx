import React, { useState } from 'react';
import { X, Fuel, Check, Gauge } from 'lucide-react';
import { Vehicle, Driver } from '../types';
import { api, formatINR } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
}

export const AddFuelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicles,
  drivers,
}) => {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [liters, setLiters] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState('93.50');
  const [totalAmount, setTotalAmount] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLitersChange = (lit: string) => {
    setLiters(lit);
    const l = parseFloat(lit);
    const r = parseFloat(ratePerLiter);
    if (!isNaN(l) && !isNaN(r)) {
      setTotalAmount((l * r).toFixed(2));
    }
  };

  const handleRateChange = (rate: string) => {
    setRatePerLiter(rate);
    const l = parseFloat(liters);
    const r = parseFloat(rate);
    if (!isNaN(l) && !isNaN(r)) {
      setTotalAmount((l * r).toFixed(2));
    }
  };

  const handleTotalChange = (tot: string) => {
    setTotalAmount(tot);
    const t = parseFloat(tot);
    const r = parseFloat(ratePerLiter);
    if (!isNaN(t) && !isNaN(r) && r > 0) {
      setLiters((t / r).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!vehicleId) {
      setError('Please select a vehicle');
      return;
    }
    const lit = parseFloat(liters);
    if (isNaN(lit) || lit <= 0) {
      setError('Please enter liters filled');
      return;
    }

    try {
      setLoading(true);
      await api.addFuel({
        vehicle_id: vehicleId,
        driver_id: driverId || null,
        date,
        liters: lit,
        price_per_liter: parseFloat(ratePerLiter) || 93.5,
        total_amount: parseFloat(totalAmount) || lit * 93.5,
        odometer_km: parseFloat(odometerKm) || 0,
        fuel_station: fuelStation,
        payment_method: paymentMethod,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save diesel log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              ⛽
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Log Diesel / Fuel (डीजल एंट्री)</h3>
              <p className="text-[11px] text-slate-500">Record fuel slip and track vehicle mileage</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fuel-vehicle" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Vehicle *
              </label>
              <select
                id="fuel-vehicle"
                name="vehicleId"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fuel-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Date
              </label>
              <input
                id="fuel-date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="fuel-liters" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Liters *
              </label>
              <input
                id="fuel-liters"
                name="liters"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                value={liters}
                onChange={(e) => handleLitersChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-sm font-bold text-slate-900 outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="fuel-rate" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Rate (₹/L)
              </label>
              <input
                id="fuel-rate"
                name="ratePerLiter"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={ratePerLiter}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label htmlFor="fuel-total" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Total (₹)
              </label>
              <input
                id="fuel-total"
                name="totalAmount"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
                className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 text-sm font-black text-amber-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fuel-odometer" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Odometer KM
              </label>
              <input
                id="fuel-odometer"
                name="odometerKm"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 45200"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none"
              />
            </div>

            <div>
              <label htmlFor="fuel-station" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Fuel Station
              </label>
              <input
                id="fuel-station"
                name="fuelStation"
                type="text"
                placeholder="e.g. Indian Oil / HP"
                value={fuelStation}
                onChange={(e) => setFuelStation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Diesel Entry'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
