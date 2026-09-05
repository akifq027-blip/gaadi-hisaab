import React, { useState } from 'react';
import { X, Printer, Share2, Download, Truck, CheckCircle2, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { Customer, Vehicle, Driver } from '../types';
import { formatINR, formatDate } from '../api';
import { Language } from '../translations';

export interface BiltyData {
  lrNumber: string;
  date: string;
  isGst: boolean;
  gstType: 'rcm' | 'forward' | 'exempt';
  gstRate: number; // 5 or 12
  transporterName: string;
  transporterAddress: string;
  transporterPhone: string;
  transporterGstin: string;
  consignorName: string;
  consignorPhone: string;
  consignorAddress: string;
  consignorGstin: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
  consigneeGstin: string;
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverDl: string;
  fromLocation: string;
  toLocation: string;
  packageCount: number;
  packageType: string;
  goodsDescription: string;
  actualWeightKg: number;
  chargedWeightKg: number;
  paymentType: 'TO-PAY' | 'PAID' | 'T.B.B.'; // To Pay, Paid, To Be Billed
  freightAmount: number;
  loadingCharges: number;
  unloadingCharges: number;
  biltyCharges: number;
  haltingCharges: number;
  advancePaid: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<BiltyData>;
  customers?: Customer[];
  vehicles?: Vehicle[];
  drivers?: Driver[];
  lang?: Language;
}

export const BiltyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialData,
  customers = [],
  vehicles = [],
  drivers = [],
  lang = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>(initialData?.lrNumber ? 'view' : 'edit');

  // Form State
  const [isGst, setIsGst] = useState<boolean>(initialData?.isGst ?? true);
  const [gstType, setGstType] = useState<'rcm' | 'forward' | 'exempt'>(initialData?.gstType ?? 'rcm');
  const [gstRate, setGstRate] = useState<number>(initialData?.gstRate ?? 5);

  const [lrNumber, setLrNumber] = useState(
    initialData?.lrNumber || `LR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

  // Transporter Info
  const [transporterName, setTransporterName] = useState(initialData?.transporterName || 'Singh Roadlines & Logistics');
  const [transporterAddress, setTransporterAddress] = useState(initialData?.transporterAddress || 'Plot 42, Transport Nagar, Hyderabad - 500070');
  const [transporterPhone, setTransporterPhone] = useState(initialData?.transporterPhone || '9876543210');
  const [transporterGstin, setTransporterGstin] = useState(initialData?.transporterGstin || '36AAAAA0000A1Z5');

  // Consignor (Sender)
  const [consignorName, setConsignorName] = useState(initialData?.consignorName || (customers[0]?.name || 'Balaji Trading Co.'));
  const [consignorPhone, setConsignorPhone] = useState(initialData?.consignorPhone || (customers[0]?.phone || '9849011223'));
  const [consignorAddress, setConsignorAddress] = useState(initialData?.consignorAddress || 'Autonagar Industrial Area, Hyderabad');
  const [consignorGstin, setConsignorGstin] = useState(initialData?.consignorGstin || (isGst ? '36AABCB1234F1Z8' : ''));

  // Consignee (Receiver)
  const [consigneeName, setConsigneeName] = useState(initialData?.consigneeName || 'Venkateshwara Agro Mills');
  const [consigneePhone, setConsigneePhone] = useState(initialData?.consigneePhone || '9701234567');
  const [consigneeAddress, setConsigneeAddress] = useState(initialData?.consigneeAddress || 'Grain Market Yard, Warangal');
  const [consigneeGstin, setConsigneeGstin] = useState(initialData?.consigneeGstin || (isGst ? '36AACDV5678K1ZG' : ''));

  // Vehicle & Driver
  const [vehicleNumber, setVehicleNumber] = useState(initialData?.vehicleNumber || (vehicles[0]?.vehicle_number || 'TS 07 UA 4567'));
  const [vehicleType, setVehicleType] = useState(initialData?.vehicleType || (vehicles[0]?.vehicle_type || 'Tata Ace Gold'));
  const [driverName, setDriverName] = useState(initialData?.driverName || (drivers[0]?.name || 'Ramesh Yadav'));
  const [driverPhone, setDriverPhone] = useState(initialData?.driverPhone || (drivers[0]?.phone || '9876543211'));
  const [driverDl, setDriverDl] = useState(initialData?.driverDl || (drivers[0]?.license_number || 'TS0920190012345'));

  // Route & Goods
  const [fromLocation, setFromLocation] = useState(initialData?.fromLocation || 'Hyderabad');
  const [toLocation, setToLocation] = useState(initialData?.toLocation || 'Warangal');
  const [packageCount, setPackageCount] = useState<number>(initialData?.packageCount || 85);
  const [packageType, setPackageType] = useState(initialData?.packageType || 'Bags / Boriyan');
  const [goodsDescription, setGoodsDescription] = useState(initialData?.goodsDescription || 'Agricultural Grain & Seeds');
  const [actualWeightKg, setActualWeightKg] = useState<number>(initialData?.actualWeightKg || 2400);
  const [chargedWeightKg, setChargedWeightKg] = useState<number>(initialData?.chargedWeightKg || 2500);

  // Financials
  const [paymentType, setPaymentType] = useState<'TO-PAY' | 'PAID' | 'T.B.B.'>(initialData?.paymentType || 'TO-PAY');
  const [freightAmount, setFreightAmount] = useState<number>(initialData?.freightAmount || 6500);
  const [loadingCharges, setLoadingCharges] = useState<number>(initialData?.loadingCharges || 300);
  const [unloadingCharges, setUnloadingCharges] = useState<number>(initialData?.unloadingCharges || 250);
  const [biltyCharges, setBiltyCharges] = useState<number>(initialData?.biltyCharges || 50);
  const [haltingCharges, setHaltingCharges] = useState<number>(initialData?.haltingCharges || 0);
  const [advancePaid, setAdvancePaid] = useState<number>(initialData?.advancePaid || 2000);

  if (!isOpen) return null;

  // Computations
  const subtotal = freightAmount + loadingCharges + unloadingCharges + biltyCharges + haltingCharges;
  const gstAmount = isGst && gstType === 'forward' ? Math.round((subtotal * gstRate) / 100) : 0;
  const grandTotal = subtotal + gstAmount;
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = () => {
    const slipHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bilty_${lrNumber}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #111; }
          .bilty-box { border: 2px solid #111; max-width: 800px; margin: 0 auto; padding: 15px; }
          .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 20px; font-weight: 900; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; margin-bottom: 10px; }
          .box { border: 1px solid #aaa; padding: 8px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
          th, td { border: 1px solid #444; padding: 6px; text-align: left; }
          th { background: #f0f0f0; }
          .text-right { text-align: right; }
          .badge { font-weight: bold; padding: 2px 6px; border: 1px solid #111; display: inline-block; }
          .terms { font-size: 10px; color: #555; margin-top: 10px; border-top: 1px dashed #aaa; padding-top: 6px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 30px; font-size: 11px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="bilty-box">
          <div class="header">
            <div class="badge">${isGst ? 'GST CONSIGNMENT NOTE (BILTY)' : 'NON-GST CONSIGNMENT NOTE (LR)'}</div>
            <div class="title">${transporterName}</div>
            <div style="font-size: 12px;">${transporterAddress} | Ph: ${transporterPhone}</div>
            ${isGst ? `<div style="font-size: 11px; font-weight: bold;">GSTIN: ${transporterGstin} • SAC Code: 996511 (Road Freight)</div>` : ''}
          </div>
          <div class="grid">
            <div class="box">
              <strong>LR / Bilty No:</strong> ${lrNumber}<br/>
              <strong>Date:</strong> ${formatDate(date)}<br/>
              <strong>Vehicle No:</strong> ${vehicleNumber} (${vehicleType})<br/>
              <strong>Driver:</strong> ${driverName} (Ph: ${driverPhone})<br/>
              <strong>From:</strong> ${fromLocation} ➔ <strong>To:</strong> ${toLocation}
            </div>
            <div class="box">
              <strong>Freight Mode:</strong> <span class="badge">${paymentType}</span><br/>
              <strong>Consignor (Sender):</strong> ${consignorName}<br/>
              <strong>Address:</strong> ${consignorAddress}<br/>
              <strong>Consignee (Receiver):</strong> ${consigneeName}<br/>
              <strong>Address:</strong> ${consigneeAddress}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Packages</th>
                <th>Description of Goods</th>
                <th>Actual Wt (Kg)</th>
                <th>Charged Wt</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${packageCount} ${packageType}</td>
                <td>${goodsDescription}</td>
                <td>${actualWeightKg} Kg</td>
                <td>${chargedWeightKg} Kg</td>
                <td class="text-right">${freightAmount.toLocaleString('en-IN')}</td>
              </tr>
              ${loadingCharges > 0 ? `<tr><td colspan="4">Loading / Hamali Charges</td><td class="text-right">${loadingCharges.toLocaleString('en-IN')}</td></tr>` : ''}
              ${unloadingCharges > 0 ? `<tr><td colspan="4">Unloading Charges</td><td class="text-right">${unloadingCharges.toLocaleString('en-IN')}</td></tr>` : ''}
              ${biltyCharges > 0 ? `<tr><td colspan="4">Bilty / Statistical Charges</td><td class="text-right">${biltyCharges.toLocaleString('en-IN')}</td></tr>` : ''}
              ${haltingCharges > 0 ? `<tr><td colspan="4">Halting / Detention Charges</td><td class="text-right">${haltingCharges.toLocaleString('en-IN')}</td></tr>` : ''}
              ${isGst && gstType === 'forward' ? `<tr><td colspan="4">GST (${gstRate}%) Forward Charge</td><td class="text-right">${gstAmount.toLocaleString('en-IN')}</td></tr>` : ''}
              ${isGst && gstType === 'rcm' ? `<tr><td colspan="4">GST Status: <em>Payable under RCM by Consignor/Consignee</em></td><td class="text-right">RCM (5%)</td></tr>` : ''}
              <tr style="font-weight: bold; background: #fafafa;">
                <td colspan="4">GRAND TOTAL</td>
                <td class="text-right">₹${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colspan="4">Advance Paid (पेशगी)</td>
                <td class="text-right">₹${advancePaid.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="font-weight: 900; font-size: 13px;">
                <td colspan="4">BALANCE DUE AT DESTINATION (बकाया)</td>
                <td class="text-right">₹${balanceDue.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          <div class="terms">
            <strong>Standard Terms of Carriage:</strong><br/>
            1. Goods booked strictly at Owner's risk. Transporter is not liable for leakage, rain damage, theft or natural decay.<br/>
            2. Demurrage @ ₹300/day after 24 hrs of arrival at destination.<br/>
            3. Delivery strictly upon surrender of original Consignee copy.
          </div>
          <div class="signatures">
            <div>___________________<br/>Consignor's Signature</div>
            <div>___________________<br/>Driver's Signature</div>
            <div>___________________<br/>Receiver's Seal & Signature</div>
            <div>___________________<br/>For ${transporterName}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([slipHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bilty_${lrNumber}_${vehicleNumber.replace(/\s+/g, '')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const text = `*🚚 ${transporterName.toUpperCase()}*
*${isGst ? 'GST CONSIGNMENT NOTE (BILTY)' : 'NON-GST CONSIGNMENT NOTE (LR)'}*
---------------------------------------
*Bilty/LR No:* ${lrNumber}
*Date:* ${formatDate(date)}
*Vehicle:* ${vehicleNumber} (${vehicleType})
*Driver:* ${driverName} (${driverPhone})
*Route:* ${fromLocation} ➔ ${toLocation}
---------------------------------------
*Sender (Consignor):* ${consignorName}
*Receiver (Consignee):* ${consigneeName}
*Goods:* ${packageCount} ${packageType} (${goodsDescription})
*Weight:* ${actualWeightKg} Kg (Charged: ${chargedWeightKg} Kg)
*Freight Mode:* ${paymentType}
---------------------------------------
*Freight Charges:* ${formatINR(freightAmount)}
*Loading / Hamali:* ${formatINR(loadingCharges)}
*Unloading:* ${formatINR(unloadingCharges)}
*Bilty Charge:* ${formatINR(biltyCharges)}
${haltingCharges > 0 ? `*Halting:* ${formatINR(haltingCharges)}\n` : ''}${isGst && gstType === 'forward' ? `*GST (${gstRate}%):* ${formatINR(gstAmount)}\n` : ''}${isGst && gstType === 'rcm' ? `*GST:* Under RCM (5%)\n` : ''}*TOTAL AMOUNT:* ${formatINR(grandTotal)}
*Advance Paid:* ${formatINR(advancePaid)}
*BALANCE DUE:* ${formatINR(balanceDue)}
---------------------------------------
Delivery at destination upon verification.
Generated via Gaadi Hisaab App.`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header / Mode Bar (Excluded from print) */}
        <div className="px-5 py-3.5 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF8C00] text-white flex items-center justify-center font-bold text-sm">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-wide">
                {isGst ? 'GST BILTY / LORRY RECEIPT (LR)' : 'NON-GST CONSIGNMENT NOTE'}
              </h2>
              <p className="text-[11px] text-[#A0A09B]">
                {activeTab === 'view' ? `Viewing LR #${lrNumber}` : 'Create / Edit Consignment Note'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'view' ? 'edit' : 'view')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition"
            >
              {activeTab === 'view' ? '✏️ Edit Fields' : '👁️ View Slip'}
            </button>
            <button onClick={onClose} className="p-1 text-[#A0A09B] hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW MODE: Official Printable Indian Bilty Slip */}
        {activeTab === 'view' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 printable-area text-[#1A1A1A]">
            {/* Action Bar (Download, Print, WhatsApp) */}
            <div className="no-print bg-[#F5F5F0] border border-[#E5E5DF] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#70706B]">Bilty Format:</span>
                <button
                  type="button"
                  onClick={() => setIsGst(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    isGst ? 'bg-[#FF8C00] text-white shadow-xs' : 'bg-white text-[#70706B] border border-[#E5E5DF]'
                  }`}
                >
                  GST Bilty (RCM/Forward)
                </button>
                <button
                  type="button"
                  onClick={() => setIsGst(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    !isGst ? 'bg-[#1A1A1A] text-white shadow-xs' : 'bg-white text-[#70706B] border border-[#E5E5DF]'
                  }`}
                >
                  Non-GST / Direct
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  className="px-3 py-1.5 bg-white border border-[#E5E5DF] hover:border-[#FF8C00] text-[#1A1A1A] rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#FF8C00]" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* THE FORMAL BILTY DOCUMENT FRAME */}
            <div className="border-2 border-[#1A1A1A] rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
              {/* Header Box */}
              <div className="border-b-2 border-[#1A1A1A] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A1A1A] text-white">
                    {isGst ? 'GOODS TRANSPORT CONSIGNMENT NOTE (BILTY)' : 'CONSIGNMENT NOTE (NON-GST LORRY RECEIPT)'}
                  </span>
                  <span className="text-xs font-black uppercase border border-[#1A1A1A] px-2 py-0.5 rounded">
                    CONSIGNEE COPY
                  </span>
                </div>

                <div className="text-center mt-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1A1A1A] tracking-tight uppercase">
                    {transporterName}
                  </h1>
                  <p className="text-xs text-[#50504B] font-medium">{transporterAddress}</p>
                  <p className="text-xs text-[#50504B]">
                    📞 Ph: <strong className="text-[#1A1A1A]">{transporterPhone}</strong>
                    {isGst && (
                      <> • GSTIN: <strong className="text-[#1A1A1A] font-mono">{transporterGstin}</strong> • SAC: <strong>996511</strong></>
                    )}
                  </p>
                </div>
              </div>

              {/* LR Number, Date & Payment Mode Banner */}
              <div className="grid grid-cols-3 gap-2 bg-[#F9F9F6] p-2.5 rounded-xl border border-[#E5E5DF] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">LR / Bilty No.</span>
                  <span className="font-mono font-black text-[#1A1A1A] text-sm">{lrNumber}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">Date (तारीख)</span>
                  <span className="font-bold text-[#1A1A1A]">{formatDate(date)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">Freight Terms</span>
                  <span className={`inline-block px-2 py-0.5 rounded font-black text-xs uppercase ${
                    paymentType === 'PAID' ? 'bg-[#059669] text-white' : 'bg-[#FF8C00] text-white'
                  }`}>
                    {paymentType} ({paymentType === 'PAID' ? 'भाड़ा जमा' : 'पहुँच पर भाड़ा'})
                  </span>
                </div>
              </div>

              {/* Consignor vs Consignee Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Consignor (Sender) */}
                <div className="border border-[#E5E5DF] rounded-xl p-3 bg-white space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF8C00] block">
                    1. Consignor / प्रेषक (माल भेजने वाला)
                  </span>
                  <p className="font-black text-sm text-[#1A1A1A]">{consignorName}</p>
                  <p className="text-[#50504B] text-[11px]">{consignorAddress}</p>
                  <p className="text-[#50504B] text-[11px]">📞 {consignorPhone}</p>
                  {isGst && consignorGstin && (
                    <p className="text-[11px] font-mono text-[#1A1A1A]">GSTIN: {consignorGstin}</p>
                  )}
                </div>

                {/* Consignee (Receiver) */}
                <div className="border border-[#E5E5DF] rounded-xl p-3 bg-white space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1A73E8] block">
                    2. Consignee / प्राप्तकर्ता (माल पाने वाला)
                  </span>
                  <p className="font-black text-sm text-[#1A1A1A]">{consigneeName}</p>
                  <p className="text-[#50504B] text-[11px]">{consigneeAddress}</p>
                  <p className="text-[#50504B] text-[11px]">📞 {consigneePhone}</p>
                  {isGst && consigneeGstin && (
                    <p className="text-[11px] font-mono text-[#1A1A1A]">GSTIN: {consigneeGstin}</p>
                  )}
                </div>
              </div>

              {/* Vehicle & Route Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F5F5F0] p-2.5 rounded-xl border border-[#E5E5DF] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">Vehicle No. (गाड़ी नं.)</span>
                  <span className="font-mono font-black text-[#1A1A1A]">{vehicleNumber}</span>
                  <span className="text-[10px] text-[#70706B] block">{vehicleType}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">Driver Name</span>
                  <span className="font-bold text-[#1A1A1A]">{driverName}</span>
                  <span className="text-[10px] text-[#70706B] block">DL: {driverDl || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">From (कहाँ से)</span>
                  <span className="font-black text-[#1A1A1A]">{fromLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#70706B] uppercase block">To (कहाँ तक)</span>
                  <span className="font-black text-[#1A1A1A]">{toLocation}</span>
                </div>
              </div>

              {/* Goods & Packages Table */}
              <div className="border border-[#1A1A1A] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#1A1A1A] text-white font-bold">
                    <tr>
                      <th className="p-2">Packages</th>
                      <th className="p-2">Description of Goods</th>
                      <th className="p-2 text-center">Actual Wt</th>
                      <th className="p-2 text-center">Charged Wt</th>
                      <th className="p-2 text-right">Freight (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5DF]">
                    <tr>
                      <td className="p-2 font-bold">{packageCount} {packageType}</td>
                      <td className="p-2">{goodsDescription}</td>
                      <td className="p-2 text-center font-mono">{actualWeightKg} Kg</td>
                      <td className="p-2 text-center font-mono font-bold">{chargedWeightKg} Kg</td>
                      <td className="p-2 text-right font-black">{formatINR(freightAmount)}</td>
                    </tr>
                    {loadingCharges > 0 && (
                      <tr className="text-[#50504B]">
                        <td colSpan={4} className="p-2">Loading / Hamali Charges (हमाली)</td>
                        <td className="p-2 text-right font-semibold">{formatINR(loadingCharges)}</td>
                      </tr>
                    )}
                    {unloadingCharges > 0 && (
                      <tr className="text-[#50504B]">
                        <td colSpan={4} className="p-2">Unloading Charges (उतराई)</td>
                        <td className="p-2 text-right font-semibold">{formatINR(unloadingCharges)}</td>
                      </tr>
                    )}
                    {biltyCharges > 0 && (
                      <tr className="text-[#50504B]">
                        <td colSpan={4} className="p-2">Bilty / Statistical Charges (बिल्टी खर्च)</td>
                        <td className="p-2 text-right font-semibold">{formatINR(biltyCharges)}</td>
                      </tr>
                    )}
                    {haltingCharges > 0 && (
                      <tr className="text-[#50504B]">
                        <td colSpan={4} className="p-2">Halting / Demurrage (गाड़ी रोकने का खर्च)</td>
                        <td className="p-2 text-right font-semibold">{formatINR(haltingCharges)}</td>
                      </tr>
                    )}

                    {/* GST Details */}
                    {isGst && (
                      <tr className="bg-[#FFF8E7] text-[#1A1A1A]">
                        <td colSpan={4} className="p-2 font-semibold">
                          GST Status:{' '}
                          {gstType === 'rcm' ? (
                            <strong className="text-[#059669]">
                              Tax payable under Reverse Charge Mechanism (RCM 5%) by Consignor / Consignee
                            </strong>
                          ) : gstType === 'forward' ? (
                            <strong>Forward Charge @ {gstRate}%</strong>
                          ) : (
                            <span>Exempt Goods</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-bold">
                          {gstType === 'forward' ? formatINR(gstAmount) : 'RCM (5%)'}
                        </td>
                      </tr>
                    )}

                    {/* Grand Total */}
                    <tr className="bg-[#F5F5F0] font-black text-sm text-[#1A1A1A]">
                      <td colSpan={4} className="p-2 uppercase tracking-wide">GRAND TOTAL (कुल भाड़ा)</td>
                      <td className="p-2 text-right">{formatINR(grandTotal)}</td>
                    </tr>

                    {/* Advance Paid */}
                    <tr>
                      <td colSpan={4} className="p-2 font-bold text-[#059669]">Advance Received / Paid (पेशगी)</td>
                      <td className="p-2 text-right font-bold text-[#059669]">- {formatINR(advancePaid)}</td>
                    </tr>

                    {/* Balance Payable */}
                    <tr className="bg-[#FFF3E0] font-black text-base text-[#1A1A1A] border-t-2 border-[#1A1A1A]">
                      <td colSpan={4} className="p-2.5 text-[#FF8C00] uppercase">
                        BALANCE PAYABLE AT DESTINATION (बकाया भाड़ा)
                      </td>
                      <td className="p-2.5 text-right text-[#FF8C00] font-mono">
                        {formatINR(balanceDue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Conditions of Carriage */}
              <div className="text-[10px] text-[#70706B] border-t border-dashed border-[#E5E5DF] pt-2 space-y-0.5">
                <p className="font-bold text-[#1A1A1A]">Terms & Conditions (नियम व शर्तें):</p>
                <p>1. The goods are accepted for carriage strictly at Owner's risk. Transporter is not responsible for transit damages, breakage, rain, or natural loss.</p>
                <p>2. Demurrage will be charged @ ₹300 per day after 24 hours of arrival at destination.</p>
                <p>3. Delivery will only be handed over against original Consignee Copy of this Lorry Receipt.</p>
              </div>

              {/* 4 Official Signatures Grid */}
              <div className="pt-4 grid grid-cols-4 gap-2 text-center text-[10px] text-[#50504B]">
                <div className="border-t border-[#1A1A1A] pt-1">
                  <p className="font-bold text-[#1A1A1A]">Consignor Signature</p>
                  <p className="text-[9px]">माल भेजने वाले के हस्ताक्षर</p>
                </div>
                <div className="border-t border-[#1A1A1A] pt-1">
                  <p className="font-bold text-[#1A1A1A]">Driver Signature</p>
                  <p className="text-[9px]">चालक के हस्ताक्षर</p>
                </div>
                <div className="border-t border-[#1A1A1A] pt-1">
                  <p className="font-bold text-[#1A1A1A]">Receiver's Seal & Sign</p>
                  <p className="text-[9px]">माल प्राप्तकर्ता की मोहर</p>
                </div>
                <div className="border-t border-[#1A1A1A] pt-1">
                  <p className="font-bold text-[#1A1A1A]">For {transporterName}</p>
                  <p className="text-[9px]">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT MODE: Fast Customizer for Bilty */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="bg-[#FFF8E7] border border-[#FF8C00]/30 p-3 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-[#1A1A1A]">Select Bilty Mode:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGst(true)}
                  className={`px-3 py-1 rounded-xl font-black text-xs ${
                    isGst ? 'bg-[#FF8C00] text-white' : 'bg-white text-[#70706B] border border-[#E5E5DF]'
                  }`}
                >
                  GST Bilty (RCM)
                </button>
                <button
                  type="button"
                  onClick={() => setIsGst(false)}
                  className={`px-3 py-1 rounded-xl font-black text-xs ${
                    !isGst ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#70706B] border border-[#E5E5DF]'
                  }`}
                >
                  Non-GST Consignment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">LR / Bilty Number</label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
            </div>

            {/* Consignor & Consignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#F9F9F6] p-3 rounded-2xl border border-[#E5E5DF] space-y-2">
                <span className="font-black text-[#FF8C00] text-[11px] block uppercase">Consignor (Sender)</span>
                <input
                  type="text"
                  placeholder="Sender Name"
                  value={consignorName}
                  onChange={(e) => setConsignorName(e.target.value)}
                  className="w-full bg-white border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={consignorAddress}
                  onChange={(e) => setConsignorAddress(e.target.value)}
                  className="w-full bg-white border border-[#E5E5DF] rounded-xl p-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="GSTIN (optional)"
                  value={consignorGstin}
                  onChange={(e) => setConsignorGstin(e.target.value)}
                  className="w-full bg-white border border-[#E5E5DF] rounded-xl p-2 font-mono text-xs"
                />
              </div>

              <div className="bg-[#F9F9F6] p-3 rounded-2xl border border-[#E5E5DF] space-y-2">
                <span className="font-black text-[#1A73E8] text-[11px] block uppercase">Consignee (Receiver)</span>
                <input
                  type="text"
                  placeholder="Receiver Name"
                  value={consigneeName}
                  onChange={(e) => setConsigneeName(e.target.value)}
                  className="w-full bg-white border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={consigneeAddress}
                  onChange={(e) => setConsigneeAddress(e.target.value)}
                  className="w-full bg-white border border-[#E5E5DF] rounded-xl p-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="GSTIN (optional)"
                  value={consigneeGstin}
                  onChange={(e) => setConsigneeGstin(e.target.value)}
                  className="w-full bg-white border border-[#E5E5DF] rounded-xl p-2 font-mono text-xs"
                />
              </div>
            </div>

            {/* Route & Vehicle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">From Location</label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">To Location</label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
            </div>

            {/* Goods & Financials */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Goods Description</label>
                <input
                  type="text"
                  value={goodsDescription}
                  onChange={(e) => setGoodsDescription(e.target.value)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Package Count</label>
                <input
                  type="number"
                  value={packageCount}
                  onChange={(e) => setPackageCount(Number(e.target.value))}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Payment Mode</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                >
                  <option value="TO-PAY">TO-PAY (पहुँच पर देय)</option>
                  <option value="PAID">PAID (चुकाया गया)</option>
                  <option value="T.B.B.">T.B.B. (To Be Billed)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Freight (₹) *</label>
                <input
                  type="number"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(Number(e.target.value))}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-black text-[#059669]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Advance Paid (₹)</label>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value))}
                  className="w-full bg-[#F9F9F6] border border-[#E5E5DF] rounded-xl p-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Balance Due (₹)</label>
                <div className="bg-[#FFF3E0] border border-[#FF8C00]/30 rounded-xl p-2 font-black text-[#FF8C00]">
                  {formatINR(balanceDue)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className="w-full py-3 bg-[#FF8C00] hover:bg-[#E67E00] text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <span>Generate & View Printable Bilty</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
