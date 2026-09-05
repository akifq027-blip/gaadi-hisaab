import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, Filter, FileText, Share2, Trash2, IndianRupee, MapPin } from 'lucide-react';
import { Language, translations } from '../translations';
import { Trip, Vehicle } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  onOpenAddHisaab: () => void;
  onOpenBillModal: (trip: Trip) => void;
  vehicles: Vehicle[];
}

export const TripsView: React.FC<Props> = ({
  lang,
  onOpenAddHisaab,
  onOpenBillModal,
  vehicles,
}) => {
  const t = translations[lang];
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  useEffect(() => {
    loadTrips();
  }, [statusFilter, vehicleFilter]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (vehicleFilter !== 'all') params.vehicleId = vehicleFilter;
      const data = await api.getTrips(params);
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip hisaab record?')) return;
    try {
      await api.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip');
    }
  };

  const handleShareWhatsApp = (trip: Trip) => {
    const text = `*🚚 GAADI HISAAB - TRIP DETAILS*
------------------------------
*Trip No:* ${trip.trip_number}
*Date:* ${formatDate(trip.date)}
*Route:* ${trip.pickup_location} ➔ ${trip.drop_location}
*Vehicle:* ${trip.vehicle_number}
*Goods:* ${trip.goods_type}
*Party:* ${trip.customer_name || 'Direct'}
------------------------------
*Gross Freight:* ${formatINR(trip.gross_income)}
*Diesel:* ${formatINR(trip.diesel_cost)}
*Tolls & Exp:* ${formatINR(Number(trip.toll_cost) + Number(trip.parking_cost) + Number(trip.other_expenses))}
🟢 *Net Earnings:* ${formatINR(trip.net_income)}
------------------------------
*Paid:* ${formatINR(trip.paid_amount)}
*Balance Due:* ${formatINR(trip.pending_amount)}
*Status:* ${trip.payment_status.toUpperCase()}
------------------------------
_Hisaab, Trip aur Gaadi — Sab Ek Jagah_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Local text search filter
  const filteredTrips = trips.filter((tr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tr.trip_number?.toLowerCase().includes(q) ||
      tr.pickup_location?.toLowerCase().includes(q) ||
      tr.drop_location?.toLowerCase().includes(q) ||
      tr.customer_name?.toLowerCase().includes(q) ||
      tr.vehicle_number?.toLowerCase().includes(q) ||
      tr.goods_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>Trips & Loads ({trips.length})</span>
          </h1>
          <p className="text-xs text-slate-500">Full history of commercial vehicle trips and freight</p>
        </div>

        <button
          onClick={onOpenAddHisaab}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newTrip}</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by pickup, drop, party, or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl font-semibold">
            {['all', 'paid', 'partial', 'pending'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize transition text-[11px] ${
                  statusFilter === st
                    ? 'bg-white text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Vehicle Dropdown Filter */}
          {vehicles.length > 0 && (
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-slate-100 px-2.5 py-1.5 rounded-xl font-semibold text-slate-800 text-[11px] outline-none"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Trips List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading trips log...</div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">{t.noDataFound}</p>
          <p className="text-xs text-slate-500">No trips matched your active filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const isPaid = trip.payment_status === 'paid';
            const isPartial = trip.payment_status === 'partial';

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition space-y-3"
              >
                {/* Trip Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wide">
                        {trip.trip_number}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-600">
                        {formatDate(trip.date)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm sm:text-base font-black text-slate-900 mt-0.5">
                      <span>{trip.pickup_location}</span>
                      <span className="text-slate-400">➔</span>
                      <span>{trip.drop_location}</span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : isPartial
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {trip.payment_status}
                  </span>
                </div>

                {/* Badges & Meta */}
                <div className="flex flex-wrap gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <span className="font-semibold text-slate-800">
                    🚚 {trip.vehicle_number}
                  </span>
                  <span>•</span>
                  <span>👤 Party: {trip.customer_name || 'Direct Customer'}</span>
                  <span>•</span>
                  <span>📦 {trip.goods_type}</span>
                  {trip.total_km > 0 && (
                    <>
                      <span>•</span>
                      <span>📏 {trip.total_km} KM</span>
                    </>
                  )}
                </div>

                {/* Financials Grid */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Gross Income</span>
                    <span className="font-black text-slate-900">{formatINR(trip.gross_income)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Diesel</span>
                    <span className="font-bold text-amber-700">{formatINR(trip.diesel_cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Net Profit</span>
                    <span className={`font-black ${trip.net_income >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatINR(trip.net_income)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Pending</span>
                    <span className={`font-bold ${trip.pending_amount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {formatINR(trip.pending_amount)}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onOpenBillModal(trip)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center space-x-1 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Bill / Receipt</span>
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(trip)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center space-x-1 transition"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
