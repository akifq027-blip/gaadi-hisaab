import React, { useState } from 'react';
import { X, Share2, Copy, Check } from 'lucide-react';
import { formatINR, formatDate } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: any;
  selectedDate?: string;
}

export const WhatsAppShareModal: React.FC<Props> = ({
  isOpen,
  onClose,
  dashboardData,
  selectedDate = new Date().toISOString().split('T')[0],
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dashboardData) return null;

  const today = dashboardData.today || {};
  const recentTrips = dashboardData.recentTrips || [];

  const summaryText = `*🚚 GAADI HISAAB DIARY SUMMARY*
------------------------------
📅 *Date:* ${formatDate(selectedDate)}
📊 *Total Trips:* ${today.trips || 0}
💰 *Total Income:* ${formatINR(today.income || 0)}
⛽ *Diesel:* ${formatINR(today.diesel || 0)}
💸 *Other Expenses:* ${formatINR(today.otherExpenses || 0)}
------------------------------
🟢 *NET INCOME:* ${formatINR(today.netIncome || 0)}
🟡 *TODAY PENDING:* ${formatINR(today.pendingToday || 0)}
⚠️ *TOTAL UDHAAR:* ${formatINR(dashboardData.totalPending || 0)}
------------------------------
*Recent Trips:*
${recentTrips.slice(0, 3).map((t: any, idx: number) => 
  `${idx + 1}. ${t.vehicle_number || 'Truck'} | ${t.pickup_location} ➔ ${t.drop_location} | ${formatINR(t.gross_income)} (${t.payment_status.toUpperCase()})`
).join('\n')}
------------------------------
_Hisaab, Trip aur Gaadi — Sab Ek Jagah._`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E5E5DF] rounded-2xl max-w-md w-full p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5DF]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-[#1A1A1A] text-base">Share Hisaab on WhatsApp</h3>
              <p className="text-[11px] text-[#70706B]">Send formatted daily report to partner or owner</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#70706B] hover:text-[#1A1A1A] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-[#70706B] mb-1.5">Message Preview:</label>
          <pre className="bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-3 text-[11px] font-mono text-[#1A1A1A] whitespace-pre-wrap max-h-64 overflow-y-auto">
            {summaryText}
          </pre>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 bg-[#F5F5F0] hover:bg-[#E5E5DF] text-[#1A1A1A] font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#70706B]" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Open WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
