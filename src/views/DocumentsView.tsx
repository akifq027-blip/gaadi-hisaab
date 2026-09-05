import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Clock, Plus, X, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../translations';
import { VehicleDocument, Vehicle } from '../types';
import { api, formatDate } from '../api';

interface Props {
  lang: Language;
  vehicles: Vehicle[];
}

export const DocumentsView: React.FC<Props> = ({ lang, vehicles }) => {
  const t = translations[lang];
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  // New Document State
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [documentType, setDocumentType] = useState('insurance');
  const [documentNumber, setDocumentNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !expiryDate) return;

    try {
      setSaving(true);
      await api.addDocument({
        vehicle_id: vehicleId,
        document_type: documentType,
        document_number: documentNumber,
        issue_date: issueDate || null,
        expiry_date: expiryDate,
      });

      setShowAddModal(false);
      setDocumentNumber('');
      setExpiryDate('');
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to add document');
    } finally {
      setSaving(false);
    }
  };

  // Status calculation
  const getDocStatus = (expiry: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiry);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: `Expired ${Math.abs(diffDays)} days ago`, color: 'rose' };
    } else if (diffDays <= 30) {
      return { status: 'expiring', label: `Expires in ${diffDays} days!`, color: 'amber' };
    } else {
      return { status: 'valid', label: `Valid (${diffDays} days left)`, color: 'emerald' };
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const { status } = getDocStatus(doc.expiry_date);
    if (filter === 'all') return true;
    return status === filter;
  });

  const expiredCount = documents.filter((d) => getDocStatus(d.expiry_date).status === 'expired').length;
  const expiringCount = documents.filter((d) => getDocStatus(d.expiry_date).status === 'expiring').length;

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Vehicle Documents & Expiry (कागज़ात)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Never miss insurance, fitness, permit, or road tax renewal
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">
          <span className="text-[10px] font-black text-rose-800 uppercase block">Expired</span>
          <p className="text-base sm:text-xl font-black text-rose-700 mt-1">{expiredCount}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Immediate renewal needed</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
          <span className="text-[10px] font-black text-amber-900 uppercase block">Expiring in 30 Days</span>
          <p className="text-base sm:text-xl font-black text-amber-850 mt-1">{expiringCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Action required soon</span>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl">
          <span className="text-[10px] font-black text-slate-500 uppercase block">Total Monitored</span>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1">{documents.length}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Across fleet</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl w-max text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
          }`}
        >
          All ({documents.length})
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'expiring' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
          }`}
        >
          Expiring Soon ({expiringCount})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filter === 'expired' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
          }`}
        >
          Expired ({expiredCount})
        </button>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Checking document records...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">No documents found for this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDocs.map((doc) => {
            const { status, label, color } = getDocStatus(doc.expiry_date);

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                        color === 'rose'
                          ? 'bg-rose-100 text-rose-800'
                          : color === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 text-sm uppercase">
                        {doc.document_type.replace('_', ' ')}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        🚚 {doc.vehicle_number}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      color === 'rose'
                        ? 'bg-rose-100 text-rose-800'
                        : color === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs flex justify-between items-center text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Doc Number
                    </span>
                    <span className="font-semibold">{doc.document_number || 'N/A'}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Expiry Date
                    </span>
                    <span className="font-black text-slate-900">{formatDate(doc.expiry_date)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add Vehicle Document</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="mt-4 space-y-3">
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
                      {v.vehicle_number} ({v.vehicle_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Type *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                >
                  <option value="insurance">Insurance (बीमा)</option>
                  <option value="fitness">Fitness Certificate (फिटनेस)</option>
                  <option value="puc">PUC / Pollution (प्रदूषण)</option>
                  <option value="permit">State / All India Permit (परमिट)</option>
                  <option value="road_tax">Road Tax (टैक्स)</option>
                  <option value="rc">RC (रजिस्ट्रेशन)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document / Policy No.</label>
                <input
                  type="text"
                  placeholder="e.g. POL-98765432"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
              >
                {saving ? 'Saving...' : 'Save Document Reminder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
