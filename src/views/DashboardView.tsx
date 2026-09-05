import React from 'react';
import {
  TrendingUp,
  Fuel,
  Receipt,
  Truck,
  IndianRupee,
  Clock,
  AlertTriangle,
  PlusCircle,
  Share2,
  Users,
  CreditCard,
  FileText,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
} from 'lucide-react';
import { Language, translations } from '../translations';
import { User, Vehicle } from '../types';
import { formatINR, formatDate } from '../api';

interface Props {
  data: any;
  user: User | null;
  lang: Language;
  onOpenAddHisaab: () => void;
  onOpenAddFuel: () => void;
  onOpenAddExpense: () => void;
  onOpenReceivePayment: () => void;
  onOpenCreateBill: () => void;
  onOpenWhatsAppShare: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  data,
  user,
  lang,
  onOpenAddHisaab,
  onOpenAddFuel,
  onOpenAddExpense,
  onOpenReceivePayment,
  onOpenCreateBill,
  onOpenWhatsAppShare,
  onNavigateTab,
}) => {
  const t = translations[lang];

  const today = data?.today || {
    trips: 0,
    income: 0,
    expenses: 0,
    diesel: 0,
    otherExpenses: 0,
    netIncome: 0,
    pendingToday: 0,
  };

  const totalPending = data?.totalPending || 0;
  const recentTrips = data?.recentTrips || [];
  const reminders = data?.reminders || [];
  const fleet = data?.fleet || { vehicles: 0, drivers: 0 };

  const isDriver = user?.role === 'driver';

  // Greeting based on time
  const currentHour = new Date().getHours();
  let greeting = t.greetingMorning;
  if (currentHour >= 12 && currentHour < 17) {
    greeting = t.greetingAfternoon;
  } else if (currentHour >= 17) {
    greeting = t.greetingEvening;
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 min-w-0 w-full">
      {/* Top Banner & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1A1A1A] p-3.5 sm:p-5 rounded-2xl text-white shadow-xs border border-[#2C2C2A] min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[#FF8C00] font-black uppercase tracking-wider text-[11px] sm:text-xs">
              {formatDate(data?.date || new Date().toISOString().split('T')[0])}
            </span>
            <span className="text-[#70706B]">•</span>
            <span className="text-[#A0A09B] text-[11px] sm:text-xs font-semibold">
              {fleet.vehicles} Vehicles Active
            </span>
          </div>
          <h1 className="text-base sm:text-xl font-black mt-0.5 text-white truncate">
            {greeting}, {user?.name?.split(' ')[0] || 'Transport Hero'}!
          </h1>
          <p className="text-xs text-[#A0A09B] mt-0.5 line-clamp-2 sm:line-clamp-1">
            {isDriver
              ? 'Enter daily trips, fuel bills and expenses in your diary.'
              : 'Real-time financial summary for your vehicles and trips.'}
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="flex items-center space-x-2 pt-1 sm:pt-0 shrink-0">
          <button
            onClick={onOpenWhatsAppShare}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition active:scale-95 shrink-0"
            title="Share Today's Hisaab on WhatsApp"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={onOpenAddHisaab}
            className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#FF8C00] hover:bg-[#E67E00] text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 sm:space-x-2 shadow-xs transition active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-white shrink-0" />
            <span>{t.addHisaab}</span>
          </button>
        </div>
      </div>

      {/* Expiry & Urgent Reminders Banner */}
      {reminders.length > 0 && (
        <div className="bg-[#FFF9F2] border border-[#FDE68A] p-3 sm:p-4 rounded-2xl space-y-2.5 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-[#1A1A1A]">
              <AlertTriangle className="w-4 h-4 text-[#FF8C00] shrink-0" />
              Document Reminders ({reminders.length})
            </span>
            <button
              onClick={() => onNavigateTab('documents')}
              className="text-[11px] font-bold text-[#FF8C00] hover:underline shrink-0"
            >
              View All
            </button>
          </div>
          {reminders.slice(0, 2).map((r: any) => (
            <div
              key={r.id}
              onClick={() => onNavigateTab('documents')}
              className="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-xl border border-[#FDE68A] shadow-xs cursor-pointer hover:bg-[#FFFDF9] transition text-xs min-w-0 gap-2"
            >
              <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                <span className="text-base sm:text-lg shrink-0">⚠️</span>
                <div className="min-w-0">
                  <span className="font-bold text-[#1A1A1A] block truncate">{r.title}</span>
                  <p className="text-[#70706B] text-[11px] truncate">{r.message}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateTab('documents');
                }}
                className="text-[10px] bg-[#1A1A1A] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold hover:bg-[#333] transition shrink-0"
              >
                Renew
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TODAY'S HISAAB STATS GRID (Hero Numbers matching Natural Tones) */}
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black text-[#70706B] uppercase tracking-wider flex items-center space-x-1.5">
            <span>{t.todayHisaab}</span>
          </h2>
          <button
            onClick={() => onNavigateTab('hisaab')}
            className="text-xs font-bold text-[#FF8C00] hover:text-[#E67E00] flex items-center space-x-0.5"
          >
            <span>{t.viewHisaab}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: Gross Income */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E5E5DF] shadow-xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#70706B] truncate">{t.income}</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#059669] mt-1 truncate">
              {formatINR(today.income)}
            </p>
            <div className="mt-1.5 sm:mt-2 h-1 bg-[#ECFDF5] rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] w-3/4 rounded-full" />
            </div>
            <p className="text-[10px] text-[#70706B] mt-1 sm:mt-1.5 font-semibold truncate">
              {today.trips} {t.trips} today
            </p>
          </div>

          {/* Card 2: Diesel Expense */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E5E5DF] shadow-xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#70706B] truncate">{t.diesel}</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#4B5563] mt-1 truncate">
              {formatINR(today.diesel)}
            </p>
            <div className="mt-1.5 sm:mt-2 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className="h-full bg-[#6B7280] w-2/3 rounded-full" />
            </div>
            <p className="text-[10px] text-[#70706B] mt-1 sm:mt-1.5 font-semibold truncate">
              Fuel & Gas spend
            </p>
          </div>

          {/* Card 3: Other Expenses */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E5E5DF] shadow-xs min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#70706B] truncate">{t.expenses}</span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#DC2626] mt-1 truncate">
              {formatINR(today.expenses)}
            </p>
            <div className="mt-1.5 sm:mt-2 h-1 bg-[#FEF2F2] rounded-full overflow-hidden">
              <div className="h-full bg-[#EF4444] w-1/2 rounded-full" />
            </div>
            <p className="text-[10px] text-[#70706B] mt-1 sm:mt-1.5 font-semibold truncate">
              Toll, food, maintenance
            </p>
          </div>

          {/* Card 4: Net Income (Profit) */}
          <div className="bg-[#1A1A1A] p-3 sm:p-4 rounded-2xl text-white shadow-xs border border-[#2C2C2A] min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60 text-white truncate">
                {t.netIncome}
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#2C2C2A] text-[#FF8C00] flex items-center justify-center shrink-0">
                <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#FF8C00] mt-1 truncate">
              {formatINR(today.netIncome)}
            </p>
            <div className="mt-1.5 sm:mt-2 h-1 bg-[#2C2C2A] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF8C00] w-full rounded-full" />
            </div>
            <p className="text-[10px] text-white opacity-60 mt-1 sm:mt-1.5 font-semibold truncate">
              Udhaar: {formatINR(totalPending)}
            </p>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR (1-Tap Buttons matching Natural Tones) */}
      <div className="min-w-0">
        <h2 className="text-xs font-black text-[#70706B] uppercase tracking-wider mb-2">
          {t.quickActions}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
          <button
            onClick={onOpenAddHisaab}
            className="bg-white border-2 border-[#E5E5DF] hover:border-[#FF8C00] rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-3.5 transition-all group shadow-xs cursor-pointer min-w-0"
          >
            <div className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform">
              🚚
            </div>
            <p className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate w-full text-center">{t.newTrip}</p>
            <p className="text-[10px] text-[#70706B] truncate w-full text-center">Enter trip hisaab</p>
          </button>

          <button
            onClick={onOpenAddFuel}
            className="bg-white border-2 border-[#E5E5DF] hover:border-[#FF8C00] rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-3.5 transition-all group shadow-xs cursor-pointer min-w-0"
          >
            <div className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform">
              ⛽
            </div>
            <p className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate w-full text-center">{t.addDiesel}</p>
            <p className="text-[10px] text-[#70706B] truncate w-full text-center">Liters & slip</p>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="bg-white border-2 border-[#E5E5DF] hover:border-[#FF8C00] rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-3.5 transition-all group shadow-xs cursor-pointer min-w-0"
          >
            <div className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform">
              💸
            </div>
            <p className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate w-full text-center">{t.addExpense}</p>
            <p className="text-[10px] text-[#70706B] truncate w-full text-center">Toll, police, food</p>
          </button>

          <button
            onClick={onOpenReceivePayment}
            className="bg-white border-2 border-[#E5E5DF] hover:border-[#FF8C00] rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-3.5 transition-all group shadow-xs cursor-pointer min-w-0"
          >
            <div className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform">
              💰
            </div>
            <p className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate w-full text-center">{t.receivePayment}</p>
            <p className="text-[10px] text-[#70706B] truncate w-full text-center">Clear party udhaar</p>
          </button>

          <button
            onClick={onOpenCreateBill}
            className="bg-white border-2 border-[#E5E5DF] hover:border-[#FF8C00] rounded-2xl flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-3.5 transition-all group shadow-xs cursor-pointer min-w-0 col-span-2 sm:col-span-1"
          >
            <div className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform">
              🧾
            </div>
            <p className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate w-full text-center">{t.createBill}</p>
            <p className="text-[10px] text-[#70706B] truncate w-full text-center">Transport bilty</p>
          </button>
        </div>
      </div>

      {/* TODAY'S TRIPS & RECENT ACTIVITY */}
      <div className="bg-white border border-[#E5E5DF] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E5DF] flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A]">
            {t.recentTrips}
          </h2>
          <button
            onClick={() => onNavigateTab('trips')}
            className="text-[10px] font-bold text-[#FF8C00] hover:underline flex items-center space-x-0.5"
          >
            <span>{t.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTrips.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3E0] text-[#FF8C00] flex items-center justify-center mx-auto text-xl">
              🚚
            </div>
            <p className="font-bold text-[#1A1A1A] text-sm">{t.noDataFound}</p>
            <p className="text-xs text-[#70706B] max-w-xs mx-auto">
              You have not entered any trips for today yet. Tap the button below to start your hisaab.
            </p>
            <button
              onClick={onOpenAddHisaab}
              className="px-4 py-2 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-xs rounded-xl shadow-xs transition"
            >
              {t.addHisaab}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F5F0]">
            {recentTrips.map((trip: any) => {
              const isPaid = trip.payment_status === 'paid';
              const isPartial = trip.payment_status === 'partial';

              return (
                <div
                  key={trip.id}
                  className="p-3 sm:p-3.5 hover:bg-[#F9F9F6] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 cursor-pointer min-w-0"
                  onClick={() => onNavigateTab('trips')}
                >
                  <div className="flex items-start space-x-2.5 sm:space-x-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border border-[#E5E5DF]">
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                        <span className="font-black text-[#1A1A1A] text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                          {trip.pickup_location}
                        </span>
                        <span className="text-[#A0A09B] text-xs shrink-0">➔</span>
                        <span className="font-black text-[#1A1A1A] text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                          {trip.drop_location}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-[11px] text-[#70706B]">
                        <span className="font-bold text-[#1A1A1A]">
                          {trip.vehicle_number}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[100px]">{trip.customer_name || 'Direct Party'}</span>
                        <span>•</span>
                        <span>{trip.goods_type || 'Goods'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Financials & Status Pill */}
                  <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#F5F5F0] shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="font-black text-[#1A1A1A] text-xs sm:text-base block">
                        {formatINR(trip.gross_income)}
                      </span>
                      <span className="text-[10px] text-[#70706B]">
                        Diesel: {formatINR(trip.diesel_cost)} | Net: {formatINR(trip.net_income)}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isPartial
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isPaid ? t.paid : isPartial ? `${t.partial}` : t.pending}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
