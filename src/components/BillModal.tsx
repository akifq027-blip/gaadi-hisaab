import React, { useState } from 'react';
import { X, Printer, Share2, Download, Check, Truck } from 'lucide-react';
import { TransportBill, Customer, Vehicle, Driver } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  bill?: TransportBill | null;
  customers: Customer[];
  vehicles: Vehicle[];
  drivers: Driver[];
}

export const BillModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  bill,
  customers,
  vehicles,
  drivers,
}) => {
  // If creating new bill
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [goods, setGoods] = useState('Commercial Goods');
  const [freight, setFreight] = useState('');
  const [loadingCharge, setLoadingCharge] = useState('');
  const [unloadingCharge, setUnloadingCharge] = useState('');
  const [extraCharges, setExtraCharges] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isViewMode = !!bill;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = (targetBill: TransportBill) => {
    const text = `*🚚 GAADI HISAAB - TRANSPORT BILL*
------------------------------
*Bill No:* ${targetBill.bill_number}
*Date:* ${formatDate(targetBill.date)}
*Party:* ${targetBill.customer_name || 'Customer'}
*Vehicle:* ${targetBill.vehicle_number}
*Route:* ${targetBill.pickup} ➔ ${targetBill.destination}
*Goods:* ${targetBill.goods || 'General'}
------------------------------
*Freight:* ${formatINR(targetBill.freight)}
*Loading/Unloading:* ${formatINR(Number(targetBill.loading) + Number(targetBill.unloading))}
*Extra Charges:* ${formatINR(targetBill.extra_charges)}
*TOTAL:* ${formatINR(targetBill.total_amount)}
*PAID:* ${formatINR(targetBill.paid_amount)}
*BALANCE DUE:* ${formatINR(targetBill.balance_amount)}
*Status:* ${targetBill.status.toUpperCase()}
------------------------------
Generated via Gaadi Hisaab App`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const f = parseFloat(freight);
    if (!customerId || !vehicleId || isNaN(f) || f <= 0) {
      setError('Please select customer, vehicle, and enter freight amount.');
      return;
    }

    try {
      setSaving(true);
      await api.createBill({
        customer_id: customerId,
        vehicle_id: vehicleId,
        driver_id: driverId || null,
        date,
        pickup,
        destination,
        goods,
        freight: f,
        loading: parseFloat(loadingCharge) || 0,
        unloading: parseFloat(unloadingCharge) || 0,
        extra_charges: parseFloat(extraCharges) || 0,
        paid_amount: parseFloat(paidAmount) || 0,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              {isViewMode ? `Transport Bill #${bill.bill_number}` : 'Generate Transport Bill (रसीद)'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Existing Bill (Printable layout) */}
        {isViewMode ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 printable-area">
            {/* Invoice Printable Header */}
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">GAADI HISAAB</h1>
                <p className="text-[11px] text-slate-500 font-medium">TRANSPORT RECEIPT / BILTY</p>
                <p className="text-xs text-slate-600 mt-1">Sab Ek Jagah • India</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                    bill.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {bill.status}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1">Bill #: {bill.bill_number}</p>
                <p className="text-[11px] text-slate-500">Date: {formatDate(bill.date)}</p>
              </div>
            </div>

            {/* Party & Vehicle Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-400 text-[10px] uppercase">Billed To (Party):</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{bill.customer_name || 'Customer'}</p>
                {bill.customer_phone && <p className="text-slate-600">Ph: {bill.customer_phone}</p>}
              </div>
              <div>
                <p className="font-bold text-slate-400 text-[10px] uppercase">Vehicle & Driver:</p>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{bill.vehicle_number}</p>
                {bill.driver_name && <p className="text-slate-600">Driver: {bill.driver_name}</p>}
              </div>
            </div>

            {/* Route & Goods */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Route</span>
                <span className="font-bold text-slate-900">
                  {bill.pickup} ➔ {bill.destination}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Goods</span>
                <span className="font-bold text-slate-800">{bill.goods || 'General'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="p-2.5">Freight Charges</td>
                    <td className="p-2.5 text-right font-semibold">{formatINR(bill.freight)}</td>
                  </tr>
                  {Number(bill.loading) > 0 && (
                    <tr>
                      <td className="p-2.5">Loading Charges</td>
                      <td className="p-2.5 text-right font-semibold">{formatINR(bill.loading)}</td>
                    </tr>
                  )}
                  {Number(bill.unloading) > 0 && (
                    <tr>
                      <td className="p-2.5">Unloading Charges</td>
                      <td className="p-2.5 text-right font-semibold">{formatINR(bill.unloading)}</td>
                    </tr>
                  )}
                  {Number(bill.extra_charges) > 0 && (
                    <tr>
                      <td className="p-2.5">Extra Charges / Halting</td>
                      <td className="p-2.5 text-right font-semibold">{formatINR(bill.extra_charges)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-extrabold text-sm text-slate-950">
                    <td className="p-2.5">Total Amount</td>
                    <td className="p-2.5 text-right">{formatINR(bill.total_amount)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-emerald-700 font-bold">Paid / Received</td>
                    <td className="p-2.5 text-right text-emerald-700 font-bold">
                      {formatINR(bill.paid_amount)}
                    </td>
                  </tr>
                  <tr className="bg-amber-50/80 font-black text-sm text-amber-950">
                    <td className="p-2.5">Balance Pending</td>
                    <td className="p-2.5 text-right text-amber-900">
                      {formatINR(bill.balance_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Signature */}
            <div className="pt-6 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p>Thank you for your business!</p>
                <p className="text-[10px]">Computer generated transport receipt</p>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 w-28 mb-1"></div>
                <p className="font-semibold text-slate-700 text-[11px]">Authorized Signatory</p>
              </div>
            </div>

            {/* Actions (Hidden on Print) */}
            <div className="pt-3 border-t border-slate-200 flex space-x-2 no-print">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>
              <button
                onClick={() => handleShareWhatsApp(bill)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          /* Create New Bill Form */
          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pickup (From) *</label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Drop (To) *</label>
                <input
                  type="text"
                  placeholder="e.g. Vijayawada"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Goods Type</label>
              <input
                type="text"
                value={goods}
                onChange={(e) => setGoods(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Freight (₹) *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Advance / Paid (₹)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full bg-emerald-50 border border-emerald-300 rounded-xl p-2 text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600">Loading (₹)</label>
                <input
                  type="number"
                  value={loadingCharge}
                  onChange={(e) => setLoadingCharge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600">Unloading (₹)</label>
                <input
                  type="number"
                  value={unloadingCharge}
                  onChange={(e) => setUnloadingCharge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600">Extra (₹)</label>
                <input
                  type="number"
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full mt-2 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Generating...' : 'Generate Bill Now'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
