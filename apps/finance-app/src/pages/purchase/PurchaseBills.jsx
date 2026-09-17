import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Printer } from 'lucide-react';
import StatusBar from '../../components/Layout/StatusBar';
import StatusBadge from '../../components/Common/StatusBadge';
import { subscribeToPurchaseBills, savePurchaseBill } from '../../services/firestore';

export default function PurchaseBills() {
  const [bills, setBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [category, setCategory] = useState('Hardware & Equipment');

  useEffect(() => {
    const unsub = subscribeToPurchaseBills((data) => {
      setBills(data || []);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const totalAmount = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!vendorName.trim() || !billAmount) return;

    await savePurchaseBill({
      bill_no: `PB-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      vendor_name: vendorName.trim(),
      category: category,
      amount: Number(billAmount),
      status: 'Unpaid'
    });

    setShowAddModal(false);
    setVendorName('');
    setBillAmount('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080810]">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 no-print">
        <h1 className="text-xl font-bold text-white tracking-tight">Purchase Bills</h1>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={14} />
          <span>Add Purchase</span>
        </button>
      </div>

      {bills.length === 0 ? (
        /* Empty State (Exact Match to Screenshot 1) */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-28 h-28 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6 shadow-2xl">
            <ShoppingCart size={48} className="text-sky-400" />
          </div>

          <p className="text-sm font-semibold text-slate-300 max-w-md mb-6 leading-relaxed">
            Make Purchase invoices & Print or share with your customers directly via WhatsApp or Email.
          </p>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs tracking-wide shadow-xl transition-transform active:scale-95"
          >
            Add Your First Purchase Invoice
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-[#101020] border border-white/10 rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#16162d] text-slate-400 font-semibold border-b border-white/10">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Bill No.</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bills.map(b => (
                  <tr key={b.id} className="hover:bg-white/[0.03]">
                    <td className="py-3 px-4 font-mono text-slate-300">{b.date}</td>
                    <td className="py-3 px-3 font-mono font-bold text-white">{b.bill_no}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{b.vendor_name}</td>
                    <td className="py-3 px-4 text-slate-400">{b.category}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ₹ {Number(b.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">
                      <button onClick={() => window.print()} className="hover:text-white p-1">
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StatusBar totalAmount={totalAmount} balance={totalAmount} />

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Add Purchase Bill</h2>
            <form onSubmit={handleCreateBill} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Dell Workstations India / Adobe Systems"
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="e.g. 185000"
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Hardware & Grading Monitors">Hardware & Grading Monitors</option>
                  <option value="Software & SaaS Licenses">Software & SaaS Licenses</option>
                  <option value="Office Rent & Facility">Office Rent & Facility</option>
                  <option value="Freelance Colorist / Artist">Freelance Colorist / Artist</option>
                  <option value="Utilities & Electricity">Utilities & Electricity</option>
                </select>
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
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg shadow-lg"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
