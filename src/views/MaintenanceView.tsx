import React, { useState, useEffect } from 'react';
import { Wrench, Plus, X, IndianRupee, Truck } from 'lucide-react';
import { Language, translations } from '../translations';
import { MaintenanceLog, Vehicle } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  vehicles: Vehicle[];
}

export const MaintenanceView: React.FC<Props> = ({ lang, vehicles }) => {
  const t = translations[lang];
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [serviceType, setServiceType] = useState('Oil & Filter Change');
  const [garageName, setGarageName] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMaintenance();
  }, []);

  const loadMaintenance = async () => {
    try {
      setLoading(true);
      const data = await api.getMaintenance();
      setLogs(data.records || []);
      setTotalCost(data.totalMaintCost || 0);
    } catch (err) {
      console.error('Failed to load maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cost);
    if (!vehicleId || isNaN(amt) || amt <= 0) return;

    try {
      setSaving(true);
      await api.addMaintenance({
        vehicle_id: vehicleId,
        service_type: serviceType,
        garage_name: garageName,
        cost: amt,
        service_date: date,
        description: notes,
      });

      setShowAddModal(false);
      setCost('');
      setGarageName('');
      setNotes('');
      loadMaintenance();
    } catch (err: any) {
      alert(err.message || 'Failed to save maintenance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            <span>Vehicle Maintenance & Service (सर्विस और रिपेयर)</span>
          </h1>
          <p className="text-xs text-slate-500">Track oil changes, garage repairs and maintenance bills</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Service</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-900 uppercase">Total Maintenance Spend</span>
          <p className="text-xl sm:text-2xl font-black text-amber-900 mt-0.5">
            {formatINR(totalCost)}
          </p>
        </div>
        <div className="text-right text-xs text-amber-800 font-semibold">
          {logs.length} Service Logs
        </div>
      </div>

      {/* Maintenance List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading service logs...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">No maintenance records yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Record First Service
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
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0 mt-0.5">
                  🔧
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-sm">
                      {log.service_type}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatDate(log.service_date)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-0.5">
                    🚚 {log.vehicle_number} {log.garage_name ? `• Garage: ${log.garage_name}` : ''}
                  </p>

                  {log.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-slate-900 text-sm sm:text-base block">
                  {formatINR(log.cost)}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Record Service & Repair</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle *</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Done *</label>
                <input
                  type="text"
                  placeholder="e.g. Oil Change, Brake Shoe, Clutch plate"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost (₹) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 text-sm font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Garage / Mechanic</label>
                <input
                  type="text"
                  placeholder="e.g. Sri Balaji Motors"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
              >
                {saving ? 'Saving...' : 'Save Maintenance'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
