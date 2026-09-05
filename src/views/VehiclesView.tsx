import React, { useState, useEffect } from 'react';
import { Truck, Plus, X, Fuel, Wrench, IndianRupee, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Language, translations } from '../translations';
import { Vehicle, Driver } from '../types';
import { api, formatINR } from '../api';

interface Props {
  lang: Language;
  onOpenAddHisaab: () => void;
  onOpenAddFuel: () => void;
  drivers: Driver[];
}

export const VehiclesView: React.FC<Props> = ({
  lang,
  onOpenAddHisaab,
  onOpenAddFuel,
  drivers,
}) => {
  const t = translations[lang];
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Vehicle state
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Tata Ace');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('diesel');
  const [driverId, setDriverId] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!vehicleNumber.trim()) {
      setError('Please enter a vehicle number');
      return;
    }

    try {
      setSaving(true);
      await api.addVehicle({
        vehicle_number: vehicleNumber.toUpperCase().trim(),
        vehicle_type: vehicleType,
        brand_model: model,
        assigned_driver_id: driverId || null,
        current_km: parseFloat(currentKm) || 0,
      });

      setShowAddModal(false);
      setVehicleNumber('');
      setModel('');
      setCurrentKm('');
      loadVehicles();
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>Vehicles & Fleet (गाड़ियाँ - {vehicles.length})</span>
          </h1>
          <p className="text-xs text-slate-500">Track profit, mileage, maintenance and drivers per vehicle</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">No vehicles added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const netProfit =
              Number(v.total_revenue || 0) -
              Number(v.total_fuel_cost || 0) -
              Number(v.total_maintenance_cost || 0);

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition space-y-3.5"
              >
                {/* Vehicle Title & Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-lg">
                      🚚
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base tracking-tight">
                        {v.vehicle_number}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {v.vehicle_type} {v.model ? `• ${v.model}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      v.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                {/* Driver & Odometer info */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl text-slate-700">
                  <span>
                    👤 Driver: <strong className="text-slate-900">{v.driver_name || 'Unassigned'}</strong>
                  </span>
                  <span>
                    📏 ODO: <strong>{Number(v.current_odometer_km || 0).toLocaleString('en-IN')} KM</strong>
                  </span>
                </div>

                {/* Financial Performance */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs pt-1">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Revenue</span>
                    <span className="font-bold text-slate-900">{formatINR(v.total_revenue || 0)}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Diesel</span>
                    <span className="font-bold text-amber-700">{formatINR(v.total_fuel_cost || 0)}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Service</span>
                    <span className="font-bold text-slate-600">{formatINR(v.total_maintenance_cost || 0)}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase block">Net Profit</span>
                    <span className={`font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatINR(netProfit)}
                    </span>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 text-xs">
                  <button
                    onClick={onOpenAddHisaab}
                    className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-center"
                  >
                    + Trip Hisaab
                  </button>
                  <button
                    onClick={onOpenAddFuel}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-center"
                  >
                    + Diesel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Vehicle (गाड़ी जोड़ें)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="mt-4 space-y-3">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle Number (नंबर प्लेट) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AP29TX4490"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-black uppercase text-slate-900 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="Tata Ace">Tata Ace (छोटा हाथी)</option>
                    <option value="Bolero Pickup">Bolero Pickup</option>
                    <option value="DCM 14ft">DCM 14ft</option>
                    <option value="Eicher 17ft">Eicher 17ft</option>
                    <option value="Tata 407">Tata 407</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="diesel">Diesel (डीजल)</option>
                    <option value="cng">CNG</option>
                    <option value="petrol">Petrol</option>
                    <option value="ev">Electric / EV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                >
                  <option value="">-- No Driver (Self / Unassigned) --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Odometer KM</label>
                <input
                  type="number"
                  placeholder="e.g. 35000"
                  value={currentKm}
                  onChange={(e) => setCurrentKm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
              >
                {saving ? 'Saving...' : 'Add Vehicle Now'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
