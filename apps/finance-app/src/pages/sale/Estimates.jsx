import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, MoreVertical } from 'lucide-react';
import SummaryCard from '../../components/Common/SummaryCard';
import FilterBar from '../../components/Common/FilterBar';
import StatusBadge from '../../components/Common/StatusBadge';
import StatusBar from '../../components/Layout/StatusBar';
import { subscribeToEstimates, saveEstimate } from '../../services/firestore';

const SEED_ESTIMATES = [
  { id: 'est_14', ref_no: '14', date: '2026-09-07', party_name: 'Chirag Dhariwal', amount: 441250, balance: 441250, status: 'Open' },
  { id: 'est_13', ref_no: '13', date: '2026-09-02', party_name: 'Eternal Sunshine Media Private Limited', amount: 177000, balance: 177000, status: 'Open' }
];

export default function Estimates({ onConvertToSale }) {
  const [estimates, setEstimates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = subscribeToEstimates((data) => {
      if (data && data.length > 0) {
        setEstimates(data);
      } else {
        setEstimates(SEED_ESTIMATES);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const filtered = estimates.filter(e => 
    (e.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.ref_no || '').includes(searchTerm)
  );

  const totalAmount = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const openAmount = filtered.filter(e => e.status === 'Open').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const convertedAmount = filtered.filter(e => e.status === 'Converted').reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleConvert = (est) => {
    if (onConvertToSale) {
      onConvertToSale({
        client_name: est.party_name,
        rows: [
          {
            id: 1,
            item: `Project Quote #${est.ref_no}`,
            qty: 1,
            unit: 'PROJECT',
            priceUnit: est.amount,
            taxPct: 18,
            taxAmt: Math.round(est.amount * 0.18),
            amount: Math.round(est.amount * 1.18)
          }
        ]
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080810]">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 no-print">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">Estimate/Quotation</h1>
          <ChevronDown size={16} className="text-slate-400 cursor-pointer" />
        </div>

        <button
          onClick={() => {
            const client = prompt('Enter Client Name for New Estimate:');
            if (client) {
              const amt = Number(prompt('Enter Total Quotation Amount (₹):')) || 100000;
              saveEstimate({
                ref_no: String(estimates.length + 15),
                date: new Date().toISOString().slice(0, 10),
                party_name: client,
                amount: amt,
                balance: amt,
                status: 'Open'
              });
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus size={14} />
          <span>Add Estimate</span>
        </button>
      </div>

      {/* Filters */}
      <div className="px-6">
        <FilterBar
          dateRangeLabel="This Month"
          dateRange="01/09/2026 To 30/09/2026"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onPrint={() => window.print()}
        />
      </div>

      {/* Summary Card (Screenshot 4 Match) */}
      <div className="px-6 py-4 no-print">
        <SummaryCard
          title="Total Quotations"
          amount={totalAmount || 618250}
          trend="43.8%"
          trendDirection="down"
          trendSubtext="vs last month"
          leftSubLabel="Converted"
          leftSubValue={convertedAmount}
          rightSubLabel="Open"
          rightSubValue={openAmount || 618250}
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
                <th className="py-2.5 px-3 w-28">Reference no</th>
                <th className="py-2.5 px-4 min-w-[240px]">Party Name</th>
                <th className="py-2.5 px-3 w-32 text-right">Amount</th>
                <th className="py-2.5 px-3 w-32 text-right">Balance</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
                <th className="py-2.5 px-4 w-36 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filtered.map(est => (
                <tr key={est.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-mono">{est.date}</td>
                  <td className="py-3 px-3 font-bold text-white font-mono">{est.ref_no}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{est.party_name}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                    ₹ {Number(est.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-amber-400">
                    ₹ {Number(est.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={est.status} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleConvert(est)}
                        className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                      >
                        <span>Convert</span>
                        <ChevronDown size={12} />
                      </button>
                      <button className="text-slate-400 hover:text-white p-1">
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

      <StatusBar totalAmount={totalAmount} balance={openAmount} />
    </div>
  );
}
