import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Share2, Plus, Fuel, IndianRupee, Truck } from 'lucide-react';
import { Language, translations } from '../translations';
import { api, formatINR, formatDate } from '../api';
import { DaySummary, Trip } from '../types';

interface Props {
  lang: Language;
  onOpenAddHisaab: () => void;
  onSelectTrip?: (trip: Trip) => void;
}

export const HisaabDiaryView: React.FC<Props> = ({
  lang,
  onOpenAddHisaab,
  onSelectTrip,
}) => {
  const t = translations[lang];
  const [days, setDays] = useState<DaySummary[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [calendarData, tripsData] = await Promise.all([
        api.getHisaabCalendar(),
        api.getTrips(),
      ]);
      setDays(calendarData);
      setAllTrips(tripsData);
      if (calendarData.length > 0) {
        setExpandedDate(calendarData[0].date);
      }
    } catch (err) {
      console.error('Failed to load hisaab diary:', err);
    } finally {
      setLoading(false);
    }
  };

  const shareDayWhatsApp = (day: DaySummary) => {
    const dayTrips = allTrips.filter((t) => t.date === day.date);
    const text = `*🚚 GAADI HISAAB - ${formatDate(day.date)}*
------------------------------
*Total Trips:* ${day.trips_count}
*Gross Income:* ${formatINR(day.income)}
*Diesel:* ${formatINR(day.diesel)}
*Other Expenses:* ${formatINR(day.other_expenses)}
------------------------------
🟢 *NET PROFIT:* ${formatINR(day.net)}
🟡 *BALANCE PENDING:* ${formatINR(day.pending)}
------------------------------
*Trips Log:*
${dayTrips.map((t, idx) => `${idx + 1}. ${t.pickup_location} ➔ ${t.drop_location} | ${formatINR(t.gross_income)} (${t.payment_status.toUpperCase()})`).join('\n')}
------------------------------
_Hisaab, Trip aur Gaadi — Sab Ek Jagah_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span>Transport Hisaab Diary (डायरी)</span>
          </h1>
          <p className="text-xs text-slate-500">Day-by-day record of trips, earnings and expenses</p>
        </div>

        <button
          onClick={onOpenAddHisaab}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addHisaab}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading daily hisaab logs...</div>
      ) : days.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">{t.noDataFound}</p>
          <p className="text-xs text-slate-500">Start entering your daily trips to see your hisaab diary.</p>
          <button
            onClick={onOpenAddHisaab}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            {t.addHisaab}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const isExpanded = expandedDate === day.date;
            const dayTrips = allTrips.filter((t) => t.date === day.date);

            return (
              <div
                key={day.date}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
              >
                {/* Day Summary Card Header */}
                <div
                  onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                  className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between gap-2 select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex flex-col items-center justify-center font-bold text-center shrink-0">
                      <span className="text-[10px] uppercase font-extrabold leading-none text-amber-900">
                        {new Date(day.date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black leading-tight">
                        {day.date.split('-')[2]}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {formatDate(day.date)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {day.trips_count} {t.trips}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 mt-1 text-[11px]">
                        <span className="font-semibold text-emerald-700">
                          Gross: {formatINR(day.income)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-slate-600">
                          Exp: {formatINR(day.expense)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side Net Profit and Expand */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Net Profit
                      </span>
                      <span
                        className={`text-sm sm:text-base font-black ${
                          day.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatINR(day.net)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareDayWhatsApp(day);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Share this day on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <ChevronRight
                        className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Day Detail List */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-4 border-t border-slate-100 space-y-2.5">
                    {/* Day Financial Stats Micro-bar */}
                    <div className="grid grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Income</span>
                        <span className="font-bold text-slate-800">{formatINR(day.income)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Diesel</span>
                        <span className="font-bold text-amber-700">{formatINR(day.diesel)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Other Exp</span>
                        <span className="font-bold text-slate-600">{formatINR(day.other_expenses)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Pending</span>
                        <span className="font-bold text-rose-600">{formatINR(day.pending)}</span>
                      </div>
                    </div>

                    {/* Individual Trips for this date */}
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-1 pt-1">
                      Trips on this date ({dayTrips.length})
                    </p>

                    <div className="space-y-2">
                      {dayTrips.map((trip) => (
                        <div
                          key={trip.id}
                          onClick={() => onSelectTrip && onSelectTrip(trip)}
                          className="bg-white p-3 rounded-xl border border-slate-200 hover:border-amber-300 transition flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center space-x-2 text-xs font-black text-slate-900">
                              <span>{trip.pickup_location}</span>
                              <span className="text-slate-400">➔</span>
                              <span>{trip.drop_location}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                              <span>{trip.vehicle_number}</span>
                              <span>•</span>
                              <span>{trip.customer_name || 'Party'}</span>
                              <span>•</span>
                              <span>{trip.goods_type}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-slate-900 text-xs sm:text-sm block">
                              {formatINR(trip.gross_income)}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                trip.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : trip.payment_status === 'partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {trip.payment_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
