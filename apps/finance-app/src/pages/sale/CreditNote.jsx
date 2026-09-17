import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import StatusBar from '../../components/Layout/StatusBar';
import { subscribeToCreditNotes } from '../../services/firestore';

export default function CreditNote() {
  const [creditNotes, setCreditNotes] = useState([]);

  useEffect(() => {
    const unsub = subscribeToCreditNotes((data) => {
      setCreditNotes(data || []);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080810]">
      {/* ── Top Filters Row (Exact Match to Screenshot 2) ── */}
      <div className="px-6 py-3 border-b border-white/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 font-bold text-white">
              <span>This Month</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            <div className="flex items-center gap-1.5 bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-300">
              <span className="text-slate-400">Between</span>
              <span className="font-mono">01/09/2026</span>
              <span className="text-slate-400">To</span>
              <span className="font-mono">30/09/2026</span>
            </div>

            <div className="flex items-center gap-1 bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-300">
              <span>ALL FIRMS</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            <div className="flex items-center gap-1 bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-300">
              <span>ALL USERS</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 text-xs">
              <FileSpreadsheet size={15} className="text-emerald-500" />
              <span>Excel Report</span>
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1 text-slate-400 hover:text-white text-xs">
              <Printer size={15} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Sub-Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <select className="bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-200">
              <option value="credit_note">Credit Note</option>
            </select>

            <select className="bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-200">
              <option value="all_payment">All Payment</option>
            </select>

            <select className="bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-slate-200">
              <option value="all_fields">All additional Fields</option>
            </select>

            <input
              type="text"
              placeholder="Filter By Values of Additional Fields"
              className="bg-[#18182c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-56"
            />
            <button className="text-sky-400 font-bold hover:underline">Select All</button>
          </div>

          <button
            onClick={() => alert('New Credit Note form ready.')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow"
          >
            <Plus size={14} />
            <span>Add Credit Note</span>
          </button>
        </div>
      </div>

      {/* ── Table & Empty State View ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
        <div className="bg-[#101020] border border-white/10 rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#16162d] text-slate-400 font-semibold border-b border-white/10 text-[11px]">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3 w-28">DATE</th>
                <th className="py-2.5 px-3 w-24">REF NO.</th>
                <th className="py-2.5 px-4 min-w-[180px]">PARTY NAME</th>
                <th className="py-2.5 px-3 w-32">CATEGORY NAME</th>
                <th className="py-2.5 px-3 w-24">TYPE</th>
                <th className="py-2.5 px-3 w-28 text-right">TOTAL</th>
                <th className="py-2.5 px-3 w-28 text-right">RECEIVED/PAID</th>
                <th className="py-2.5 px-3 w-28 text-right">BALANCE</th>
                <th className="py-2.5 px-3 w-24 text-center">STATUS</th>
                <th className="py-2.5 px-4 w-28 text-center">PRINT / SHA...</th>
              </tr>
            </thead>
          </table>

          {creditNotes.length > 0 ? (
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {creditNotes.map((cn, idx) => (
                <div key={cn.id || idx} className="grid grid-cols-11 py-2.5 px-3 text-xs text-slate-300 hover:bg-white/[0.02]">
                  <span className="text-center">{idx + 1}</span>
                  <span>{cn.date}</span>
                  <span className="font-mono">{cn.ref_no}</span>
                  <span className="col-span-2 text-white font-medium">{cn.party_name}</span>
                  <span>{cn.category_name || '-'}</span>
                  <span>{cn.type || 'Credit Note'}</span>
                  <span className="text-right font-mono font-bold text-rose-400">₹ {Number(cn.total || 0).toLocaleString('en-IN')}</span>
                  <span className="text-right font-mono">₹ {Number(cn.received || 0).toLocaleString('en-IN')}</span>
                  <span className="text-right font-mono">₹ {Number(cn.balance || 0).toLocaleString('en-IN')}</span>
                  <span className="text-center">{cn.status || 'Active'}</span>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State (Exact Match to Screenshot 2) */
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <FileText size={36} className="text-purple-400" />
              </div>
              <div className="text-sm font-semibold text-slate-300 mb-1">
                No data is available for Credit Note.
              </div>
              <div className="text-xs text-slate-500">
                Please try again after making relevant changes.
              </div>
            </div>
          )}
        </div>
      </div>

      <StatusBar 
        totalAmount={creditNotes.reduce((s, c) => s + (Number(c.total) || 0), 0)} 
        balance={creditNotes.reduce((s, c) => s + (Number(c.balance) || 0), 0)} 
      />
    </div>
  );
}
