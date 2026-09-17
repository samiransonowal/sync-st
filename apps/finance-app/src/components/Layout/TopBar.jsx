import React from 'react';
import { Search, Plus, Printer, PhoneCall, Headphones, LogOut, Shield } from 'lucide-react';

export default function TopBar({
  onAddSale,
  onAddPurchase,
  searchQuery,
  onSearchChange,
  currentUser,
  onSignOut
}) {
  return (
    <header className="bg-[#0b0b14] border-b border-white/10 flex flex-col no-print">
      {/* Super Top Sub-header: Customer Support Bar (identical to Vyapar) */}
      <div className="flex items-center justify-center gap-4 py-1 px-4 bg-[#07070d] border-b border-white/5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          Customer Support : <PhoneCall size={11} className="text-purple-400" />
          <span className="text-purple-300 font-semibold">+91 77956 87633, +91 63644 44752</span>
        </span>
        <span className="text-slate-600">|</span>
        <a 
          href="mailto:contact@studiotunnel.com" 
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors font-medium"
        >
          <Headphones size={11} />
          <span>Get Instant Online Support</span>
        </a>
      </div>

      {/* Main Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 gap-4">
        {/* Global Transaction Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search Transactions"
            className="w-full bg-[#141424] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* + Add Sale (Red Pill CTA) */}
          <button
            onClick={onAddSale}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={13} className="text-rose-400" />
            <span>Add Sale</span>
          </button>

          {/* + Add Purchase (Sky/Blue Pill CTA) */}
          <button
            onClick={onAddPurchase}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={13} className="text-sky-400" />
            <span>Add Purchase</span>
          </button>

          {/* Quick Add Icon */}
          <button
            onClick={onAddSale}
            className="w-7 h-7 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center transition-colors"
            title="Quick Add"
          >
            <Plus size={14} />
          </button>

          {/* Print Icon */}
          <button
            onClick={() => window.print()}
            className="w-7 h-7 rounded-full hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Print"
          >
            <Printer size={14} />
          </button>

          {/* User Profile / Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Shield size={13} className="text-emerald-400" />
                <span className="font-medium max-w-[120px] truncate">{currentUser.email || 'Admin'}</span>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
