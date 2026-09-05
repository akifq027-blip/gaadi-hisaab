import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Language, translations } from '../translations';
import { Vehicle } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  vehicles: Vehicle[];
}

export const ReportsView: React.FC<Props> = ({ lang, vehicles }) => {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    summary: any;
    vehicles: any[];
    customers: any[];
    monthlyTrends: any[];
    dailyPnl: any[];
  } | null>(null);

  useEffect(() => {
    loadReports();
  }, [range]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getReports(range);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter daily rows by vehicle if selected
  const dailyRows = (reportData?.dailyPnl || []).filter((row) => {
    if (selectedVehicle === 'all') return true;
    return row.vehicle_number === selectedVehicle;
  });

  // Calculate dynamic totals from filtered dailyRows if vehicle filter is applied
  const filteredRevenue = dailyRows.reduce((sum, r) => sum + Number(r.gross_income || 0), 0);
  const filteredDiesel = dailyRows.reduce((sum, r) => sum + Number(r.diesel_cost || 0), 0);
  const filteredOtherExp = dailyRows.reduce((sum, r) => sum + Number(r.other_total || 0), 0);
  const filteredTotalExp = filteredDiesel + filteredOtherExp;
  const filteredNetProfit = filteredRevenue - filteredTotalExp;
  const profitMargin = filteredRevenue > 0 ? ((filteredNetProfit / filteredRevenue) * 100).toFixed(1) : '0';

  // Export Daily P&L to Excel (.CSV with UTF-8 BOM)
  const handleExportExcel = () => {
    if (dailyRows.length === 0) {
      alert('No trip or P&L data available to export.');
      return;
    }

    const headers = [
      'Date',
      'Trip/LR No',
      'Vehicle No',
      'Driver Name',
      'Customer/Party',
      'Route (From -> To)',
      'Goods Type',
      'Total KM',
      'Gross Freight (INR)',
      'Diesel Cost (INR)',
      'Toll/Parking/Other Exp (INR)',
      'Total Trip Expense (INR)',
      'Net Profit (INR)',
      'Amount Received (INR)',
      'Pending Balance (INR)',
      'Payment Status',
    ];

    const rows = dailyRows.map((r) => [
      `"${r.date}"`,
      `"${r.trip_number || 'TRIP'}"`,
      `"${r.vehicle_number || ''}"`,
      `"${r.driver_name || ''}"`,
      `"${r.customer_name || 'Direct Party'}"`,
      `"${r.pickup_location || ''} to ${r.drop_location || ''}"`,
      `"${r.goods_type || ''}"`,
      r.total_km || 0,
      r.gross_income || 0,
      r.diesel_cost || 0,
      r.other_total || 0,
      r.total_expenses || 0,
      r.net_profit || 0,
      r.paid_amount || 0,
      r.pending_amount || 0,
      `"${r.payment_status || 'paid'}"`,
    ]);

    // Summary Totals Row
    const totalsRow = [
      '"TOTAL"',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      '""',
      filteredRevenue,
      filteredDiesel,
      filteredOtherExp,
      filteredTotalExp,
      filteredNetProfit,
      '""',
      '""',
      `"Profit Margin: ${profitMargin}%"`,
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(',')), totalsRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Gaadi_Hisaab_Daily_PNL_${range}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print / Save as PDF
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#1A1A1A] flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#FF8C00]" />
            <span>
              {lang === 'hi'
                ? 'दैनिक लाभ व हानि रिपोर्ट (Daily Profit & Loss Report)'
                : 'Daily Profit & Loss (P&L) Report'}
            </span>
          </h1>
          <p className="text-xs text-[#70706B]">
            {lang === 'hi'
              ? 'गाड़ीवार भाड़ा आय, डीजल, टोल, चालक खर्च एवं शुद्ध बचत — एक्सेल/PDF में डाउनलोड करें'
              : 'Trip revenue, diesel, toll, operational expenses, and net margins exportable to Excel & PDF'}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto no-print">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export to Excel (.CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#FF8C00]" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (No print) */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5DF] flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Period Selector */}
        <div className="flex items-center space-x-1 bg-[#F5F5F0] p-1 rounded-xl border border-[#E5E5DF]">
          {[
            { id: 'today', labelEn: 'Today (आज)', labelHi: 'आज' },
            { id: 'week', labelEn: 'Last 7 Days', labelHi: '7 दिन' },
            { id: 'month', labelEn: 'This Month', labelHi: 'इस महीने' },
            { id: 'all', labelEn: 'All Trips', labelHi: 'सम्पूर्ण' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRange(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                range === tab.id
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#70706B] hover:text-[#1A1A1A]'
              }`}
            >
              {lang === 'hi' ? tab.labelHi : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Vehicle Filter */}
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-[#70706B]" />
          <span className="text-xs font-bold text-[#70706B]">Vehicle:</span>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1A1A1A] outline-none"
          >
            <option value="all">All Fleet Trucks (सभी गाड़ियां)</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.vehicle_number}>
                {v.vehicle_number} ({v.vehicle_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRINTABLE REPORT CONTAINER */}
      <div className="space-y-4 printable-area">
        {/* Printable Business Header */}
        <div className="border-b-2 border-[#1A1A1A] pb-3 hidden print:block">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase text-[#1A1A1A]">SINGH ROADLINES & LOGISTICS</h1>
              <p className="text-xs text-[#50504B]">Transport Nagar, Autonagar, Hyderabad • Ph: 9876543210</p>
              <p className="text-xs font-bold text-[#1A1A1A] mt-1">
                DAILY PROFIT & LOSS STATEMENT ({range.toUpperCase()} - {formatDate(new Date().toISOString())})
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold">Vehicle Filter:</span> {selectedVehicle === 'all' ? 'All Fleet' : selectedVehicle}
            </div>
          </div>
        </div>

        {/* 4 Core Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Revenue */}
          <div className="bg-white p-4 rounded-3xl border border-[#E5E5DF] shadow-xs">
            <div className="flex items-center justify-between text-[#70706B] text-[10px] font-black uppercase tracking-wider">
              <span>Gross Freight Income</span>
              <TrendingUp className="w-4 h-4 text-[#059669]" />
            </div>
            <p className="text-2xl font-black text-[#059669] mt-1">{formatINR(filteredRevenue)}</p>
            <p className="text-[11px] text-[#70706B] mt-0.5">
              From {dailyRows.length} completed trips
            </p>
          </div>

          {/* Diesel Expenses */}
          <div className="bg-white p-4 rounded-3xl border border-[#E5E5DF] shadow-xs">
            <div className="flex items-center justify-between text-[#70706B] text-[10px] font-black uppercase tracking-wider">
              <span>Diesel & Fuel Cost</span>
              <Fuel className="w-4 h-4 text-[#4B5563]" />
            </div>
            <p className="text-2xl font-black text-[#4B5563] mt-1">{formatINR(filteredDiesel)}</p>
            <p className="text-[11px] text-[#70706B] mt-0.5">
              {filteredRevenue > 0 ? `${((filteredDiesel / filteredRevenue) * 100).toFixed(1)}% of total freight` : '0% of freight'}
            </p>
          </div>

          {/* Toll & Other Expenses */}
          <div className="bg-white p-4 rounded-3xl border border-[#E5E5DF] shadow-xs">
            <div className="flex items-center justify-between text-[#70706B] text-[10px] font-black uppercase tracking-wider">
              <span>Toll, Police & Maintenance</span>
              <span className="text-xs">🛣️</span>
            </div>
            <p className="text-2xl font-black text-[#70706B] mt-1">{formatINR(filteredOtherExp)}</p>
            <p className="text-[11px] text-[#70706B] mt-0.5">Fastag, driver bata & misc</p>
          </div>

          {/* Net Clean Profit */}
          <div className="bg-[#1A1A1A] p-4 rounded-3xl text-white shadow-xs border border-[#2C2C2A]">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#FF8C00]">
              <span>Net Clean Profit (शुद्ध लाभ)</span>
              <span className="bg-[#FF8C00]/20 text-[#FF8C00] px-2 py-0.5 rounded-full font-mono font-black">
                {profitMargin}% Margin
              </span>
            </div>
            <p className="text-2xl font-black text-[#FF8C00] mt-1">{formatINR(filteredNetProfit)}</p>
            <p className="text-[11px] text-[#A0A09B] mt-0.5">Net cash saving in transport khata</p>
          </div>
        </div>

        {/* DETAILED DAILY PROFIT & LOSS BREAKDOWN TABLE */}
        <div className="bg-white rounded-3xl border border-[#E5E5DF] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <h3 className="font-black text-sm text-[#1A1A1A] uppercase tracking-wide">
                Day-by-Day Itemized Profit & Loss Ledger (दैनिक हिसाब-किताब)
              </h3>
            </div>
            <span className="text-xs text-[#70706B] font-semibold">
              {dailyRows.length} Days / Trips Logged
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#70706B]">Calculating financial accounts...</div>
          ) : dailyRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#70706B]">
              No trip or expense records found for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F6] text-[#70706B] font-bold border-b border-[#E5E5DF]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Vehicle & Driver</th>
                    <th className="p-2.5">Route & Party</th>
                    <th className="p-2.5 text-right">Freight Income</th>
                    <th className="p-2.5 text-right">Diesel</th>
                    <th className="p-2.5 text-right">Toll & Other</th>
                    <th className="p-2.5 text-right font-black">Net Profit</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5DF]">
                  {dailyRows.map((r, i) => {
                    const rowNet = Number(r.net_profit || 0);
                    return (
                      <tr key={r.id || i} className="hover:bg-[#F9F9F6]/60">
                        <td className="p-2.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                          {formatDate(r.date)}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-[#1A1A1A] block">
                            {r.vehicle_number}
                          </span>
                          <span className="text-[11px] text-[#70706B]">
                            {r.driver_name || 'Driver'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="font-semibold text-[#1A1A1A] block">
                            {r.pickup_location} ➔ {r.drop_location}
                          </span>
                          <span className="text-[11px] text-[#70706B]">
                            {r.customer_name || 'Direct Party'} {r.goods_type ? `• ${r.goods_type}` : ''}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold text-[#059669] whitespace-nowrap">
                          {formatINR(r.gross_income)}
                        </td>
                        <td className="p-2.5 text-right text-[#4B5563] font-semibold whitespace-nowrap">
                          {formatINR(r.diesel_cost)}
                        </td>
                        <td className="p-2.5 text-right text-[#70706B] font-semibold whitespace-nowrap">
                          {formatINR(r.other_total)}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <span className={`font-black ${rowNet >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                            {formatINR(rowNet)}
                          </span>
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              r.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {r.payment_status || 'paid'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* SUMMARY TOTAL ROW */}
                  <tr className="bg-[#F5F5F0] font-black text-sm text-[#1A1A1A] border-t-2 border-[#1A1A1A]">
                    <td colSpan={3} className="p-3 uppercase tracking-wider">
                      TOTAL SUMMARY ({dailyRows.length} TRIPS)
                    </td>
                    <td className="p-3 text-right text-[#059669] font-mono">
                      {formatINR(filteredRevenue)}
                    </td>
                    <td className="p-3 text-right text-[#4B5563] font-mono">
                      {formatINR(filteredDiesel)}
                    </td>
                    <td className="p-3 text-right text-[#70706B] font-mono">
                      {formatINR(filteredOtherExp)}
                    </td>
                    <td className="p-3 text-right text-[#FF8C00] font-mono text-base">
                      {formatINR(filteredNetProfit)}
                    </td>
                    <td className="p-3 text-center text-xs font-mono font-black text-[#059669]">
                      {profitMargin}% Margin
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Print Signatures */}
        <div className="pt-6 hidden print:grid grid-cols-2 gap-8 text-xs text-[#50504B]">
          <div className="border-t border-[#1A1A1A] pt-1 text-center">
            <p className="font-bold text-[#1A1A1A]">Prepared by Accountant / Manager</p>
          </div>
          <div className="border-t border-[#1A1A1A] pt-1 text-center">
            <p className="font-bold text-[#1A1A1A]">Transporter / Fleet Owner Approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};
