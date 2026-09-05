import React, { useState, useEffect } from 'react';
import { Fuel, Plus, Search, Gauge, IndianRupee } from 'lucide-react';
import { Language, translations } from '../translations';
import { FuelLog, Vehicle } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  onOpenAddFuel: () => void;
  vehicles: Vehicle[];
}

export const FuelView: React.FC<Props> = ({ lang, onOpenAddFuel, vehicles }) => {
  const t = translations[lang];
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [summary, setSummary] = useState({ totalLiters: 0, totalAmount: 0, avgPrice: 93.5 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFuel();
  }, []);

  const loadFuel = async () => {
    try {
      setLoading(true);
      const data = await api.getFuel();
      setLogs(data.logs);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load fuel logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Fuel className="w-5 h-5 text-amber-600" />
            <span>{t.fuelTitle} (डीजल हिसाब)</span>
          </h1>
          <p className="text-xs text-slate-500">Track fuel spend, diesel slips and vehicle mileage</p>
        </div>

        <button
          onClick={onOpenAddFuel}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addDiesel}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
          <span className="text-[10px] font-black text-amber-900 uppercase block">Total Spent</span>
          <p className="text-base sm:text-xl font-black text-amber-850 mt-1">
            {formatINR(summary.totalAmount)}
          </p>
          <span className="text-[10px] text-amber-700 font-semibold">{logs.length} Fill-ups</span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase block">Total Liters</span>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1">
            {summary.totalLiters} L
          </p>
          <span className="text-[10px] text-slate-500 font-semibold">Diesel consumed</span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase block">Avg Rate / Liter</span>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1">
            ₹{summary.avgPrice}
          </p>
          <span className="text-[10px] text-slate-500 font-semibold">Per liter rate</span>
        </div>
      </div>

      {/* Fuel Logs List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading fuel slips...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">No diesel logs yet</p>
          <button
            onClick={onOpenAddFuel}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            {t.addDiesel}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-base shrink-0 mt-0.5">
                  ⛽
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {log.vehicle_number || 'Vehicle'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatDate(log.date)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-600 mt-0.5">
                    <span className="font-bold text-amber-800">{log.liters} Liters</span>
                    <span>@</span>
                    <span>₹{log.price_per_liter}/L</span>
                    {log.odometer_km > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-slate-500">KM: {log.odometer_km}</span>
                      </>
                    )}
                  </div>

                  {log.fuel_station && (
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Station: {log.fuel_station}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-slate-900 text-sm sm:text-base block">
                  {formatINR(log.total_amount)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {log.payment_method || 'CASH'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
