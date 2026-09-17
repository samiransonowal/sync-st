import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Settings, Printer, Share2, MoreVertical } from 'lucide-react';
import SummaryCard from '../../components/Common/SummaryCard';
import FilterBar from '../../components/Common/FilterBar';
import StatusBadge from '../../components/Common/StatusBadge';
import StatusBar from '../../components/Layout/StatusBar';
import { subscribeToPaymentsIn, savePaymentIn } from '../../services/firestore';

const SEED_PAYMENTS = [
  { 
    id: 'pay_126', 
    date: '2026-04-06', 
    ref_no: '126', 
    party_name: 'THE NOTION PICTURES', 
    amount: 51920, 
    received: 51920, 
    payment_type: 'CINELOOM POSTWO...', 
    status: 'Used',
    tds_status: 'TDS_DEDUCTED'
  }
];

export default function PaymentIn() {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields for adding payment
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (HDFC)');
  const [tdsDeducted, setTdsDeducted] = useState(true);

  useEffect(() => {
    const unsub = subscribeToPaymentsIn((data) => {
      if (data && data.length > 0) {
        setPayments(data);
      } else {
        setPayments(SEED_PAYMENTS);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const filtered = payments.filter(p => 
    (p.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.ref_no || '').includes(searchTerm)
  );

  const totalAmount = filtered.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalReceived = filtered.reduce((s, p) => s + (Number(p.received || p.amount) || 0), 0);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!partyName.trim() || !amount) {
      alert('Please enter party name and amount.');
      return;
    }

    await savePaymentIn({
      date: new Date().toISOString().slice(0, 10),
      ref_no: String(payments.length + 127),
      party_name: partyName.trim(),
      amount: Number(amount),
      received: Number(amount),
      payment_type: paymentMode,
      status: 'Used',
      tds_status: tdsDeducted ? 'TDS_DEDUCTED' : 'TDS_NOT_DEDUCTED'
    });

    setShowAddModal(false);
    setPartyName('');
    setAmount('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080810]">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 no-print">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">Payment-In</h1>
          <ChevronDown size={16} className="text-slate-400 cursor-pointer" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={14} />
            <span>Add Payment-In</span>
          </button>
          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6">
        <FilterBar
          dateRangeLabel="This Financial Year"
          dateRange="01/04/2026 To 31/03/2027"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onPrint={() => window.print()}
        />
      </div>

      {/* Summary Card (Screenshot 3 Match) */}
      <div className="px-6 py-4 no-print">
        <SummaryCard
          title="Total Amount"
          amount={totalAmount || 51920}
          trend="100%"
          trendDirection="up"
          leftSubLabel="Received"
          leftSubValue={totalReceived || 51920}
          rightSubLabel=""
          rightSubValue={0}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="text-xs font-bold text-slate-300 mb-2">Transactions</div>

        <div className="bg-[#101020] border border-white/10 rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#16162d] text-slate-400 font-medium border-b border-white/10">
                <th className="py-2.5 px-4 w-32">Date</th>
                <th className="py-2.5 px-3 w-28">Ref. no.</th>
                <th className="py-2.5 px-4 min-w-[240px]">Party Name</th>
                <th className="py-2.5 px-3 w-32 text-right">Total Amount</th>
                <th className="py-2.5 px-3 w-32 text-right">Received</th>
                <th className="py-2.5 px-4 w-44">Payment Type</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-3 w-24 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{p.date}</td>
                  <td className="py-3 px-3 font-bold text-white font-mono">{p.ref_no}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{p.party_name}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    ₹ {Number(p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                    ₹ {Number(p.received || p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[160px]">
                    {p.payment_type || 'CINELOOM POSTWO...'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={p.status} tdsStatus={p.tds_status} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <button onClick={() => window.print()} className="hover:text-white p-0.5">
                        <Printer size={13} />
                      </button>
                      <button onClick={() => alert('Receipt shared.')} className="hover:text-sky-400 p-0.5">
                        <Share2 size={13} />
                      </button>
                      <button className="hover:text-white p-0.5">
                        <MoreVertical size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StatusBar totalAmount={totalAmount} balance={0} />

      {/* Modal: Add Payment-In */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-up">
            <h2 className="text-base font-bold text-white">Record Payment Receipt</h2>

            <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. THE NOTION PICTURES"
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 51920"
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-[#1a1a32] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="HDFC Bank Transfer">HDFC Current Account Transfer</option>
                  <option value="UPI / QR">UPI / IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* TDS Deduction Tracking Toggle */}
              <div className="pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tdsDeducted}
                    onChange={(e) => setTdsDeducted(e.target.checked)}
                    className="rounded text-purple-600 bg-[#1a1a32]"
                  />
                  <span className="text-slate-300">Client deducted 10% TDS</span>
                </label>
                {!tdsDeducted && (
                  <p className="text-[11px] text-amber-300 mt-1 pl-5">
                    ⚠️ Will be flagged as "TDS Not Deducted" for ledger audit.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
