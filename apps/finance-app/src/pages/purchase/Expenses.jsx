import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import StatusBar from '../../components/Layout/StatusBar';
import { subscribeToExpenses, saveExpense } from '../../services/firestore';

const SEED_EXPENSES = [
  { id: 'exp_1', date: '2026-09-05', category: 'Fixed Overheads', description: 'Studio 01 & 02 Electricity & Power Backup', project_code: 'GENERAL', amount: 38500, vendor: 'Adani Electricity', payment_mode: 'HDFC Auto-Debit', status: 'Paid' },
  { id: 'exp_2', date: '2026-09-04', category: 'Software & SaaS', description: 'DaVinci Resolve Studio & Frame.io Pro Renewal', project_code: 'GENERAL', amount: 24200, vendor: 'Blackmagic Design', payment_mode: 'Corporate Card', status: 'Paid' },
  { id: 'exp_3', date: '2026-09-02', category: 'Logistics & Production', description: 'Hard Drive Runner & Delivery to White Tiger Films', project_code: 'PRJ-WTF', amount: 3500, vendor: 'Borzo / WeFast', payment_mode: 'Petty Cash', status: 'Paid' }
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const date = new Date().toISOString().slice(0, 10);
  const paymentMode = 'HDFC Bank Transfer';
  const [category, setCategory] = useState('Fixed Overheads');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [projectCode, setProjectCode] = useState('GENERAL');

  useEffect(() => {
    const unsub = subscribeToExpenses((data) => {
      if (data && data.length > 0) {
        setExpenses(data);
      } else {
        setExpenses(SEED_EXPENSES);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    await saveExpense({
      date,
      category,
      description: description.trim(),
      amount: Number(amount),
      vendor: vendor.trim() || 'General Vendor',
      payment_mode: paymentMode,
      project_code: projectCode.trim() || 'GENERAL',
      status: 'Paid'
    });

    setShowAddModal(false);
    setDescription('');
    setAmount('');
    setVendor('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080810]">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 no-print">
        <h1 className="text-xl font-bold text-white tracking-tight">Expenses Ledger</h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={14} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="bg-[#101020] border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#16162d] text-slate-400 font-semibold border-b border-white/10">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 min-w-[200px]">Description</th>
                <th className="py-2.5 px-3">Project Code</th>
                <th className="py-2.5 px-4">Vendor</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Payment Mode</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-white/[0.03]">
                  <td className="py-3 px-4 font-mono text-slate-300">{exp.date}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold text-[11px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-medium">{exp.description}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{exp.project_code}</td>
                  <td className="py-3 px-4 text-slate-300">{exp.vendor}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                    ₹ {Number(exp.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400">{exp.payment_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StatusBar totalAmount={totalExpense} balance={0} />

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Record Operating Expense</h2>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Fixed Overheads">Fixed Overheads (Rent, Power, Facility)</option>
                  <option value="Payroll & Staffing">Payroll & Staffing (Salaries, Retainers)</option>
                  <option value="Capital Expenditures">Capital Expenditures (Hardware, Monitors)</option>
                  <option value="Logistics & Production">Logistics & Production (Travel, Runners, Hard Drives)</option>
                  <option value="Software & SaaS">Software & SaaS (DaVinci, Adobe, GCP, AWS)</option>
                  <option value="Daily Operations">Daily Operations (Petty Cash, Catering)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Flight ticket to Mumbai for Project Zenith"
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 12500"
                    className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Project Code</label>
                  <input
                    type="text"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    placeholder="e.g. PRJ-ZENITH"
                    className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vendor / Payee</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. MakeMyTrip / Indigo Airlines"
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
