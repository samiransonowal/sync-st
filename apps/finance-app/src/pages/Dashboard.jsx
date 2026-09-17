import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { subscribeToInvoices, subscribeToExpenses } from '../services/firestore';

export default function Dashboard({ onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const unsubInv = subscribeToInvoices(setInvoices);
    const unsubExp = subscribeToExpenses(setExpenses);

    return () => {
      if (typeof unsubInv === 'function') unsubInv();
      if (typeof unsubExp === 'function') unsubExp();
    };
  }, []);

  // Aggregations
  const totalInvoiced = useMemo(() => {
    return invoices.reduce((s, i) => s + (Number(i.invoice_total) || 0), 0);
  }, [invoices]);

  const totalCollected = useMemo(() => {
    return invoices.reduce((s, i) => s + (Number(i.amount_received) || 0), 0);
  }, [invoices]);

  const pendingReceivables = useMemo(() => {
    return invoices.reduce((s, i) => s + (Number(i.pending_balance) || Number(i.invoice_total) || 0), 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const netCashflow = totalCollected - totalExpenses;

  // Invoices missing TDS deduction
  const missingTdsInvoices = useMemo(() => {
    return invoices.filter(i => i.tds_status === 'TDS_NOT_DEDUCTED');
  }, [invoices]);

  // Receivables Aging Calculation (30-day payment cycle)
  const agingBuckets = useMemo(() => {
    const buckets = { current: 0, upcoming: 0, overdue1: 0, critical: 0 };
    const now = Date.now();

    invoices.forEach(inv => {
      if ((inv.status || '').toLowerCase() === 'paid') return;
      const invDate = new Date(inv.invoice_date || 0).getTime();
      const diffDays = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
      const balance = Number(inv.pending_balance || inv.invoice_total || 0);

      if (diffDays <= 20) buckets.current += balance;
      else if (diffDays <= 30) buckets.upcoming += balance;
      else if (diffDays <= 45) buckets.overdue1 += balance;
      else buckets.critical += balance;
    });

    return buckets;
  }, [invoices]);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#080810] text-[#f0f0ff]">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CINELOOM COMPTROLLER
            </span>
            <span className="text-xs text-slate-500">FY 2026 – 2027</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Studio Financial Command
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('add_sale')}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <Plus size={14} />
            <span>+ Add Sale Invoice</span>
          </button>
          <button
            onClick={() => onNavigate('payment_in')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all"
          >
            <Plus size={14} />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18182c] hover:bg-[#20203a] text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all"
          >
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Revenue Invoiced</span>
            <span className="text-purple-400 font-bold">FYTD</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{totalInvoiced.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{invoices.length} Invoices</span>
            <span>billed</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Outstanding Receivables</span>
            <span className="text-rose-400 font-bold">Action Needed</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{pendingReceivables.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Pending client settlements
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Expenses (Opex)</span>
            <span className="text-amber-400 font-bold">Recorded</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Rent, software, utilities & capex
          </div>
        </div>

        {/* Net Cash Position */}
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Net Cash Position</span>
            <span className="text-emerald-400 font-bold">HDFC Bank</span>
          </div>
          <div className={`text-2xl font-black font-mono ${netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{netCashflow.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Net receipts minus outflows
          </div>
        </div>
      </div>

      {/* 2-Column Section: 30-Day Payment Cycle Aging & TDS Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Receivables Aging Buckets (Col 1-7) */}
        <div className="lg:col-span-7 bg-[#111122] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">30-Day Credit Aging Analysis</h2>
              <p className="text-xs text-slate-400">Receivables breakdown against contractual credit cycles</p>
            </div>
            <Clock size={18} className="text-purple-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#18182e] p-3 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Current (0–20d)</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                ₹{agingBuckets.current.toLocaleString('en-IN')}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Healthy Cycle</div>
            </div>

            <div className="bg-[#18182e] p-3 rounded-xl border border-amber-500/20">
              <div className="text-[10px] text-amber-300 font-bold uppercase">Due (21–30d)</div>
              <div className="text-base font-bold text-amber-400 font-mono mt-1">
                ₹{agingBuckets.upcoming.toLocaleString('en-IN')}
              </div>
              <div className="text-[9px] text-amber-400/70 mt-0.5">21-Day Reminder</div>
            </div>

            <div className="bg-[#18182e] p-3 rounded-xl border border-rose-500/20">
              <div className="text-[10px] text-rose-300 font-bold uppercase">Overdue (31–45d)</div>
              <div className="text-base font-bold text-rose-400 font-mono mt-1">
                ₹{agingBuckets.overdue1.toLocaleString('en-IN')}
              </div>
              <div className="text-[9px] text-rose-400/70 mt-0.5">Escalate Producer</div>
            </div>

            <div className="bg-[#18182e] p-3 rounded-xl border border-rose-600/40">
              <div className="text-[10px] text-rose-400 font-bold uppercase">Critical (&gt;45d)</div>
              <div className="text-base font-bold text-rose-500 font-mono mt-1">
                ₹{agingBuckets.critical.toLocaleString('en-IN')}
              </div>
              <div className="text-[9px] text-rose-500 mt-0.5">Hold Bookings</div>
            </div>
          </div>
        </div>

        {/* TDS Warning & Compliance Card (Col 8-12) */}
        <div className="lg:col-span-5 bg-[#111122] border border-amber-500/30 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">TDS Deduction Audit</h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
              {missingTdsInvoices.length} Flagged
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Clients pay without deducting 10% TDS occasionally. Comptroller flags these transactions to prevent discrepancies with Form 26AS.
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {missingTdsInvoices.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={16} />
                <span>All recorded settlements have verified TDS compliance!</span>
              </div>
            ) : (
              missingTdsInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-[#18182e] p-2.5 rounded-xl text-xs border border-white/5">
                  <div>
                    <span className="font-bold text-white">#{inv.invoice_number}</span>
                    <span className="text-slate-400 ml-2">{inv.customer_name}</span>
                  </div>
                  <span className="text-amber-300 font-mono font-semibold">
                    ₹{Number(inv.invoice_total).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Snippet */}
      <div className="bg-[#111122] border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-wide">Recent Financial Activity</h2>
          <button 
            onClick={() => onNavigate('sale_invoices')} 
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            View All Invoices →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-500 border-b border-white/10 pb-2">
                <th className="py-2">Date</th>
                <th className="py-2">Ref / Inv</th>
                <th className="py-2">Party</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.slice(0, 5).map(inv => (
                <tr key={inv.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 font-mono text-slate-400">{inv.invoice_date || 'Recent'}</td>
                  <td className="py-2.5 font-bold text-white font-mono">#{inv.invoice_number}</td>
                  <td className="py-2.5 font-medium text-slate-200">{inv.customer_name}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-white">
                    ₹{Number(inv.invoice_total || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {inv.status || 'Unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
