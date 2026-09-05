import React, { useState, useEffect } from 'react';
import { Search, X, Truck, User, Users, FileText, ArrowRight } from 'lucide-react';
import { api, formatINR } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip?: (tripId: string) => void;
  onSelectCustomer?: (customerId: string) => void;
}

export const SearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectTrip,
  onSelectCustomer,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ customers: [], vehicles: [], drivers: [], trips: [], bills: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ customers: [], vehicles: [], drivers: [], trips: [], bills: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.customers.length +
    results.vehicles.length +
    results.drivers.length +
    results.trips.length +
    results.bills.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-20">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            id="global-search-input"
            name="search"
            type="text"
            autoFocus
            placeholder="Search vehicles, drivers, parties, trips, bills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-900 px-2 py-1">
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-3">
          {loading && (
            <div className="py-6 text-center text-xs text-slate-400">Searching transport records...</div>
          )}

          {!loading && query.length >= 2 && totalResults === 0 && (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching records found for "{query}"
            </div>
          )}

          {/* Vehicles */}
          {results.vehicles.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Vehicles
              </p>
              {results.vehicles.map((v: any) => (
                <div key={v.id} className="p-2 hover:bg-amber-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-bold text-slate-900">{v.vehicle_number}</p>
                      <p className="text-[10px] text-slate-500">{v.vehicle_type}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium">
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Parties / Customers
              </p>
              {results.customers.map((c: any) => (
                <div key={c.id} className="p-2 hover:bg-amber-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.phone || c.city || 'Party'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drivers */}
          {results.drivers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Drivers
              </p>
              {results.drivers.map((d: any) => (
                <div key={d.id} className="p-2 hover:bg-amber-50 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-bold text-slate-900">{d.name}</p>
                      <p className="text-[10px] text-slate-500">{d.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trips */}
          {results.trips.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Trips
              </p>
              {results.trips.map((t: any) => (
                <div key={t.id} className="p-2 hover:bg-amber-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {t.pickup_location} ➔ {t.drop_location}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {t.trip_number} • {t.date}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-700">{formatINR(t.gross_income)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
