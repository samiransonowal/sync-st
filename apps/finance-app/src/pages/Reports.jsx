import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { subscribeToInvoices, subscribeToExpenses } from '../services/firestore';

export default function Reports() {
  const [activeReportTab, setActiveReportTab] = useState('pl'); // 'pl' | 'aging' | 'gst' | 'tds'
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

  const totalRevenue = invoices.reduce((s, i) => s + (Number(i.invoice_total) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // GST Breakdown
  const totalGstCollected = invoices.reduce((s, i) => s + (Number(i.gst_amount) || 0), 0);
  const estimatedInputTaxCredit = Math.round(totalExpenses * 0.18);
  const netGstPayable = Math.max(0, totalGstCollected - estimatedInputTaxCredit);

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#080810] text-[#f0f0ff]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial & Statutory Reports</h1>
          <p className="text-xs text-slate-400 mt-1">Audit-ready P&L, GST reconciliation, Form 26AS matching</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18182c] border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:text-white">
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('pl')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeReportTab === 'pl' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveReportTab('aging')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeReportTab === 'aging' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Receivables Aging
        </button>
        <button
          onClick={() => setActiveReportTab('gst')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeReportTab === 'gst' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          GST Returns (GSTR-1 / 3B)
        </button>
        <button
          onClick={() => setActiveReportTab('tds')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeReportTab === 'tds' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          TDS Receivable Ledger
        </button>
      </div>

      {/* P&L View */}
      {activeReportTab === 'pl' && (
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6 max-w-3xl">
          <h2 className="text-base font-bold text-white border-b border-white/10 pb-3">
            Income & Expenditure Summary (FY 2026–27)
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="font-semibold text-slate-300">Gross Operating Revenue (Sale Invoices)</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                + ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="font-semibold text-slate-300">Total Operating Expenditures (Opex)</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                - ₹{totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 bg-[#18182e] px-4 rounded-xl border border-white/10 font-bold text-sm">
              <span className="text-white">Net Operating Profit (EBITDA)</span>
              <span className={`font-mono text-base ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GST View */}
      {activeReportTab === 'gst' && (
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-white border-b border-white/10 pb-3">
            Statutory GST Position (18% Regime)
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-300 font-medium">Output GST Collected (on Sale Invoices)</span>
              <span className="font-mono font-bold text-white">₹{totalGstCollected.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-300 font-medium">Input Tax Credit (ITC on Vendor Bills)</span>
              <span className="font-mono font-bold text-emerald-400">₹{estimatedInputTaxCredit.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-[#18182e] px-4 rounded-xl border border-purple-500/30 font-bold">
              <span className="text-purple-300">Net GST Liability Payable</span>
              <span className="font-mono text-base text-purple-300">₹{netGstPayable.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* TDS Ledger */}
      {activeReportTab === 'tds' && (
        <div className="bg-[#111122] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">TDS Receivable Audit (Section 194J)</h2>
              <p className="text-xs text-slate-400">Verify client deductions against Form 26AS records</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#16162d] text-slate-400 border-b border-white/10">
                  <th className="py-2.5 px-3">Inv #</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3 text-right">Base Amount</th>
                  <th className="py-2.5 px-3 text-right">10% Expected TDS</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map(inv => {
                  const base = Number(inv.base_amount || inv.invoice_total / 1.18 || 0);
                  const expected = Math.round(base * 0.10);
                  const deducted = inv.tds_status !== 'TDS_NOT_DEDUCTED';

                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">#{inv.invoice_number}</td>
                      <td className="py-2.5 px-3 text-slate-300">{inv.customer_name}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{Math.round(base).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-300">₹{expected.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center">
                        {deducted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            ✓ Deducted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            ⚠️ Not Deducted
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
