import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, IndianRupee } from 'lucide-react';
import { Language, translations } from '../translations';
import { Expense, Vehicle } from '../types';
import { api, formatINR, formatDate } from '../api';

interface Props {
  lang: Language;
  onOpenAddExpense: () => void;
  vehicles: Vehicle[];
}

export const ExpensesView: React.FC<Props> = ({ lang, onOpenAddExpense, vehicles }) => {
  const t = translations[lang];
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.getExpenses();
      setExpenses(data.expenses);
      setCategoryTotals(data.categoryTotals);
      setTotalExpense(data.totalExpense);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'toll': return '🛣️';
      case 'parking': return '🅿️';
      case 'food': return '☕';
      case 'loading': return '📦';
      case 'unloading': return '📥';
      case 'tyre': return '🛞';
      case 'maintenance': return '🔧';
      case 'challan': return '🚨';
      default: return '💸';
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.category === selectedCategory;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            <span>{t.expensesTitle} (दैनिक खर्चे)</span>
          </h1>
          <p className="text-xs text-slate-500">Tolls, parking, driver food, police challan and repairs</p>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Total Card */}
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-rose-900 uppercase">Total Expenses Recorded</span>
          <p className="text-xl sm:text-2xl font-black text-rose-700 mt-0.5">
            {formatINR(totalExpense)}
          </p>
        </div>
        <div className="text-right text-xs text-rose-800 font-semibold">
          {expenses.length} Records
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All ({expenses.length})
        </button>

        {Object.entries(categoryTotals).map(([cat, total]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition flex items-center space-x-1.5 ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{getCategoryIcon(cat)}</span>
            <span>{cat}:</span>
            <span className="font-bold">{formatINR(total as number)}</span>
          </button>
        ))}
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading expenses...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <p className="font-bold text-slate-800 text-sm">No expenses found</p>
          <button
            onClick={onOpenAddExpense}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            {t.addExpense}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-base shrink-0">
                  {getCategoryIcon(e.category)}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-xs sm:text-sm capitalize">
                      {e.category}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-500">{formatDate(e.date)}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-0.5">
                    {e.description || 'Routine transport expense'}
                  </p>

                  {e.vehicle_number && (
                    <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
                      🚚 {e.vehicle_number}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-rose-600 text-sm sm:text-base block">
                  -{formatINR(e.amount)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {e.payment_method}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
