import React from 'react';
import { Landmark, RefreshCw } from 'lucide-react';

export default function CashBank() {
  const hdfcBalance = 1482930;
  const cashBalance = 38400;

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#080810] text-[#f0f0ff]">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Cash & Bank Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">HDFC Bank Current Account & Petty Cash Reconciliation</p>
        </div>

        <button 
          onClick={() => alert('Monday Bank Reconciliation running. Matching credits to open invoices...')} 
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          <RefreshCw size={14} />
          <span>Run Monday Bank Recon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HDFC Card */}
        <div className="bg-[#111122] border border-sky-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Landmark size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">HDFC Current Account</h3>
                <span className="text-xs text-slate-400 font-mono">A/C: ••••••••••29112</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              Active Primary
            </span>
          </div>

          <div className="text-3xl font-black text-white font-mono pt-2">
            ₹{hdfcBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">
            CINELOOM POSTWORKS PRIVATE LIMITED
          </div>
        </div>

        {/* Petty Cash Card */}
        <div className="bg-[#111122] border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                ₹
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Office Petty Cash</h3>
                <span className="text-xs text-slate-400">Studio 01 / Front Desk</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
              Vault
            </span>
          </div>

          <div className="text-3xl font-black text-white font-mono pt-2">
            ₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400">
            Managed by Line Producer & Floor Manager
          </div>
        </div>
      </div>
    </div>
  );
}
